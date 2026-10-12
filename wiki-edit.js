import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,signInAnonymously,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getDatabase,ref,onValue} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import {getFunctions,httpsCallable} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
const firebaseConfig={apiKey:"AIzaSyBreTSe1m0-xlbF4aupnU5isRZCihR25IE",authDomain:"formwheel.firebaseapp.com",databaseURL:"https://formwheel-default-rtdb.firebaseio.com",projectId:"formwheel",appId:"1:431583088241:web:74e0e34ea1e3e1170c55d0"};
const app=initializeApp(firebaseConfig,"wiki");
const auth=getAuth(app),db=getDatabase(app),func=getFunctions(app,"asia-northeast3");
const submit=httpsCallable(func,"wikiSubmit"),moderate=httpsCallable(func,"wikiModerate");
let mode="create",editId=null,approved={},pending=[],ready=false;
const $=s=>document.querySelector(s);
function notice(el,message){$(el).textContent=message}
async function ensureAuth(){if(auth.currentUser)return;await signInAnonymously(auth)}
const editor=$("#wiki-editor-panel"),admin=$("#wiki-admin-panel");
function openModal(el){el.classList.remove("hidden")}
function closeModal(el){el.classList.add("hidden")}
document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",()=>closeModal(b.closest(".wiki-modal"))));
for(const el of [editor,admin])el.addEventListener("click",e=>{if(e.target===el)closeModal(el)});
$("#wiki-create").onclick=()=>{mode="create";editId=null;$("#wiki-editor-heading").textContent="새 문서 작성 요청";$("#wiki-editor-form").reset();openModal(editor)};
$("#wiki-edit").onclick=()=>{const id=location.hash.match(/^#\/page\/([\w-]+)$/)?.[1];const x=items.find(x=>x[0]===id);if(!x)return;mode="edit";editId=id;$("#wiki-editor-heading").textContent="문서 편집 요청 · "+x[1];$("#wiki-title-input").value=x[1];$("#wiki-category-input").value=["기본","게임","도구","앱","도움말"].includes(x[2])?x[2]:"기본";$("#wiki-description-input").value=x[5];$("#wiki-body-input").value=approved[id]?.body||x[6].join("\n\n");openModal(editor)};
$("#wiki-admin-open").onclick=()=>openModal(admin);
$("#wiki-editor-form").onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;notice("#wiki-editor-status","요청을 보내는 중…");try{await ensureAuth();await submit({mode,id:editId,title:$("#wiki-title-input").value.trim(),category:$("#wiki-category-input").value,description:$("#wiki-description-input").value.trim(),body:$("#wiki-body-input").value.trim()});notice("#wiki-editor-status","요청 접수 완료! 관리자 승인 전에는 공개되지 않습니다.");setTimeout(()=>closeModal(editor),1200)}catch(err){notice("#wiki-editor-status","제출 실패: "+(err.message||"Firebase Functions 배포 상태를 확인해주세요."))}finally{b.disabled=false}};
$("#wiki-admin-load").onclick=()=>loadQueue();
async function loadQueue(){notice("#wiki-admin-status","요청을 확인하는 중…");try{await ensureAuth();const response=await moderate({action:"list",code:$("#wiki-admin-code").value});pending=response.data.proposals||[];drawQueue();notice("#wiki-admin-status","승인 대기 요청 "+pending.length+"개")}catch(e){notice("#wiki-admin-status","조회 실패: "+e.message)}}
function drawQueue(){const root=$("#wiki-admin-list");root.replaceChildren();for(const p of pending){const box=document.createElement("section");box.className="wiki-proposal";const h=document.createElement("h3");h.textContent=p.title+" · "+(p.mode==="edit"?"편집":"생성");const desc=document.createElement("p");desc.textContent=p.description;const pre=document.createElement("pre");pre.textContent=p.body;const actions=document.createElement("div");actions.className="actions";for(const [label,decision] of [["✓ 승인","approve"],["✕ 거부","reject"]]){const b=document.createElement("button");b.className="btn"+(decision==="approve"?" primary":"");b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await moderate({action:decision,code:$("#wiki-admin-code").value,proposalId:p.id});pending=pending.filter(x=>x.id!==p.id);drawQueue();notice("#wiki-admin-status",label+" 처리 완료")}catch(e){notice("#wiki-admin-status","처리 실패: "+e.message);b.disabled=false}};actions.append(b)}box.append(h,desc,pre,actions);root.append(box)}}
const catIcon={게임:"🎮",도구:"🛠️",앱:"📱",기본:"📖",도움말:"❓"};
// Moderated content is always plain text, never treated as executable HTML.
onValue(ref(db,"wikiV1/pages"),snapshot=>{approved=snapshot.val()||{};for(const [id,p] of Object.entries(approved)){if(!p||typeof p.title!=="string")continue;let x=items.find(x=>x[0]===id);const steps=String(p.body||"").split(/\n+/).filter(Boolean).slice(0,30);if(x){x[1]=p.title;x[2]=p.category;x[4]=p.description;x[5]=p.description;x[6]=steps;x[7]="이 문서는 승인된 사용자 기여를 반영합니다."}else{items.push([id,p.title,p.category,catIcon[p.category]||"📄",p.description,p.description,steps,"이 문서는 승인된 사용자 기여입니다.","Formwheel/"])}}
 if(location.hash.match(/^#\/page\//))route();else drawList();
},error=>console.warn("Wiki 공개 문서 읽기 실패:",error.message));
