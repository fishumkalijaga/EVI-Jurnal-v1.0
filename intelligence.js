/* APJIKI RamaLabs — evidence-oriented journal audit module. Browser static, optional Worker. */
(() => {
'use strict';
const STORE='ramalabs-apjiki-intelligence-v2';
const $=id=>document.getElementById(id);
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=id=>($(id)?.value||'').trim();
const initial={worker:'',token:'',url:'',doi:'',selected:'C.1',ojs:null,crossref:null,pdf:null,analysis:null,prediction:null,logs:[]};
let data={...initial};
try {const previous=JSON.parse(localStorage.getItem(STORE)||'{}'); data={...data,...previous,token:''};}catch{}
const persist=()=>{try{localStorage.setItem(STORE,JSON.stringify({...data,token:''}));}catch(e){console.warn('Penyimpanan audit gagal',e)}};
const choices=()=>DATA.items.map(i=>`<option value="${h(i.code)}" ${data.selected===i.code?'selected':''}>${h(i.code+' · '+i.name)}</option>`).join('');
const collectEvidence=()=>{
 const ev=[];
 if(data.ojs) ev.push(...(data.ojs.findings||[]).map(x=>({source:'OJS',label:x.label,url:x.url,status:x.status,excerpt:x.excerpt||''})));
 if(data.crossref) ev.push({source:'Crossref',label:'Metadata DOI',url:'https://doi.org/'+encodeURIComponent(data.crossref.doi),status:'metadata tercatat',excerpt:`${data.crossref.title}; jurnal ${data.crossref.journal}; tahun ${data.crossref.year}; penulis ${data.crossref.authors.length}; referensi ${data.crossref.references}; lisensi ${data.crossref.license?'tercatat':'tidak tercatat'}`});
 if(data.pdf) ev.push({source:'PDF',label:'Analisis artikel yang diunggah',url:'(file lokal)',status:'indikasi teks',excerpt:data.pdf.summary});
 return ev;
};
const link=(url,label)=>{try{let u=new URL(url);if(u.protocol!=='https:'&&u.protocol!=='http:')return h(label);return `<a target="_blank" rel="noopener noreferrer" href="${h(u.href)}">${h(label)}</a>`}catch{return h(label)}};
const findRow=(label,matched,url,excerpt)=>`<div class="smallcard"><span class="proofmark ${matched?'ok':''}">${matched?'TERDETEKSI':'BELUM TERDETEKSI'}</span> <strong>${h(label)}</strong><div class="tiny">${url?link(url,url):'Belum ada URL'}</div><div class="tiny muted">${h((excerpt||'').slice(0,320))}</div></div>`;
function predictionSummary(){
 const p=data.prediction; if(!p) return '';
 return `<div class="smallcard"><b>Prediksi otomatis 32 sub-unsur</b><div>${h(p.filled)} sub-unsur diisi otomatis · skor total sementara <b>${h(p.total.toFixed(2))}</b>/100</div><div class="tiny">Dibuat: ${h(p.at)}. Hasil ini adalah estimasi awal dari laman publik jurnal dan tetap perlu diverifikasi penilai.</div></div>`;
}
function ojsSection(){const o=data.ojs;return `<div class="intcard"><h3>1 · Audit URL OJS / laman jurnal + prediksi skor</h3><p class="muted">Masukkan satu URL jurnal/OJS. Aplikasi akan memindai halaman publik, mencari komponen kebijakan dan artikel contoh, dan mengisi prediksi 32 sub-unsur dalam satu klik. Untuk situs yang membatasi CORS, koneksikan Worker melalui pengaturan di bawah.</p><label>URL laman jurnal / OJS</label><input id="auditUrl" type="url" placeholder="https://jurnal.example.ac.id/index.php/nama" value="${h(data.url||state.profile.journalurl||'')}"><div class="twoBtns"><button id="auditOjs">Audit + prediksi 32 sub-unsur</button><button class="alt" id="predictAll" ${!o?'disabled':''}>Prediksi 32 sub-unsur</button><button class="outline" id="ojsToProof" ${!o?'disabled':''}>Masukkan temuan ke catatan bukti</button></div><div id="ojsStatus" class="statusline" role="status"></div>${!data.worker?`<div class="warnx tiny">Jika muncul NetworkError/CORS, situs jurnal tidak dapat dibaca langsung oleh GitHub Pages. Hubungkan Cloudflare Worker pada Pengaturan Integrasi di bawah. Tanpa layanan perantara yang aktif, pemindaian lintas domain tidak dapat dipaksakan dari browser.</div>`:""}${predictionSummary()}${o?`<div class="${o.error?'warnx':'okx'}">${h(o.error||`Selesai: ${o.findings.filter(x=>x.status==='terdeteksi').length}/${o.findings.length} komponen ditemukan pada halaman yang berhasil dibaca.`)}<div class="tiny">Waktu: ${h(o.at)} · ${h(o.method||'')}</div></div>${o.sample?`<div class="smallcard"><b>Artikel contoh terdeteksi</b><div class="tiny">${o.sample.url?link(o.sample.url,o.sample.url):''}</div><div class="tiny">Judul: ${h(o.sample.title||'tidak terdeteksi')}</div><div class="tiny">Sinyal artikel: ${Object.entries(o.sample.signals||{}).filter(x=>x[1]).map(x=>x[0]).join(', ')||'belum ada'}</div></div>`:''}${o.findings.map(x=>findRow(x.label,x.status==='terdeteksi',x.url,x.excerpt)).join('')}`:''}</div>`}
function crossrefSection(){const c=data.crossref;return `<div class="intcard"><h3>2 · Pemeriksaan DOI (Crossref / DataCite)</h3><p class="muted">Mencari metadata dari Crossref, lalu DataCite bila tidak ditemukan. Metadata tidak ditemukan bukan berarti DOI tidak sah. Nomor DOI juga dapat dibandingkan dengan laman penerbit.</p><label>DOI artikel (atau URL doi.org)</label><input id="auditDoi" value="${h(data.doi)}" placeholder="10.14421/pjk.v19i1.3089"><div class="twoBtns"><button id="fetchDoi">Periksa DOI</button><button id="doiToProof" class="outline" ${!c?'disabled':''}>Tambahkan bukti DOI</button></div><div id="doiStatus" class="statusline" role="status"></div>${c?`<div class="smallcard"><b>${h(c.title||'Metadata bibliografis tidak tersedia')}</b><div>${h(c.journal||'Nama jurnal tidak tersedia')} · ${h(c.year||'Tahun tidak tersedia')}</div><div>${link('https://doi.org/'+c.doi,c.doi)}</div><div>Provider: ${h(c.provider||'tidak diketahui')} · Status: ${h(c.status||'tercatat')}</div><div>Penulis: ${(c.authors||[]).length}; afiliasi dalam metadata: ${c.affiliations||0}; referensi deposit: ${c.references||0}; ORCID: ${c.orcid||0}; lisensi: ${c.license?'tercantum':'tidak terdeteksi'}</div><small class="muted">Data dari Crossref/DataCite hanya metadata terdeposit, bukan audit keabsahan artikel atau mutu ilmiah.</small></div>`:''}</div>`}
function pdfSection(){const p=data.pdf;return `<div class="intcard"><h3>3 · Pemeriksaan PDF artikel</h3><p class="muted">Memeriksa teks PDF di browser: indikasi struktur artikel, metadata dan daftar pustaka. PDF hasil scan tanpa teks tidak didukung OCR. Isi PDF tidak dikirim ke server kecuali Anda memilih analisis AI.</p><label>PDF artikel jurnal</label><input id="auditPdf" type="file" accept="application/pdf,.pdf"><div class="twoBtns"><button id="scanPdf">Analisis PDF lokal</button><button class="outline" id="pdfToProof" ${!p?'disabled':''}>Masukkan hasil ke bukti</button></div><div id="pdfStatus" class="statusline" role="status"></div>${p?`<div class="smallcard"><b>${h(p.filename)}</b> · ${p.pages} halaman · ${p.characters.toLocaleString('id-ID')} karakter teks<div class="tiny">${h(p.summary)}</div>${Object.entries(p.signals).map(([k,v])=>`<span class="pillx">${h(k)}: ${v?'terdeteksi':'belum'}</span>`).join('')}<p class="muted tiny">Kata kunci yang terdeteksi bukan bukti mutu substansi. Evaluasi metodologi dan kebaruan membutuhkan pembacaan manusia.</p></div>`:''}</div>`}
function aiSection(){const a=data.analysis;return `<div class="intcard"><h3>4 · Evaluator berbasis bukti + narasi perbaikan</h3><p class="muted">Mode lokal membandingkan bukti terdeteksi dengan rubrik, menyusun rekomendasi, dan tidak mengubah skor final tanpa persetujuan penilai. Mode AI menggunakan Worker aman dengan API key hanya di server.</p><label>Indikator evaluasi</label><select id="auditItem">${choices()}</select><label>Catatan / observasi penilai</label><textarea id="auditNotes" rows="3" placeholder="Masukkan temuan yang sudah diverifikasi; hindari data pribadi reviewer."></textarea><div class="twoBtns"><button id="localEvaluate">Rekomendasi otomatis (tanpa API)</button><button class="alt" id="aiEvaluate">Analisis AI melalui Worker</button></div><div id="aiStatus" role="status" class="statusline"></div>${a?`<div class="smallcard"><div class="tiny">${h(a.mode)} · ${h(a.code)} · ${h(a.at)}</div><h4>${h(a.title)}</h4><div class="intresult">${h(a.text)}</div><div class="twoBtns"><button class="outline" id="copyAnalysis">Salin hasil</button><button class="outline" id="saveAnalysis">Simpan ke catatan indikator</button></div></div>`:''}</div>`}
function settingsSection(){return `<div class="intcard"><h3>Pengaturan integrasi (opsional)</h3><p class="muted">GitHub Pages tidak dapat melewati CORS situs OJS. Jalankan Worker untuk audit URL yang konsisten. Pemeriksaan Crossref/DataCite dapat bekerja tanpa Worker jika API dapat diakses langsung.</p><label>Endpoint Cloudflare Worker (HTTPS)</label><input id="workerUrl" type="url" placeholder="https://nama-worker.workers.dev" value="${h(data.worker)}"><label>Token khusus layanan AI (opsional; tidak disimpan permanen)</label><input id="workerToken" type="password" autocomplete="off" placeholder="Token akses yang dikonfigurasi di Worker"><div class="twoBtns"><button id="saveSettings" class="outline">Simpan alamat endpoint</button><button id="exportEvidence" class="outline">Ekspor temuan JSON</button></div><p class="tiny muted">Deploy folder worker/ ke Cloudflare (panduan DEPLOY-WORKER.md). Set ALLOWED_ORIGIN untuk GitHub Pages; OPENAI_API_KEY dan ACCESS_TOKEN hanya diperlukan untuk fitur AI. Jangan menaruh API key di GitHub.</p></div>`}
window.renderIntelligence=()=>`<div class="panel"><h2>Audit Jurnal Otomatis · URL, DOI, PDF, AI</h2><p class="muted">Lapisan pengumpulan dan penelusuran bukti untuk membantu penilaian A–H. Status otomatis berarti “indikasi ditemukan”, bukan “ketentuan Juknis telah terbukti terpenuhi”.</p><div class="intgrid"><div>${ojsSection()}${crossrefSection()}</div><div>${pdfSection()}${aiSection()}</div></div>${settingsSection()}</div>`;
function notice(id,msg){const n=$(id);if(n)n.textContent=msg}
function readForm(){if($('workerUrl'))data.worker=val('workerUrl');if($('workerToken') && val('workerToken'))data.token=val('workerToken');if($('auditUrl'))data.url=val('auditUrl');if($('auditDoi'))data.doi=val('auditDoi');if($('auditItem'))data.selected=val('auditItem');persist()}
async function requestWorker(path,body){
 readForm();
 if(!data.worker)throw Error('URL Worker belum diatur. Audit situs OJS lintas domain membutuhkan backend. Lihat panduan DEPLOY-WORKER.md dalam ZIP.');
 const u=new URL(data.worker);if(u.protocol!=='https:')throw Error('Endpoint Worker harus HTTPS.');
 let res;
 try{res=await fetch(u.href.replace(/\/$/,'')+path,{method:'POST',headers:{'content-type':'application/json',...(path==='/ai'&&data.token?{'authorization':'Bearer '+data.token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});}catch(e){throw Error('Tidak dapat menghubungi Worker ('+e.message+'). Periksa alamat Worker dan ALLOWED_ORIGIN.');}
 const payload=await res.json().catch(()=>({error:'Respons Worker bukan JSON'}));
 if(!res.ok)throw Error(payload.error||'Worker HTTP '+res.status);
 return payload;
}
function safeUrl(input){const u=new URL(input);if(!['https:','http:'].includes(u.protocol))throw Error('Hanya URL http/https.');if(u.username||u.password)throw Error('URL berkredensial tidak didukung.');if(!u.hostname.includes('.'))throw Error('URL situs publik tidak valid.');return u.href}

const checks=[
 ['Peer Review Policy',/peer[\s-]?review|review process|proses penelaahan|mitra bestari/i],
 ['Publication Ethics',/publication ethics|etika publikasi|ethics statement/i],
 ['Author Guidelines',/author guidelines|panduan penulis|petunjuk penulisan|submission/i],
 ['Editorial Team',/editorial team|editorial board|dewan redaksi/i],
 ['Reviewers',/reviewers|mitra bestari|peer reviewers/i],
 ['AI Policy',/generative ai|kecerdasan artifisial|artificial intelligence policy/i],
 ['Publication Fees',/author fees|article processing charge|biaya publikasi/i],
 ['Copyright and License',/copyright|creative commons|lisensi/i],
 ['Archiving',/archiving|preservation|pengarsipan/i],
 ['Current Issue',/current issue|current|terbitan terkini|issue\/view/i],
 ['DOI in article page',/doi\.org\/10\.|\bdoi\s*:/i],
 ['Indexing',/indexing|abstracting|indeksasi/i],
 ['Publication Schedule',/publication schedule|frekuensi terbit|jadwal terbit/i]
];
function normalizeUrlMaybe(href,base){try{return new URL(href,base).href}catch{return ''}}
async function fetchHtmlMaybe(url){
 if(data.worker){const r=await requestWorker('/audit',{url});return {html:r.html,method:'Worker aman',url:r.url||url};}
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(13000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  if(!/html|xml/i.test(response.headers.get('content-type')||''))throw Error('Respons bukan HTML');
  return {html:await response.text(),method:'browser langsung',url:response.url||url};
 }catch(e){throw Error('Akses langsung gagal (CORS/server). Aktifkan Worker sesuai DEPLOY-WORKER.md, lalu masukkan endpoint di bagian Pengaturan Integrasi. '+e.message);}
}
function analyseArticleHtml(url,html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const text=(doc.body?.innerText||doc.body?.textContent||'').replace(/\s+/g,' ').trim();
 const title=(doc.querySelector('meta[property="og:title"]')?.content||doc.querySelector('h1')?.textContent||doc.querySelector('title')?.textContent||'').trim();
 const anchors=Array.from(doc.querySelectorAll('a[href]')).map(a=>({text:(a.textContent||'').replace(/\s+/g,' ').trim(),href:normalizeUrlMaybe(a.getAttribute('href')||'',url)}));
 const pdfLink=(anchors.find(a=>/\.pdf($|\?)|download.*pdf|article\/download/i.test(a.href+' '+a.text))||{}).href||'';
 const signals={
  'Abstrak':/\babstract\b|\babstrak\b/i.test(text),
  'Kata kunci':/\bkeywords?\b|\bkata kunci\b/i.test(text),
  'Pendahuluan':/\bintroduction\b|\bpendahuluan\b/i.test(text),
  'Metode':/\bmethods?\b|\bmetode\b/i.test(text),
  'Hasil/Pembahasan':/\bresults?\b|\bhasil\b|\bdiscussion\b|\bpembahasan\b/i.test(text),
  'Kesimpulan':/\bconclusions?\b|\bsimpulan\b|\bkesimpulan\b/i.test(text),
  'Referensi':/\breferences\b|\bdaftar pustaka\b|\bbibliography\b/i.test(text),
  'DOI':/10\.\d{4,9}\/\S+/i.test(text),
  'ORCID':/orcid\.org\/\d{4}-\d{4}-\d{4}-[\dX]{4}/i.test(text),
  'Afiliasi':/universitas|university|faculty|department|departemen|institut|institute|school|college|affiliation/i.test(text)
 };
 return {url,title,pdfLink,signals,excerpt:text.slice(0,2200)};
}
function buildOjsReport(url,html,method){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const anchors=Array.from(doc.querySelectorAll('a[href]')).slice(0,1800).map(a=>({text:(a.textContent||'').replace(/\s+/g,' ').trim().slice(0,130),href:a.getAttribute('href')||''}));
 const normalized=anchors.map(a=>({...a,full:normalizeUrlMaybe(a.href,url)}));
 const whole=(doc.body?.innerText||doc.body?.textContent||'').replace(/\s+/g,' ').trim();
 const find=checks.map(([label,re])=>{const matched=normalized.find(a=>re.test(a.text+' '+a.full+' '+a.href));const onpage=re.test(whole);let urlFound='';try{if(matched)urlFound=matched.full}catch{}return {label,status:matched||onpage?'terdeteksi':'belum terdeteksi',url:urlFound||url,excerpt:matched?.text||(onpage?'Kata kunci ditemukan di halaman, bukan bukti kebijakan lengkap.':'Tidak terdeteksi dari halaman yang dapat diakses')}});
 const title=(doc.querySelector('title')?.textContent||'').trim();
 const generator=(doc.querySelector('meta[name="generator"]')?.content||'').trim();
 const issueLinks=normalized.filter(a=>/issue\/view|current issue|current/i.test(a.text+' '+a.full));
 const articleLinks=normalized.filter(a=>/article\/view|\/article\/view\//i.test(a.full));
 const pdfLinks=normalized.filter(a=>/\.pdf($|\?)|article\/download|download.*pdf/i.test(a.full+' '+a.text));
 const years=[...new Set((whole.match(/20\d{2}/g)||[]).filter(y=>+y>=2000&&+y<=2100))];
 const metrics={title,generator,ojsDetected:/open journal systems|ojs/i.test(whole+' '+generator),issueCount:issueLinks.length,articleCount:articleLinks.length,pdfCount:pdfLinks.length,yearCount:years.length,years,hasDoi:/10\.\d{4,9}\/\S+/i.test(whole),hasIssn:/\b\d{4}-\d{3}[\dX]\b/i.test(whole),lang:(doc.documentElement?.lang||'').trim()};
 const sample={issueUrl:(issueLinks[0]||{}).full||'',articleUrl:(articleLinks[0]||{}).full||'',pdfUrl:(pdfLinks[0]||{}).full||''};
 return {url,at:new Date().toISOString(),method,findings:find,metrics,sample};
}
async function auditOjs(){
 readForm(); notice('ojsStatus','Memeriksa situs...');
 try{
  const url=safeUrl(data.url);
  const home=await fetchHtmlMaybe(url);
  data.ojs=buildOjsReport(url,home.html,home.method);
  let sample=data.ojs.sample||{};
  if(!sample.articleUrl && sample.issueUrl){
   try{
    const issue=await fetchHtmlMaybe(sample.issueUrl);
    const issueReport=buildOjsReport(sample.issueUrl,issue.html,issue.method);
    sample.articleUrl=issueReport.sample.articleUrl||sample.articleUrl;
    sample.pdfUrl=issueReport.sample.pdfUrl||sample.pdfUrl;
    if(issueReport.metrics.issueCount>data.ojs.metrics.issueCount) data.ojs.metrics.issueCount=issueReport.metrics.issueCount;
    if(issueReport.metrics.articleCount>data.ojs.metrics.articleCount) data.ojs.metrics.articleCount=issueReport.metrics.articleCount;
   }catch{}
  }
  if(sample.articleUrl){
   try{
    const art=await fetchHtmlMaybe(sample.articleUrl);
    data.ojs.sample=analyseArticleHtml(sample.articleUrl,art.html);
    if(data.ojs.sample.pdfLink && !sample.pdfUrl) sample.pdfUrl=data.ojs.sample.pdfLink;
   }catch{}
  }
  data.ojs.sample={...sample,...(data.ojs.sample||{})};
  data.url=url; state.profile.journalurl=url; document.getElementById('journalurl').value=url; save(); const pred=predictAllFromAudit(); persist(); render(); notice('ojsStatus','Audit dan prediksi selesai: '+pred.filled+' sub-unsur. Tinjau kualitas bukti dan rubrik sebelum menggunakan skor.');
 }catch(e){notice('ojsStatus','Gagal: '+e.message)}
}
function cleanDoi(s){const d=String(s).trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');if(!/^10\.\d{4,9}\/\S+$/i.test(d))throw Error('Format DOI tidak valid.');return d}
function normalizeCrossref(x){
 const authors=(x.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(' '));
 const year=x.published?.['date-parts']?.[0]?.[0]||x.issued?.['date-parts']?.[0]?.[0]||null;
 return {doi:x.DOI||'',provider:'Crossref',status:'metadata terdaftar',title:(x.title||[])[0]||'',journal:(x['container-title']||[])[0]||'',year,authors,affiliations:(x.author||[]).reduce((n,a)=>n+(a.affiliation?.length||0),0),references:x['reference-count']??(x.reference||[]).length,orcid:(x.author||[]).filter(a=>a.ORCID).length,license:!!x.license};
}
function normalizeDatacite(x){
 const a=x?.data?.attributes||{};
 return {doi:a.doi||'',provider:'DataCite',status:'metadata terdaftar',title:(a.titles||[])[0]?.title||'',journal:a.container?.title||a.publisher||'',year:a.publicationYear||'',authors:(a.creators||[]).map(c=>c.name||''),affiliations:(a.creators||[]).reduce((n,c)=>n+(c.affiliation?.length||0),0),references:0,orcid:(a.creators||[]).filter(c=>(c.nameIdentifiers||[]).some(z=>/orcid/i.test(z.nameIdentifierScheme||''))).length,license:!!(a.rightsList||[]).length};
}
async function directDoiLookup(doi){
 const query=encodeURIComponent(doi);
 const sources=[['Crossref','https://api.crossref.org/works/'+query],['DataCite','https://api.datacite.org/dois/'+query]];
 let failures=[];
 for(const [provider,url] of sources){try{let r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(r.status===404){failures.push(provider+': metadata tidak ditemukan');continue;}if(!r.ok)throw Error('HTTP '+r.status);let x=await r.json();return provider==='Crossref'?normalizeCrossref(x.message):normalizeDatacite(x)}catch(e){failures.push(provider+': '+e.message)}}
 return {doi,provider:'Crossref/DataCite',status:'metadata belum ditemukan atau tidak dapat diakses',title:'',journal:'',authors:[],affiliations:0,references:0,orcid:0,license:false,details:failures.join('; ')};
}
async function auditDoi(){
 readForm(); notice('doiStatus','Memeriksa Crossref dan DataCite...');
 try{
  const doi=cleanDoi(data.doi);let result;
  if(data.worker){let r=await requestWorker('/doi',{doi}); result=r.provider==='Crossref'&&r.message?normalizeCrossref(r.message):r.provider==='DataCite'&&r.data?normalizeDatacite(r):r;}
  else result=await directDoiLookup(doi);
  data.crossref={...result,doi};persist();render();notice('doiStatus',result.status==='metadata terdaftar'?'Metadata DOI ditemukan pada '+result.provider+'.':'Belum ada metadata terverifikasi dari Crossref/DataCite. Ini bukan bukti bahwa DOI tidak sah; periksa tautan DOI pada laman penerbit.');
 }catch(e){notice('doiStatus','Pemeriksaan belum selesai: '+e.message)}
}
async function getPdfjs(){if(window.pdfjsLib)return window.pdfjsLib;const paths=['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'];for(const url of paths){try{await new Promise((resolve,reject)=>{let s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});if(window.pdfjsLib){window.pdfjsLib.GlobalWorkerOptions.workerSrc=url.replace('pdf.min.js','pdf.worker.min.js');return window.pdfjsLib}}catch{}}throw Error('PDF.js tidak tersedia. Periksa jaringan atau CDN.')}
async function auditPdf(){const file=$('auditPdf')?.files?.[0];if(!file)return notice('pdfStatus','Pilih PDF terlebih dahulu.');if(file.size>20*1024*1024)return notice('pdfStatus','PDF maksimum 20 MB.');notice('pdfStatus','Mengekstraksi teks PDF di browser...');try{const pdfjs=await getPdfjs();const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});const pdf=await task.promise;let blocks=[];for(let p=1;p<=Math.min(pdf.numPages,80);p++){const page=await pdf.getPage(p);const t=await page.getTextContent();blocks.push(t.items.map(x=>x.str||'').join(' '))}const full=blocks.join('\n'),signals={'Abstrak':/\babstract\b|\babstrak\b/i.test(full),'Kata kunci':/\bkeywords?\b|\bkata kunci\b/i.test(full),'Pendahuluan':/\bintroduction\b|\bpendahuluan\b/i.test(full),'Metode':/\bmethods?\b|\bmetode\b/i.test(full),'Hasil/Pembahasan':/\bresults?\b|\bhasil\b|\bdiscussion\b|\bpembahasan\b/i.test(full),'Kesimpulan':/\bconclusions?\b|\bsimpulan\b|\bkesimpulan\b/i.test(full),'Referensi':/\breferences\b|\bdaftar pustaka\b|\bbibliography\b/i.test(full),'DOI':/10\.\d{4,9}\/\S+/i.test(full),'ORCID':/orcid\.org\/\d{4}-\d{4}-\d{4}-[\dX]{4}/i.test(full)};const present=Object.values(signals).filter(Boolean).length;data.pdf={filename:file.name,pages:pdf.numPages,characters:full.length,signals,summary:full.length<180?'PDF tidak menyediakan cukup teks; kemungkinan hasil pindai atau terkunci.':`${present}/${Object.keys(signals).length} penanda struktur/metadata ditemukan. Pemeriksaan hanya indikatif, tidak menilai kualitas substantif.`,excerpt:full.slice(0,11000),at:new Date().toISOString()};persist();render();notice('pdfStatus','Analisis selesai. Penanda perlu diverifikasi melalui pembacaan PDF asli.')}catch(e){notice('pdfStatus','Gagal: '+e.message)}}
const codeMapping={A:['Konsistensi judul jurnal','ISSN','metadata artikel','PDF'],B:['Editorial Team','Reviewers','Peer Review Policy'],C:['Peer Review Policy','Author Guidelines','AI Policy','Publication Ethics','Copyright and License'],D:['Current Issue'],E:['DOI in article page','Indexing','Archiving'],F:[],G:[],H:[]};

function byLabel(label){return (data.ojs?.findings||[]).find(x=>x.label===label)}
function detected(label){return byLabel(label)?.status==='terdeteksi'}
function pickChoice(item, desired){
 const options=[...item.choices].sort((a,b)=>b.score-a.score);
 let chosen=options.find(o=>desired>=o.score-1e-9);
 return chosen||options[options.length-1];
}
function setPrediction(code, desired, why){
 const item=DATA.items.find(i=>i.code===code); if(!item) return;
 const picked=pickChoice(item, desired);
 state.ratings[code]=picked.key;
 const line=`Prediksi otomatis dari URL jurnal (${new Date().toLocaleString('id-ID')}): skor ${picked.score}. Dasar: ${why}`;
 state.notes[code]=line + (state.notes[code] ? `\n\n${state.notes[code]}` : '');
}
function totalPredicted(){
 return DATA.items.reduce((s,i)=>{const key=state.ratings[i.code]; const c=i.choices.find(x=>x.key===key); return s + (c?c.score:0)},0)
}
function predictAllFromAudit(){
 if(!data.ojs) throw Error('Audit URL belum dijalankan.');
 const m=data.ojs.metrics||{};
 const s=data.ojs.sample||{};
 const sig=s.signals||{};
 const countFound=(labels)=>labels.filter(detected).length;
 const manyPolicies=countFound(['Peer Review Policy','Publication Ethics','Author Guidelines','Editorial Team','Reviewers','Copyright and License','Archiving','Indexing']);
 setPrediction('A.1', (m.title&&m.hasIssn&& (detected('DOI in article page')||m.hasDoi))?2: (m.title||m.hasIssn?1:0), `judul laman ${m.title?'terdeteksi':'belum jelas'}, ISSN ${m.hasIssn?'terdeteksi':'belum'}, DOI ${m.hasDoi||detected('DOI in article page')?'terdeteksi':'belum'}`);
 setPrediction('B.1', detected('Reviewers')&&detected('Peer Review Policy')?2:(detected('Reviewers')||detected('Peer Review Policy')?1:0), `halaman reviewer ${detected('Reviewers')?'ada':'belum terdeteksi'} dan kebijakan peer review ${detected('Peer Review Policy')?'ada':'belum terdeteksi'}`);
 setPrediction('B.2', detected('Peer Review Policy')?2:(detected('Reviewers')?1:0), `indikasi kualitas penyuntingan dinilai konservatif dari kebijakan peer review`);
 setPrediction('B.3', detected('Editorial Team') && detected('Reviewers') ? 3 : (detected('Editorial Team') ? 2 : 1), `editorial team ${detected('Editorial Team')?'terdeteksi':'belum'}, reviewer ${detected('Reviewers')?'terdeteksi':'belum'}`);
 setPrediction('B.4', m.articleCount>=8 ? 2 : (m.articleCount>=2 ? 1 : 0), `jumlah tautan artikel yang terdeteksi ${m.articleCount||0}`);
 setPrediction('B.5', (m.ojsDetected||m.articleCount>0) && detected('Author Guidelines') ? 1 : 0, `OJS ${m.ojsDetected?'terindikasi':'tidak jelas'}, panduan penulis ${detected('Author Guidelines')?'terdeteksi':'belum'}`);
 setPrediction('C.1', detected('Peer Review Policy')?2:(detected('Reviewers')?1:0), `kebijakan peer review ${detected('Peer Review Policy')?'terdeteksi':'belum'}`);
 setPrediction('C.2', detected('Author Guidelines')?1:0, `panduan penulis ${detected('Author Guidelines')?'terdeteksi':'belum'}`);
 setPrediction('C.3', detected('AI Policy')?1:0, `kebijakan AI ${detected('AI Policy')?'terdeteksi':'belum'}`);
 setPrediction('C.4', manyPolicies>=7?3:(manyPolicies>=4?2:(manyPolicies>=2?1:0)), `kelengkapan laman: ${manyPolicies} komponen kebijakan/informasi utama terdeteksi`);
 setPrediction('D.1', (detected('Publication Schedule')&&((m.yearCount||0)>=2 || (m.issueCount||0)>=2))?2:((detected('Current Issue')||(m.issueCount||0)>=1)?1:0), `jadwal/terbitan terdeteksi: schedule ${detected('Publication Schedule')?'ya':'tidak'}, issue ${m.issueCount||0}`);
 setPrediction('D.2', (m.issueCount||0)>0 || (m.articleCount||0)>0 ? 1 : 0, `tautan volume/nomor/artikel ${((m.issueCount||0)+(m.articleCount||0))>0?'terdeteksi':'belum'}`);
 setPrediction('E.1', data.crossref?2:(detected('DOI in article page')?1:0), `sitasi tidak dapat dipastikan dari URL; DOI/Crossref ${data.crossref?'terkonfirmasi':'belum terkonfirmasi'}`);
 setPrediction('E.2', (detected('Indexing')&&detected('Archiving')&&(detected('DOI in article page')||m.hasDoi))?4:(detected('Indexing')||detected('DOI in article page')?2:1), `visibilitas dinilai dari indexing ${detected('Indexing')?'ya':'tidak'}, archiving ${detected('Archiving')?'ya':'tidak'}, DOI ${detected('DOI in article page')||m.hasDoi?'ya':'tidak'}`);
 setPrediction('F.1', s.title?1:0, `judul artikel contoh ${s.title?'terdeteksi':'belum terdeteksi'}`);
 setPrediction('F.2', sig['Abstrak']&&sig['Kata kunci']?2:(sig['Abstrak']?1:0), `abstrak ${sig['Abstrak']?'terdeteksi':'belum'}, kata kunci ${sig['Kata kunci']?'terdeteksi':'belum'}`);
 setPrediction('F.3', sig['Kata kunci']?1:0, `kata kunci ${sig['Kata kunci']?'terdeteksi':'belum'}`);
 setPrediction('F.4', (sig['Pendahuluan']&&sig['Referensi'])?3:(sig['Pendahuluan']?2:1), `indikasi orisinalitas dinilai konservatif dari keberadaan pendahuluan dan referensi`);
 setPrediction('F.5', (sig['Metode']&&sig['Hasil/Pembahasan'])?4:(sig['Hasil/Pembahasan']?2:1), `analisis/sintesis diperkirakan dari struktur metode dan hasil/pembahasan`);
 setPrediction('F.6', sig['Kesimpulan']?3:1, `kesimpulan ${sig['Kesimpulan']?'terdeteksi':'belum'}`);
 setPrediction('F.7', sig['Referensi']?2:1, `daftar pustaka ${sig['Referensi']?'terdeteksi':'belum'}; nisbah sumber belum dapat dihitung akurat hanya dari URL`);
 setPrediction('F.8', sig['Referensi']?2:1, `kemutakhiran pustaka belum dapat diverifikasi penuh dari URL; prediksi konservatif diberikan`);
 setPrediction('F.9', sig['Pendahuluan']&&sig['Metode']&&sig['Hasil/Pembahasan']?2:1, `cakupan keilmuan diperkirakan dari struktur artikel contoh`);
 setPrediction('G.1', (sig['Abstrak']&&sig['Referensi']&&sig['DOI']&&sig['Afiliasi'])?3:(sig['Abstrak']&&sig['Referensi']?2:1), `kelengkapan PDF/halaman artikel dinilai dari elemen yang terdeteksi`);
 setPrediction('G.2', sig['Afiliasi']?1:0, `afiliasi penulis ${sig['Afiliasi']?'terdeteksi':'belum'}`);
 setPrediction('G.3', (sig['Pendahuluan']&&sig['Metode']&&sig['Hasil/Pembahasan']&&sig['Kesimpulan'])?2:1, `sistematika artikel ${['Pendahuluan','Metode','Hasil/Pembahasan','Kesimpulan'].filter(k=>sig[k]).length}/4 bagian utama terdeteksi`);
 setPrediction('G.4', (sig['DOI']&&sig['ORCID'])?3:(sig['DOI']?2:1), `instrumen pendukung dinilai dari DOI ${sig['DOI']?'ya':'tidak'} dan ORCID ${sig['ORCID']?'ya':'tidak'}`);
 setPrediction('G.5', sig['Referensi']?2:1, `sistem pengacuan diperkirakan dari keberadaan referensi; konsistensi sitasi masih perlu cek manual`);
 setPrediction('G.6', s.title && sig['Abstrak'] ? 2 : 1, `kebahasaan tidak dapat dipastikan otomatis; skor tengah konservatif bila judul/abstrak terdeteksi`);
 setPrediction('G.7', (detected('Author Guidelines')&&s.title&&sig['Referensi'])?2:1, `mutu penyuntingan diperkirakan dari kelengkapan artikel contoh dan panduan penulis`);
 setPrediction('H.1', 0, `tidak ada bukti publik yang cukup untuk menyimpulkan pelanggaran integritas; butir disinsentif perlu verifikasi manual`);
 setPrediction('H.2', 0, `informasi ethical clearance tidak selalu relevan untuk semua artikel dan belum dapat dipastikan dari audit URL saja`);
 save();
 data.prediction={at:new Date().toISOString(), total: totalPredicted(), filled: DATA.items.filter(i=>state.ratings[i.code]).length};
 persist();
 return data.prediction;
}
function localText(item,notes){const choice=item.choices.find(c=>c.key===state.ratings[item.code]);const top=item.choices.reduce((a,c)=>c.score>a.score?c:a,item.choices[0]);const targets=codeMapping[item.group]||[];const relevant=(data.ojs?.findings||[]).filter(x=>targets.includes(x.label));const missing=relevant.filter(x=>x.status!=='terdeteksi');let lines=[`INDIKATOR ${item.code} — ${item.name}`,`Skor manual: ${choice?choice.score:'belum ditentukan'} dari ${top.score}.`, `Rubrik target: ${top.description}`,`STATUS BUKTI: hasil pemindaian adalah kandidat, bukan verifikasi kesesuaian.`];if(relevant.length)lines.push('Hasil audit OJS: '+relevant.map(x=>x.label+' ('+x.status+')').join('; ')+'.');if(data.crossref)lines.push(`DOI Crossref ${data.crossref.doi}: metadata ${data.crossref.title} (${data.crossref.year||'tahun tidak tercatat'}), ${data.crossref.references} referensi terdeposit.`);if(data.pdf)lines.push('Pemeriksaan PDF: '+data.pdf.summary);if(missing.length)lines.push('Prioritas: konfirmasi atau lengkapi '+missing.map(x=>x.label).join(', ')+'.');if(notes)lines.push('Catatan penilai: '+notes);lines.push('SARAN TINDAKAN: (1) Cocokkan rubrik tertinggi dengan fakta yang dapat ditunjukkan; (2) simpan tautan bukti, rentang edisi, dan rekam jejak; (3) perbaiki halaman/kebijakan atau praktik editorial yang belum memadai; (4) audit ulang dan minta reviewer memvalidasi.');lines.push('DRAF NARASI: Berdasarkan penelaahan awal terhadap indikator '+item.code+', pengelola jurnal telah mengidentifikasi kebutuhan verifikasi dan penguatan pada aspek '+item.name.toLowerCase()+'. Temuan dan kesenjangan akan ditindaklanjuti melalui pembaruan dokumen, penguatan implementasi, serta pengarsipan bukti terukur. Pernyataan capaian dan angka final baru dapat dicantumkan setelah diverifikasi berdasarkan data jurnal yang sahih.');return lines.join('\n\n')}
function composeEval(){readForm();const item=DATA.items.find(i=>i.code===data.selected);if(!item)throw Error('Indikator tidak dikenali.');return {item,notes:val('auditNotes'),evidence:collectEvidence().slice(0,24),pdfSummary:data.pdf?{filename:data.pdf.filename,signals:data.pdf.signals,excerpt:data.pdf.excerpt.slice(0,6000)}:null,selection:state.ratings[item.code]||null};}
function localEval(){try{const {item,notes}=composeEval();data.analysis={code:item.code,title:item.name,text:localText(item,notes),mode:'Rekomendasi lokal berbasis aturan',at:new Date().toISOString()};persist();render();notice('aiStatus','Rekomendasi lokal dibuat.')}catch(e){notice('aiStatus',e.message)}}
async function aiEval(){notice('aiStatus','Mengirim ringkasan bukti ke Worker...');try{const {item,notes,evidence,pdfSummary,selection}=composeEval();const r=await requestWorker('/ai',{indicator:{code:item.code,name:item.name,choices:item.choices,selected:selection},notes,evidence,pdfSummary});if(!r.analysis||typeof r.analysis!=='string')throw Error('Respons AI tidak memiliki analisis.');data.analysis={code:item.code,title:item.name,text:r.analysis,mode:'AI — evaluasi awal, perlu validasi manusia',at:new Date().toISOString()};persist();render();notice('aiStatus','AI selesai; tinjau klaim dan tautan bukti.')}catch(e){notice('aiStatus','AI gagal: '+e.message+'. Mode rekomendasi lokal tetap tersedia.')}}
function toEvidence(text){const code=data.selected;state.evidence[code]=[state.evidence[code],text].filter(Boolean).join('\n').slice(0,9000);save();persist();}
function download(filename,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
document.addEventListener('click',e=>{const id=e.target?.id;if(!id)return;switch(id){case 'auditOjs':auditOjs();break;case 'fetchDoi':auditDoi();break;case 'predictAll':try{const p=predictAllFromAudit();render();notice('ojsStatus','Prediksi otomatis selesai: '+p.filled+' sub-unsur terisi, total sementara '+p.total.toFixed(2)+'/100.');go('assessment')}catch(err){notice('ojsStatus','Prediksi gagal: '+err.message)}break;case 'scanPdf':auditPdf();break;case 'localEvaluate':localEval();break;case 'aiEvaluate':aiEval();break;case 'saveSettings':readForm();notice('aiStatus','Alamat endpoint disimpan. Token tetap hanya di tab aktif.');break;case 'ojsToProof':if(data.ojs){toEvidence('Audit OJS '+data.ojs.at+' '+data.ojs.url+'\n'+data.ojs.findings.map(x=>x.label+': '+x.status+' '+x.url).join('\n'));notice('ojsStatus','Dimasukkan ke bukti indikator '+data.selected)}break;case 'doiToProof':if(data.crossref){toEvidence('Crossref DOI '+data.crossref.doi+': '+data.crossref.title);notice('doiStatus','Dimasukkan ke bukti '+data.selected)}break;case 'pdfToProof':if(data.pdf){toEvidence('PDF '+data.pdf.filename+': '+data.pdf.summary);notice('pdfStatus','Dimasukkan ke bukti '+data.selected)}break;case 'saveAnalysis':if(data.analysis){state.notes[data.selected]=[state.notes[data.selected], 'DRAF EVALUASI (belum diverifikasi) '+data.analysis.mode+' '+data.analysis.at+'\n'+data.analysis.text].filter(Boolean).join('\n').slice(0,11000);save();notice('aiStatus','Disimpan ke catatan reviewer '+data.selected+' (bukan bukti).')}break;case 'copyAnalysis':if(data.analysis){navigator.clipboard.writeText(data.analysis.text).then(()=>notice('aiStatus','Teks disalin.')).catch(()=>notice('aiStatus','Salin manual dari hasil.'))}break;case 'exportEvidence':download('apjiki-audit-bukti-'+new Date().toISOString().slice(0,10)+'.json',{version:2,exported:new Date().toISOString(),journal:state.profile,evidence:collectEvidence(),analysis:data.analysis});break;default:break}});
document.addEventListener('change',e=>{if(e.target?.id==='auditItem'){data.selected=e.target.value;persist()}});
})();
