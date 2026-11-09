"""Display every registered reference-model development attempt from sealed bytes.

Read-only publication transform. No simulator, tracker, policy or trainer runs.
RGB is copied at 2.5 Hz; all 50 Hz recorded commands remain. No case selection.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('camera_evidence', ROOT/'scripts/build-camera-action-evidence.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
read, load, identity, sealed, canonical = base.read, base.load, base.identity, base.sealed, base.canonical


def require(condition, message):
    if not condition:
        raise ValueError(message)


def build(batch, audit_path, audit_sha, out):
    batch, audit_path, out = Path(batch).resolve(), Path(audit_path).resolve(), Path(out).absolute()
    require(not out.exists() and not out.is_symlink() and not out.resolve().is_relative_to(batch), 'Fresh output outside recording required.')
    audit_raw = read(audit_path)
    require(identity(audit_raw)['sha256'] == audit_sha, 'Independent audit identity differs.')
    audit = json.loads(audit_raw)
    result_raw = read(batch/'result.json'); result = json.loads(result_raw)
    require(audit['passed'] is True and audit['result_file'] == identity(result_raw), 'Passing audit of this exact batch required.')
    require(result['status'] == 'complete_accounting' and result['qualified'] is False and len(result['attempts']) == 8, 'Expected eight retained unqualified attempts.')
    require(audit['plan_sha256'] == result['plan_sha256'], 'Registration differs.')
    verified = {row['id']: row for row in audit['attempts']}
    require(len(verified) == 8 and set(verified) == {row['id'] for row in result['attempts']}, 'Audit roster differs.')
    out.mkdir(parents=True)
    cases = []
    for index, row in enumerate(result['attempts']):
        cid = row['id']; checked = verified[cid]
        require(re.fullmatch(r'development-0[01]-goal[01]-(absolute|delta)', cid) is not None, 'Unexpected case identifier.')
        worker_raw = read(batch/f'attempt-{index:02}-worker.json')
        require(identity(worker_raw) == row['worker_receipt'] == checked['worker_receipt'], 'Worker receipt changed.')
        worker = json.loads(worker_raw); episode = batch/'episodes'/cid
        for name, field in [('integrity.json','integrity_file'),('rollout.json','rollout_file')]:
            require(identity(read(episode/name)) == worker[field] == checked[field], 'Episode seal changed.')
        inventory = load(episode/'integrity.json')['files']
        summary = json.loads(sealed(episode,'rollout.json',inventory))
        require(summary['mode'] == 'student' and summary['teacher_queries'] == 0 and summary['negative_control'] is None, 'Wrong control authority.')
        require(summary['strict_success'] == checked['inspection']['strict_success'] == row['strict_success'], 'Scorer differs.')
        case = dict(id=cid, controller='student', variant=row['variant'], group=row['case']['group_id'], goal_id=row['case']['goal_id'], status=row['rollout_status'], strict_success=row['strict_success'], frames=[], rows=[], longest_missing_seconds=worker.get('perception',{}).get('longest_missing_seconds'), integrity_sha256=worker['integrity_file']['sha256'], rollout_sha256=worker['rollout_file']['sha256'], model_sha256=worker['policy_artifact_sha256'])
        if 'recording.json' not in inventory:
            require(summary['recorded_complete_intervals'] == 0, 'Missing executed recording.')
            case['recording_note'] = 'No sealed control intervals; this scheduled attempt was not replaced.'
            cases.append(case); continue
        recording_raw = sealed(episode,'recording.json',inventory); recording = json.loads(recording_raw)
        require(recording['control_mode'] == 'student' and len(recording['steps']) == summary['recorded_complete_intervals'] <= 1000, 'Invalid control record.')
        case['recording_sha256'] = identity(recording_raw)['sha256']
        frames = {}; previous = None
        for i, step in enumerate(recording['steps']):
            before = step['before']; camera = before['camera']; frame = camera['value']
            perception = json.loads(sealed(episode,step['perception']['path'],inventory,step['perception']))
            require(step['index'] == i and step['teacher_query'] is None and step['command']['authority'] == 'student' and perception['index'] == i and perception['snapshot_sha256'] == identity(canonical(before))['sha256'], 'Unbound learner observation.')
            if frame['index'] % 10 == 0 and frame['index'] not in frames:
                ref = frame['rgb']; raw = sealed(episode,ref['path'],inventory,ref)
                name = f'frames/{cid}/{frame["index"]:04}.png'; dest = out/name
                dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(raw)
                previous = dict(path=name,index=frame['index'],time=camera['captured_at_seconds'],source_path=ref['path'],**identity(raw)); frames[frame['index']] = previous
            require(previous is not None, 'No initial display frame.')
            signals = before['signals']; issued = step['command']['issued']; applied = step['applied']['ramped_targets']; estimate = perception['estimate']
            case['rows'].append(dict(time=before['timestamp_seconds'], frame=previous['index'], frame_time=previous['time'], camera_source_time=camera['captured_at_seconds'], camera_age=estimate['age_seconds'], available=estimate['status']=='available', reason=estimate.get('reason'), phase=None, authority='student', measured=signals['joint_position_rad']['value']+[signals['gripper_joint_position_m']['value'][0]], issued=issued['joint_targets_rad']+[issued['gripper_position_m']], applied=applied['joint_targets_rad']+[applied['gripper_position_m']], interval_end=step['applied']['interval_end_seconds']))
        case['frames'] = list(frames.values()); cases.append(case)
    public_audit = dict(schema='dvidia.reference-action-viewer-readback/v1', passed=True, source_audit_sha256=audit_sha, result_file=identity(result_raw), plan_sha256=result['plan_sha256'], scope='Projection of independent read-only audit; all eight scheduled engineering attempts, not confirmation or qualification.', rows=[{key:row[key] for key in ('id','variant','inspection','worker_receipt','integrity_file','rollout_file','perception')} for row in audit['attempts']])
    data = dict(schema='dvidia.reference-action-viewer/v1', qualified_skill=False, physical_robot_ready=False, selected_case=cases[0]['id'], cases=cases, camera_source_hz=25, display_rgb_hz=2.5, motor_hz=50, source_result_sha256=identity(result_raw)['sha256'], audit_sha256=audit_sha, plan_sha256=result['plan_sha256'], scope='All eight reference-model engineering attempts on two reused development starts and two goals; no teacher fallback.', builder_sha256=identity(read(__file__))['sha256'])
    template=ROOT/'scripts/reference-action-viewer'
    for name in ('index.html','viewer.js'):
        shutil.copyfile(template/name,out/name)
    shutil.copyfile(ROOT/'scripts/camera-action-viewer/viewer.css',out/'viewer.css')
    shutil.copyfile(ROOT/'docs/assets/paper-grain.svg',out/'paper-grain.svg')
    shutil.copyfile(ROOT/'LICENSE-CODE',out/'LICENSE-CODE')
    licenses=out/'licenses/agilex_piper'; licenses.mkdir(parents=True)
    for name in ('LICENSE','README.md'):
        shutil.copyfile(ROOT/'topics/physical-grounding/runs/2026-10-30-usd-workstation-v01/licenses/agilex_piper'/name,licenses/name)
    (out/'readback.json').write_bytes(canonical(public_audit)+b'\n')
    (out/'evidence.json').write_bytes(canonical(data)+b'\n')
    (out/'evidence.js').write_text('window.DVIDIA_CAMERA_EVIDENCE='+canonical(data).decode().replace('<','\\u003c')+';\n')
    files={str(p.relative_to(out)):identity(read(p)) for p in sorted(out.rglob('*')) if p.is_file()}
    (out/'viewer-integrity.json').write_bytes(canonical(dict(schema='dvidia.static-evidence-integrity/v1',files=files))+b'\n')
    return dict(cases=len(cases),decisions=sum(len(c['rows']) for c in cases),frames=sum(len(c['frames']) for c in cases),bytes=sum(v['bytes'] for v in files.values()),physics_executed=False)


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('batch');p.add_argument('--audit',required=True);p.add_argument('--audit-sha256',required=True);p.add_argument('--out',required=True)
    a=p.parse_args(); print(json.dumps(build(a.batch,a.audit,a.audit_sha256,a.out)))
