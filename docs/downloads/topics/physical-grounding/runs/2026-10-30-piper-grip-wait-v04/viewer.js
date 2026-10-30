'use strict';
const labels={guarded:'Bounded waiting',clock:'Learned clock',fixed:'Fixed progression',teacher:'Teacher'};
const state={rows:[]};
function kind(row){return row.interrupted_unevaluable?'unknown':row.success===true?'success':'failure';}
function cell(text,cls){const td=document.createElement('td');td.textContent=text;if(cls)td.className=cls;return td;}
function render(){
 const variant=document.getElementById('variant').value,outcome=document.getElementById('outcome').value,condition=document.getElementById('condition').value,search=document.getElementById('search').value.trim().toLowerCase();
 const rows=state.rows.filter(r=>(!variant||r.variant===variant)&&(!outcome||kind(r)===outcome)&&(!condition||r.condition===condition)&&(!search||r.case_id.toLowerCase().includes(search)));
 const body=document.getElementById('rows'),frag=document.createDocumentFragment();
 for(const r of rows){
  const tr=document.createElement('tr');tr.dataset.outcome=kind(r);tr.dataset.variant=r.variant;
  const result=kind(r),supervisor=r.supervisor_summary;
  tr.append(cell(r.case_id,'mono'),cell(labels[r.variant]),cell(r.condition==='nominal'?'Nominal':'Pulse assigned'),cell(result==='unknown'?'Unknown':result==='success'?'Success':'Observed failure','result '+result));
  tr.append(cell(result==='unknown'?'—':r.variant==='guarded'&&supervisor?Math.round(supervisor.wait_seconds*1000)+' ms':'—'));
  tr.append(cell(result==='unknown'?'Not scored':r.variant!=='guarded'?'Not applicable':r.aborted?'Aborted: '+r.abort_reason:r.acquisition_released?'Released':'Not latched'));
  const evidence=document.createElement('td');
  if(result==='unknown'){evidence.append(document.createTextNode('Interrupted; native outcome unknown.'));const note=document.createElement('div');note.className='small';note.textContent='Primary analysis imputes failure; not an observed failure.';evidence.append(note);}
  else{const reason=document.createElement('div');reason.textContent=r.score_reason;const hash=document.createElement('div');hash.className='mono';hash.textContent='Receipt SHA256: '+r.receipt_sha256;evidence.append(reason,hash);}
  tr.append(evidence);frag.append(tr);
 }
 body.replaceChildren(frag);
 document.getElementById('status').textContent=rows.length+' of 512 scheduled records · '+rows.filter(r=>kind(r)==='unknown').length+' unknown in this view. Raw native arrays are not included.';
}
document.getElementById('filters').addEventListener('input',render);
document.getElementById('filters').addEventListener('change',render);
document.getElementById('filters').addEventListener('reset',()=>setTimeout(render,0));
fetch('benchmarks/piper-grip-wait-v04/recovery-20261030/report.json',{credentials:'omit',cache:'no-store'}).then(r=>{if(!r.ok)throw Error('unavailable');return r.json();}).then(report=>{
 if(report.schema!=='dvidia.piper-grip-wait-compact-recovery/v1'||report.rows.length!==512||report.rows.filter(r=>r.interrupted_unevaluable).length!==4)throw Error('scope');
 state.rows=report.rows;render();
}).catch(()=>{document.getElementById('status').textContent='Could not load the compact report. Serve this directory over HTTP, or read the JSON report directly below.';});
