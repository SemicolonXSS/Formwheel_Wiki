/* Formwheel Wiki document syntax. All user input is escaped before markup rendering. */
(function(){
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 function resolve(raw){
  const value=raw.trim();if(!value||/[\s<>"']/u.test(value))return null;
  if(/^javascript:|^data:|^vbscript:/i.test(value))return null;
  if(/^https?:\/\//i.test(value)){try{const u=new URL(value);return {href:u.href,title:decodeURIComponent(u.hash.split('/').filter(Boolean).pop()||u.pathname.split('/').filter(Boolean).pop()||u.hostname),external:true}}catch{return null}}
  if(value.startsWith('#/page/')){const id=value.slice(7);if(!/^[\w-]+$/.test(id))return null;const x=typeof items!=='undefined'&&items.find(p=>p[0]===id);return {href:'#/page/'+id,title:x?x[1]:id,external:false}}
  const id=value.replace(/^\/+|\/+$/g,'');if(!/^[\w-]+$/.test(id))return null;const x=typeof items!=='undefined'&&items.find(p=>p[0]===id);return {href:'#/page/'+id,title:x?x[1]:id,external:false};
 }
 function inline(raw){
  const saved=[];const token=html=>{const i=saved.length;saved.push(html);return '\uE000'+i+'\uE001'};
  let text=String(raw).replace(/\{(\[[^\]\n]*\])\}/g,(_,literal)=>token(esc(literal)));
  text=text.replace(/\(\*[\s\S]*?\)/g,'');
  text=text.replace(/\[([^\]\n]+)\]/g,(whole,url)=>{const x=resolve(url);if(!x)return whole;return token('<a class="wiki-syntax-link" href="'+esc(x.href)+'"'+(x.external?' target="_blank" rel="noopener noreferrer"':'')+'>'+esc(x.title)+'</a>')});
  text=esc(text);
  text=text.replace(/==([^=\n]+)==/g,(_,v)=>'<strong>'+v+'</strong>');
  text=text.replace(/~~([^~\n]+)~~/g,(_,v)=>'<del>'+v+'</del>');
  return text.replace(/\uE000(\d+)\uE001/g,(_,i)=>saved[Number(i)]||'');
 }
 function render(raw){
  const source=String(raw||'').replace(/\r\n?/g,'\n');
  const comments=[...source.matchAll(/\(\*([\s\S]*?)\)/g)].map(m=>m[1].trim()).filter(Boolean);
  const lines=source.replace(/\(\*[\s\S]*?\)/g,'').split('\n');
  const out=[],para=[];let chapter=0;let folded=null;let table=[];
  const target=()=>folded?folded:out;
  const flush=()=>{if(para.length){target().push('<p>'+para.map(inline).join('<br>')+'</p>');para.length=0}};
  const flushTable=()=>{if(!table.length)return;target().push('<div class="wiki-table-wrap"><table class="wiki-table"><tbody>'+table.map(row=>'<tr>'+row.map(v=>'<td>'+inline(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');table=[]};
  for(const line of lines){
   const t=line.trim(), heading=t.match(/^---(.+?)---$/), fold=t.match(/^\{\{\{접기:(.+)$/);
   if(fold){flush();flushTable();if(folded){out.push('<details class="wiki-fold"><summary>접힌 내용</summary>'+folded.join('')+'</details>')}folded=[];folded.title=fold[1].replace(/\}\}\}$/, '').trim();continue}
   if(t==='}}}'&&folded){flush();flushTable();out.push('<details class="wiki-fold"><summary>'+inline(folded.title||'접기')+'</summary><div>'+folded.join('\n')+'</div></details>');folded=null;continue}
   if(heading){flush();flushTable();chapter++;target().push('<h2 id="wiki-section-'+chapter+'">'+esc(heading[1].trim())+'</h2>');continue}
   if(/^\|\|.*\|\|$/.test(t)){flush();table.push(t.slice(2,-2).split('||'));continue}
   flushTable();if(!t){flush();continue}para.push(line);
  }
  flush();flushTable();if(folded)out.push('<details class="wiki-fold" open><summary>'+inline(folded.title||'접기')+'</summary><div>'+folded.join('\n')+'</div></details>');
  const notes=comments.length?'<details class="wiki-comments"><summary aria-label="주석 보기">💬 주석 '+comments.length+'</summary><div class="wiki-comment-pop">'+comments.map((c,i)=>'<p><strong>'+ (i+1)+'.</strong> '+esc(c)+'</p>').join('')+'</div></details>':'';
  return '<div class="wiki-document-tools">'+notes+'</div>'+out.join('\n');
 }
 function sourceFor(x,extended){
  const details=(extended&&extended[x[0]])||[];
  const kind=x[2], id=x[0],name=x[1];
  const steps=x[6].map((v,i)=>(i+1)+'. '+v);
  const sections=['---개요---',x[5],'이 문서는 '+name+'의 이용 목적, 시작 방법, 중요한 규칙과 자주 발생하는 문제를 차례대로 설명합니다. 실제 화면 및 최신 운영 상태와 다른 내용이 있다면 프로젝트 화면의 안내를 우선하세요.'];
  const byKind={
   '게임':['처음에는 승리 조건과 한 판의 종료 시점을 확인하세요. 다른 참가자와 플레이한다면 방장과 참가자 각각의 권한도 확인해야 합니다.','라운드는 게임의 진행 구간, 턴은 한 사람의 행동 차례를 뜻합니다. 타이머, 점수 계산 및 특수 효과는 게임에 따라 다릅니다.','다인용 게임에서는 방 코드와 내부 방 식별자가 다른 값일 수 있습니다. 참가 중 연결이 끊겼다면 재접속 가능 여부를 먼저 살펴보세요.'],
   '도구':['작업을 시작하기 전에 입력할 정보와 생성되는 결과물을 구분하세요. 결과를 공유할 때 공개되는 범위를 꼭 확인해야 합니다.','임시 작업 상태와 서버에 저장된 결과는 같지 않을 수 있습니다. 새로고침이나 다른 기기에서 불러오는 기능은 프로젝트별 지원 여부를 확인하세요.','공유 링크를 이용할 때는 개인 정보나 비공개 작업 내용이 포함되지 않도록 점검하세요.'],
   '기기별 설치':['홈 화면에 추가하기와 웹 앱 설치는 브라우저 환경에 따라 다르게 표시될 수 있습니다.','설치 여부가 곧 오프라인 게임 지원을 뜻하지는 않습니다. 로그인·대전·동기화에는 연결이 필요할 수 있습니다.','공용 기기에서는 로그인 상태를 유지하지 않는 것이 좋습니다.']
  };
  const common=byKind[kind]||['화면에 보이는 메뉴 이름과 이 문서의 용어를 비교하면 사용 흐름을 이해하기 쉽습니다.','로그인·저장·공유 가능 여부는 프로젝트마다 다르므로 실제 안내를 우선해야 합니다.','기능이 기획 중이거나 시험 중이라면 모든 사용자에게 제공되는 것으로 간주하지 마세요.'];
  const special={
   battle:['Battle은 프로젝트 이름이며, 대전은 경쟁 모드를 뜻합니다. 두 표현을 혼동하지 마세요.','방 만들기, 방 참가, 빠른 대전은 서로 다른 행동입니다. 방 코드를 입력하는 방식과 자동 매칭 방식을 구분하세요.'],
   clicker:['클릭으로 점수를 얻고 업그레이드를 구매하는 진행 방식입니다. 자동 획득과 클릭 강화의 효과를 따로 비교해 보세요.','점수 표시가 소수점으로 나타나는 경우 계산값과 반올림된 화면 표시가 다를 수 있습니다. 구매 가능 여부는 실제 잔액을 기준으로 판단해야 합니다.'],
   spy:['발언과 질문을 통해 역할을 추리하고, 투표 및 정답 추측 등 각 단계의 안내를 확인하세요.','방 재입장 시 역할 정보가 초기화되는지 여부는 현재 구현 상태에 따라 달라질 수 있습니다.'],
   cook:['재료 선택, 손질, 섞기, 익히기 등 행동의 순서가 요리 결과에 영향을 줄 수 있습니다.','랜덤 평가·제한 재료가 적용되는 모드에서는 같은 요리도 다른 점수를 받을 수 있습니다.'],
   quiz:['일반적인 방 참가 코드와 특별 콘텐츠에 사용되는 코드는 역할이 다를 수 있습니다.','특별 퀴즈와 Orbit Identity 사이의 연결은 플레이 조건과 정체성 표시를 구분해 안내해야 합니다.'],
   'welcome':['Formwheel에 속한 게임·도구·앱은 모두 프로젝트로 부릅니다. 각 프로젝트의 이름은 Battle, Wiki처럼 단독으로 표시합니다.','프로젝트를 처음 접한다면 Hub에서 분류를 선택하고, 소개 및 게임 시작 또는 실행 버튼을 확인하세요.'],
   'faq':['화면이 멈췄다면 연결 상태, 브라우저 최신 여부, 새로고침 시 저장 가능 여부를 확인하세요.','기록 누락 문제가 발생하면 계정 로그인 상태와 데이터 저장 위치가 프로젝트별로 다른지 확인하세요.']
  };
  sections.push('','---주요 기능과 알아둘 용어---',...(special[id]||common),'','---시작 방법---',...steps,'','---상세 규칙과 사용 예시---',...(details.length?details:common),'예시: 처음 방문한 사용자는 안내를 읽고 모드를 선택한 다음, 화면에 표시된 조건을 확인한 뒤 시작합니다. 진행 결과는 해당 프로젝트의 결과 화면을 기준으로 확인하세요.','','---문제 해결---','화면이 반응하지 않는다면 먼저 네트워크 연결과 브라우저 상태를 확인하세요. 다른 계정이나 기기에서 반복되는지 비교하면 원인을 구별하는 데 도움이 됩니다.','방 또는 기록이 보이지 않는다면 코드 입력값, 로그인 상태, 저장·동기화 정책을 살펴보세요. 중요한 데이터가 있다면 새로고침 전에 보존 방법을 확인하세요.','오류를 제보할 때는 사용한 프로젝트, 화면, 재현 순서, 오류 메시지를 전달하되 비밀번호·인증 토큰·민감한 정보는 포함하지 마세요.','','---자주 묻는 질문---','Q. 로그인해야 하나요?','A. 지원 모드와 저장 기능에 따라 달라집니다. 화면의 계정 안내를 확인하세요.','Q. 설치하면 인터넷 없이 사용할 수 있나요?','A. 모든 프로젝트가 오프라인을 지원하는 것은 아닙니다. 특히 다인용 기능에는 연결이 필요할 수 있습니다.','Q. 문서와 실제 화면이 다르면 어떻게 하나요?','A. 최신 화면의 안내를 우선하고 Wiki 편집 요청이나 개선 의견으로 차이를 알려주세요.','','---알아두면 좋아요---',x[7],'','---관련 문서---');
  const suggestions=(typeof items!=='undefined'?items:[]).filter(y=>y[0]!==id&&y[2]===kind).slice(0,4);
  sections.push(...suggestions.map(y=>'['+y[0]+']'),'[faq]');
  return sections.join('\n');
 }
 window.WikiSyntax={render,sourceFor,inline};
})();
