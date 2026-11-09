"""Add the first registered student confirmation attempt to a fresh viewer copy.

The original four-diagnostic viewer remains byte-for-byte unchanged. Selection
is by protocol order before inspecting outcomes. A refused or missing recording
is shown as such, never replaced by a later success. No physics or model runs.
"""
from __future__ import annotations

import argparse
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location('diagnostic_viewer_builder',
    ROOT/'scripts/build-camera-action-evidence.py')
BASE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BASE)
read, load, identity, relative, sealed, canonical = (
    BASE.read, BASE.load, BASE.identity, BASE.relative, BASE.sealed, BASE.canonical)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def select_first_student(study, audit_path):
    study = Path(study)
    require(not (study/'worker.lock').exists(), 'Wait for the study worker to finish before publication.')
    protocol_raw = read(study/'protocol.json'); protocol = json.loads(protocol_raw)
    protocol_sha = identity(protocol_raw)['sha256']
    require(load(study/'registration.json')['protocol_sha256'] == protocol_sha, 'Protocol registration differs.')
    audit = load(audit_path)
    require(audit.get('schema') == 'dvidia.camera-action-study-audit/v1'
        and audit.get('passed') is True and audit.get('errors') == []
        and audit.get('protocol_sha256') == protocol_sha,
        'A passing independent study audit with the same protocol is required.')
    stage_raw = read(study/'stages/confirmation.json'); stage = json.loads(stage_raw)
    require(load(study/'stages/confirmation.integrity.json') ==
        dict(sha256=identity(stage_raw)['sha256'], protocol_sha256=protocol_sha), 'Confirmation stage seal differs.')
    require(audit.get('evidence_inventory', {}).get('stages/confirmation.json') == identity(stage_raw),
        'Independent audit does not bind this confirmation stage.')
    roster = protocol['rosters']['confirmation']
    attempts = {item['id']: item for item in roster}; rows = {item['id']: item for item in stage['rows']}
    require(len(roster) == len(attempts) == len(rows) == len(stage['rows'])
        and set(attempts) == set(rows), 'Confirmation rows differ from the complete registered roster.')
    # This decision intentionally precedes reading any outcome in a selected row.
    first = next((item for item in roster if item['controller'] == 'student'), None)
    require(first is not None, 'No registered student confirmation attempt exists.')
    row = rows[first['id']]
    require(all(row.get(key) == first.get(key) for key in ('case', 'controller', 'negative_control')),
        'Selected row differs from its registered scene or controller.')
    audited = [item for item in audit.get('results', [])
               if item.get('stage') == 'confirmation' and item.get('id') == first['id']]
    require(len(audited) == 1, 'The first student attempt has no unique independent audit result.')
    verified = audited[0]
    for key in ('case', 'controller', 'negative_control', 'status', 'strict_success', 'complete'):
        require(verified.get(key) == row.get(key), 'Selected outcome differs from independent audit: '+key)
    selection = dict(attempt_id=first['id'], protocol_order=roster.index(first),
        controller='student', case=first['case'], status=row['status'],
        strict_success=row['strict_success'], complete=row['complete'],
        policy='First scheduled student confirmation attempt; selected without looking at success.',
        protocol_sha256=protocol_sha, confirmation_stage_sha256=identity(stage_raw)['sha256'],
        study_audit_sha256=identity(read(audit_path))['sha256'])
    return row, verified, selection


