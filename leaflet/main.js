// Initialize Leaflet map
// Start focused on the southeastern US like the original ColorBrewer map
const map = L.map('map').setView([31, -85], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Controls
const schemeSelect = document.getElementById('scheme');
const classesSelect = document.getElementById('classes');
const modeSelect = document.getElementById('mode');
const reverseCheck = document.getElementById('reverse');
const layerSelect = document.getElementById('layer');
const legend = document.getElementById('legend');
const probe = document.getElementById('probe');
const schemeInfo = document.getElementById('scheme-info');
const recommendation = document.getElementById('recommendation');
const exportAse = document.getElementById('export-ase');
const exportGpl = document.getElementById('export-gpl');
const exportClr = document.getElementById('export-clr');
const exportText = document.getElementById('export-text');
const copyJsBtn = document.getElementById('copy-js');
const copyCssBtn = document.getElementById('copy-css');

// Shared data and style state
let data;
let geo;
let breaks = [];
let colors = [];
let ranges = [];
let minVal = 0;
let maxVal = 0;

// Populate color scheme options
const seq = colorbrewer;
const schemesByType = { seq: [], div: [], qual: [] };
Object.entries(seq).forEach(([name, val]) => {
  const t = val.properties?.type;
  if (schemesByType[t]) schemesByType[t].push(name);
});

const typeLabels = { seq: 'Sequential', div: 'Diverging', qual: 'Qualitative' };
Object.keys(typeLabels).forEach((t) => {
  const group = document.createElement('optgroup');
  group.label = typeLabels[t];
  schemesByType[t].sort().forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    group.appendChild(opt);
  });
  schemeSelect.appendChild(group);
});

const typeDescriptions = {
  seq: 'Sequential: ordered low→high values (light to dark).',
  div: 'Diverging: data around a meaningful middle value.',
  qual: 'Qualitative: categorical classes with no order.'
};

const recommendationByType = {
  seq: 'Tip: use sequential when values have a natural order and no critical midpoint.',
  div: 'Tip: use diverging when low/high sides must be balanced around a key value.',
  qual: 'Tip: use qualitative for categories, not magnitude.'
};

function updateSchemeInfo() {
  const t = seq[schemeSelect.value]?.properties?.type;
  schemeInfo.textContent = t ? typeDescriptions[t] : '';
  recommendation.textContent = t ? recommendationByType[t] : '';
}

// Utility helpers
function rgbArray(str) {
  return str.match(/\d+/g).map(Number);
}

function toHex(str) {
  const [r, g, b] = rgbArray(str);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function toCmyk(str) {
  const [r, g, b] = rgbArray(str).map((v) => v / 255);
  const k = 1 - Math.max(r, g, b);
  const c = (1 - r - k) / (1 - k) || 0;
  const m = (1 - g - k) / (1 - k) || 0;
  const y = (1 - b - k) / (1 - k) || 0;
  return [c, m, y, k].map((x) => Math.round(x * 100));
}

function computeQuantileBreaks(values, num) {
  const sorted = values.slice().sort((a, b) => a - b);
  const quantileBreaks = [];
  for (let i = 1; i < num; i += 1) {
    quantileBreaks.push(sorted[Math.floor((i * sorted.length) / num)]);
  }
  return quantileBreaks;
}

function computeEqualBreaks(num) {
  const step = (maxVal - minVal) / num;
  const equalBreaks = [];
  for (let i = 1; i < num; i += 1) {
    equalBreaks.push(minVal + i * step);
  }
  return equalBreaks;
}

function computeBreaks() {
  const scheme = schemeSelect.value || 'YlGn';
  const num = parseInt(classesSelect.value, 10) || 3;
  const schemeColors = seq[scheme][num];
  colors = reverseCheck.checked ? schemeColors.slice().reverse() : schemeColors.slice();

  const values = data.features.map((f) => f.properties.density);
  minVal = Math.min(...values);
  maxVal = Math.max(...values);

  breaks = modeSelect.value === 'equal'
    ? computeEqualBreaks(num)
    : computeQuantileBreaks(values, num);

  ranges = [];
  for (let i = 0; i < num; i += 1) {
    const from = i === 0 ? minVal : breaks[i - 1];
    const to = i === num - 1 ? maxVal : breaks[i];
    ranges.push([from, to]);
  }
}

function getClassIndex(d) {
  const num = parseInt(classesSelect.value, 10) || 3;
  for (let i = num - 1; i > 0; i -= 1) {
    if (d >= breaks[i - 1]) return i;
  }
  return 0;
}

function styleFeature(feature) {
  const idx = getClassIndex(feature.properties.density);
  return {
    weight: 0.8,
    color: '#fff',
    fillColor: colors[idx],
    fillOpacity: 0.78
  };
}

function showProbeFromEvent(e, idx, labelPrefix = '') {
  const col = colors[idx];
  const [r, g, b] = rgbArray(col);
  const [c, m, y, k] = toCmyk(col);
  const title = labelPrefix || `${schemeSelect.value} class ${idx + 1}`;
  probe.innerHTML = `<p>${title}<br>HEX: ${toHex(col)}<br>RGB: ${r}, ${g}, ${b}<br>CMYK: ${c}, ${m}, ${y}, ${k}</p>`;
  probe.style.left = `${e.clientX + 10}px`;
  probe.style.top = `${e.clientY + 10}px`;
  probe.style.display = 'block';
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover(e) {
      const idx = getClassIndex(feature.properties.density);
      layer.setStyle({ weight: 1.5, color: '#333' });
      showProbeFromEvent(e.originalEvent, idx, `${feature.properties.name || 'Area'}: ${feature.properties.density.toFixed(1)}`);
    },
    mousemove(e) {
      const idx = getClassIndex(feature.properties.density);
      showProbeFromEvent(e.originalEvent, idx, `${feature.properties.name || 'Area'}: ${feature.properties.density.toFixed(1)}`);
    },
    mouseout() {
      geo.resetStyle(layer);
      probe.style.display = 'none';
    }
  });
}

