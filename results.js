// All displayed bars use the paper-reported values in results-data.js.
(() => {
  const colors = {
    Original: 'var(--method-reference)', QuaRot: '#4ca5ff', Atom: '#ee78b6', SVDQuant: '#52d69a',
    SmoothQuant: '#4ca5ff', PTQ4DiT: '#b28aff', 'Q-DiT': '#35d5d0', SteerQuant: 'var(--method-ours)'
  };
  const metrics = {
    latency: {index: 0, title: 'Denoising latency (ms) ↓', unit: 'ms', max: 1000, step: 250},
    speedup: {index: 1, title: 'Speedup (× vs. full precision) ↑', unit: '×', max: 2.5, step: 0.5},
    memory: {index: 2, title: 'Peak allocated GPU memory (GB) ↓', unit: 'GB', max: 14, step: 2}
  };
  let currentPrecision = 'W4A4';
  let currentModel = 'Cosmos-Policy';
  let currentMetric = 'latency';
  const get = id => document.getElementById(id);
  const name = method => method === 'Original' ? 'Full precision (BF16)' : method;
  const methodLabel = method => `<span class="method-swatch" style="--method-color:${colors[method]}"></span>${name(method)}${method === 'SteerQuant' ? ' <b>Ours</b>' : ''}`;
  const matchedRows = rows => rows.filter(row => row.precision === 'FP' || row.precision === currentPrecision);
  const signed = (value, digits) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`;
  const chartOptions = new Map();
  const selectedGroups = {'success-chart': 'Average', 'efficiency-chart': 'Cosmos-Policy'};

  function compactPlot({groups, rows, min = 0, max, step, decimals, unit, reference = null}, group) {
    const groupIndex = groups.indexOf(group);
    const ticks = [];
    for (let tick = min; tick <= max + 0.0001; tick += step) {
      ticks.push(`<span>${Number(tick.toFixed(2))}</span>`);
    }
    return `<div class="compact-axis" aria-label="Axis: ${min} to ${max} ${unit}${min > 0 ? ', truncated' : ''}">${min > 0 ? '<span class="compact-axis-break" aria-hidden="true">//</span>' : ''}${ticks.join('')}</div>
      <div class="compact-bars">${rows.map(row => {
        const value = row.values[groupIndex];
        const width = 100 * (value - min) / (max - min);
        const ours = row.method === 'SteerQuant';
        const suffix = ['%', '×'].includes(unit) ? unit : ` ${unit}`;
        return `<div class="compact-bar-row${ours ? ' compact-ours' : ''}" data-method="${row.method}" data-group="${group}" data-value="${value}" style="--bar-color:${colors[row.method]}">
          <div class="compact-bar-label"><span class="compact-method">${name(row.method)}${ours ? ' <b>Ours</b>' : ''}</span><strong>${value.toFixed(decimals)}${suffix}</strong></div>
          <div class="compact-bar-track" aria-hidden="true"><i style="width:${width}%"></i>${reference === null ? '' : `<span class="compact-reference" style="left:${100 * (reference - min) / (max - min)}%"></span>`}</div>
        </div>`;
      }).join('')}</div>`;
  }

  function compactChart(options) {
    const {id, title, groups, min = 0, max} = options;
    const group = groups.includes(selectedGroups[id]) ? selectedGroups[id] : groups[0];
    const groupLabel = value => value === 'Average' ? 'Average · 4 suites' : value;
    const picker = groups.length > 1
      ? `<label class="compact-chart-picker" for="${id}-group"><span>${id === 'success-chart' ? 'Suite / average' : 'Model'}</span><select id="${id}-group" data-chart-group="${id}">${groups.map(value => `<option value="${value}"${value === group ? ' selected' : ''}>${groupLabel(value)}</option>`).join('')}</select></label>`
      : `<p class="compact-chart-heading">${group}</p>`;
    return `<div class="compact-chart">${picker}<div class="compact-chart-plot" role="group" aria-label="${title} · ${groupLabel(group)}" data-axis-min="${min}" data-axis-max="${max}">${compactPlot(options, group)}</div></div>`;
  }

  function legend(id, rows) {
    get(id).innerHTML = rows.map(row => `<span class="${row.method === 'SteerQuant' ? 'legend-ours' : ''}">${methodLabel(row.method)}</span>`).join('');
  }

  function bars({id, title, groups, rows, min = 0, max, step, decimals, unit, average = false, single = false, reference = null}) {
    const width = 1120, height = single ? 430 : 530, left = 60, right = 16, top = 40, bottom = 375;
    const plotWidth = width - left - right;
    const stride = plotWidth / groups.length;
    const band = single ? 740 : stride * 0.9;
    const slot = band / rows.length;
    const barWidth = Math.min(single ? 70 : 52, slot * 0.74);
    const y = value => bottom - (value - min) / (max - min) * (bottom - top);
    const svg = [`<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title" aria-describedby="${id}-desc" data-axis-min="${min}" data-axis-max="${max}" class="comparison-svg${single ? ' single-group' : ''}">
      <title id="${id}-title">${title}</title>
      <desc id="${id}-desc">${min > 0 ? `Zoomed, truncated axis from ${min} to ${max} percent; bars start at ${min}, not zero.` : 'Grouped bars on a zero-based axis.'} Method names appear below every bar. Exact values are labelled above every bar and available in the data table below. ${currentPrecision} methods are compared with a full-precision reference.</desc>`];
    if (average) svg.push(`<rect class="average-band" x="${left + stride * (groups.length - 1) + 3}" y="15" width="${stride - 6}" height="${height - 25}" rx="10"/>`);
    for (let tick = min; tick <= max + 0.0001; tick += step) {
      const label = Number(tick.toFixed(2));
      svg.push(`<line class="chart-grid" x1="${left}" y1="${y(tick)}" x2="${width - right}" y2="${y(tick)}"/><text class="chart-tick" x="${left - 13}" y="${y(tick) + 5}" text-anchor="end">${label}</text>`);
    }
    if (min > 0) svg.push(`<path class="chart-axis-break" d="M${left - 7} ${bottom + 7}l14 -8m-14 16l14 -8"/>`);
    if (reference !== null) svg.push(`<line class="chart-reference" x1="${left}" x2="${width - right}" y1="${y(reference)}" y2="${y(reference)}"/>`);
    groups.forEach((group, groupIndex) => {
      const center = left + stride * (groupIndex + 0.5);
      rows.forEach((row, methodIndex) => {
        const value = row.values[groupIndex];
        const cx = center - band / 2 + slot * (methodIndex + 0.5);
        const label = value.toFixed(decimals);
        const ours = row.method === 'SteerQuant';
        svg.push(`<g class="chart-bar${ours ? ' bar-ours' : ''}" data-method="${row.method}" data-group="${group}" data-value="${value}" style="--bar-color:${colors[row.method]}">
          <title>${group} · ${name(row.method)}: ${label}${unit === '×' ? '×' : ' ' + unit}</title>
          <rect x="${cx - barWidth / 2}" y="${y(value)}" width="${barWidth}" height="${bottom - y(value)}" rx="4"/>
          <text class="bar-value" x="${cx}" y="${y(value) - 11}" text-anchor="middle">${label}</text>
          <text class="bar-method${single ? ' bar-method-horizontal' : ''}" x="${cx}" y="${single ? 407 : bottom + 21}" ${single ? '' : `transform="rotate(-55 ${cx} ${bottom + 21})"`} text-anchor="${single ? 'middle' : 'end'}">${row.method === 'Original' ? 'BF16' : row.method}</text>
        </g>`);
      });
      if (!single) svg.push(`<text class="chart-group${average && groupIndex === groups.length - 1 ? ' average-label' : ''}" x="${center}" y="509" text-anchor="middle">${group}</text>`);
    });
    svg.push('</svg>');
    const options = {id, title, groups, rows, min, max, step, decimals, unit, reference};
    chartOptions.set(id, options);
    get(id).innerHTML = svg.join('') + compactChart(options);
  }

  function dataTable(id, caption, groups, rows, decimals, unit) {
    get(id).innerHTML = `<table><caption class="sr-only">${caption}</caption><thead><tr><th scope="col">Method</th>${groups.map(group => `<th scope="col">${group}<small>${unit}</small></th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr class="${row.method === 'SteerQuant' ? 'data-ours' : ''}"><th scope="row">${methodLabel(row.method)}</th>${row.values.map(value => `<td>${value.toFixed(decimals)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function renderSuccess() {
    const single = currentModel === 'Cosmos-Edge';
    const decimals = single ? 2 : 1;
    const groups = single ? ['RoboLab'] : ['Spatial', 'Object', 'Goal', 'Long', 'Average'];
    const rows = matchedRows(benchmarkData.success).map(row => ({method: row.method, values: single ? [row[currentModel]] : row[currentModel]}));
    const last = groups.length - 1;
    const ours = rows.find(row => row.method === 'SteerQuant').values[last];
    const fp = rows[0].values[last];
    const best = rows.filter(row => !['Original', 'SteerQuant'].includes(row.method)).reduce((a, b) => a.values[last] >= b.values[last] ? a : b);
    const bestNames = rows.filter(row => !['Original', 'SteerQuant'].includes(row.method) && row.values[last] === best.values[last]).map(row => row.method).join(' / ');
    legend('success-legend', rows);
    get('success-axis-label').textContent = `${single ? 'RoboLab' : 'LIBERO'} · Success rate (%) ↑ · ${single ? 'Axis: 0–25%' : 'Zoomed axis: 90–100% (truncated)'}`;
    bars({id: 'success-chart', title: `${currentModel} · ${currentPrecision} · Success rate (%)`, groups, rows, min: single ? 0 : 90, max: single ? 25 : 100, step: single ? 5 : 2, decimals, unit: '%', average: !single, single});
    get('success-summary').innerHTML = `<div><span>SteerQuant ${single ? 'success rate' : 'overall average'}</span><strong>${ours.toFixed(decimals)}<small>%</small></strong></div><div><span>${single ? 'vs.' : 'Overall vs.'} strongest quantized baseline</span><strong>${signed(ours - best.values[last], decimals)}<small> pp</small></strong><em>${bestNames} · ${best.values[last].toFixed(decimals)}%</em></div><div><span>${single ? 'vs.' : 'Overall vs.'} full precision</span><strong>${signed(ours - fp, decimals)}<small> pp</small></strong><em>BF16 · ${fp.toFixed(decimals)}%</em></div>`;
    get('success-note').textContent = single
      ? 'Quantized results remain below full precision. pp = percentage points.'
      : `Truncated axis: bars start at 90%. Averages are reported by the paper. pp = percentage points.${currentModel === 'FastWAMJoint' && currentPrecision === 'W4A4' ? ' QuaRot has the highest quantized average in this setting.' : ''}`;
    dataTable('success-data', `${currentModel}, ${currentPrecision}, success rates from Table 1`, groups, rows, decimals, '%');
  }

  function renderEfficiency() {
    const metric = metrics[currentMetric];
    const rows = matchedRows(benchmarkData.efficiency).map(row => ({method: row.method, values: benchmarkData.models.map(model => row[model][metric.index])}));
    legend('efficiency-legend', rows);
    get('efficiency-axis-label').textContent = metric.title;
    bars({id: 'efficiency-chart', title: `${currentPrecision} · ${metric.title} · RTX 4090`, groups: benchmarkData.models, rows, max: metric.max, step: metric.step, decimals: 3, unit: metric.unit, reference: currentMetric === 'speedup' ? 1 : null});
    get('efficiency-insight').innerHTML = currentMetric === 'memory'
      ? '<strong>Memory is part of the trade-off.</strong> SteerQuant reduces peak memory relative to BF16; some quantized baselines use slightly less.'
      : '<strong>SteerQuant is the fastest reported method at matched precision</strong> across all three models on the RTX 4090.';
    get('efficiency-note').textContent = `${currentMetric === 'latency' ? 'Denoising latency only.' : currentMetric === 'speedup' ? 'Relative to each model’s BF16 run; dashed line = 1×.' : 'Peak GPU memory includes weights, activations, and temporary buffers.'}${currentPrecision === 'W4A8' ? ' PTQ4DiT / Q-DiT: W4A8 efficiency results not reported.' : ''}`;
    dataTable('efficiency-data', `${currentPrecision}, ${metric.title}, RTX 4090, Table 2`, benchmarkData.models, rows, 3, metric.unit);
  }

  window.renderComparisonCharts = precision => {
    currentPrecision = precision;
    document.querySelectorAll('[data-current-precision]').forEach(label => { label.textContent = precision; });
    renderSuccess();
    renderEfficiency();
  };
  ['success-chart', 'efficiency-chart'].forEach(id => get(id).addEventListener('change', event => {
    if (event.target.dataset.chartGroup !== id) return;
    const options = chartOptions.get(id);
    const group = event.target.value;
    if (!options.groups.includes(group)) return;
    selectedGroups[id] = group;
    const plot = get(id).querySelector('.compact-chart-plot');
    plot.setAttribute('aria-label', `${options.title} · ${group === 'Average' ? 'Average across four suites' : group}`);
    plot.innerHTML = compactPlot(options, group);
  }));
  document.querySelectorAll('[data-result-model]').forEach(button => button.addEventListener('click', () => {
    currentModel = button.dataset.resultModel;
    document.querySelectorAll('[data-result-model]').forEach(choice => {
      const active = choice === button;
      choice.classList.toggle('active', active);
      choice.setAttribute('aria-pressed', String(active));
    });
    renderSuccess();
  }));
  document.querySelectorAll('[data-result-metric]').forEach(button => button.addEventListener('click', () => {
    currentMetric = button.dataset.resultMetric;
    document.querySelectorAll('[data-result-metric]').forEach(choice => {
      const active = choice === button;
      choice.classList.toggle('active', active);
      choice.setAttribute('aria-pressed', String(active));
    });
    renderEfficiency();
  }));
})();