def student_case(study, row, verified, selection, out):
    """Read the audited decision prefix; absent/refused evidence stays absent."""
    result = dict(id='first-student', controller='student', attempt_id=row['id'],
        group=row['case']['group_id'], goal_id=row['case']['goal_id'],
        status=row['status'], strict_success=row['strict_success'], frames=[], rows=[],
        initial_anchor_error_m=verified.get('initial_anchor_error_m'),
        longest_missing_seconds=verified.get('perception', {}).get('longest_missing_seconds'),
        selection=selection)
    if row['status'] in ('unknown', 'unattempted'):
        result['recording_note'] = 'No sealed decision recording; this attempt was not replaced.'
        return result
    expected_path = 'episodes/confirmation/'+row['id']
    require(row.get('path') == expected_path, 'Selected recording path differs from its registered attempt.')
    episode = relative(Path(study), expected_path)
    for name, field in (('integrity.json', 'integrity_sha256'), ('rollout.json', 'receipt_sha256')):
        require(identity(read(episode/name))['sha256'] == row.get(field) == verified.get(field),
            'Selected recording differs from sealed stage/audit: '+name)
    inventory = load(episode/'integrity.json')['files']
    summary = json.loads(sealed(episode, 'rollout.json', inventory))
    require(summary['status'] == row['status'] and summary['strict_success'] is row['strict_success']
        and summary['mode'] == 'student' and summary['negative_control'] is None
        and summary.get('teacher_queries') == 0, 'Selected receipt has different outcome or teacher authority.')
    result.update(source_episode=expected_path, integrity_sha256=row['integrity_sha256'],
        rollout_sha256=row['receipt_sha256'], model_sha256=row.get('policy_artifact_sha256'))
    if 'recording.json' not in inventory:
        require(summary['recorded_complete_intervals'] == 0 and summary['status'] == 'refused',
            'Absent recording claims executed actions.')
        result['recording_note'] = 'Execution refused before a decision recording; this attempt was not replaced.'
        return result
    raw = sealed(episode, 'recording.json', inventory); recording = json.loads(raw)
    require(recording['control_mode'] == 'student'
        and len(recording['steps']) == summary['recorded_complete_intervals'] <= 1000,
        'Selected recording control mode or decision count differs.')
    result['recording_sha256'] = identity(raw)['sha256']
    previous = None; frames = {}
    for index, step in enumerate(recording['steps']):
        before = step['before']; camera = before['camera']; frame = camera['value']
        estimate_doc = json.loads(sealed(episode, step['perception']['path'], inventory, step['perception']))
        require(step['index'] == index and step['teacher_query'] is None
            and step['command']['authority'] == 'student'
            and estimate_doc['index'] == index
            and estimate_doc['snapshot_sha256'] == sha256(canonical(before)).hexdigest(),
            'Selected decision is not bound to student-only observed inputs.')
        if frame['index'] % 10 == 0 and frame['index'] not in frames:
            ref = frame['rgb']; frame_raw = sealed(episode, ref['path'], inventory, ref)
            name = f'frames/first-student/{frame["index"]:04}.png'
            destination = out/name; destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(frame_raw)
            previous = dict(path=name, index=frame['index'], time=camera['captured_at_seconds'],
                source_path=ref['path'], **identity(frame_raw))
            frames[frame['index']] = previous
        require(previous is not None, 'A recorded action has no initial RGB sample.')
        signals = before['signals']; issued = step['command']['issued']; applied = step['applied']['ramped_targets']
        estimate = estimate_doc['estimate']
        result['rows'].append(dict(time=before['timestamp_seconds'], frame=previous['index'],
            frame_time=previous['time'], camera_source_time=camera['captured_at_seconds'],
            camera_age=estimate['age_seconds'], available=estimate['status'] == 'available',
            reason=estimate.get('reason'), phase=None, authority='student',
            measured=signals['joint_position_rad']['value']+[signals['gripper_joint_position_m']['value'][0]],
            issued=issued['joint_targets_rad']+[issued['gripper_position_m']],
            applied=applied['joint_targets_rad']+[applied['gripper_position_m']],
            interval_end=step['applied']['interval_end_seconds']))
    result['frames'] = list(frames.values())
    if not result['rows']:
        result['recording_note'] = 'The sealed recording contains no executed decision intervals; this attempt was not replaced.'
    return result


