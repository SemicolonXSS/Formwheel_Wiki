import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,signInAnonymously,signInWithPopup,GoogleAuthProvider,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getDatabase,ref,push,set,get,update,onValue,query,orderByChild,equalTo,limitToLast} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
const config={apiKey:"AIzaSyBreTSe1m0-xlbF4aupnU5isRZCihR25IE",authDomain:"formwheel.firebaseapp.com",databaseURL:"https://formwheel-default-rtdb.firebaseio.com",projectId:"formwheel",appId:"1:431583088241:web:74e0e34ea1e3e1170c55d0"};
const app=initializeApp(config,"formwheel-wiki"),auth=getAuth(app),db=getDatabase(app);
const $=s=>document.querySelector(s),editor=$("#wiki-editor-panel"),admin=$("#wiki-admin-panel");
let mode="create",editId=null,approved={},pending=[],returnHash="",isAdmin=false;
function message(where,value){$(where).textContent=value}
function reveal(el){el.classList.remove("hidden")}
function hide(el){el.classList.add("hidden")}
function errorMessage(e){const code=String(e?.code||"");if(code.includes("permission-denied"))return "Firebase Rules에서 권한이 거부되었어요. 관리자 UID/Rules 배포 또는 로그인 상태를 확인하세요.";if(code.includes("auth/popup"))return "Google 로그인 팝업이 차단되거나 닫혔어요.";if(code.includes("auth/operation-not-allowed"))return "Firebase Authentication에서 해당 로그인 방식을 활성화해야 해요.";return e?.message||"네트워크 및 Firebase 설정을 확인해 주세요."}
async function ensureAuth(){if(auth.currentUser)return auth.currentUser;const cred=await signInAnonymously(auth);return cred.user}
async function refreshAdmin(){const user=auth.currentUser;if(!user||user.isAnonymous){isAdmin=false;return false}const snap=await get(ref(db,"wikiV1/admins/"+user.uid));isAdmin=snap.val()===true;return isAdmin}
function editTab(which){const preview=which==="preview";$("#wiki-tab-edit").classList.toggle("active",!preview);$("#wiki-tab-preview").classList.toggle("active",preview);$("#wiki-edit-source").classList.toggle("hidden",preview);$("#wiki-preview-content").classList.toggle("hidden",!preview);if(preview)$("#wiki-preview-content").innerHTML=window.WikiSyntax.render($("#wiki-body-input").value||"")||"본문이 비어 있습니다."}
function openEditor(){returnHash=location.hash;message("#wiki-editor-status","");editTab("edit");reveal(editor);$("#wiki-title-input").focus()}
function exitEditor(){hide(editor);if(returnHash&&location.hash!==returnHash)location.hash=returnHash}
$("#wiki-create").addEventListener("click",()=>{mode="create";editId=null;$("#wiki-editor-form").reset();$("#wiki-editor-heading").textContent="새 문서 작성";$("#wiki-edit-crumb").textContent="새 문서 작성";$("#wiki-edit-count").textContent="0 / 20,000자";openEditor()});
$("#wiki-edit").addEventListener("click",()=>{const id=location.hash.startsWith("#/page/")?location.hash.slice(7):null;const x=items.find(v=>v[0]===id);if(!x)return;mode="edit";editId=id;$("#wiki-editor-heading").textContent=x[1]+" (편집)";$("#wiki-edit-crumb").textContent=x[1]+" / 편집";$("#wiki-title-input").value=x[1];$("#wiki-category-input").value=["게임","도구","앱","기본","도움말"].includes(x[2])?x[2]:"기본";$("#wiki-description-input").value=x[5];$("#wiki-body-input").value=approved[id]?.body||window.WikiSyntax.sourceFor(x,typeof extended==="undefined"?{}:extended);$("#wiki-edit-count").textContent=$("#wiki-body-input").value.length.toLocaleString()+" / 20,000자";openEditor()});
$("#wiki-tab-edit").onclick=()=>editTab("edit");$("#wiki-tab-preview").onclick=()=>editTab("preview");
$("#wiki-body-input").oninput=()=>$("#wiki-edit-count").textContent=$("#wiki-body-input").value.length.toLocaleString()+" / 20,000자";
$("#wiki-editor-cancel").onclick=exitEditor;$("#wiki-editor-cancel-bottom").onclick=exitEditor;
$("#wiki-edit-home").onclick=e=>{e.preventDefault();hide(editor);location.hash=""};
$("#wiki-editor-form").onsubmit=async e=>{
 e.preventDefault();const button=$("#wiki-submit-edit");button.disabled=true;message("#wiki-editor-status","편집 요청을 저장하는 중…");
 try{
  const user=await ensureAuth(),node=push(ref(db,"wikiV1/proposals"));
  const title=$("#wiki-title-input").value.trim(),description=$("#wiki-description-input").value.trim(),body=$("#wiki-body-input").value.trim();
  if(!title||!description||!body)throw new Error("제목, 소개, 본문을 입력해 주세요.");
  if(mode==="edit"&&!/^[a-z0-9-]{1,64}$/.test(editId||""))throw new Error("올바르지 않은 문서 ID입니다.");
  await set(node,{mode,targetId:mode==="edit"?editId:"",title,category:$("#wiki-category-input").value,description,body,uid:user.uid,status:"pending",createdAt:Date.now()});
  message("#wiki-editor-status","접수 완료! 관리자 승인 전까지 공개되지 않아요.");button.disabled=true;
 }catch(err){message("#wiki-editor-status","제출 실패: "+errorMessage(err));button.disabled=false}
};
document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",()=>hide(b.closest(".wiki-modal"))));
admin.addEventListener("click",e=>{if(e.target===admin)hide(admin)});
$("#wiki-admin-open").onclick=()=>reveal(admin);
$("#wiki-admin-load").onclick=loadQueue;
async function loadQueue(){
 message("#wiki-admin-status","관리자 권한을 확인하는 중…");
 try{
  if(!await refreshAdmin())throw new Error("관리자로 등록된 Google 계정이 아니에요. 아래 'Google 로그인' 후 Rules의 관리자 UID를 확인해 주세요.");
  const snap=await get(query(ref(db,"wikiV1/proposals"),orderByChild("status"),equalTo("pending"),limitToLast(100)));
  pending=Object.entries(snap.val()||{}).map(([id,p])=>({id,...p})).sort((a,b)=>a.createdAt-b.createdAt);
  drawQueue();message("#wiki-admin-status","대기 중인 요청 "+pending.length+"개");
 }catch(err){message("#wiki-admin-status","조회 실패: "+errorMessage(err))}
}
$("#wiki-google-login").onclick=async()=>{try{const result=await signInWithPopup(auth,new GoogleAuthProvider());message("#wiki-admin-status","Google 로그인 완료. UID: "+result.user.uid+" · 관리자 등록 후 요청 조회를 눌러주세요.");await refreshAdmin()}catch(err){message("#wiki-admin-status","로그인 실패: "+errorMessage(err))}};
$("#wiki-admin-logout").onclick=async()=>{await auth.signOut();isAdmin=false;message("#wiki-admin-status","로그아웃했어요.")};
function drawQueue(){
 const root=$("#wiki-admin-list");root.replaceChildren();
 for(const p of pending){const box=document.createElement("section");box.className="wiki-proposal";
  const h=document.createElement("h3");h.textContent=p.title+" · "+(p.mode==="edit"?"수정":"새 문서");
  const summary=document.createElement("p");summary.textContent=p.description;
  const pre=document.createElement("pre");pre.textContent=p.body;
  const buttons=document.createElement("div");buttons.className="actions";
  for(const [label,decision] of [["✓ 승인","approved"],["✕ 거부","rejected"]]){
   const b=document.createElement("button");b.type="button";b.className="btn"+(decision==="approved"?" primary":"");b.textContent=label;
   b.onclick=async()=>{if(!isAdmin)return;for(const node of buttons.querySelectorAll("button"))node.disabled=true;
    try{
     const changes={};
     if(decision==="approved"){
      const id=p.mode==="edit"?p.targetId:"community-"+p.id;
      if(!/^[a-z0-9-]{1,100}$/.test(id))throw new Error("문서 ID가 올바르지 않습니다.");
      changes["wikiV1/pages/"+id]={title:p.title,description:p.description,category:p.category,body:p.body,updatedAt:Date.now()};
     }
     changes["wikiV1/proposals/"+p.id+"/status"]=decision;
     changes["wikiV1/proposals/"+p.id+"/reviewedBy"]=auth.currentUser.uid;
     changes["wikiV1/proposals/"+p.id+"/reviewedAt"]=Date.now();
     await update(ref(db),changes);pending=pending.filter(x=>x.id!==p.id);drawQueue();
     message("#wiki-admin-status",decision==="approved"?"승인되어 공개됐어요.":"거부 처리했어요.");
    }catch(err){message("#wiki-admin-status","처리 실패: "+errorMessage(err));for(const node of buttons.querySelectorAll("button"))node.disabled=false}
   };buttons.append(b);
  }box.append(h,summary,pre,buttons);root.append(box)}
}
onAuthStateChanged(auth,user=>{if(!user)isAdmin=false});
onValue(ref(db,"wikiV1/pages"),snapshot=>{
 approved=snapshot.val()||{};
 window.wikiApprovedBody=Object.fromEntries(Object.entries(approved).filter(([,v])=>typeof v?.body==="string").map(([id,v])=>[id,v.body]));
 for(const [id,p] of Object.entries(approved)){
  if(!p||typeof p.title!=="string")continue;
  const steps=String(p.body||"").split(/\n+/).filter(Boolean).slice(0,30);
  let x=items.find(x=>x[0]===id);
  if(x){x[1]=p.title;x[2]=p.category;x[4]=p.description;x[5]=p.description;x[6]=steps;x[7]="승인된 사용자 문서입니다."}
  else items.push([id,p.title,p.category,"📄",p.description,p.description,steps,"승인된 사용자 문서입니다.","Formwheel/"]);
 }
 if(location.hash.startsWith("#/page/"))route();else drawList();
},err=>console.error("Wiki 승인 문서 읽기 오류",err));
