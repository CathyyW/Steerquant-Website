const explorer = document.querySelector('.method-explorer');
const stageButtons = [...document.querySelectorAll('.stage-button')];
const methodPanels = [...document.querySelectorAll('.method-panel')];
const methodPrevious = document.getElementById('method-prev');
const methodNext = document.getElementById('method-next');
const nextLabels = ['Next: Route →', 'Next: Modulate →', 'See full framework ↓'];
let activeMethodStage = 0;

function showStage(index, moveToPanel = false) {
  activeMethodStage = index;
  explorer.dataset.stage = String(index);
  stageButtons.forEach((button, i) => {
    const active = i === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    button.querySelector('.step-card-state').textContent = active ? 'Now viewing' : 'Explore step →';
    methodPanels[i].hidden = !active;
  });
  methodPrevious.disabled = index === 0;
  methodNext.textContent = nextLabels[index];
  document.getElementById('method-count').textContent = `Step ${index + 1} of 3`;
  document.querySelectorAll('.step-progress-dots i').forEach((dot, i) => dot.classList.toggle('active', i === index));
  if (moveToPanel) {
    methodPanels[index].focus({preventScroll: true});
    methodPanels[index].scrollIntoView({block: 'start'});
  }
}
stageButtons.forEach((button, i) => {
  button.addEventListener('click', () => showStage(i));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (i + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    stageButtons[next].focus();
    showStage(next);
  });
});
methodPrevious.addEventListener('click', () => showStage(Math.max(0, activeMethodStage - 1), true));
methodNext.addEventListener('click', () => {
  if (activeMethodStage < 2) showStage(activeMethodStage + 1, true);
  else document.getElementById('method-framework').scrollIntoView({block: 'start'});
});

const models = [
  {name:'Cosmos-Policy',benchmark:'LIBERO · mean success (%)',fp:[98.5,261.460,4.241],W4A4:[98.3,117.322,2.229,1.645],W4A8:[98.6,133.455,1.959,1.642]},
  {name:'FastWAMJoint',benchmark:'LIBERO · mean success (%)',fp:[98.9,360.450,12.116],W4A4:[98.4,193.916,1.859,3.370],W4A8:[98.1,260.977,1.381,3.363]},
  {name:'Cosmos-Edge',benchmark:'RoboLab · success (%)',fp:[21.83,881.637,8.492],W4A4:[17.33,521.589,1.690,6.398],W4A8:[14.67,563.858,1.564,6.397]}
];
const precisionButtons=[...document.querySelectorAll('.precision-button')];
function showPrecision(precision){
  renderComparisonCharts(precision);
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
