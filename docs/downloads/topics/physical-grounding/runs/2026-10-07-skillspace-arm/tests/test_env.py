"""Tests of numerical continuation, actual goal conditions and failure semantics."""
from __future__ import annotations

import copy
from dataclasses import replace
import json
import math
from pathlib import Path
import re
import tempfile
import unittest

import numpy as np

from simlab.env import CableEndReachEnv, Config
from simlab.viewer import save_replay


def feedback(observation, limit):
    """A bounded PD fixture, independent of the production policy module."""
    force = 10.0 * (np.asarray(observation["target"]) - observation["endpoint_position"])
    force -= 0.25 * np.asarray(observation["endpoint_velocity"])
    force[2] += 0.1
    norm = np.linalg.norm(force)
    if norm > limit:
        force *= limit / norm
    return force.tolist()


class CableEndReachTests(unittest.TestCase):
    def assertObservationEqual(self, first, second):
        self.assertEqual(set(first), set(second))
        for key in first:
            np.testing.assert_allclose(first[key], second[key], rtol=0, atol=1e-11, err_msg=key)

    def assertFiniteObservation(self, observation):
        for values in observation.values():
            self.assertTrue(np.isfinite(np.asarray(values)).all())

    def test_seeded_reset_and_control_are_deterministic(self):
        first, second = CableEndReachEnv(), CableEndReachEnv()
        obs1, info1 = first.reset(seed=7)
        obs2, info2 = second.reset(seed=7)
        self.assertObservationEqual(obs1, obs2)
        self.assertEqual(info1["scene_hash"], info2["scene_hash"])
        self.assertEqual(info1["parameters"], info2["parameters"])
        for _ in range(12):
            force = [0.12, -0.03, 0.06]
            obs1, reward1, done1, trunc1, info1 = first.step(force)
            obs2, reward2, done2, trunc2, info2 = second.step(force)
            self.assertObservationEqual(obs1, obs2)
            self.assertEqual((reward1, done1, trunc1), (reward2, done2, trunc2))
            self.assertEqual(info1["reason"], info2["reason"])
            self.assertFiniteObservation(obs1)
        self.assertAlmostEqual(info1["simulation_time"], 12 * first.config.control_dt, places=10)

    def test_seed_changes_the_authored_scene(self):
        env = CableEndReachEnv()
        _, first = env.reset(seed=3)
        _, second = env.reset(seed=4)
        self.assertNotEqual(first["scene_hash"], second["scene_hash"])
        self.assertNotEqual(first["parameters"], second["parameters"])

    def test_json_snapshot_preserves_full_continuation(self):
        original = CableEndReachEnv()
        observation, _ = original.reset(seed=2)
        for _ in range(9):
            observation, _, done, truncated, _ = original.step(feedback(observation, original.config.force_limit))
            self.assertFalse(done or truncated)
        # Serialization exercises the documented portable state, not an in-memory
        # data-object alias or a saved qpos-only approximation.
        saved = json.loads(json.dumps(original.snapshot(), allow_nan=False))
        restored = CableEndReachEnv()
        self.assertObservationEqual(observation, restored.restore(saved))
        for _ in range(15):
            action = feedback(observation, original.config.force_limit)
            expected = original.step(action)
            actual = restored.step(action)
            self.assertObservationEqual(expected[0], actual[0])
            self.assertAlmostEqual(expected[1], actual[1], places=11)
            self.assertEqual(expected[2:4], actual[2:4])
            for key in ("reason", "success", "valid", "steps", "contact_samples", "max_contact_count"):
                self.assertEqual(expected[4][key], actual[4][key], key)
            for key in ("simulation_time", "dwell_elapsed", "distance"):
                self.assertAlmostEqual(expected[4][key], actual[4][key], places=11, msg=key)
            observation = expected[0]
            if expected[2] or expected[3]:
                break
        self.assertEqual(original.snapshot()["integration_state"], restored.snapshot()["integration_state"])

    def test_snapshot_rejects_incompatible_or_nonfinite_state(self):
        env = CableEndReachEnv()
        env.reset(seed=0)
        saved = env.snapshot()
        incompatible = CableEndReachEnv(replace(Config(), force_limit=1.5))
        with self.assertRaises(ValueError):
            incompatible.restore(saved)
        invalid = copy.deepcopy(saved)
        invalid["integration_state"][0] = math.nan
        with self.assertRaises(ValueError):
            CableEndReachEnv().restore(invalid)
        mismatched = copy.deepcopy(saved)
        mismatched["target"][0] += 0.1
        with self.assertRaises(ValueError):
            CableEndReachEnv().restore(mismatched)

    def test_malformed_snapshot_cannot_forge_success_or_mutate_live_state(self):
        env = CableEndReachEnv()
        env.reset(seed=0)
        env.step([0.1, 0.0, 0.03])
        original = env.snapshot()
        corruptions = ({"elapsed": math.nan}, {"steps": -1}, {"dwell_elapsed": -0.1},
                       {"terminated": True, "done": False, "reason": "success"},
                       {"done": True, "terminated": True, "reason": "success", "dwell_elapsed": 0},
                       {"last_action": [math.inf, 0, 0]})
        for corruption in corruptions:
            with self.subTest(corruption=corruption):
                malformed = copy.deepcopy(original)
                malformed["episode"].update(corruption)
                with self.assertRaises(ValueError):
                    env.restore(malformed)
                self.assertEqual(original, env.snapshot())

    def test_invalid_physics_returns_json_safe_failure_without_resumable_state(self):
        for field in ("position", "clock"):
            with self.subTest(field=field):
                env = CableEndReachEnv()
                env.reset(seed=0)
                # Fault injection into native solver input exercises automatic
                # reset/clock detection, without mocking a failure or reward.
                if field == "position":
                    env.data.qpos[0] = math.nan
                else:
                    env.data.time = math.nan
                observation, reward, done, truncated, info = env.step([0, 0, 0])
                self.assertTrue(done)
                self.assertFalse(truncated)
                self.assertFalse(info["success"])
                self.assertFalse(info["valid"])
                self.assertFalse(info["observations_available"])
                self.assertIsNone(info["distance"])
                self.assertEqual(observation["endpoint_position"], [])
                self.assertEqual(observation["rope_points"], [])
                self.assertEqual(reward, -1.0)
                json.dumps({"observation": observation, "info": info, "reward": reward}, allow_nan=False)
                with self.assertRaises(RuntimeError):
                    env.snapshot()

    def test_cable_centerline_preserves_authored_length_during_motion(self):
        env = CableEndReachEnv()
        observation, info = env.reset(seed=2)
        authored_length = info["parameters"]["rope_length"]
        for _ in range(25):
            points = np.asarray(observation["rope_points"])
            arc_length = float(np.linalg.norm(np.diff(points, axis=0), axis=1).sum())
            # The elasticity plugin supplies bending/twist, not axial stretch.
            # This checks the marker mapping and the fixed segment lengths.
            self.assertAlmostEqual(arc_length, authored_length, delta=1e-7)
            observation, _, done, truncated, info = env.step(feedback(observation, env.config.force_limit))
            self.assertTrue(info["valid"])
            if done or truncated:
                break

    def test_refined_timestep_tracks_the_same_fixed_action_tape(self):
        coarse = CableEndReachEnv()
        fine = CableEndReachEnv(replace(Config(), timestep=0.0005))
        coarse_observation, _ = coarse.reset(seed=2)
        fine_observation, _ = fine.reset(seed=2)
        coarse_initial = np.asarray(coarse_observation["endpoint_position"])
        fine_initial = np.asarray(fine_observation["endpoint_position"])
        # Both settle independently. Their initial states and relative targets
        # differ slightly; subtracting each initial point also checks displacement.
        self.assertLess(np.linalg.norm(coarse_initial - fine_initial), 0.0001)
        for _ in range(12):
            action = feedback(coarse_observation, coarse.config.force_limit)
            coarse_observation, _, done1, truncated1, info1 = coarse.step(action)
            fine_observation, _, done2, truncated2, info2 = fine.step(action)
            self.assertFalse(done1 or truncated1 or done2 or truncated2)
            self.assertTrue(info1["valid"] and info2["valid"])
            coarse_endpoint = np.asarray(coarse_observation["endpoint_position"])
            fine_endpoint = np.asarray(fine_observation["endpoint_position"])
            self.assertLess(np.linalg.norm(coarse_endpoint - fine_endpoint), 0.002)
            self.assertLess(np.linalg.norm((coarse_endpoint - coarse_initial) - (fine_endpoint - fine_initial)), 0.002)
        # The 2 mm regression bound is 8% of the configured 25 mm target radius.
        # A two-resolution comparison does not establish convergence or fidelity
        # to physical cable dynamics.

    def test_success_requires_movement_and_actual_continuous_dwell(self):
        env = CableEndReachEnv()
        observation, info = env.reset(seed=0)
        initial_distance = info["distance"]
        self.assertGreater(initial_distance, env.config.tolerance)
        self.assertFalse(info["success"])
        inside_before_success = False
        for _ in range(round(env.config.horizon / env.config.control_dt)):
            observation, reward, done, truncated, info = env.step(feedback(observation, env.config.force_limit))
            self.assertFiniteObservation(observation)
            self.assertTrue(math.isfinite(reward))
            self.assertTrue(info["valid"], info["reason"])
            if info["distance"] <= env.config.tolerance and not info["success"]:
                inside_before_success = True
            if info["dwell_elapsed"] + 1e-12 < env.config.dwell:
                self.assertFalse(info["success"])
            if done or truncated:
                break
        self.assertTrue(inside_before_success, "Entering the target must not immediately release the skill")
        self.assertTrue(info["success"], info["reason"])
        self.assertTrue(done)
        self.assertFalse(truncated)
        self.assertLessEqual(info["distance"], env.config.tolerance)
        self.assertGreaterEqual(info["dwell_elapsed"] + 1e-12, env.config.dwell)
        self.assertLess(info["distance"], initial_distance)
        with self.assertRaises(RuntimeError):
            env.step([0, 0, 0])

    def test_zero_action_cannot_claim_success(self):
        env = CableEndReachEnv(replace(Config(), horizon=0.8))
        env.reset(seed=0)
        for _ in range(40):
            observation, reward, done, truncated, info = env.step([0, 0, 0])
            self.assertFiniteObservation(observation)
            self.assertFalse(info["success"])
            self.assertTrue(info["valid"], info["reason"])
            if done or truncated:
                break
        self.assertFalse(done)
        self.assertTrue(truncated)
        self.assertEqual(info["reason"], "horizon")
        self.assertAlmostEqual(info["simulation_time"], env.config.horizon, places=10)
        with self.assertRaises(RuntimeError):
            env.step([0, 0, 0])

    def test_invalid_action_is_rejected_without_state_change(self):
        env = CableEndReachEnv()
        env.reset(seed=0)
        for action in ([math.nan, 0, 0], [math.inf, 0, 0], [0, 0], [0, 0, 0, 0],
                       [[0, 0, 0]], [env.config.force_limit + 0.001, 0, 0], ["invalid", 0, 0]):
            with self.subTest(action=action):
                before = env.snapshot()
                with self.assertRaises(ValueError):
                    env.step(action)
                self.assertEqual(before, env.snapshot())
                self.assertFalse(before["episode"]["done"])

    def test_force_norm_limit_is_enforced_across_axes(self):
        env = CableEndReachEnv()
        env.reset(seed=0)
        with self.assertRaises(ValueError):
            env.step([env.config.force_limit, env.config.force_limit, 0])
        observation, _, _, _, _ = env.step([0.3, 0.4, 0.0])
        self.assertEqual(observation["last_action"], [0.3, 0.4, 0.0])

    def test_explicit_failure_cannot_be_reported_as_success(self):
        env = CableEndReachEnv(replace(Config(), workspace_radius_factor=0.05))
        env.reset(seed=0)
        _, reward, done, truncated, info = env.step([0, 0, 0])
        self.assertEqual(info["reason"], "workspace_violation")
        self.assertFalse(info["valid"])
        self.assertFalse(info["success"])
        self.assertTrue(done)
        self.assertFalse(truncated)
        self.assertEqual(reward, -1.0)

    def test_unreachable_and_trivial_targets_are_rejected(self):
        for offset in ((99.0, 0.0, 0.0), (0.0, 0.0, 0.0)):
            with self.subTest(offset=offset):
                env = CableEndReachEnv(replace(Config(), target_offset=offset, target_jitter=0))
                with self.assertRaises(ValueError):
                    env.reset(seed=0)
                with self.assertRaises(RuntimeError):
                    env.step([0, 0, 0])

    def test_timing_and_geometry_profiles_reject_unsupported_values(self):
        for change in ({"timestep": 0}, {"control_dt": 0.0205}, {"horizon": 0.061},
                       {"dwell": 7}, {"force_limit": math.inf}, {"rope_nodes": 4},
                       {"rope_radius": 0.02}, {"target_offset": (0, math.nan, 0)}):
            with self.subTest(change=change):
                with self.assertRaises(ValueError):
                    replace(Config(), **change)

    def test_reset_required_for_control_and_snapshot(self):
        env = CableEndReachEnv()
        with self.assertRaises(RuntimeError):
            env.step([0, 0, 0])
        with self.assertRaises(RuntimeError):
            env.snapshot()


