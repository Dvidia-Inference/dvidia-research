"""Native contact qualification of the authored arm placement adapter."""
import copy
from dataclasses import replace
import unittest

import mujoco
import numpy as np

from simlab.arm_env import ArmConfig, ArmEnv, JOINT_LIMITS
from simlab.arm_policy import ArmPickPlacePolicy


def execute(env, policy):
    observation, info = env.reset(seed=0)
    records = []
    while True:
        action = policy(observation)
        observation, _, done, truncated, info = env.step(action)
        records.append((copy.deepcopy(action), observation, info, policy.stage, env.data.actuator_force.copy()))
        if done or truncated:
            return records


class ArmContactTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.success_env = ArmEnv()
        cls.records = execute(cls.success_env, ArmPickPlacePolicy(cls.success_env))

    def test_native_model_has_six_hinges_free_object_and_bounded_jaw_servos(self):
        env = self.success_env
        self.assertEqual(env.model.nmocap, 0)
        self.assertEqual(env.model.neq, 0)
        self.assertEqual(len(env.joint_ids), 6)
        self.assertTrue(np.all(env.model.jnt_type[env.joint_ids] == mujoco.mjtJoint.mjJNT_HINGE))
        object_joint = mujoco.mj_name2id(env.model, mujoco.mjtObj.mjOBJ_JOINT, "object_free")
        self.assertEqual(env.model.jnt_type[object_joint], mujoco.mjtJoint.mjJNT_FREE)
        self.assertTrue(env.model.actuator_forcelimited.all())
        for _, _, _, _, forces in self.records:
            self.assertLessEqual(float(np.abs(forces[:6]).max()), env.config.joint_torque_limit + 1e-9)
            self.assertLessEqual(float(np.abs(forces[6:]).max()), env.config.jaw_force_limit + 1e-9)
        self.assertTrue(np.all(env.data.xfrc_applied[env.object_id] == 0))

    def test_contact_pick_lift_release_and_settled_target_dwell(self):
        _, observation, info, stage, _ = self.records[-1]
        self.assertTrue(info["success"])
        self.assertTrue(info["valid"])
        self.assertEqual(info["warnings"], [])
        self.assertTrue(info["grasp_seen"] and info["lift_seen"])
        self.assertGreater(info["max_object_lift"], .10)
        self.assertGreater(observation["gripper_width"], .065)
        self.assertEqual(observation["grasp_contacts"], {"left": 0, "right": 0})
        self.assertGreater(observation["table_contacts"], 0)
        self.assertGreaterEqual(observation["end_effector_position"][2], observation["object_position"][2] + .10)
        self.assertLess(np.linalg.norm(observation["object_velocity"]), .035)
        self.assertLess(np.linalg.norm(observation["object_angular_velocity"]), .3)
        self.assertLess(info["target_distance"], self.success_env.config.position_tolerance)
        self.assertGreaterEqual(info["dwell_elapsed"] + 1e-12, self.success_env.config.dwell_seconds)
        self.assertEqual(stage, "verify")
        # Being inside the goal while still gripped cannot complete placement.
        gripped_at_goal = [entry for entry in self.records if entry[2]["target_distance"] < self.success_env.config.position_tolerance
                           and entry[1]["grasp_contacts"]["left"] > 0 and entry[1]["grasp_contacts"]["right"] > 0]
        self.assertTrue(gripped_at_goal)
        self.assertTrue(all(not entry[2]["success"] for entry in gripped_at_goal))

    def test_identical_arm_action_tape_with_open_jaws_cannot_pick_up_object(self):
        env = ArmEnv()
        _, info = env.reset(seed=0)
        for recorded_action, *_ in self.records:
            action = {"joint_targets": recorded_action["joint_targets"], "gripper_width": .08}
            _, _, done, truncated, info = env.step(action)
            if done or truncated:
                break
        self.assertFalse(info["success"])
        self.assertFalse(info["grasp_seen"])
        self.assertFalse(info["lift_seen"])
        self.assertLess(info["max_object_lift"], .002)
        self.assertGreater(info["target_distance"], env.config.position_tolerance)

    def test_opening_jaws_after_lift_loses_object_retention(self):
        env = ArmEnv()
        observation, info = env.reset(seed=0)
        released = False
        for recorded_action, *_ in self.records:
            if info["lift_seen"]:
                released = True
            action = copy.deepcopy(recorded_action)
            if released:
                action["gripper_width"] = .08
            observation, _, done, truncated, info = env.step(action)
            if done or truncated:
                break
        self.assertTrue(released)
        self.assertGreater(info["max_object_lift"], .055)
        self.assertFalse(info["success"])
        self.assertAlmostEqual(observation["object_position"][2], env.config.table_height + env.config.object_half_size[2], delta=.002)
        self.assertEqual(observation["grasp_contacts"], {"left": 0, "right": 0})
        self.assertGreater(info["target_distance"], env.config.position_tolerance)

    def test_same_adapter_executes_a_changed_valid_scene(self):
        config = replace(ArmConfig(), object_position=(.38, -.08, .31), target_position=(.48, .14, .31), scene_jitter=0)
        env = ArmEnv(config)
        records = execute(env, ArmPickPlacePolicy(env))
        observation, info = records[-1][1:3]
        self.assertTrue(info["success"], info["reason"])
        np.testing.assert_allclose(observation["target_position"], [.48, .14, .31], atol=0, rtol=0)
        self.assertLess(info["target_distance"], config.position_tolerance)

    def test_seeded_initial_state_and_native_steps_are_deterministic(self):
        first, second = ArmEnv(), ArmEnv()
        obs1, _ = first.reset(seed=3)
        obs2, _ = second.reset(seed=3)
        np.testing.assert_allclose(obs1["object_position"], obs2["object_position"], atol=0, rtol=0)
        policy = ArmPickPlacePolicy(first)
        for _ in range(12):
            action = policy(obs1)
            obs1, reward1, done1, truncated1, info1 = first.step(action)
            obs2, reward2, done2, truncated2, info2 = second.step(action)
            for key in ("joint_position", "end_effector_position", "object_position", "object_quaternion", "arm_points", "gripper_points"):
                np.testing.assert_allclose(obs1[key], obs2[key], atol=1e-12, rtol=0)
            self.assertEqual((reward1, done1, truncated1, info1["reason"]), (reward2, done2, truncated2, info2["reason"]))

    def test_invalid_action_is_rejected_before_native_state_changes(self):
        env = ArmEnv()
        env.reset(seed=0)
        valid = {"joint_targets": list(env.data.qpos[env.joint_qpos]), "gripper_width": .08}
        invalid = [dict(valid, gripper_width=.09), dict(valid, joint_targets=[0]*5), dict(valid, joint_targets=[float('nan')]*6),
                   dict(valid, joint_targets=[JOINT_LIMITS[0][1]+.01]+valid["joint_targets"][1:])]
        for action in invalid:
            with self.subTest(action=action):
                before = env.data.qpos.copy(), env.data.qvel.copy(), env.data.ctrl.copy(), float(env.data.time)
                with self.assertRaises(ValueError):
                    env.step(action)
                np.testing.assert_array_equal(env.data.qpos, before[0])
                np.testing.assert_array_equal(env.data.qvel, before[1])
                np.testing.assert_array_equal(env.data.ctrl, before[2])
                self.assertEqual(env.data.time, before[3])

    def test_unreachable_layouts_and_rejected_reset_cannot_execute(self):
        for target in ((2., 0., .31), (.60, .20, .31), (.54, .10, .60)):
            with self.subTest(target=target):
                with self.assertRaises(ValueError):
                    replace(ArmConfig(), target_position=target)
        env = ArmEnv()
        env.reset(seed=0)
        with self.assertRaises(ValueError):
            env.reset(seed=0, target_position=(3., 0., .31))
        with self.assertRaises(RuntimeError):
            env.step({"joint_targets": [0]*6, "gripper_width": .08})

    def test_motion_free_open_jaw_baseline_does_not_report_success(self):
        env = ArmEnv(replace(ArmConfig(), horizon=.8))
        obs, _ = env.reset(seed=0)
        action = {"joint_targets": obs["joint_position"], "gripper_width": .08}
        for _ in range(40):
            _, _, done, truncated, info = env.step(action)
            self.assertFalse(info["success"])
            if done or truncated:
                break
        self.assertFalse(done)
        self.assertTrue(truncated)
        self.assertEqual(info["reason"], "horizon")
        self.assertFalse(info["grasp_seen"] or info["lift_seen"])


if __name__ == "__main__":
    unittest.main()
