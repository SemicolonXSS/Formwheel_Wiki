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
  const saved=[];const token=(html)=>{const index=saved.length;saved.push(html);return '\uE000'+index+'\uE001'};
  let text=String(raw).replace(/\{(\[[^\]\n]*\])\}/g,(_,literal)=>token(esc(literal)));
  text=text.replace(/\(\*[\s\S]*?\)/g,'');
  text=text.replace(/\[([^\]\n]+)\]/g,(whole,url)=>{const x=resolve(url);if(!x)return whole;return token('<a class="wiki-syntax-link" href="'+esc(x.href)+'"'+(x.external?' target="_blank" rel="noopener noreferrer"':'')+'>'+esc(x.title)+'</a>')});
  return esc(text).replace(/\uE000(\d+)\uE001/g,(_,i)=>saved[Number(i)]||'');
 }
 function render(raw){
  const lines=String(raw||'').replace(/\r\n?/g,'\n').replace(/\(\*[\s\S]*?\)/g,'').split('\n');
  const out=[];let para=[];let chapter=0;
  const flush=()=>{if(para.length){out.push('<p>'+para.map(inline).join('<br>')+'</p>');para=[]}};
  for(const line of lines){
   const m=line.trim().match(/^---(.+?)---$/);
   if(m){flush();chapter++;out.push('<h2 id="wiki-section-'+chapter+'">'+esc(m[1].trim())+'</h2>');continue}
   if(!line.trim()){flush();continue}para.push(line);
  }flush();return out.join('\n');
 }
 function sourceFor(x,extended){
  const details=(extended&&extended[x[0]])||[];
  let parts=['---개요---',x[5],'','---사용 방법과 규칙---',...x[6].map((v,i)=>(i+1)+'. '+v),'','---상세 설명---',...(details.length?details:[x[7]]),'','---알아두면 좋아요---',x[7],'','---관련 문서---'];
  const suggestions=(typeof items!=='undefined'?items:[]).filter(y=>y[0]!==x[0]&&y[2]===x[2]).slice(0,4);parts.push(...suggestions.map(y=>'['+y[0]+']'));parts.push('[faq]');return parts.join('\n');
 }
 window.WikiSyntax={render,sourceFor,inline};
})();
