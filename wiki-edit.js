let auth=null,submit=null,moderate=null,signInAnonymously=null;
let mode="create",editId=null,approved={},pending=[],ready=false;
const $=s=>document.querySelector(s);
function notice(el,message){$(el).textContent=message}
async function ensureAuth(){if(!auth||!submit)throw new Error("온라인 요청 서버에 연결되지 않았습니다. Firebase 설정 및 Functions 배포를 확인해주세요.");if(auth.currentUser)return;await signInAnonymously(auth)}
const editor=$("#wiki-editor-panel"),admin=$("#wiki-admin-panel");
function openModal(el){el.classList.remove("hidden")}
function closeModal(el){el.classList.add("hidden")}
document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",()=>closeModal(b.closest(".wiki-modal"))));
admin.addEventListener("click",e=>{if(e.target===admin)closeModal(admin)});
let returnHash="";
function editTab(which){const preview=which==="preview";$("#wiki-tab-edit").classList.toggle("active",!preview);$("#wiki-tab-preview").classList.toggle("active",preview);$("#wiki-edit-source").classList.toggle("hidden",preview);$("#wiki-preview-content").classList.toggle("hidden",!preview);if(preview)$("#wiki-preview-content").innerHTML=window.WikiSyntax.render($("#wiki-body-input").value||"")||"아직 작성된 내용이 없습니다.";}
function openEditor(){returnHash=location.hash;$("#wiki-editor-status").textContent="";editTab("edit");editor.classList.remove("hidden");$("#wiki-title-input").focus();}
function exitEditor(){editor.classList.add("hidden");if(returnHash&&location.hash!==returnHash)location.hash=returnHash;}
$("#wiki-editor-cancel").onclick=exitEditor;$("#wiki-editor-cancel-bottom").onclick=exitEditor;
$("#wiki-edit-home").onclick=e=>{e.preventDefault();editor.classList.add("hidden");location.hash="";};
$("#wiki-tab-edit").onclick=()=>editTab("edit");
$("#wiki-tab-preview").onclick=()=>editTab("preview");
$("#wiki-body-input").addEventListener("input",()=>$("#wiki-edit-count").textContent=$("#wiki-body-input").value.length.toLocaleString()+" / 20,000자");
$("#wiki-create").onclick=()=>{mode="create";editId=null;$("#wiki-editor-heading").textContent="새 문서 작성";$("#wiki-edit-crumb").textContent="새 문서 작성";$("#wiki-editor-form").reset();$("#wiki-edit-count").textContent="0 / 20,000자";openEditor();};
$("#wiki-edit").onclick=()=>{const id=location.hash.startsWith("#/page/")?location.hash.slice(7):null;const x=items.find(x=>x[0]===id);if(!x)return;mode="edit";editId=id;$("#wiki-editor-heading").textContent=x[1]+" (편집)";$("#wiki-edit-crumb").textContent=x[1]+" / 편집";$("#wiki-title-input").value=x[1];$("#wiki-category-input").value=["기본","게임","도구","앱","도움말"].includes(x[2])?x[2]:"기본";$("#wiki-description-input").value=x[5];$("#wiki-body-input").value=approved[id]?.body||window.WikiSyntax.sourceFor(x,typeof extended!=="undefined"?extended:{});$("#wiki-edit-count").textContent=$("#wiki-body-input").value.length.toLocaleString()+" / 20,000자";openEditor();};
$("#wiki-admin-open").onclick=()=>openModal(admin);
$("#wiki-editor-form").onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;notice("#wiki-editor-status","요청을 보내는 중…");try{await ensureAuth();await submit({mode,id:editId,title:$("#wiki-title-input").value.trim(),category:$("#wiki-category-input").value,description:$("#wiki-description-input").value.trim(),body:$("#wiki-body-input").value.trim()});notice("#wiki-editor-status","요청 접수 완료! 관리자 승인 전에는 공개되지 않습니다.");setTimeout(exitEditor,1200)}catch(err){{const code=String(err.code||"");const message=code.includes("internal")?(err.message&&err.message.includes("진단 ID")?err.message:"서버 내부 오류입니다. Firebase Functions 배포 및 서버 로그를 확인해주세요. (functions/internal)"):code.includes("not-found")?"제출 함수가 아직 배포되지 않았거나 위치가 다릅니다. (functions/not-found)":code.includes("unauthenticated")?"로그인이 필요합니다. (functions/unauthenticated)":code.includes("resource-exhausted")?"요청 횟수 제한에 도달했어요. 나중에 다시 시도해주세요.":(err.message||"연결 설정을 확인해주세요.");console.error("Wiki 제출 실패",err);notice("#wiki-editor-status","제출 실패: "+message)}}finally{b.disabled=false}};
$("#wiki-admin-load").onclick=()=>loadQueue();
async function loadQueue(){notice("#wiki-admin-status","요청을 확인하는 중…");try{await ensureAuth();const response=await moderate({action:"list",code:$("#wiki-admin-code").value});pending=response.data.proposals||[];drawQueue();notice("#wiki-admin-status","승인 대기 요청 "+pending.length+"개")}catch(e){notice("#wiki-admin-status","조회 실패: "+e.message)}}
function drawQueue(){const root=$("#wiki-admin-list");root.replaceChildren();for(const p of pending){const box=document.createElement("section");box.className="wiki-proposal";const h=document.createElement("h3");h.textContent=p.title+" · "+(p.mode==="edit"?"편집":"생성");const desc=document.createElement("p");desc.textContent=p.description;const pre=document.createElement("pre");pre.textContent=p.body;const actions=document.createElement("div");actions.className="actions";for(const [label,decision] of [["✓ 승인","approve"],["✕ 거부","reject"]]){const b=document.createElement("button");b.className="btn"+(decision==="approve"?" primary":"");b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await moderate({action:decision,code:$("#wiki-admin-code").value,proposalId:p.id});pending=pending.filter(x=>x.id!==p.id);drawQueue();notice("#wiki-admin-status",label+" 처리 완료")}catch(e){notice("#wiki-admin-status","처리 실패: "+e.message);b.disabled=false}};actions.append(b)}box.append(h,desc,pre,actions);root.append(box)}}
const catIcon={게임:"🎮",도구:"🛠️",앱:"📱",기본:"📖",도움말:"❓"};
// Moderated content is always plain text, never treated as executable HTML.
async function initializeWikiBackend(){
 try{
 const [{initializeApp},{getAuth,signInAnonymously:signIn},{getDatabase,ref,onValue},{getFunctions,httpsCallable}]=await Promise.all([
 import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
 import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
 import("https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js"),
 import("https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js")]);
 const config={apiKey:"AIzaSyBreTSe1m0-xlbF4aupnU5isRZCihR25IE",authDomain:"formwheel.firebaseapp.com",databaseURL:"https://formwheel-default-rtdb.firebaseio.com",projectId:"formwheel",appId:"1:431583088241:web:74e0e34ea1e3e1170c55d0"};
 const app=initializeApp(config,"wiki");auth=getAuth(app);signInAnonymously=signIn;const db=getDatabase(app),func=getFunctions(app,"asia-northeast3");submit=httpsCallable(func,"wikiSubmit");moderate=httpsCallable(func,"wikiModerate");
 onValue(ref(db,"wikiV1/pages"),snapshot=>{approved=snapshot.val()||{};window.wikiApprovedBody=Object.fromEntries(Object.entries(approved).filter(([id,p])=>p&&typeof p.body==="string").map(([id,p])=>[id,p.body]));for(const [id,p] of Object.entries(approved)){if(!p||typeof p.title!=="string")continue;let x=items.find(x=>x[0]===id);const steps=String(p.body||"").split(/\n+/).filter(Boolean).slice(0,30);if(x){x[1]=p.title;x[2]=p.category;x[4]=p.description;x[5]=p.description;x[6]=steps;x[7]="이 문서는 승인된 사용자 기여를 반영합니다."}else{items.push([id,p.title,p.category,catIcon[p.category]||"📄",p.description,p.description,steps,"이 문서는 승인된 사용자 기여입니다.","Formwheel/"])}}
 if(location.hash.match(/^#\/page\//))route();else drawList();
},error=>console.warn("Wiki 공개 문서 읽기 실패:",error.message));

 }catch(error){console.warn("Wiki 온라인 연결 실패. 편집 화면은 계속 사용할 수 있습니다.",error);}
}
initializeWikiBackend();
