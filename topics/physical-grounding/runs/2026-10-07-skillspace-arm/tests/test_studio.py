"""Real loopback HTTP boundaries and offline source-to-native preview bridge."""
from __future__ import annotations

import http.client
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch

from simlab.installer import read_installation
from simlab.studio import StudioServer


class StudioHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory()
        cls.server = StudioServer(("127.0.0.1", 0), Path(cls.temporary.name), offline=True)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever,
                                      kwargs={"poll_interval": .01}, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)
        cls.temporary.cleanup()

    def request(self, path, value=None, *, method="POST", headers=None, raw=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=35)
        supplied_headers = {"Content-Type": "application/json",
                            "Origin": f"http://127.0.0.1:{self.port}"}
        supplied_headers.update(headers or {})
        payload = raw if raw is not None else (None if value is None else json.dumps(value))
        try:
            connection.request(method, path, body=payload, headers=supplied_headers)
            response = connection.getresponse()
            data = response.read()
            parsed = json.loads(data) if response.getheader("Content-Type", "").startswith("application/json") else data
            return response.status, dict(response.getheaders()), parsed
        finally:
            connection.close()

    def test_loopback_ui_serves_with_browser_guards_and_nonlocal_requests_fail(self):
        status, headers, body = self.request("/", method="GET")
        self.assertEqual(status, 200)
        self.assertIsInstance(body, bytes)
        self.assertIn(b"Install", body)
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertIn("frame-ancestors 'none'", headers["Content-Security-Policy"])
        self.assertNotIn("Access-Control-Allow-Origin", headers)
        for values in ({"Host": "evil.example"}, {"Origin": "https://evil.example"},
                       {"Origin": "null"}, {"Host": f"127.0.0.1:{self.port + 1}"}):
            with self.subTest(headers=values):
                status, _, body = self.request("/api/install", {"bundled": True}, headers=values)
                self.assertEqual(status, 400)
                self.assertIn("error", body)

    def test_json_body_media_type_size_duplicate_keys_and_nonfinite_values_reject(self):
        cases = (("{}", {"Content-Type": "text/plain"}), ("[]", {}), ("null", {}),
                 ('{"bundled":false,"bundled":true}', {}), ('{"bundled":true,"scene":NaN}', {}),
                 ('{"bundled":true,"unrecognized":1}', {}), ('{"bundled":true}', {"Content-Length": "-1"}),
                 (" " * (256 * 1024 + 1), {}))
        for raw, headers in cases:
            with self.subTest(raw=raw[:50], headers=headers):
                status, _, result = self.request("/api/install", headers=headers, raw=raw)
                self.assertEqual(status, 400)
                self.assertIn("error", result)

    def test_offline_bundled_install_persists_without_network_or_robot_readiness(self):
        with patch("simlab.studio.fetch_skill_url", side_effect=AssertionError("offline install fetched a URL")):
            status, _, record = self.request("/api/install", {"bundled": True})
            self.assertEqual(status, 200)
            self.assertEqual(record["skill"]["skill_id"], "place_cup")
            self.assertEqual(record["scope"], "simulation-only")
            self.assertFalse(record["physical_robot_ready"])
            self.assertFalse(record["skill"]["source_has_robot_policy"])
            restored = read_installation(Path(self.temporary.name) / "installed", record["installation_id"])
            self.assertEqual(restored["source_sha256"], record["source_sha256"])
            status, _, error = self.request("/api/install", {"url": "https://dvidia.org/store/dvidia/place_cup"})
            self.assertEqual(status, 400)
            self.assertIn("offline", error["error"].lower())

    def test_inline_json_upload_and_mutually_exclusive_source_modes(self):
        document = (Path(__file__).resolve().parents[1] / "examples" / "arm_place_skillspace.json").read_text()
        status, _, record = self.request("/api/install", {"document": document})
        self.assertEqual(status, 200)
        self.assertEqual(record["grounding_mode"], "inline")
        self.assertEqual(record["skill"]["skill_id"], "place_object")
        self.assertEqual(record["skill"]["source_permissions"], "local_only_no_public_reuse")
        for source in ({"bundled": True, "document": document}, {"bundled": False}, {"document": {}}, {}):
            with self.subTest(source=list(source)):
                status, _, error = self.request("/api/install", source)
                self.assertEqual(status, 400)
                self.assertIn("error", error)

    def test_preview_spawns_native_worker_and_honors_independent_grounded_scene(self):
        scene = {"object_position": [.36, -.08, .31], "target_position": [.50, .08, .31], "seed": 12}
        status, _, preview = self.request("/api/preview", {"scene": scene})
        self.assertEqual(status, 200)
        self.assertTrue(preview["info"]["valid"])
        self.assertFalse(preview["info"]["success"])
        observation = preview["observation"]
        for coordinate, expected in zip(observation["object_position"][:2], scene["object_position"][:2]):
            self.assertAlmostEqual(coordinate, expected, places=6)
        self.assertEqual(observation["target_position"], scene["target_position"])
        self.assertEqual(len(observation["joint_position"]), 6)
        json.dumps(preview, allow_nan=False)

    def test_invalid_scene_and_execution_identity_do_not_queue_native_runs(self):
        before = set(self.server.jobs)
        for scene in ({"object_position": [.60, .20, .31]}, {"seed": True}, {"unknown": 1}):
            with self.subTest(scene=scene):
                status, _, body = self.request("/api/preview", {"scene": scene})
                self.assertEqual(status, 400)
                self.assertIn("error", body)
        scene = {"object_position": [.42, -.04, .31], "target_position": [.54, .10, .31], "seed": 0}
        status, _, body = self.request("/api/run", {"installation_id": "../escape", "scene": scene, "policy": "placement"})
        self.assertEqual(status, 400)
        self.assertEqual(set(self.server.jobs), before)
        status, _, _ = self.request("/api/jobs/" + "0" * 32, method="GET")
        self.assertEqual(status, 404)


if __name__ == "__main__":
    unittest.main()
