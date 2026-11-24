import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { io as connect } from 'socket.io-client';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root=process.cwd();
const port=42000+Math.floor(Math.random()*12000);
const base=`http://127.0.0.1:${port}`;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qba-integration-'));
const server=spawn(process.execPath,['backend/server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),HOST:'127.0.0.1',DATABASE_PATH:path.join(temp,'test.sqlite'),PUBLIC_BASE_URL:base,SESSION_SECRET:'test-secret-with-at-least-32-random-characters'},stdio:'ignore'});

async function waitForHealth(){
  for(let i=0;i<80;i++){
    try{const response=await fetch(`${base}/api/health`);if(response.ok)return;}
    catch{}
    await delay(100);
  }
  throw new Error('QBA server did not become healthy.');
}
function eventOnce(socket,event,predicate=()=>true,timeout=7000){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{socket.off(event,listener);reject(new Error(`Timed out waiting for ${event}`));},timeout);
    const listener=value=>{if(!predicate(value))return;clearTimeout(timer);socket.off(event,listener);resolve(value);};
    socket.on(event,listener);
  });
}
async function post(url,body,cookie){
  const response=await fetch(`${base}${url}`,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  const data=await response.json();if(!response.ok)throw new Error(data.error||`POST ${url} failed`);return {data,response};
}
const inputSequences=new WeakMap();
function sendInput(socket,x,y){
  const seq=(inputSequences.get(socket)||0)+1;inputSequences.set(socket,seq);
  socket.emit('game:input',{x,y,seq});
}
async function moveToAnswer(socket,getState,answerIndex){
  const locked=eventOnce(socket,'game:state',state=>state.phase==='ACTIVE'&&state.self?.locked===true,9000);
  const timer=setInterval(()=>{
    const state=getState(),zone=state?.zones?.[answerIndex];
    if(state?.phase!=='ACTIVE'||state.self?.locked||!zone)return;
    const dx=zone.x-state.self.x,dy=zone.y-state.self.y,mag=Math.hypot(dx,dy)||1;
    sendInput(socket,dx/mag,dy/mag);
  },50);
  try{return await locked;}finally{clearInterval(timer);}
}
async function verifyMovement(socket,state){
  const startX=state.self.x,direction=startX<480?1:-1;
  const moved=eventOnce(socket,'game:state',next=>next.phase==='ACTIVE'&&next.questionNumber===2&&direction*(next.self.x-startX)>12,5000);
  for(let i=0;i<8;i++)sendInput(socket,direction,0);
  return moved;
}

test('two independent Socket.IO players receive a server-run Survival Quiz arena', {timeout:30000}, async t=>{
  const sockets=[];
  t.after(async()=>{
    for(const socket of sockets)socket.disconnect();
    server.kill('SIGTERM');
    await delay(300);
    fs.rmSync(temp,{recursive:true,force:true});
  });
  await waitForHealth();
  const registered=await post('/api/auth/register',{email:'host@example.test',password:'long-test-password',displayName:'Test Host'});
  const cookie=registered.response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie,'host session cookie is issued');
  const quiz=await post('/api/quizzes',{title:'Socket test',description:'',questions:[
    {question:'Which answer is correct?',answers:['A','B','C','D'],correctAnswerIndex:2,timeLimit:12,wrongAnswerDamage:20,correctAnswerReward:10},
    {question:'Which answer comes second?',answers:['A','B','C','D'],correctAnswerIndex:1,timeLimit:12,wrongAnswerDamage:20,correctAnswerReward:10}
  ]},cookie);
  const room=await post('/api/tournaments',{quizId:quiz.data.id,settings:{questionsPerMatch:2,readingSeconds:0,answerSeconds:12,feedbackSeconds:2,antiCopy:true,randomQuestions:false,randomAnswers:false}},cookie);
  const first=await post('/api/join',{publicId:room.data.publicId,nickname:'Player One',character:'bot'});
  const second=await post('/api/join',{publicId:room.data.publicId,nickname:'Player Two',character:'ninja'});
  const host=connect(base,{transports:['websocket'],extraHeaders:{Cookie:cookie}});sockets.push(host);
  const hostLobby=eventOnce(host,'room:lobby',value=>value.publicId===room.data.publicId);
  host.on('connect',()=>host.emit('host:attach',{publicId:room.data.publicId}));
  await hostLobby;
  const a=connect(base,{transports:['websocket'],auth:{token:first.data.token}});sockets.push(a);
  const b=connect(base,{transports:['websocket'],auth:{token:second.data.token}});sockets.push(b);
  let latestA=null,latestB=null;
  a.on('game:state',state=>{latestA=state;});b.on('game:state',state=>{latestB=state;});
  const readyA=eventOnce(a,'player:ready');const readyB=eventOnce(b,'player:ready');
  a.on('connect',()=>a.emit('player:attach',{token:first.data.token}));
  b.on('connect',()=>b.emit('player:attach',{token:second.data.token}));
  await Promise.all([readyA,readyB]);
  const stateA=eventOnce(a,'game:state',state=>state.phase==='ACTIVE'&&Boolean(state.question));
  const stateB=eventOnce(b,'game:state',state=>state.phase==='ACTIVE'&&Boolean(state.question));
  const bracketState=eventOnce(host,'tournament:state',state=>state.status==='active');
  host.emit('host:start');
  const [aState,bState,bracket]=await Promise.all([stateA,stateB,bracketState]);
  assert.equal(bracket.rounds.length,1,'first round has no sparse null entry');
  assert.ok(Array.isArray(bracket.rounds[0]),'bracket rounds serialize as arrays');
  const activeRoomsResponse=await fetch(`${base}/api/tournaments`,{headers:{Cookie:cookie}});
  const activeRooms=await activeRoomsResponse.json();
  assert.equal(activeRooms[0]?.publicId,room.data.publicId,'a host can recover their live room after navigating away');
  assert.equal(aState.question.question,'Which answer is correct?');
  assert.deepEqual(aState.question.answers,bState.question.answers);
  assert.equal('correctAnswerIndex' in aState.question,false,'clients do not receive the correct answer before resolution');
  const rival=aState.players.find(player=>player.id!==aState.self.id);
  assert.equal(typeof rival?.x,'number','the active player can see the rival outside an answer zone');
  assert.equal(typeof rival?.y,'number','the rival position is synchronized during the battle');
  const dashState=eventOnce(a,'game:state',state=>state.self?.dashing===true);
  a.emit('game:action',{type:'dash'});
  const dashed=await dashState;
  assert.equal(dashed.self.dashReady,false,'dash activation and cooldown are confirmed by the server');
  const shieldState=eventOnce(a,'game:state',state=>state.self?.shielded===true);
  a.emit('game:action',{type:'shield'});
  const shielded=await shieldState;
  assert.equal(shielded.self.abilityReady,false,'shield activation and cooldown are confirmed by the server');
  const startX=aState.self.x;
  for(let i=0;i<6;i++)sendInput(a,1,0);
  const moved=await eventOnce(a,'game:state',state=>state.phase==='ACTIVE'&&state.self.x>startX+12);
  assert.ok(moved.self.x>startX,'the server applied movement intentions to authoritative position');

  const feedbackA=eventOnce(a,'game:state',state=>state.phase==='FEEDBACK'&&state.questionNumber===1);
  const [lockedA,lockedB,feedback]=await Promise.all([
    moveToAnswer(a,()=>latestA,2),
    moveToAnswer(b,()=>latestB,2),
    feedbackA
  ]);
  assert.equal(lockedA.self.locked,true,'Player 1 can lock the correct answer');
  assert.equal(lockedB.self.locked,true,'Player 2 can lock the correct answer');
  assert.equal(feedback.feedback.correctAnswerIndex,2,'the server resolves Q1 after both players answer');
  assert.ok(feedback.feedback.outcome.every(player=>player.correct),'both independent clients receive a correct Q1 outcome');

  const secondQuestionA=eventOnce(a,'game:state',state=>state.phase==='ACTIVE'&&state.questionNumber===2&&Boolean(state.question),9000);
  const secondQuestionB=eventOnce(b,'game:state',state=>state.phase==='ACTIVE'&&state.questionNumber===2&&Boolean(state.question),9000);
  const [stateA2,stateB2]=await Promise.all([secondQuestionA,secondQuestionB]);
  assert.equal(stateA2.question.question,'Which answer comes second?');
  assert.equal(stateB2.question.question,'Which answer comes second?');
  const [movedA2,movedB2]=await Promise.all([verifyMovement(a,stateA2),verifyMovement(b,stateB2)]);
  assert.notEqual(movedA2.self.x,stateA2.self.x,'Player 1 moves authoritatively after Q1 resolution');
  assert.notEqual(movedB2.self.x,stateB2.self.x,'Player 2 moves authoritatively after Q1 resolution');
});