class ReplayTests(unittest.TestCase):
    def payload(self):
        frame = {"time": 0.0, "endpoint_position": [0.1, 0.0, 0.1],
                 "endpoint_velocity": [0, 0, 0], "target": [0.12, 0.01, 0.1],
                 "rope_points": [[0, 0, 0.2], [0.1, 0, 0.1]], "last_action": [0, 0, 0]}
        return {"schema_version": 1, "task": "CableEndReach-v0", "scope": "simulation-only",
                "actuation": "ideal endpoint attachment", "observations": "privileged simulator state",
                "config": {"tolerance": 0.025}, "episodes": [{"seed": 0, "policy": "Fixture",
                "success": False, "reason": "horizon", "simulated_seconds": 0,
                "control_steps": 0, "trace": [frame]}]}

    def test_saved_replay_is_self_contained_and_script_safe(self):
        payload = self.payload()
        payload["episodes"][0]["policy"] = '</script><img src=x onerror="alert(1)">'
        with tempfile.TemporaryDirectory() as folder:
            path = save_replay(payload, Path(folder) / "nested" / "replay.html")
            page = path.read_text()
        self.assertNotIn('</script><img', page)
        self.assertNotRegex(page, r'<script[^>]+src=')
        self.assertNotRegex(page, r'<link[^>]+(?:href=)')
        data = re.search(r'<script id="replay-data" type="application/json">(.*?)</script>', page, re.S)
        self.assertIsNotNone(data)
        self.assertEqual(json.loads(data.group(1)), payload)
        self.assertIn('Simulation only', page)
        self.assertIn('Ideal endpoint attachment', page)
        self.assertIn('Privileged simulator state', page)

    def test_replay_rejects_invalid_state_and_mislabeled_scope(self):
        with tempfile.TemporaryDirectory() as folder:
            for change in ("nonfinite", "empty", "backwards", "scope"):
                with self.subTest(change=change):
                    payload = self.payload()
                    if change == "nonfinite":
                        payload["episodes"][0]["trace"][0]["endpoint_position"][0] = math.inf
                    elif change == "empty":
                        payload["episodes"][0]["trace"] = []
                        payload["episodes"][0]["success"] = True
                    elif change == "backwards":
                        second = copy.deepcopy(payload["episodes"][0]["trace"][0])
                        second["time"] = -0.1
                        payload["episodes"][0]["trace"].append(second)
                    else:
                        payload["scope"] = "physical-robot"
                    with self.assertRaises(ValueError):
                        save_replay(payload, Path(folder) / "replay.html")

    def test_replay_preserves_failed_episodes_with_unavailable_observations(self):
        payload = self.payload()
        payload["episodes"].append({"seed": 1, "policy": "Fixture", "success": False,
                                    "reason": "rejected_start", "simulated_seconds": 0.0,
                                    "final_observation_available": False, "trace": []})
        with tempfile.TemporaryDirectory() as folder:
            page = save_replay(payload, Path(folder) / "replay.html").read_text()
        data = re.search(r'<script id="replay-data" type="application/json">(.*?)</script>', page, re.S)
        self.assertEqual(len(json.loads(data.group(1))["episodes"]), 2)
        self.assertIn("No usable trajectory recorded", page)
        self.assertIn("final observation unavailable", page)


if __name__ == "__main__":
    unittest.main()
