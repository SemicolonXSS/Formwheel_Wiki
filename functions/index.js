"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const admin=require("firebase-admin");
const crypto=require("node:crypto");
const {logger}=require("firebase-functions");
admin.initializeApp({databaseURL:"https://formwheel-default-rtdb.firebaseio.com"});
const secret=defineSecret("WIKI_ADMIN_CODE");
const database=admin.database();
const region="asia-northeast3";
const categories=["게임","도구","앱","기본","도움말"];
function validText(v,max){return typeof v==="string"&&v.trim().length>0&&v.trim().length<=max}
function safeId(v){return typeof v==="string"&&/^[a-z0-9-]{1,64}$/.test(v)}
function compare(a,b){const x=crypto.createHash("sha256").update(String(a)).digest(),y=crypto.createHash("sha256").update(String(b)).digest();return crypto.timingSafeEqual(x,y)}
async function throttle(key,limit,windowMs){
 const path=database.ref("wikiV1/rate/"+key);const now=Date.now();
 const result=await path.transaction(old=>{if(!old||old.until<now)return {count:1,until:now+windowMs};if(old.count>=limit)return;return {count:old.count+1,until:old.until}},undefined,false);
 if(!result.committed)throw new HttpsError("resource-exhausted","요청 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.");
}
exports.wikiSubmit=onCall({region,maxInstances:5},async request=>{
 if(!request.auth)throw new HttpsError("unauthenticated","로그인이 필요합니다.");
 const {mode,id,title,category,description,body}=request.data||{};
 if(!["create","edit"].includes(mode)||!validText(title,100)||!categories.includes(category)||!validText(description,1000)||!validText(body,20000))throw new HttpsError("invalid-argument","내용을 확인해주세요.");
 if(mode==="edit"&&!safeId(id))throw new HttpsError("invalid-argument","문서 주소가 올바르지 않습니다.");
 try{
   await throttle("submit/"+request.auth.uid,5,3600000);
   const node=database.ref("wikiV1/proposals").push();
   await node.set({mode,targetId:mode==="edit"?id:null,title:title.trim(),category,description:description.trim(),body:body.trim(),uid:request.auth.uid,status:"pending",createdAt:admin.database.ServerValue.TIMESTAMP});
   return {id:node.key,status:"pending"};
 }catch(err){
   if(err instanceof HttpsError)throw err;
   const diagnosticId=crypto.randomBytes(4).toString("hex");
   logger.error("wikiSubmit failed",{diagnosticId,errorCode:err?.code||"unknown",errorMessage:err?.message||"Unknown database error"});
   throw new HttpsError("internal","문서 저장 서버 오류 (진단 ID: "+diagnosticId+"). 관리자에게 문의해주세요.");
 }
});
exports.wikiModerate=onCall({region,secrets:[secret],maxInstances:3},async request=>{
 if(!request.auth)throw new HttpsError("unauthenticated","로그인이 필요합니다.");
 await throttle("moderation/"+request.auth.uid,10,3600000);
 if(!validText(request.data?.code,128)||!compare(request.data.code,secret.value()))throw new HttpsError("permission-denied","관리자 코드가 올바르지 않습니다.");
 const {action,proposalId}=request.data;
 if(action==="list"){const snap=await database.ref("wikiV1/proposals").orderByChild("status").equalTo("pending").limitToLast(100).get();return {proposals:Object.entries(snap.val()||{}).map(([id,p])=>({id,...p})).sort((a,b)=>a.createdAt-b.createdAt)}}
 if(!["approve","reject"].includes(action)||!safeId(proposalId))throw new HttpsError("invalid-argument","올바르지 않은 작업입니다.");
 const propRef=database.ref("wikiV1/proposals/"+proposalId);const snap=await propRef.get();const p=snap.val();
 if(!p||p.status!=="pending")throw new HttpsError("failed-precondition","대기 중인 요청이 아닙니다.");
 // Do not allow user supplied HTML/JS. The client renders all body content as plain text.
 if(action==="approve"){
   const id=p.mode==="edit"?p.targetId:"community-"+proposalId;
   if(!safeId(id))throw new HttpsError("invalid-argument","문서 주소가 올바르지 않습니다.");
   await database.ref("wikiV1/pages/"+id).set({title:p.title,category:p.category,description:p.description,body:p.body,updatedAt:admin.database.ServerValue.TIMESTAMP});
 }
 await propRef.update({status:action==="approve"?"approved":"rejected",reviewedAt:admin.database.ServerValue.TIMESTAMP,reviewedBy:request.auth.uid});
 return {ok:true};
});
