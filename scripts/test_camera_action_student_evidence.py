"""Synthetic byte-contract fixtures for the read-only learned-attempt viewer."""
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('extend-camera-action-student-evidence.py')
SPEC = importlib.util.spec_from_file_location('student_viewer', SCRIPT)
viewer = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(viewer)


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = viewer.canonical(value)+b'\n'; path.write_bytes(raw)
    return viewer.identity(raw)


class StudentViewerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.study = self.root/'study'; self.original = self.root/'diagnostic'
        self.audit = self.root/'audit.json'; self.out = self.root/'extended'
        case = dict(id='confirmation-000-goal0', group_id='confirmation-000', goal_id=0)
        roster = [dict(id='fixed-0', controller='fixed', case=case, negative_control=None),
                  dict(id='student-0', controller='student', case=case, negative_control=None),
                  dict(id='student-1', controller='student', case={**case, 'id':'confirmation-001-goal0'}, negative_control=None)]
        protocol_identity = write(self.study/'protocol.json', dict(rosters={'confirmation':roster}))
        self.protocol_sha = protocol_identity['sha256']
        write(self.study/'registration.json', dict(protocol_sha256=self.protocol_sha))
        episode = self.study/'episodes/confirmation/student-0'
        episode.mkdir(parents=True)
        frame_raw = b'synthetic-frame-bytes-for-contract-test'; (episode/'frame.png').write_bytes(frame_raw)
        frame_identity = viewer.identity(frame_raw); ref = dict(path='frame.png', **frame_identity)
        before = dict(timestamp_seconds=0., camera=dict(value=dict(index=0, rgb=ref), captured_at_seconds=0.),
            signals=dict(joint_position_rad=dict(value=[0.]*6), gripper_joint_position_m=dict(value=[.03,-.03])))
        estimate = dict(age_seconds=0., status='available', reason='fixture')
        perception = dict(index=0, snapshot_sha256=viewer.identity(viewer.canonical(before))['sha256'], estimate=estimate)
        p_identity = write(episode/'perception.json', perception)
        target = dict(joint_targets_rad=[0.]*6, gripper_position_m=.03)
        step = dict(index=0, before=before, perception=dict(path='perception.json', **p_identity),
            teacher_query=None, command=dict(authority='student', issued=target),
            applied=dict(ramped_targets=target, interval_end_seconds=.02))
        self.recording = dict(control_mode='student', steps=[step])
        recording_identity = write(episode/'recording.json', self.recording)
        summary = dict(status='interrupted', strict_success=False, mode='student', negative_control=None,
            teacher_queries=0, recorded_complete_intervals=1)
        receipt_identity = write(episode/'rollout.json', summary)
        inventory_identity = write(episode/'integrity.json', dict(files={
            'frame.png':frame_identity, 'perception.json':p_identity,
            'recording.json':recording_identity, 'rollout.json':receipt_identity}))
        rows = [{**item, 'status':'complete', 'strict_success':True, 'complete':True} for item in roster]
        rows[1].update(status='interrupted', strict_success=False, complete=False,
            path='episodes/confirmation/student-0', integrity_sha256=inventory_identity['sha256'],
            receipt_sha256=receipt_identity['sha256'], policy_artifact_sha256='a'*64)
        self.stage = dict(rows=rows, status='complete', protocol_sha256=self.protocol_sha)
        self.proof = dict(schema='dvidia.camera-action-study-audit/v1', passed=True, errors=[],
            protocol_sha256=self.protocol_sha,
            results=[{**rows[1], 'stage':'confirmation', 'perception':dict(longest_missing_seconds=0.)}],
            evidence_inventory={})
        self.seal()
        self.original.mkdir()
        data = dict(status='diagnostic-only', protocol_sha256=self.protocol_sha,
            qualified_skill=False, physical_robot_ready=False,
            cases=[dict(id='diagnostic-'+str(i), rows=[], frames=[]) for i in range(4)])
        write(self.original/'evidence.json', data)
        (self.original/'evidence.js').write_text('window.DVIDIA_CAMERA_EVIDENCE='+json.dumps(data)+';')
        (self.original/'index.html').write_bytes((SCRIPT.parent/'camera-action-viewer/index.html').read_bytes())
        (self.original/'viewer.js').write_bytes((SCRIPT.parent/'camera-action-viewer/viewer.js').read_bytes())
        (self.original/'original-frame.png').write_bytes(b'original diagnostic sample')
        original_files = {p.name:viewer.identity(p.read_bytes()) for p in self.original.iterdir()}
        write(self.original/'viewer-integrity.json', dict(files=original_files))

    def seal(self):
        identity = write(self.study/'stages/confirmation.json', self.stage)
        write(self.study/'stages/confirmation.integrity.json', dict(sha256=identity['sha256'], protocol_sha256=self.protocol_sha))
        self.proof['evidence_inventory']['stages/confirmation.json'] = identity
        write(self.audit, self.proof)

    def test_first_failed_attempt_is_selected_and_original_diagnostics_unchanged(self):
        before = {p.name:p.read_bytes() for p in self.original.iterdir()}
        result = viewer.build(self.study, self.original, self.audit, self.out)
        self.assertEqual(result['selected_attempt'], 'student-0')
        self.assertFalse(result['strict_success']); self.assertEqual(result['decisions'], 1)
        data = viewer.load(self.out/'evidence.json')
        self.assertEqual(data['selection']['protocol_order'], 1)
        self.assertEqual(data['cases'][:4], viewer.load(self.original/'evidence.json')['cases'])
        self.assertIsNone(data['cases'][-1]['rows'][0]['phase'])
        self.assertEqual(data['cases'][-1]['rows'][0]['authority'], 'student')
        self.assertEqual(before, {p.name:p.read_bytes() for p in self.original.iterdir()})
        manifest = viewer.load(self.out/'viewer-integrity.json')['files']
        for name, expected in manifest.items():
            self.assertEqual(viewer.identity((self.out/name).read_bytes()), expected)
        self.assertIn('not a benchmark rate', (self.out/'index.html').read_text())

    def test_unattempted_first_record_is_not_replaced_with_later_success(self):
        first = self.stage['rows'][1]
        first.update(status='unattempted', complete=False, strict_success=False)
        self.proof['results'][0].update(status='unattempted', complete=False, strict_success=False)
        self.seal()
        result = viewer.build(self.study, self.original, self.audit, self.out)
        self.assertEqual(result['selected_attempt'], 'student-0'); self.assertEqual(result['decisions'], 0)
        self.assertEqual(result['status'], 'unattempted')
        self.assertEqual(viewer.load(self.out/'evidence.json')['cases'][-1]['frames'], [])

    def test_wrong_audit_and_missing_roster_rows_are_rejected(self):
        original = deepcopy(self.proof)
        self.proof['results'][0]['strict_success'] = True; self.seal()
        with self.assertRaisesRegex(ValueError, 'independent audit'):
            viewer.build(self.study, self.original, self.audit, self.out)
        self.proof = original; self.stage['rows'].pop(); self.seal()
        with self.assertRaisesRegex(ValueError, 'complete registered roster'):
            viewer.build(self.study, self.original, self.audit, self.out)

    def test_bound_frame_tampering_and_existing_output_are_refused(self):
        frame = self.study/'episodes/confirmation/student-0/frame.png'; frame.write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'inventory mismatch'):
            viewer.build(self.study, self.original, self.audit, self.out)
        with self.assertRaisesRegex(ValueError, 'fresh output'):
            viewer.build(self.study, self.original, self.audit, self.out)

    def test_active_study_is_not_published(self):
        (self.study/'worker.lock').write_text('{}')
        with self.assertRaisesRegex(ValueError, 'worker'):
            viewer.build(self.study, self.original, self.audit, self.out)


if __name__ == '__main__':
    unittest.main()
