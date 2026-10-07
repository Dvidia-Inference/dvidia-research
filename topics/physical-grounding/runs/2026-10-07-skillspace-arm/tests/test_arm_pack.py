"""Integrity and scope checks for inert, inspectable simulation adapter bundles."""
import copy
from hashlib import sha256
import json
from pathlib import Path
import re
import tempfile
import unittest
from zipfile import ZipFile, ZIP_DEFLATED

from simlab.arm_pack import export_arm_pack, verify_arm_pack
from simlab.arm_runner import authored_grounding
from simlab.skillspace import load_skillspace


def encoded(value):
    return (json.dumps(value, indent=2, allow_nan=False) + '\n').encode()


def archive_files(path):
    with ZipFile(path) as archive:
        return {name: archive.read(name) for name in archive.namelist()}


def rewrite_archive(path, files):
    with ZipFile(path, 'w', ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(name, data)


def update_evidence(files, payload, manifest):
    files['evidence/run.json'] = encoded(payload)
    manifest['files']['evidence/run.json'] = sha256(files['evidence/run.json']).hexdigest()
    files['manifest.json'] = encoded(manifest)


class ArmPackTests(unittest.TestCase):
    def fixture(self, directory):
        directory = Path(directory)
        source = Path(__file__).resolve().parents[1].joinpath('simlab/place_cup.skill.json').read_bytes()
        grounding = authored_grounding(source)
        skill = load_skillspace(source, grounding).to_dict()
        # Deliberately synthetic pack-verification fixture. Native physics and
        # recorded qualification are tested separately; no run is claimed here.
        episodes = [{'seed': 100, 'policy': 'placement', 'success': True, 'reason': 'success',
                     'simulated_seconds': 1.0, 'episode_wall_seconds': .1},
                    {'seed': 100, 'policy': 'idle', 'success': False, 'reason': 'horizon',
                     'simulated_seconds': 2.0, 'episode_wall_seconds': .2}]
        summary = {'successes': 1, 'episodes': 2, 'simulated_seconds': 3.0, 'episode_wall_seconds': .3,
                   'by_policy': {'placement': {'successes': 1, 'episodes': 1, 'simulated_seconds': 1.0, 'episode_wall_seconds': .1},
                                 'idle': {'successes': 0, 'episodes': 1, 'simulated_seconds': 2.0, 'episode_wall_seconds': .2}}}
        payload = {'schema_version': 1, 'task': 'ArmPickPlace-v0', 'scope': 'simulation-only',
                   'skill': skill, 'summary': summary, 'episodes': episodes,
                   'limitations': ['Synthetic test fixture; no physical or learned robot policy.']}
        (directory / 'source.json').write_bytes(source)
        (directory / 'grounding.json').write_bytes(encoded(grounding))
        (directory / 'run.json').write_bytes(encoded(payload))
        export_arm_pack(directory)
        return directory / 'skill-adapter.zip'

    def test_bundle_preserves_explicit_scope_source_and_qualification(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.fixture(folder)
            manifest = verify_arm_pack(path)
            self.assertEqual(manifest['task'], 'ArmPickPlace-v0')
            self.assertEqual(manifest['scope'], 'simulation-only')
            self.assertIs(manifest['physical_robot_ready'], False)
            self.assertIs(manifest['source_has_robot_policy'], False)
            self.assertEqual(manifest['summary']['successes'], 1)
            files = archive_files(path)
            payload = json.loads(files['evidence/run.json'])
            self.assertEqual(payload['skill']['source_sha256'], sha256(files['evidence/source.json']).hexdigest())
            self.assertEqual(manifest['limitations'], payload['limitations'])

    def test_modified_source_code_fails_content_integrity(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.fixture(folder)
            files = archive_files(path)
            files['simlab/arm_policy.py'] += b'\n# Changed after export\n'
            rewrite_archive(path, files)
            with self.assertRaises(ValueError):
                verify_arm_pack(path)

    def test_source_identity_remains_bound_after_a_file_hash_is_replaced(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.fixture(folder)
            files = archive_files(path)
            files['evidence/source.json'] += b' '
            manifest = json.loads(files['manifest.json'])
            manifest['files']['evidence/source.json'] = sha256(files['evidence/source.json']).hexdigest()
            files['manifest.json'] = encoded(manifest)
            rewrite_archive(path, files)
            with self.assertRaises(ValueError):
                verify_arm_pack(path)

    def test_grounding_identity_cannot_change_under_recorded_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.fixture(folder)
            files = archive_files(path)
            grounding = json.loads(files['evidence/grounding.json'])
            grounding['object']['mass'] = .06
            files['evidence/grounding.json'] = encoded(grounding)
            manifest = json.loads(files['manifest.json'])
            manifest['files']['evidence/grounding.json'] = sha256(files['evidence/grounding.json']).hexdigest()
            files['manifest.json'] = encoded(manifest)
            rewrite_archive(path, files)
            with self.assertRaises(ValueError):
                verify_arm_pack(path)

    def test_summary_counts_cannot_disagree_with_episode_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.fixture(folder)
            files = archive_files(path)
            payload = json.loads(files['evidence/run.json'])
            manifest = json.loads(files['manifest.json'])
            payload['summary']['successes'] = 2
            manifest['summary'] = copy.deepcopy(payload['summary'])
            update_evidence(files, payload, manifest)
            rewrite_archive(path, files)
            with self.assertRaises(ValueError):
                verify_arm_pack(path)

    def test_policy_counts_cannot_credit_a_failed_negative_control(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.fixture(folder)
            files = archive_files(path)
            payload = json.loads(files['evidence/run.json'])
            manifest = json.loads(files['manifest.json'])
            payload['summary']['by_policy']['idle']['successes'] = 1
            manifest['summary'] = copy.deepcopy(payload['summary'])
            update_evidence(files, payload, manifest)
            rewrite_archive(path, files)
            with self.assertRaises(ValueError):
                verify_arm_pack(path)

    def test_manifest_cannot_claim_physical_or_learned_policy_qualification(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.fixture(folder)
            original = archive_files(path)
            for change in ({'scope': 'physical-ready'}, {'physical_robot_ready': True},
                           {'source_has_robot_policy': True}, {'task': 'HardwarePickPlace-v1'},
                           {'schema_version': 99}, {'arm_profile': 'unrelated-arm'},
                           {'adapter_id': 'unrelated-controller'}):
                with self.subTest(change=change):
                    files = copy.deepcopy(original)
                    manifest = json.loads(files['manifest.json'])
                    manifest.update(change)
                    files['manifest.json'] = encoded(manifest)
                    rewrite_archive(path, files)
                    with self.assertRaises(ValueError):
                        verify_arm_pack(path)

    def test_run_scope_must_match_the_adapter_even_with_updated_hashes(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.fixture(folder)
            original = archive_files(path)
            for change in ({'scope': 'physical-ready'}, {'task': 'DifferentTask-v0'}):
                with self.subTest(change=change):
                    files = copy.deepcopy(original)
                    payload = json.loads(files['evidence/run.json'])
                    manifest = json.loads(files['manifest.json'])
                    payload.update(change)
                    update_evidence(files, payload, manifest)
                    rewrite_archive(path, files)
                    with self.assertRaises(ValueError):
                        verify_arm_pack(path)

    def test_portable_archive_paths_cannot_escape_an_extraction_directory(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.fixture(folder)
            original = archive_files(path)
            for name in ('/absolute.py', 'simlab/../../escape.py', 'C:/escape.py', 'simlab\\..\\escape.py'):
                with self.subTest(name=name):
                    files = copy.deepcopy(original)
                    files[name] = b'# inert path fixture\n'
                    manifest = json.loads(files['manifest.json'])
                    manifest['files'][name] = sha256(files[name]).hexdigest()
                    files['manifest.json'] = encoded(manifest)
                    rewrite_archive(path, files)
                    with self.assertRaises(ValueError):
                        verify_arm_pack(path)

    def test_bundle_contains_runnable_sources_and_local_static_studio(self):
        with tempfile.TemporaryDirectory() as folder:
            files = archive_files(self.fixture(folder))
        required = ('simlab/__init__.py', 'simlab/arm_env.py', 'simlab/arm_policy.py',
                    'simlab/arm_runner.py', 'simlab/arm_qualify.py', 'simlab/skillspace.py',
                    'simlab/installer.py', 'simlab/studio.py', 'simlab/studio.html',
                    'simlab/env.py', 'simlab/cli.py', 'simlab/LICENSE', 'requirements.lock.txt',
                    'evidence/run.json', 'evidence/source.json', 'evidence/grounding.json')
        for name in required:
            self.assertIn(name, files)
            self.assertGreater(len(files[name]), 0)
        self.assertEqual(files['requirements.lock.txt'], files['simlab/requirements.lock.txt'])
        studio = files['simlab/studio.html'].decode()
        self.assertIn('<canvas', studio)
        self.assertNotRegex(studio, r'<script[^>]+src=')
        self.assertNotRegex(studio, r'<link[^>]+href=["\']https?://')
        self.assertNotRegex(studio, r'\b(?:eval|Function)\s*\(')
        self.assertIn('Hashes check content integrity, not publisher identity', files['README.md'].decode())


if __name__ == '__main__':
    unittest.main()
