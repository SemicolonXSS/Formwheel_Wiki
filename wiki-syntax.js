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
  let parts=['---개요---',x[5],'','---사용 방법과 규칙---',...x[6].map((v,i)=>(i+1)+'. '+v),'','---상세 설명---',...(details.length?details:[x[7]]),'','---알아두면 좋아요---',x[7],'','---관련 문서---'];
  const suggestions=(typeof items!=='undefined'?items:[]).filter(y=>y[0]!==x[0]&&y[2]===x[2]).slice(0,4);parts.push(...suggestions.map(y=>'['+y[0]+']'));parts.push('[faq]');return parts.join('\n');
 }
 window.WikiSyntax={render,sourceFor,inline};
})();
