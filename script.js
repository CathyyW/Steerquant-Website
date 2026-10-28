const stages = [
  {kicker:'01 / READ THE MAP',title:'Action-Impact<br> Stream Map',description:'Estimate how local quantization errors propagate to the final action. The map identifies which layer–step–stream regions deserve stronger protection.',label:'THE QUESTION',key:'Where does error matter most to control?'},
  {kicker:'02 / SET THE ROUTE',title:'Shared-Weight<br> Error Routing',description:'Use map-derived importance to calibrate shared channel scaling. Protect high-impact regions while allowing more error in lower-impact computations.',label:'THE CONSTRAINT',key:'Keep one quantized weight matrix per layer, shared across streams and steps.'},
  {kicker:'03 / ADJUST TO CONDITIONS',title:'Stream-Specific<br> Activation Modulation',description:'Refine activation gains and clipping thresholds for each stream and denoising step as activation ranges and action impact change.',label:'OFFLINE CALIBRATION',key:'Like adjusting to changing seas, using a calibrated lookup table—not online replanning.'}
];
const explorer = document.querySelector('.voyage-explorer');
const stageButtons = [...document.querySelectorAll('.stage-button')];
function showStage(index) {
  const stage = stages[index];
  explorer.dataset.stage = index;
  stageButtons.forEach((button, i) => { button.classList.toggle('active',i===index); button.setAttribute('aria-pressed',String(i===index)); });
  document.getElementById('stage-kicker').textContent = stage.kicker;
  document.getElementById('stage-title').innerHTML = stage.title;
  document.getElementById('stage-description').textContent = stage.description;
  document.getElementById('stage-key-label').textContent = stage.label;
  document.getElementById('stage-key-text').textContent = stage.key;
}
stageButtons.forEach((button,i)=>{
  button.addEventListener('click',()=>showStage(i));
  button.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3;
    stageButtons[next].focus();showStage(next);
  });
});
const models = [
  {name:'Cosmos-Policy',benchmark:'LIBERO · mean success (%)',fp:[98.5,261.460,4.241],W4A4:[98.3,117.322,2.229,1.645],W4A8:[98.6,133.455,1.959,1.642]},
  {name:'FastWAMJoint',benchmark:'LIBERO · mean success (%)',fp:[98.9,360.450,12.116],W4A4:[98.4,193.916,1.859,3.370],W4A8:[98.1,260.977,1.381,3.363]},
  {name:'Cosmos-Edge',benchmark:'RoboLab · success (%)',fp:[21.83,881.637,8.492],W4A4:[17.33,521.589,1.690,6.398],W4A8:[14.67,563.858,1.564,6.397]}
];
const precisionButtons=[...document.querySelectorAll('.precision-button')];
function showPrecision(precision){
  precisionButtons.forEach(button=>{const active=button.dataset.precision===precision;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  document.getElementById('benchmark-table').innerHTML = `<table><caption class="sr-only">BF16 compared with SteerQuant ${precision}; success rate, denoising latency, speedup, and peak GPU memory.</caption><thead><tr><th>Model / benchmark</th><th>Task success (%)<small>BF16 → ${precision}</small></th><th>Latency (ms)<small>BF16 → ${precision}</small></th><th>Speedup<small>vs. BF16</small></th><th>Peak memory (GB)<small>BF16 → ${precision}</small></th></tr></thead><tbody>${models.map(model=>{const d=model[precision];return `<tr><th>${model.name}<small>${model.benchmark}</small></th><td>${model.fp[0]} → <strong>${d[0]}</strong></td><td>${model.fp[1].toFixed(3)} → <strong>${d[1].toFixed(3)}</strong></td><td><strong>${d[2].toFixed(3)}×</strong></td><td>${model.fp[2].toFixed(3)} → <strong>${d[3].toFixed(3)}</strong></td></tr>`;}).join('')}</tbody></table>`;
}
precisionButtons.forEach(button=>button.addEventListener('click',()=>showPrecision(button.dataset.precision)));
showPrecision('W4A4');
document.getElementById('copy').addEventListener('click',async()=>{
  const status=document.getElementById('copy-status');
  const bib=document.getElementById('bib');
  status.textContent='Copying citation…';
  try{
    await Promise.race([navigator.clipboard.writeText(bib.textContent),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Clipboard timeout')),2000))]);
    status.textContent='Citation copied.';
  }catch{
    const range=document.createRange();range.selectNodeContents(bib);
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    status.textContent='Citation selected. Press Ctrl+C (or ⌘C) to copy.';
  }
});
const sectionLinks=[...document.querySelectorAll('nav a')];
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    entries.filter(entry=>entry.isIntersecting).forEach(entry=>sectionLinks.forEach(link=>link.classList.toggle('active',link.hash==='#'+entry.target.id)));
  },{rootMargin:'-15% 0px -65% 0px'});
  sectionLinks.forEach(link=>{const section=document.querySelector(link.hash);if(section)observer.observe(section);});
}
