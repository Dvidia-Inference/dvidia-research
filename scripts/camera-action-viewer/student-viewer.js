'use strict';
const evidence=window.DVIDIA_CAMERA_EVIDENCE;
const el=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
const select=el('case'), joint=el('joint'), slider=el('time');
let playing=false, last=0, accumulator=0;
for (const c of evidence.cases) select.add(new Option(c.controller==='student'?'Learned · first scheduled confirmation':`Teacher · ${c.group.replace('development-','Start ')} · destination ${c.goal_id+1}`,c.id));
if(evidence.selected_case)select.value=evidence.selected_case;
const current=()=>evidence.cases.find(c=>c.id===select.value);
function svg(tag, attrs, text){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n}
function graph(){
  const c=current(),j=Number(joint.value), grid=el('plot-grid');grid.replaceChildren();
  slider.max=Math.max(0,c.rows.length-1);slider.disabled=!c.rows.length;el('play').disabled=!c.rows.length;el('contact').disabled=c.controller==='student'||!c.rows.length;
  el('attempt-status').textContent=c.controller==='student'?`First scheduled student attempt: ${c.attempt_id}. Status: ${c.status}. Strict task success: ${c.strict_success===true?'yes':'no'}. Selected by protocol order, irrespective of outcome.`:'Authored teacher diagnostic. Strict task success: '+(c.strict_success===true?'yes':'no')+'.';
  if(!c.rows.length){for(const kind of ['measured','issued','applied'])el(`${kind}-line`).setAttribute('points','');el('mask-blocks').replaceChildren();draw();return;}
  const values=c.rows.flatMap(r=>[r.measured[j],r.issued[j],r.applied[j]]);
  let lo=Math.min(...values),hi=Math.max(...values),span=Math.max(hi-lo,j===6?.003:.1);lo-=span*.12;hi+=span*.12;
  const X=t=>48+t/20*738,Y=v=>211-(v-lo)/(hi-lo)*191;
  for(let n=0;n<5;n++){const v=lo+(hi-lo)*n/4,y=Y(v);grid.append(svg('line',{x1:48,x2:786,y1:y,y2:y}),svg('text',{x:42,y:y+3,'text-anchor':'end'},v.toFixed(j===6?3:2)))}
  for(const t of [0,5,10,15,20]){const x=X(t);grid.append(svg('text',{x,y:235,'text-anchor':'middle'},`${t} s`))}
  for(const kind of ['measured','issued','applied'])el(`${kind}-line`).setAttribute('points',c.rows.map(r=>`${X(kind==='applied'?r.interval_end:r.time).toFixed(2)},${Y(r[kind][j]).toFixed(2)}`).join(' '));
  const mask=el('mask-blocks');mask.replaceChildren();let begin=0;
  for(let i=1;i<=c.rows.length;i++)if(i===c.rows.length||c.rows[i].available!==c.rows[begin].available){const start=c.rows[begin].time,end=i===c.rows.length?c.rows[i-1].interval_end:c.rows[i].time;mask.append(svg('rect',{x:X(start),y:6,width:X(end)-X(start),height:28,fill:c.rows[begin].available?'#42664f':'url(#missing)'}));begin=i}
  draw();
}
function draw(){
  const c=current();
  if(!c.rows.length){el('frame').hidden=true;el('frame').removeAttribute('src');el('frame-caption').textContent=c.recording_note||'No sealed executed decisions are available for this selected attempt.';for(const id of ['clock','availability','age','phase','authority','values'])el(id).textContent='Not available';el('reason').textContent='No replacement attempt was selected.';for(const id of ['cursor','mask-cursor'])el(id).setAttribute('visibility','hidden');return;}
  el('frame').hidden=false;for(const id of ['cursor','mask-cursor'])el(id).setAttribute('visibility','visible');
  const r=c.rows[Number(slider.value)],j=Number(joint.value),frame=c.frames.find(f=>f.index===r.frame);
  el('frame').src=frame.path;el('frame').alt=`Recorded simulated PiPER, ${c.id}, RGB captured at ${frame.time.toFixed(2)} seconds`;
  el('frame-caption').textContent=`Native RGB · 320 × 240 · frame ${frame.index} at ${frame.time.toFixed(2)} s. Decision at ${r.time.toFixed(2)} s; display lag ${Math.max(0,r.time-frame.time).toFixed(2)} s.`;
  el('clock').textContent=`${r.time.toFixed(2)} s`;slider.setAttribute('aria-valuetext',`${r.time.toFixed(2)} simulation seconds`);
  el('availability').textContent=r.available?'Available':'Missing';el('availability').className=r.available?'':'is-missing';
  el('age').textContent=`${(r.camera_age*1000).toFixed(0)} ms · simulation clock`;el('phase').textContent=r.phase===null?'Not used by learned controller':r.phase;el('authority').textContent=r.authority;
  el('reason').textContent=`Estimator: ${(r.reason||'No reason recorded').replaceAll('_',' ')}. Longest missing stretch in this recording: ${Number.isFinite(c.longest_missing_seconds)?c.longest_missing_seconds.toFixed(2)+' s':'not reported'}.`;
  const unit=j===6?'m':'rad';el('values').textContent=`At ${r.time.toFixed(2)} s: measured ${r.measured[j].toFixed(4)} ${unit}; issued ${r.issued[j].toFixed(4)} ${unit}. Applied at ${r.interval_end.toFixed(2)} s: ${r.applied[j].toFixed(4)} ${unit}.`;
  for(const id of ['cursor','mask-cursor']){const n=el(id);n.setAttribute('x1',48+r.time/20*738);n.setAttribute('x2',48+r.time/20*738)}
}
function stop(){playing=false;el('play').textContent='Play recording';el('play').setAttribute('aria-pressed','false')}
el('play').addEventListener('click',()=>{if(playing){stop();return}if(Number(slider.value)>=Number(slider.max))slider.value=0;playing=true;last=performance.now();accumulator=0;el('play').textContent='Pause';el('play').setAttribute('aria-pressed','true');requestAnimationFrame(tick)});
function tick(now){if(!playing)return;accumulator+=now-last;last=now;const steps=Math.floor(accumulator/20);if(steps){accumulator-=steps*20;slider.value=Math.min(Number(slider.max),Number(slider.value)+steps);draw()}if(Number(slider.value)>=Number(slider.max))stop();else requestAnimationFrame(tick)}
select.addEventListener('change',()=>{stop();slider.value=0;graph()});joint.addEventListener('change',graph);slider.addEventListener('input',()=>{stop();draw()});
el('contact').addEventListener('click',()=>{stop();const index=current().rows.findIndex(r=>r.phase==='close');slider.value=Math.max(0,index);draw();slider.focus()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});graph();
