"""Draft release inspection must separate hash consistency from competence."""
from __future__ import annotations

import copy
import hashlib
import json
import math
from pathlib import Path
import unittest
from unittest.mock import patch

from simlab.skill_release import SkillReleaseError, validate_skill_release


ROOT = Path(__file__).resolve().parents[1]


def example():
    return json.loads((ROOT / "examples" / "skill_release_v1.json").read_text())


def synthetic_contract():
    """Synthetic declarations exercise binding logic, never imply measured runs."""
    manifest = example()
    blobs = {}
    manifest["artifacts"] = []

    def add(identity, role, content):
        data = content if type(content) is bytes else json.dumps(content, sort_keys=True, allow_nan=False).encode()
        row = {"id": identity, "role": role, "path": f"fixture/{identity}.bin",
               "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}
        existing = next((index for index, item in enumerate(manifest["artifacts"]) if item["id"] == identity), None)
        if existing is None:
            manifest["artifacts"].append(row)
        else:
            manifest["artifacts"][existing] = row
        blobs[identity] = data
        return row["sha256"]

    def digest(identity):
        return next(item["sha256"] for item in manifest["artifacts"] if item["id"] == identity)

    add("source", "source", b"synthetic authored source")
    manifest["stages"]["source"] = {"artifact_ids": ["source"], "source_kind": "authored_simulation", "modalities": ["task_text"]}
    add("model", "model", b"synthetic model")
    add("kinematics", "kinematics", b"synthetic kinematics")
    profile = {"kind": "dvidia.robot-profile-proposal", "schema_version": 1,
               "model_artifact_id": "model", "kinematics_artifact_id": "kinematics", "arm_count": 1,
               "base_frame": "base", "tcp_frame": "tcp", "tcp_transform": [0, 0, 0, 1, 0, 0, 0],
               "joints": [{"name": "joint0", "type": "hinge", "unit": "rad", "range": [-1, 1],
                           "max_velocity": 2, "max_effort": 10, "effort_unit": "Nm", "actuation": "position"}],
               "control_hz": 50, "gripper": {"type": "parallel_jaw", "aperture_m": [0, .08],
                           "force_limit_n": 15, "geometry_sha256": hashlib.sha256(b"synthetic jaw").hexdigest()},
               "sensors": [{"name": "encoders", "kind": "joint_position", "shape": [1], "unit": "rad", "frame": "base", "rate_hz": 50}],
               "workspace": {"frame": "base", "minimum": [0, -.2, 0], "maximum": [.6, .2, .6]},
               "limitations": ["Synthetic declaration only; no robot or numerical experiment."]}
    add("profile", "profile", profile)
    add("scenario", "scenario", b"synthetic grounded scene")
    add("predicates", "predicates", {"initiation": ["object on support"], "success": ["released at target"],
                                      "failure": ["timeout"], "recovery": ["stop on invalid state"]})
    add("physics", "physics_validation", {"scenario_sha256": digest("scenario"), "scope": "numerical_only"})
    add("domain", "parameter_domain", {"object_x": [.3, .5]})
    manifest["stages"]["grounded_scenario"] = {"artifact_ids": ["profile", "scenario", "predicates", "physics", "domain"],
                  "scenario_artifact_id": "scenario", "profile_artifact_id": "profile", "predicates_artifact_id": "predicates",
                  "physics_validation_artifact_id": "physics", "parameter_domain_artifact_id": "domain",
                  "frame": "world", "units": "m", "physics_capabilities": ["rigid_contact"]}
    io = {"kind": "dvidia.policy-io-proposal", "schema_version": 1, "profile_sha256": digest("profile"),
          "rate_hz": 50, "joint_order": ["joint0"],
          "observations": [{"name": "joint_position", "sensor": "encoders", "shape": [1], "unit": "rad", "frame": "base"}],
          "actions": [{"name": "joint_targets", "semantics": "absolute_joint_position", "joint_names": ["joint0"],
                       "units": ["rad"], "minimum": [-1], "maximum": [1]},
                      {"name": "aperture", "semantics": "gripper_aperture", "joint_names": [], "units": ["m"],
                       "minimum": [0], "maximum": [.08]}]}
    add("io", "io_contract", io)
    add("controller", "executable", b"synthetic controller bytes; never executed")
    for identity in ("initiation", "termination", "recovery"):
        add(identity, identity, {"condition": "synthetic bounded declaration"})
    add("lock", "runtime", b"synthetic-runtime==1.0.0\n")
    manifest["dependencies"] = [{"name": "synthetic-runtime", "version": "1.0.0", "lock_artifact_id": "lock"}]
    manifest["stages"]["executable"] = {"artifact_ids": ["controller", "io", "initiation", "termination", "recovery", "profile", "scenario"],
          "kind": "authored_adapter", "implementation_artifact_id": "controller", "io_contract_id": "io",
          "initiation_id": "initiation", "termination_id": "termination", "recovery_id": "recovery",
          "profile_artifact_id": "profile", "scenario_artifact_id": "scenario",
          "trained_dataset_artifact_id": None, "training_receipt_id": None}
    add("protocol", "protocol", {"success": "synthetic predicate, not a benchmark result"})
    add("split", "split", {"train_groups": ["train-scene"], "evaluation_groups": ["test-scene"], "grouping_basis": "scene_identity"})
    add("baseline", "baseline", b"synthetic baseline declaration")
    evaluation = {"artifact_ids": ["receipt", "protocol", "controller", "scenario", "profile", "split", "baseline"],
                  "protocol_id": "protocol", "receipt_id": "receipt", "executable_artifact_id": "controller",
                  "scenario_artifact_id": "scenario", "profile_artifact_id": "profile",
                  "split_artifact_id": "split", "baseline_artifact_id": "baseline"}
    receipt = {"bindings": {key: digest(evaluation[key]) for key in ("protocol_id", "executable_artifact_id",
                      "scenario_artifact_id", "profile_artifact_id", "split_artifact_id", "baseline_artifact_id")},
               "evaluator_id": "synthetic-reviewer", "builder_id": "synthetic-author",
               "platform": {"os": "synthetic", "architecture": "synthetic", "python": "3.12.9", "simulator_version": "3.15.0"},
               "trials": [{"episode_id": "case0", "success": False, "valid": True}],
               "baseline_trials": [{"episode_id": "case0", "success": False, "valid": True}]}
    receipt["bindings"]["runtime_lock_sha256s"] = [digest("lock")]
    add("receipt", "evaluation_receipt", receipt)
    manifest["stages"]["evaluation"] = evaluation
    return manifest, blobs, add, digest


class SkillReleaseTests(unittest.TestCase):
    def test_real_metadata_only_draft_never_claims_training_or_execution(self):
        document = example()
        data = (ROOT / "simlab" / "place_cup.skill.json").read_bytes()
        report = validate_skill_release(document, {"place-cup-source": data})
        self.assertEqual(report["candidate_stage"], "source")
        self.assertTrue(report["stage_evidence_satisfied"]["source"])
        self.assertFalse(report["simulation_release_ready"])
        self.assertFalse(report["hardware_ready"])
        self.assertIn("Stage evidence", report["blockers_by_stage"]["executable"][0])

    def test_missing_or_changed_artifact_bytes_block_evidence(self):
        document = example()
        for supplied in ({}, {"place-cup-source": b"forged"}):
            report = validate_skill_release(document, supplied)
            self.assertFalse(report["stage_evidence_satisfied"]["source"])
            self.assertEqual(report["candidate_stage"], "none")
        with self.assertRaises(SkillReleaseError):
            validate_skill_release(document, {"undeclared": b"unknown"})

    def test_even_hash_consistent_synthetic_evaluation_remains_nonready_draft(self):
        document, blobs, _, _ = synthetic_contract()
        with patch("socket.create_connection", side_effect=AssertionError("inspector attempted network")):
            report = validate_skill_release(document, blobs)
        self.assertEqual(report["candidate_stage"], "evaluation")
        self.assertTrue(report["stage_evidence_satisfied"]["evaluation"])
        self.assertFalse(report["simulation_release_ready"])
        self.assertFalse(report["hardware_ready"])
        self.assertIn("no execution", report["verification_scope"])
        json.dumps(report, allow_nan=False)

    def test_compatibility_rejects_same_joint_count_with_wrong_units_sensor_or_order(self):
        for mutate in (lambda io: io.update({"joint_order": ["different_joint"]}),
                       lambda io: io["actions"][0].update({"units": ["degree"]}),
                       lambda io: io["actions"][0].update({"maximum": [2]}),
                       lambda io: io["observations"][0].update({"sensor": "unavailable_camera"}),
                       lambda io: io["observations"][0].update({"sensor": {"invalid": True}}),
                       lambda io: io.update({"rate_hz": 100})):
            document, blobs, add, _ = synthetic_contract()
            io = json.loads(blobs["io"])
            mutate(io); add("io", "io_contract", io)
            with self.subTest(io=io):
                report = validate_skill_release(document, blobs)
                self.assertFalse(report["stage_evidence_satisfied"]["executable"])
                self.assertTrue(report["blockers_by_stage"]["executable"])

    def test_stale_controller_runtime_or_split_and_evaluator_identity_are_blocked(self):
        for identity in ("controller", "lock", "split"):
            document, blobs, add, _ = synthetic_contract()
            content = {"train_groups": ["train-other"], "evaluation_groups": ["test-scene"], "grouping_basis": "scene_identity"} \
                      if identity == "split" else b"different pinned bytes"
            add(identity, next(a["role"] for a in document["artifacts"] if a["id"] == identity), content)
            with self.subTest(identity=identity):
                report = validate_skill_release(document, blobs)
                self.assertFalse(report["stage_evidence_satisfied"]["evaluation"])
                self.assertTrue(any("stale" in item for item in report["blockers_by_stage"]["evaluation"]))
        document, blobs, add, _ = synthetic_contract()
        receipt = json.loads(blobs["receipt"]); receipt["evaluator_id"] = receipt["builder_id"]
        add("receipt", "evaluation_receipt", receipt)
        self.assertFalse(validate_skill_release(document, blobs)["stage_evidence_satisfied"]["evaluation"])

    def test_group_leakage_empty_trials_and_unmatched_baseline_episodes_fail(self):
        document, blobs, add, digest = synthetic_contract()
        add("split", "split", {"train_groups": ["shared-object"], "evaluation_groups": ["shared-object"], "grouping_basis": "object_instance"})
        receipt = json.loads(blobs["receipt"]); receipt["bindings"]["split_artifact_id"] = digest("split")
        add("receipt", "evaluation_receipt", receipt)
        report = validate_skill_release(document, blobs)
        self.assertTrue(any("overlap" in item for item in report["blockers_by_stage"]["evaluation"]))
        for change in ({"trials": []}, {"baseline_trials": [{"episode_id": "different-case", "success": True, "valid": True}]},
                       {"trials": [{"episode_id": "case0", "success": True, "valid": False}]}):
            document, blobs, add, _ = synthetic_contract()
            receipt = json.loads(blobs["receipt"]); receipt.update(change); add("receipt", "evaluation_receipt", receipt)
            self.assertFalse(validate_skill_release(document, blobs)["stage_evidence_satisfied"]["evaluation"])

    def test_learned_policy_cannot_bypass_dataset_actions_rights_or_training_receipt(self):
        document, blobs, _, _ = synthetic_contract()
        document["stages"]["executable"]["kind"] = "learned_policy"
        report = validate_skill_release(document, blobs)
        self.assertFalse(report["stage_evidence_satisfied"]["executable"])
        self.assertTrue(any("curated robot dataset" in item for item in report["blockers_by_stage"]["executable"]))

    def test_curated_evidence_binds_rights_loader_and_action_supervision(self):
        document, blobs, add, digest = synthetic_contract()
        document["stages"]["source"].update({"source_kind": "robot_demonstration",
                                             "modalities": ["robot_state", "robot_actions", "timestamps"]})
        add("dataset", "dataset", b"synthetic recorded actions, not a measured dataset")
        add("rights", "rights", {"training": "documented_granted", "source_sha256s": [digest("source")]})
        add("review", "review", {"dataset_sha256": digest("dataset"), "review_status": "curated"})
        add("loader", "loader_receipt", {"dataset_sha256": digest("dataset"), "reader_loaded_and_replayed": True})
        document["stages"]["curated_dataset"] = {
            "artifact_ids": ["dataset", "rights", "review", "loader", "split"],
            "dataset_artifact_id": "dataset", "source_artifact_ids": ["source"],
            "review_artifact_id": "review", "rights_artifact_id": "rights", "split_artifact_id": "split",
            "loader_receipt_id": "loader", "robot_action_supervision": True, "clock_alignment": "validated"}
        report = validate_skill_release(document, blobs)
        self.assertTrue(report["stage_evidence_satisfied"]["curated_dataset"])
        self.assertFalse(report["simulation_release_ready"])
        for identity, key, value in (("rights", "training", "unresolved"),
                                      ("rights", "source_sha256s", ["0" * 64]),
                                      ("loader", "dataset_sha256", "0" * 64)):
            original = json.loads(blobs[identity])
            changed = copy.deepcopy(original); changed[key] = value
            add(identity, next(a["role"] for a in document["artifacts"] if a["id"] == identity), changed)
            with self.subTest(identity=identity, key=key):
                self.assertFalse(validate_skill_release(document, blobs)["stage_evidence_satisfied"]["curated_dataset"])
            add(identity, next(a["role"] for a in document["artifacts"] if a["id"] == identity), original)
        document["stages"]["curated_dataset"]["robot_action_supervision"] = False
        self.assertFalse(validate_skill_release(document, blobs)["stage_evidence_satisfied"]["curated_dataset"])

    def test_dependency_pins_reject_floating_refs_and_accept_exact_revisions(self):
        for version in ("main", "latest", "1.*", ">=1.0.0", "^1.0.0"):
            document, blobs, _, _ = synthetic_contract()
            document["dependencies"][0]["version"] = version
            with self.subTest(version=version), self.assertRaises(SkillReleaseError):
                validate_skill_release(document, blobs)
        for version in ("3.15.0", "2.2.0rc1", "a" * 40):
            document, blobs, _, _ = synthetic_contract()
            document["dependencies"][0]["version"] = version
            with self.subTest(version=version):
                self.assertTrue(validate_skill_release(document, blobs)["stage_evidence_satisfied"]["executable"])

    def test_task_families_need_physics_and_robot_capabilities(self):
        for family in ("bimanual", "deformable_cable_cloth", "contact_insertion_wiping", "articulated_open_close"):
            document, blobs, _, _ = synthetic_contract(); document["task"]["family"] = family
            with self.subTest(family=family):
                report = validate_skill_release(document, blobs)
                self.assertFalse(report["stage_evidence_satisfied"]["grounded_scenario"])

    def test_nonfinite_duplicates_paths_versions_unknown_fields_and_forged_ready_reject(self):
        malformed = ('{"kind":"x","kind":"y"}', '{"number":NaN}', '{"number":1e999}')
        for document in malformed:
            with self.subTest(document=document), self.assertRaises(SkillReleaseError):
                validate_skill_release(document)
        for mutate in (lambda d: d.update({"robot_ready": True}), lambda d: d.update({"status": "released"}),
                       lambda d: d.update({"schema_version": True}),
                       lambda d: d["artifacts"][0].update({"path": "../../outside"}),
                       lambda d: d["artifacts"][0].update({"bytes": math.nan}),
                       lambda d: d["artifacts"].append(copy.deepcopy(d["artifacts"][0]))):
            document = example(); mutate(document)
            with self.subTest(document=document), self.assertRaises(SkillReleaseError):
                validate_skill_release(document)


if __name__ == "__main__":
    unittest.main()
