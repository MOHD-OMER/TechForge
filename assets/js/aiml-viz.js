/* ── helpers ── */
  const $ = id => document.getElementById(id);
  const rng = (a, b) => Math.random() * (b - a) + a;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const TWO_PI = Math.PI * 2;

  function resizeCanvas(cv) {
    const W = cv.offsetWidth  || (cv.parentElement && cv.parentElement.offsetWidth) || 600;
    const H = cv.offsetHeight || parseInt(cv.getAttribute('height') || '300');
    cv.width  = W * devicePixelRatio;
    cv.height = H * devicePixelRatio;
    const ctx = cv.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);
    return [W, H, ctx];
  }

  /* ── TAB SWITCH ── */
  function switchViz(key, btn) {
    document.querySelectorAll('.viz-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.vtab').forEach(b => b.classList.remove('active'));
    $('vp-' + key).classList.add('active');
    if (btn) btn.classList.add('active');
    const inits = { kmeans: resetKmeans, linreg: resetLinreg, nn: resetNN, dt: drawDT, pca: resetPCA, gd: resetGD };
    // Double rAF ensures browser has painted display:block before we read offsetWidth
    requestAnimationFrame(() => requestAnimationFrame(() => inits[key] && inits[key]()));
  }

  /* ══ 1. K-MEANS ══ */
  const KM_K = 3, KM_N = 90;
  const KM_COLORS = ['#6c63ff', '#ff6b9d', '#43ffb5'];
  let kmPoints = [], kmCentroids = [], kmAssign = [], kmDone = false, kmTimer = null;

  function randKmData() {
    kmPoints = [];
    for (let c = 0; c < KM_K; c++) {
      const cx = rng(.18,.82), cy = rng(.18,.82);
      for (let i = 0; i < KM_N/KM_K; i++) kmPoints.push({ x: cx+rng(-.14,.14), y: cy+rng(-.14,.14) });
    }
    kmCentroids = Array.from({length:KM_K}, () => ({x:rng(.2,.8), y:rng(.2,.8)}));
    kmAssign = new Array(kmPoints.length).fill(0);
    kmDone = false;
  }
  function resetKmeans() { clearInterval(kmTimer); kmTimer=null; randKmData(); drawKmeans(); }
  function drawKmeans() {
    const cv = $('kmeansCanvas'); if (!cv) return;
    const [W, H, ctx] = resizeCanvas(cv);
    ctx.clearRect(0,0,W,H);
    kmPoints.forEach((p,i) => {
      ctx.beginPath(); ctx.arc(p.x*W, p.y*H, 5, 0, TWO_PI);
      ctx.fillStyle = KM_COLORS[kmAssign[i]]+'bb'; ctx.fill();
    });
    kmCentroids.forEach((c,i) => {
      const x=c.x*W, y=c.y*H;
      ctx.beginPath(); ctx.arc(x,y,14,0,TWO_PI);
      ctx.fillStyle = KM_COLORS[i]+'22'; ctx.fill();
      ctx.strokeStyle = KM_COLORS[i]; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle = KM_COLORS[i]; ctx.font='bold 16px serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('★', x, y);
    });
  }
  function stepKmeans() {
    if (kmDone) return;
    let changed = false;
    kmPoints.forEach((p,i) => {
      let best=0, bestD=Infinity;
      kmCentroids.forEach((c,j) => { const d=(p.x-c.x)**2+(p.y-c.y)**2; if(d<bestD){bestD=d;best=j;} });
      if (kmAssign[i]!==best) { kmAssign[i]=best; changed=true; }
    });
    kmCentroids = kmCentroids.map((_,j) => {
      const pts = kmPoints.filter((_,i)=>kmAssign[i]===j);
      if (!pts.length) return kmCentroids[j];
      return {x:pts.reduce((s,p)=>s+p.x,0)/pts.length, y:pts.reduce((s,p)=>s+p.y,0)/pts.length};
    });
    if (!changed) kmDone=true;
    drawKmeans();
  }
  function runKmeans() {
    if (kmTimer) return;
    kmTimer = setInterval(() => { stepKmeans(); if(kmDone){clearInterval(kmTimer);kmTimer=null;} }, 380);
  }

  /* ══ 2. LINEAR REGRESSION ══ */
  let lrPoints = [], lrFitted = false;
  function resetLinreg() {
    lrFitted = false;
    lrPoints = Array.from({length:28}, () => ({x:rng(.08,.92), y:rng(.08,.92)}));
    drawLinreg();
  }
  function drawLinreg(m, b) {
    const cv = $('linregCanvas'); if (!cv) return;
    const [W, H, ctx] = resizeCanvas(cv);
    ctx.clearRect(0,0,W,H);
    if (lrFitted && m!==undefined) {
      lrPoints.forEach(p => {
        const py = m*p.x+b;
        ctx.beginPath(); ctx.moveTo(p.x*W,p.y*H); ctx.lineTo(p.x*W,py*H);
        ctx.strokeStyle='rgba(248,113,113,.5)'; ctx.lineWidth=1.5; ctx.stroke();
      });
    }
    lrPoints.forEach(p => { ctx.beginPath(); ctx.arc(p.x*W,p.y*H,5,0,TWO_PI); ctx.fillStyle='#6c63ff'; ctx.fill(); });
    if (lrFitted && m!==undefined) {
      ctx.beginPath(); ctx.moveTo(0,b*H); ctx.lineTo(W,(m+b)*H);
      ctx.strokeStyle='#00d4ff'; ctx.lineWidth=2.5; ctx.stroke();
    }
  }
  function fitLinreg() {
    const n=lrPoints.length;
    const sx=lrPoints.reduce((s,p)=>s+p.x,0), sy=lrPoints.reduce((s,p)=>s+p.y,0);
    const sxy=lrPoints.reduce((s,p)=>s+p.x*p.y,0), sx2=lrPoints.reduce((s,p)=>s+p.x*p.x,0);
    const m=(n*sxy-sx*sy)/(n*sx2-sx*sx), b=(sy-m*sx)/n;
    lrFitted=true; drawLinreg(m,b);
  }
  window.addEventListener('load', () => {
    const cv=$('linregCanvas');
    if (cv) cv.addEventListener('click', e => {
      const r=cv.getBoundingClientRect();
      lrPoints.push({x:(e.clientX-r.left)/cv.offsetWidth, y:(e.clientY-r.top)/cv.offsetHeight});
      lrFitted=false; drawLinreg();
    });
  });

  /* ══ 3. NEURAL NETWORK ══ */
  const NN_ARCH=[3,5,4,2];
  let nnWeights=[], nnActivations=[], nnAnimFrame=null;
  function buildNN() {
    nnWeights=[];
    for(let l=0;l<NN_ARCH.length-1;l++){
      const W=[];
      for(let j=0;j<NN_ARCH[l+1];j++) W.push(Array.from({length:NN_ARCH[l]},()=>rng(-1,1)));
      nnWeights.push(W);
    }
    nnActivations=NN_ARCH.map(n=>new Array(n).fill(0));
    nnActivations[0]=Array.from({length:NN_ARCH[0]},()=>rng(0,1));
  }
  function resetNN() { cancelAnimationFrame(nnAnimFrame); buildNN(); drawNN(0); }
  const relu=x=>Math.max(0,x), sigmoid=x=>1/(1+Math.exp(-x));
  function forwardNN() {
    for(let l=0;l<NN_ARCH.length-1;l++){
      for(let j=0;j<NN_ARCH[l+1];j++){
        let z=0;
        for(let i=0;i<NN_ARCH[l];i++) z+=nnWeights[l][j][i]*nnActivations[l][i];
        nnActivations[l+1][j]=(l===NN_ARCH.length-2?sigmoid:relu)(z);
      }
    }
  }
  function drawNN(highlight) {
    const cv=$('nnCanvas'); if(!cv) return;
    const [W,H,ctx]=resizeCanvas(cv);
    ctx.clearRect(0,0,W,H);
    const pad=48, layerX=i=>pad+i*(W-2*pad)/(NN_ARCH.length-1);
    const nodeY=(l,n,N)=>(H/(N+1))*(n+1);
    for(let l=0;l<NN_ARCH.length-1;l++){
      for(let j=0;j<NN_ARCH[l+1];j++){
        for(let i=0;i<NN_ARCH[l];i++){
          const w=nnWeights[l][j][i], a=clamp(Math.abs(w),0,1);
          ctx.beginPath();
          ctx.moveTo(layerX(l),nodeY(l,i,NN_ARCH[l]));
          ctx.lineTo(layerX(l+1),nodeY(l+1,j,NN_ARCH[l+1]));
          ctx.strokeStyle=l<highlight?`rgba(0,212,255,${a*.65})`:`rgba(255,255,255,${a*.12})`;
          ctx.lineWidth=Math.abs(w)*1.8; ctx.stroke();
        }
      }
    }
    NN_ARCH.forEach((N,l)=>{
      for(let n=0;n<N;n++){
        const x=layerX(l),y=nodeY(l,n,N),act=l<=highlight?nnActivations[l][n]:0;
        ctx.beginPath(); ctx.arc(x,y,13,0,TWO_PI);
        ctx.fillStyle=l<=highlight?`rgba(108,99,255,${0.2+act*.8})`:'rgba(30,35,64,0.9)'; ctx.fill();
        ctx.strokeStyle=l===highlight?'#00d4ff':'rgba(255,255,255,.15)'; ctx.lineWidth=2; ctx.stroke();
        if(l<=highlight){
          ctx.fillStyle='#fff'; ctx.font='bold 9px JetBrains Mono';
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(act.toFixed(1),x,y);
        }
      }
    });
    ['Input','Hidden','Hidden','Output'].forEach((lbl,l)=>{
      ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='10px JetBrains Mono';
      ctx.textAlign='center'; ctx.fillText(lbl,layerX(l),H-8);
    });
  }
  function animateNN() {
    cancelAnimationFrame(nnAnimFrame); forwardNN();
    let step=0;
    function tick(){ drawNN(step); step++; if(step<=NN_ARCH.length) nnAnimFrame=requestAnimationFrame(()=>setTimeout(tick,380)); }
    tick();
  }

  /* ══ 4. DECISION TREE ══ */
  const DT_TREE={q:'Age < 30?',
    yes:{q:'Income > 50k?',yes:{leaf:'Accept',col:'#43ffb5'},no:{leaf:'Review',col:'#fbbf24'}},
    no:{q:'Credit > 700?',yes:{leaf:'Accept',col:'#43ffb5'},no:{q:'Debt < 20k?',yes:{leaf:'Review',col:'#fbbf24'},no:{leaf:'Reject',col:'#f87171'}}}
  };
  function drawDT() {
    const cv=$('dtCanvas'); if(!cv) return;
    const [W,H,ctx]=resizeCanvas(cv); ctx.clearRect(0,0,W,H);
    function dn(node,x,y,spread){
      if(node.leaf){
        ctx.beginPath(); ctx.arc(x,y,24,0,TWO_PI);
        ctx.fillStyle=node.col+'22'; ctx.fill();
        ctx.strokeStyle=node.col; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle=node.col; ctx.font='bold 11px JetBrains Mono';
        ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(node.leaf,x,y); return;
      }
      const rw=80,rh=34;
      ctx.fillStyle='rgba(30,35,64,0.95)'; ctx.strokeStyle='#6c63ff'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(x-rw/2,y-rh/2,rw,rh,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#e8eaf6'; ctx.font='10px JetBrains Mono';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(node.q,x,y);
      const nY=y+82;
      if(node.yes){
        const nx=x-spread;
        ctx.beginPath(); ctx.moveTo(x,y+rh/2); ctx.lineTo(nx,nY-24);
        ctx.strokeStyle='#43ffb5'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle='#43ffb5'; ctx.font='10px JetBrains Mono'; ctx.textAlign='center';
        ctx.fillText('Yes',(x+nx)/2+6,(y+nY)/2-4); dn(node.yes,nx,nY,spread*.5);
      }
      if(node.no){
        const nx=x+spread;
        ctx.beginPath(); ctx.moveTo(x,y+rh/2); ctx.lineTo(nx,nY-24);
        ctx.strokeStyle='#f87171'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle='#f87171'; ctx.font='10px JetBrains Mono'; ctx.textAlign='center';
        ctx.fillText('No',(x+nx)/2-6,(y+nY)/2-4); dn(node.no,nx,nY,spread*.5);
      }
    }
    dn(DT_TREE,W/2,38,W*.28);
  }

  /* ══ 5. PCA ══ */
  let pcaPoints=[];
  function resetPCA(){
    pcaPoints=Array.from({length:60},()=>{const t=rng(-1,1);return{x:t+rng(-.17,.17),y:0.7*t+rng(-.17,.17)};});
    drawPCA();
  }
  function drawPCA(pc1,pc2,mean){
    const cv=$('pcaCanvas'); if(!cv) return;
    const [W,H,ctx]=resizeCanvas(cv); ctx.clearRect(0,0,W,H);
    const toS=p=>({x:p.x/3*W/2+W/2,y:-p.y/3*H/2+H/2});
    ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    pcaPoints.forEach(p=>{const s=toS(p);ctx.beginPath();ctx.arc(s.x,s.y,4,0,TWO_PI);ctx.fillStyle='rgba(108,99,255,.65)';ctx.fill();});
    if(pc1&&mean){
      const ms=toS(mean),sc=1.3;
      [[pc1,'#a78bfa','PC1'],[pc2,'#ff6b9d','PC2']].forEach(([pc,col,lbl])=>{
        ctx.beginPath();
        ctx.moveTo(ms.x-pc[0]*sc*W/2,ms.y+pc[1]*sc*H/2);
        ctx.lineTo(ms.x+pc[0]*sc*W/2,ms.y-pc[1]*sc*H/2);
        ctx.strokeStyle=col; ctx.lineWidth=3; ctx.stroke();
        ctx.fillStyle=col; ctx.font='bold 11px JetBrains Mono';
        ctx.fillText(lbl,ms.x+pc[0]*sc*W/2+8,ms.y-pc[1]*sc*H/2);
      });
    }
  }
  function runPCA(){
    const n=pcaPoints.length;
    const mx=pcaPoints.reduce((s,p)=>s+p.x,0)/n, my=pcaPoints.reduce((s,p)=>s+p.y,0)/n;
    const cx=pcaPoints.map(p=>p.x-mx), cy=pcaPoints.map(p=>p.y-my);
    const cxx=cx.reduce((s,v,i)=>s+v*cx[i],0)/n, cyy=cy.reduce((s,v,i)=>s+v*cy[i],0)/n, cxy=cx.reduce((s,v,i)=>s+v*cy[i],0)/n;
    const tr=cxx+cyy, det=cxx*cyy-cxy*cxy;
    const l1=(tr+Math.sqrt(tr*tr-4*det))/2;
    const ev1=[l1-cyy,cxy], m1=Math.hypot(...ev1);
    const e1=[ev1[0]/m1,ev1[1]/m1], e2=[-e1[1],e1[0]];
    drawPCA(e1,e2,{x:mx,y:my});
  }

  /* ══ 6. GRADIENT DESCENT ══ */
  let gdX=rng(-2.8,2.8), gdHistory=[], gdTimer=null;
  const gdLoss=x=>(x-1.2)**2+0.4*Math.sin(2.5*x);
  const gdGrad=x=>2*(x-1.2)+1.0*Math.cos(2.5*x);
  function resetGD(){ clearInterval(gdTimer);gdTimer=null;gdX=rng(-2.8,2.8);gdHistory=[gdX];drawGD(); }
  function drawGD(){
    const cv=$('gdCanvas'); if(!cv) return;
    const [W,H,ctx]=resizeCanvas(cv); ctx.clearRect(0,0,W,H);
    const xmin=-3.5,xmax=3.5,ymin=-0.5,ymax=5;
    const sx=x=>(x-xmin)/(xmax-xmin)*W, sy=y=>H-(y-ymin)/(ymax-ymin)*H;
    ctx.beginPath();
    for(let i=0;i<=300;i++){const x=xmin+i*(xmax-xmin)/300;i===0?ctx.moveTo(sx(x),sy(gdLoss(x))):ctx.lineTo(sx(x),sy(gdLoss(x)));}
    ctx.strokeStyle='rgba(0,212,255,.7)'; ctx.lineWidth=2.5; ctx.stroke();
    if(gdHistory.length>1){
      ctx.beginPath();
      gdHistory.forEach((x,i)=>{const y=gdLoss(x);i===0?ctx.moveTo(sx(x),sy(y)):ctx.lineTo(sx(x),sy(y));});
      ctx.strokeStyle='rgba(108,99,255,.55)'; ctx.lineWidth=1.5; ctx.stroke();
    }
    gdHistory.forEach((x,i)=>{
      const r=i===gdHistory.length-1?8:3.5;
      ctx.beginPath(); ctx.arc(sx(x),sy(gdLoss(x)),r,0,TWO_PI);
      ctx.fillStyle=i===gdHistory.length-1?'#f87171':'rgba(108,99,255,.45)'; ctx.fill();
    });
    ctx.fillStyle='rgba(255,255,255,.45)'; ctx.font='11px JetBrains Mono';
    ctx.fillText(`Step ${gdHistory.length-1}   x = ${gdX.toFixed(3)}   L = ${gdLoss(gdX).toFixed(4)}`,12,18);
  }
  function stepGD(){
    const lr=($('lr-slider')?+$('lr-slider').value:8)/200;
    gdX-=lr*gdGrad(gdX); gdX=clamp(gdX,-3.5,3.5); gdHistory.push(gdX); drawGD();
  }
  function runGD(){
    if(gdTimer) return;
    gdTimer=setInterval(()=>{stepGD();if(gdHistory.length>120){clearInterval(gdTimer);gdTimer=null;}},75);
  }

  const lrSlider = document.getElementById('lr-slider');
  const lrVal = document.getElementById('lr-val');
  if (lrSlider && lrVal) {
    lrSlider.addEventListener('input', () => {
      lrVal.textContent = (lrSlider.value / 200).toFixed(3);
    });
  }

  window.addEventListener('load', () => {
    setTimeout(() => { resetKmeans(); resetLinreg(); buildNN(); drawNN(0); resetPCA(); resetGD(); drawDT(); }, 200);
  });
  window.addEventListener('resize', () => { drawKmeans(); drawLinreg(); drawNN(0); drawPCA(); drawGD(); drawDT(); });