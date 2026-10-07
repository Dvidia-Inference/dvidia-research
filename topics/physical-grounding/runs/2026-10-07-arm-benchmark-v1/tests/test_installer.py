"""Public URL boundaries, offline persistence and installation integrity."""
from __future__ import annotations

import copy
from hashlib import sha256
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from simlab.arm_runner import authored_grounding
from simlab.cli import NetworkGuard
from simlab.installer import (MAX_SOURCE_BYTES, _NoRedirect, fetch_skill_url, install_source,
                             read_installation, resolve_skill_url)


ROOT = Path(__file__).resolve().parents[1]
BUNDLED = ROOT / "simlab" / "place_cup.skill.json"
INLINE = ROOT / "examples" / "arm_place_skillspace.json"


class InstallerTests(unittest.TestCase):
    def test_observed_public_store_and_direct_pack_routes_resolve_canonically(self):
        expected = "https://dvidia.org/packs/dvidia/place_cup/skill.json"
        for url in ("https://dvidia.org/store/dvidia/place_cup",
                    "https://www.dvidia.org/store/dvidia/place_cup/",
                    "https://dvidia.org/packs/dvidia/place_cup/skill.json"):
            with self.subTest(url=url):
                self.assertEqual(resolve_skill_url(url), expected)

    def test_private_local_plans_traversal_and_untrusted_origins_are_rejected(self):
        urls = ("https://dvidia.org/skillspace?id=space-123", "https://dvidia.org/skillspaces",
                "https://dvidia.org/store/dvidia/../place_cup", "https://dvidia.org/store/dvidia/%2e%2e",
                "https://dvidia.org/store/dvidia/place%2fcup", "https://dvidia.org/store/dvidia//place_cup",
                "https://dvidia.org/store/dvidia/place_cup?source=x", "https://dvidia.org/store/dvidia/place_cup#x",
                "https://user:password@dvidia.org/store/dvidia/place_cup",
                "https://dvidia.org@evil.example/store/dvidia/place_cup",
                "https://dvidia.org.evil.example/store/dvidia/place_cup",
                "http://dvidia.org/store/dvidia/place_cup", "https://dvidia.org:443/store/dvidia/place_cup",
                "https://localhost/store/dvidia/place_cup", "https://127.0.0.1/store/dvidia/place_cup",
                "//dvidia.org/store/dvidia/place_cup", "file:" + "///store/dvidia/place_cup")
        for url in urls:
            with self.subTest(url=url), self.assertRaises(ValueError):
                resolve_skill_url(url)

    def test_download_is_bounded_and_redirects_never_follow(self):
        raw = BUNDLED.read_bytes()
        with patch("simlab.installer.build_opener") as builder:
            builder.return_value.open.return_value = io.BytesIO(raw)
            data, url = fetch_skill_url("https://dvidia.org/store/dvidia/place_cup")
            self.assertEqual(data, raw)
            self.assertEqual(url, "https://dvidia.org/packs/dvidia/place_cup/skill.json")
            request = builder.return_value.open.call_args.args[0]
            self.assertEqual(request.full_url, url)
            self.assertEqual(builder.return_value.open.call_args.kwargs["timeout"], 12)
        for raw in (b"", b"x" * (MAX_SOURCE_BYTES + 1), b"<html>not a pack</html>"):
            with self.subTest(size=len(raw)), patch("simlab.installer.build_opener") as builder:
                builder.return_value.open.return_value = io.BytesIO(raw)
                with self.assertRaises(ValueError):
                    fetch_skill_url("https://dvidia.org/store/dvidia/place_cup")
        with self.assertRaises(ValueError):
            _NoRedirect().redirect_request(None, None, 302, "redirect", {}, "https://evil.example/")

    def test_install_and_reload_remain_offline_and_preserve_exact_source(self):
        raw = BUNDLED.read_bytes()
        grounding = authored_grounding(raw)
        with tempfile.TemporaryDirectory() as temporary, NetworkGuard(True) as guard:
            directory = Path(temporary)
            first = install_source(raw, grounding, directory,
                                   source_url="https://dvidia.org/store/dvidia/place_cup")
            self.assertEqual(first["source_url"], "https://dvidia.org/packs/dvidia/place_cup/skill.json")
            self.assertEqual(read_installation(directory, first["installation_id"]), first)
            second = install_source(raw, grounding, directory,
                                    source_url="https://dvidia.org/packs/dvidia/place_cup/skill.json")
            self.assertEqual(first["installation_id"], second["installation_id"])
            restored = read_installation(directory, first["installation_id"])
            self.assertEqual(restored, second)
            self.assertEqual(restored["source_sha256"], sha256(raw).hexdigest())
            self.assertEqual(restored["source_url"], "https://dvidia.org/packs/dvidia/place_cup/skill.json")
            self.assertEqual(restored["scope"], "simulation-only")
            self.assertFalse(restored["physical_robot_ready"])
            self.assertFalse(restored["skill"]["source_has_robot_policy"])
            self.assertEqual((directory / first["installation_id"] / "source.json").read_bytes(), raw)
            self.assertEqual(guard.record()["attempted_calls"], [])

    def test_tampering_source_grounding_or_manifest_cannot_change_installed_contract(self):
        raw = BUNDLED.read_bytes()
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            record = install_source(raw, authored_grounding(raw), directory)
            installation = directory / record["installation_id"]
            path = installation / "installation.json"
            mutations = (("schema_version", 99), ("schema_version", True), ("scope", "physical"),
                         ("status", "robot_ready"), ("physical_robot_ready", True),
                         ("grounding_mode", "invented"), ("grounding_mode", "inline"),
                         ("policy_origin", "learned from supplied video"))
            for field, value in mutations:
                changed = copy.deepcopy(record)
                changed[field] = value
                path.write_text(json.dumps(changed))
                with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                    read_installation(directory, record["installation_id"])
            for section, field, value in (("grounding", "table_height", .3),
                                           ("skill", "object_mass", .08), ("source", "skill", "tie_lace")):
                changed = copy.deepcopy(record)
                changed[section][field] = value
                path.write_text(json.dumps(changed))
                with self.subTest(section=section), self.assertRaises(ValueError):
                    read_installation(directory, record["installation_id"])
            path.write_text(json.dumps(record))
            (installation / "source.json").write_bytes(raw + b"\n")
            with self.assertRaises(ValueError):
                read_installation(directory, record["installation_id"])

    def test_inline_export_retains_its_explicit_grounding_and_local_permissions(self):
        raw = INLINE.read_bytes()
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            record = install_source(raw, authored_grounding(raw), directory)
            restored = read_installation(directory, record["installation_id"])
            self.assertEqual(restored["grounding_mode"], "inline")
            self.assertEqual(restored["grounding"], json.loads(raw)["simulation_grounding"])
            self.assertEqual(restored["skill"]["source_permissions"], "local_only_no_public_reuse")
            self.assertEqual(restored["source_sha256"], sha256(raw).hexdigest())

    def test_changed_runtime_requires_explicit_reinstallation(self):
        raw = BUNDLED.read_bytes()
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            record = install_source(raw, authored_grounding(raw), directory)
            changed = copy.deepcopy(record['runtime'])
            changed['files_sha256']['arm_policy.py'] = '0' * 64
            with patch('simlab.installer.runtime_contract', return_value=changed):
                with self.assertRaisesRegex(ValueError, 'controller or physics dependency changed'):
                    read_installation(directory, record['installation_id'])
                second = install_source(raw, authored_grounding(raw), directory)
                self.assertNotEqual(second['installation_id'], record['installation_id'])
                self.assertEqual(read_installation(directory, second['installation_id']), second)
            self.assertTrue((directory/record['installation_id']/'source.json').exists())

    def test_runtime_includes_execution_guard_and_loader_and_detects_live_edits(self):
        from simlab import installer
        binding = installer.runtime_contract()
        self.assertTrue({'cli.py', 'installer.py'}.issubset(binding['files_sha256']))
        with patch.object(installer, '_LOADED_SOURCE_HASHES', {}):
            with self.assertRaisesRegex(ValueError, 'Restart the lab'):
                installer.runtime_contract()

    def test_install_rejects_arbitrary_provenance_urls_and_source_size(self):
        raw = BUNDLED.read_bytes()
        with tempfile.TemporaryDirectory() as temporary:
            for url in ("https://evil.example/source.json", "file:" + "///secret", "https://dvidia.org/skillspace?id=private"):
                with self.subTest(url=url), self.assertRaises(ValueError):
                    install_source(raw, authored_grounding(raw), Path(temporary), source_url=url)
            for source in (b"", b" " * (MAX_SOURCE_BYTES + 1)):
                with self.assertRaises(ValueError):
                    install_source(source, {}, Path(temporary))
            with self.assertRaises(ValueError):
                read_installation(Path(temporary), "../escape")


if __name__ == "__main__":
    unittest.main()