function formatRangeLabel(range) {
  return `${range[0].toFixed(1)} – ${range[1].toFixed(1)}`;
}

function updateLegend() {
  legend.innerHTML = '';

  const title = document.createElement('div');
  title.className = 'legend-title';
  title.textContent = `Legend (${modeSelect.value === 'equal' ? 'Equal interval' : 'Quantile'})`;
  legend.appendChild(title);

  ranges.forEach((range, idx) => {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const chip = document.createElement('span');
    const col = colors[idx];
    const [r, g, b] = rgbArray(col);
    const [c, m, y, k] = toCmyk(col);
    chip.className = 'legend-chip';
    chip.style.backgroundColor = col;
    chip.title = `HEX: ${toHex(col)} RGB: ${r}, ${g}, ${b} CMYK: ${c}, ${m}, ${y}, ${k}`;
    chip.addEventListener('mouseenter', (e) => {
      showProbeFromEvent(e, idx, `${schemeSelect.value} class ${idx + 1}`);
    });
    chip.addEventListener('mousemove', (e) => {
      probe.style.left = `${e.clientX + 10}px`;
      probe.style.top = `${e.clientY + 10}px`;
    });
    chip.addEventListener('mouseleave', () => {
      probe.style.display = 'none';
    });

    item.appendChild(chip);

    const label = document.createElement('span');
    label.textContent = formatRangeLabel(range);
    item.appendChild(label);

    legend.appendChild(item);
  });
}

function updateExports() {
  const scheme = schemeSelect.value;
  const num = parseInt(classesSelect.value, 10);
  exportAse.href = `../version2/export/ase/${scheme}_${num}.ase`;
  exportAse.download = `${scheme}_${num}.ase`;
  exportGpl.href = `../version2/export/gpl/${scheme}_${num}.gpl`;
  exportGpl.download = `${scheme}_${num}.gpl`;

  const lines = colors
    .map((rgbString, i) => {
      const rgb = rgbArray(rgbString);
      return `${i} ${rgb[0]} ${rgb[1]} ${rgb[2]} 255`;
    })
    .join('\n') + '\n';

  const blob = new Blob([lines], { type: 'text/plain' });
  if (exportClr.href && exportClr.href.startsWith('blob:')) {
    URL.revokeObjectURL(exportClr.href);
  }
  exportClr.href = URL.createObjectURL(blob);
  exportClr.download = `${scheme}_${num}.clr`;
}

copyJsBtn.addEventListener('click', () => {
  const text = JSON.stringify(colors.map(toHex));
  exportText.value = text;
  navigator.clipboard.writeText(text);
});

copyCssBtn.addEventListener('click', () => {
  const lines = colors.map((c, i) => `--color-${i + 1}: ${toHex(c)};`);
  const text = `:root {\n  ${lines.join('\n  ')}\n}`;
  exportText.value = text;
  navigator.clipboard.writeText(text);
});

function redraw() {
  if (!data) return;
  computeBreaks();
  updateSchemeInfo();

  if (geo) geo.remove();
  geo = L.geoJson(data, { style: styleFeature, onEachFeature }).addTo(map);

  updateLegend();
  updateExports();
}

function loadData() {
  const url = layerSelect.value === 'counties' ? 'data/us-counties.json' : 'data/us-states.json';
  fetch(url)
    .then((resp) => {
      if (!resp.ok) throw new Error(`GeoJSON not found: ${url}`);
      return resp.json();
    })
    .then((json) => {
      data = json;
      redraw();
    })
    .catch((err) => {
      console.error(err);
      alert(`Could not load ${url}. Please add the file to the data folder.`);
    });
}

schemeSelect.addEventListener('change', redraw);
classesSelect.addEventListener('change', redraw);
modeSelect.addEventListener('change', redraw);
reverseCheck.addEventListener('change', redraw);
layerSelect.addEventListener('change', loadData);

// Initial load
updateSchemeInfo();
loadData();
