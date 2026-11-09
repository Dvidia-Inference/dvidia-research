import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source=await readFile(new URL('./camera-action-viewer/student-viewer.js',import.meta.url),'utf8');
function render(cases){
  const elements=new Map();
  class Element{
    constructor(){this.value='0';this.textContent='';this.children=[];this.attrs={};this.events={};this.hidden=false;}
    add(option){if(!this.children.length)this.value=option.value;this.children.push(option);}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=children;}
    setAttribute(key,value){this.attrs[key]=value;}
    removeAttribute(key){delete this.attrs[key];delete this[key];}
    addEventListener(name,callback){this.events[name]=callback;}
    focus(){}
  }
  const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const document={getElementById:get,createElementNS:()=>new Element(),addEventListener(){}};
  vm.runInNewContext(source,{window:{DVIDIA_CAMERA_EVIDENCE:{cases,selected_case:'first-student'}},document,
    Option:function(text,value){this.text=text;this.value=value;},performance:{now:()=>0},requestAnimationFrame(){}});
  return get;
}
function recorded(id,student=true){return {id,controller:student?'student':'teacher',attempt_id:'student-0',
  group:'development-000',goal_id:0,status:'complete',strict_success:false,longest_missing_seconds:.02,
  frames:[{index:0,path:'frames/fixture.png',time:0}],rows:[{time:0,frame:0,available:false,camera_age:0,
    phase:student?null:'close',authority:student?'student':'teacher',reason:'occluded',
    measured:[0,0,0,0,0,0,.03],issued:[0,0,0,0,0,0,.02],applied:[0,0,0,0,0,0,.029],interval_end:.02}]};}

test('recorded student uses actual outcome with no fabricated teacher phase; diagnostics remain selectable',()=>{
  const get=render([recorded('teacher',false),recorded('first-student')]);
  assert.match(get('attempt-status').textContent,/Strict task success: no/);
  assert.equal(get('phase').textContent,'Not used by learned controller');
  assert.equal(get('authority').textContent,'student');assert.equal(get('contact').disabled,true);
  assert.equal(get('frame').src,'frames/fixture.png');assert.equal(get('time').max,0);
  get('case').value='teacher';get('case').events.change();
  assert.equal(get('phase').textContent,'close');assert.equal(get('contact').disabled,false);
  assert.equal(get('authority').textContent,'teacher');
});

test('empty refused first attempt hides stale frame and motion controls without substituting a success',()=>{
  const first={...recorded('first-student'),rows:[],frames:[],status:'refused',recording_note:'Refused before motion.'};
  const get=render([recorded('teacher',false),first]);
  assert.match(get('attempt-status').textContent,/Status: refused/);
  assert.equal(get('frame').hidden,true);assert.equal(get('frame').src,undefined);
  assert.equal(get('frame-caption').textContent,'Refused before motion.');
  assert.equal(get('play').disabled,true);assert.equal(get('time').disabled,true);
  assert.equal(get('phase').textContent,'Not available');
  assert.equal(get('measured-line').attrs.points,'');
});
