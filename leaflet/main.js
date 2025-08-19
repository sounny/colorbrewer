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
const layerSelect = document.getElementById('layer');
const legend = document.getElementById('legend');
const probe = document.getElementById('probe');
const schemeInfo = document.getElementById('scheme-info');

// Shared data and style state
let data, geo;
let breaks = [], colors = [], ranges = [];
let minVal = 0, maxVal = 0;

// Populate color scheme options
const seq = colorbrewer;
const schemesByType = { seq: [], div: [], qual: [] };
Object.entries(seq).forEach(([name, val]) => {
  const t = val.properties?.type;
  if (schemesByType[t]) schemesByType[t].push(name);
});
const typeLabels = { seq: 'Sequential', div: 'Diverging', qual: 'Qualitative' };
Object.keys(typeLabels).forEach(t => {
  const group = document.createElement('optgroup');
  group.label = typeLabels[t];
  schemesByType[t].sort().forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    group.appendChild(opt);
  });
  schemeSelect.appendChild(group);
});

const typeDescriptions = {
  seq: 'Sequential schemes work for ordered data from low to high.',
  div: 'Diverging schemes emphasize deviation around a midpoint.',
  qual: 'Qualitative schemes highlight categorical differences.'
};

function updateSchemeInfo() {
  const t = seq[schemeSelect.value]?.properties?.type;
  schemeInfo.textContent = t ? typeDescriptions[t] : '';
}

// Utility helpers
function rgbArray(str) {
  return str.match(/\d+/g).map(Number);
}

function toHex(str) {
  const [r, g, b] = rgbArray(str);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function toCmyk(str) {
  const [r, g, b] = rgbArray(str).map(v => v / 255);
  const k = 1 - Math.max(r, g, b);
  const c = (1 - r - k) / (1 - k) || 0;
  const m = (1 - g - k) / (1 - k) || 0;
  const y = (1 - b - k) / (1 - k) || 0;
  return [c, m, y, k].map(x => Math.round(x * 100));
}

function computeBreaks() {
  const scheme = schemeSelect.value || 'YlGn';
  const num = parseInt(classesSelect.value, 10) || 3;
  colors = seq[scheme][num];
  const values = data.features.map(f => f.properties.density);
  minVal = Math.min(...values);
  maxVal = Math.max(...values);
  const sorted = values.slice().sort((a, b) => a - b);
  breaks = [];
  for (let i = 1; i < num; i++) {
    breaks.push(sorted[Math.floor(i * values.length / num)]);
  }
  ranges = [];
  for (let i = 0; i < num; i++) {
    const from = i === 0 ? minVal : breaks[i - 1];
    const to = i === num - 1 ? maxVal : breaks[i];
    ranges.push([from, to]);
  }
}

function getClassIndex(d) {
  const num = parseInt(classesSelect.value, 10) || 3;
  for (let i = num - 1; i > 0; i--) {
    if (d >= breaks[i - 1]) return i;
  }
  return 0;
}

function styleFeature(feature) {
  const idx = getClassIndex(feature.properties.density);
  return { weight: 1, color: 'white', fillColor: colors[idx], fillOpacity: 0.7 };
}

function showProbeFromEvent(e, idx) {
  const col = colors[idx];
  const [r, g, b] = rgbArray(col);
  const [c, m, y, k] = toCmyk(col);
  probe.innerHTML = `<p>${schemeSelect.value} class ${idx + 1}<br/>HEX: ${toHex(col)}<br/>RGB: ${r}, ${g}, ${b}<br/>CMYK: ${c}, ${m}, ${y}, ${k}</p>`;
  probe.style.left = (e.clientX + 10) + 'px';
  probe.style.top = (e.clientY + 10) + 'px';
  probe.style.display = 'block';
}

function onEachFeature(feature, layer) {
  const idx = getClassIndex(feature.properties.density);
  layer.on({
    mouseover(e) {
      layer.setStyle({ weight: 2 });
      showProbeFromEvent(e.originalEvent, idx);
    },
    mousemove(e) {
      showProbeFromEvent(e.originalEvent, idx);
    },
    mouseout() {
      layer.setStyle({ weight: 1 });
      probe.style.display = 'none';
    }
  });
}

function updateLegend() {
  legend.innerHTML = '';
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
    chip.addEventListener('mouseenter', e => {
      probe.innerHTML = `<p>HEX: ${toHex(col)}<br/>RGB: ${r}, ${g}, ${b}<br/>CMYK: ${c}, ${m}, ${y}, ${k}</p>`;
      probe.style.left = (e.clientX + 10) + 'px';
      probe.style.top = (e.clientY + 10) + 'px';
      probe.style.display = 'block';
    });
    chip.addEventListener('mousemove', e => {
      probe.style.left = (e.clientX + 10) + 'px';
      probe.style.top = (e.clientY + 10) + 'px';
    });
    chip.addEventListener('mouseleave', () => { probe.style.display = 'none'; });
    item.appendChild(chip);
    const label = document.createElement('span');
    label.textContent = `${range[0].toFixed(1)} – ${range[1].toFixed(1)}`;
    item.appendChild(label);
    legend.appendChild(item);
  });
}

function redraw() {
  computeBreaks();
  updateSchemeInfo();
  if (geo) geo.remove();
  geo = L.geoJson(data, { style: styleFeature, onEachFeature }).addTo(map);
  updateLegend();
}

function loadData() {
  const url = layerSelect.value === 'counties' ? 'data/us-counties.json' : 'data/us-states.json';
  fetch(url)
    .then(resp => {
      if (!resp.ok) throw new Error('GeoJSON not found: ' + url);
      return resp.json();
    })
    .then(json => { data = json; redraw(); })
    .catch(err => {
      console.error(err);
      alert('Could not load ' + url + '. Please add the file to the data folder.');
    });
}

schemeSelect.addEventListener('change', redraw);
classesSelect.addEventListener('change', redraw);
layerSelect.addEventListener('change', loadData);

// Initial load
updateSchemeInfo();
loadData();