def build(study, diagnostic_viewer, audit_path, out):
    study, original, out = Path(study).resolve(), Path(diagnostic_viewer).resolve(), Path(out).absolute()
    require(not out.exists() and not out.is_symlink() and not out.resolve().is_relative_to(study)
        and not out.resolve().is_relative_to(original), 'Choose a fresh output outside the study and original viewer.')
    row, verified, selection = select_first_student(study, audit_path)
    inventory = load(original/'viewer-integrity.json')['files']
    actual = {str(path.relative_to(original)) for path in original.rglob('*')
              if path.is_file() and path.name != 'viewer-integrity.json'}
    require(actual == set(inventory), 'Original diagnostic display inventory differs.')
    for name, expected in inventory.items():
        require(identity(read(relative(original, name))) == expected, 'Original diagnostic display was modified: '+name)
    data = load(original/'evidence.json')
    require(data['status'] == 'diagnostic-only' and len(data['cases']) == 4
        and data['protocol_sha256'] == selection['protocol_sha256'], 'Expected the original four-diagnostic viewer for this study.')
    shutil.copytree(original, out)
    case = student_case(study, row, verified, selection, out)
    data.update(schema='dvidia.camera-action-evidence-viewer/v2', status='diagnostics-and-first-student',
        result_status='selected-attempt-'+row['status'], cases=[*data['cases'], case],
        selected_case='first-student', selection=selection,
        scope='Four authored-teacher diagnostics and the first scheduled learned confirmation attempt. Recorded evidence only; this subset cannot award qualification.',
        diagnostic_viewer_integrity_sha256=identity(read(original/'viewer-integrity.json'))['sha256'],
        extension_source_sha256=identity(read(__file__))['sha256'])
    (out/'evidence.json').write_bytes(canonical(data)+b'\n')
    (out/'evidence.js').write_text('window.DVIDIA_CAMERA_EVIDENCE='+canonical(data).decode().replace('<','\\u003c')+';\n')
    (out/'first-student-selection.json').write_bytes(canonical(selection)+b'\n')
    (out/'study-audit.json').write_bytes(read(audit_path))
    (out/'confirmation-stage.json').write_bytes(read(study/'stages/confirmation.json'))
    shutil.copyfile(ROOT/'scripts/camera-action-viewer/student-viewer.js', out/'viewer.js')
    html = (out/'index.html').read_text()
    html = html.replace('Student results remain pending.', 'The first scheduled learned confirmation attempt is included without outcome-based selection.')
    html = html.replace('Camera-to-action v0.1 · Diagnostic evidence', 'Camera-to-action v0.1 · Recorded evidence')
    html = html.replace('Authored teacher · student benchmark pending', 'Authored teacher and learned controller · recorded simulation')
    html = html.replace('Four recordings. Every decision retained.', 'Teacher diagnostics and the first learned attempt.')
    html = html.replace('The four teacher diagnostics complete placement. They cover two starting positions, each with two destinations. These are recorded simulation frames, not a live arm or a learned-policy demonstration.',
        'The four teacher diagnostics remain available. The added learned attempt is the first student entry in the registered confirmation roster, whether it succeeds, fails or refuses. These are recorded simulation frames, not a live arm.')
    html = html.replace('<div class="toolbar"><label>Recording', '<p id="attempt-status" class="compact" role="status"></p><div class="toolbar"><label>Recording', 1)
    html = html.replace('<strong>Qualification remains pending.</strong> This subset supplies no student success rate, superiority result, physical-camera accuracy, hardware latency or hardware qualification.',
        '<strong>A selected recording is not a benchmark rate.</strong> This subset supplies no aggregate student success rate, superiority result, physical-camera accuracy, hardware latency or hardware qualification. The <a href="study-audit.json">independent study audit</a> and <a href="first-student-selection.json">selection receipt</a> bind the added attempt.')
    (out/'index.html').write_text(html)
    manifest = {str(path.relative_to(out)): identity(read(path)) for path in sorted(out.rglob('*'))
                if path.is_file() and path.name != 'viewer-integrity.json'}
    (out/'viewer-integrity.json').write_bytes(canonical(dict(schema='dvidia.static-evidence-integrity/v1',
        files=manifest, scope='Recorded display subset; original four diagnostics preserved in a fresh viewer copy.'))+b'\n')
    return dict(cases=5, selected_attempt=row['id'], status=row['status'], strict_success=row['strict_success'],
        decisions=len(case['rows']), frames=len(case['frames']), physics_executed=False,
        output=str(out))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('study'); parser.add_argument('--diagnostic-viewer', required=True)
    parser.add_argument('--study-audit', required=True); parser.add_argument('--out', required=True)
    args = parser.parse_args()
    print(json.dumps(build(args.study, args.diagnostic_viewer, args.study_audit, args.out)))
