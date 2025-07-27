// Initialize map
const map = L.map('map').setView([37.8, -96], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Control elements
const schemeSelect = document.getElementById('scheme');
const classesSelect = document.getElementById('classes');
// Initialize map
const map = L.map('map').setView([37.8, -96], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Control elements
const schemeSelect = document.getElementById('scheme');
const classesSelect = document.getElementById('classes');
const layerSelect = document.getElementById('layer');
const legend = document.getElementById('legend');
const probe = document.getElementById('probe');

// State
let data, geo;
let breaks = [], colors = [];

// Populate color scheme dropdown
const seq = colorbrewer;
for (const name of Object.keys(seq)) {
  const opt = document.createElement('option');
  opt.value = name;
  opt.textContent = name;
  schemeSelect.appendChild(opt);
}

// Utilities
const rgbArray = str => str.match(/\d+/g).map(Number);
const toHex = rgb => {
  const [r, g, b] = rgbArray(rgb);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

// Compute classification breaks and colors
function computeBreaks() {
  const scheme = schemeSelect.value || 'YlGn';
  const num = parseInt(classesSelect.value) || 3;
  colors = seq[scheme][num];
  const values = data.features.map(f => f.properties.density);
  const sorted = values.slice().sort((a, b) => a - b);
  breaks = [];
  for (let i = 1; i < num; i++) {
    breaks.push(sorted[Math.floor(i * sorted.length / num)]);
  }
}

// Determine class index for a feature value
function getClassIndex(d) {
  const num = parseInt(classesSelect.value) || 3;
  for (let i = num - 1; i > 0; i--) {
    if (d >= breaks[i - 1]) return i;
  }
  return 0;
}

// Style each feature
function styleFeature(feature) {
  const idx = getClassIndex(feature.properties.density);
  return { weight: 1, color: 'white', fillColor: colors[idx], fillOpacity: 0.7 };
}

// Show probe with color info
function showProbe(e, idx) {
  const rgb = colors[idx];
  const hex = toHex(rgb);
  const [r, g, b] = rgbArray(rgb);
  probe.innerHTML = `<p>Class ${idx + 1}<br/>HEX: ${hex}<br/>RGB: ${r}, ${g}, ${b}</p>`;
  probe.style.left = e.originalEvent.clientX + 10 + 'px';
  probe.style.top = e.originalEvent.clientY + 10 + 'px';
  probe.style.display = 'block';
}

// Attach events to features
function onEachFeature(feature, layer) {
  const idx = getClassIndex(feature.properties.density);
  layer.on({
    mouseover(e) { layer.setStyle({ weight: 2 }); showProbe(e, idx); },
    mousemove(e) { showProbe(e, idx); },
    mouseout() { layer.setStyle({ weight: 1 }); probe.style.display = 'none'; }
  });
}

// Update legend UI
function updateLegend() {
  legend.innerHTML = '';
  colors.forEach((col, i) => {
    const chip = document.createElement('div');
    chip.className = 'legend-chip';
    chip.style.backgroundColor = col;
    chip.addEventListener('mouseenter', e => showProbe({ originalEvent: e }, i));
    chip.addEventListener('mousemove', e => showProbe({ originalEvent: e }, i));
    chip.addEventListener('mouseleave', () => { probe.style.display = 'none'; });
    legend.appendChild(chip);
  });
}

// Redraw map layer
function redraw() {
  computeBreaks();
  if (geo) geo.remove();
  geo = L.geoJson(data, { style: styleFeature, onEachFeature }).addTo(map);
  updateLegend();
}

// Load GeoJSON (states or counties) and render
function loadData() {
  const url = layerSelect.value === 'counties' ? 'data/us-counties.json' : 'data/us-states.json';
  fetch(url)
    .then(resp => { if (!resp.ok) throw new Error('Not found: ' + url); return resp.json(); })
    .then(json => { data = json; redraw(); })
    .catch(err => { console.error(err); alert('Could not load ' + url); });
}

// Event listeners
schemeSelect.addEventListener('change', redraw);
classesSelect.addEventListener('change', redraw);
layerSelect.addEventListener('change', loadData);

// Initial load
loadData();
const schemeSelect = document.getElementById('scheme');
const classesSelect = document.getElementById('classes');
const layerSelect = document.getElementById('layer');
const legend = document.getElementById('legend');
const probe = document.getElementById('probe');

// Data and style state
let data, geo;
let breaks = [], colors = [];

// Populate color scheme dropdown
const seq = colorbrewer;
Object.keys(seq).forEach(name => {
  const opt = document.createElement('option');
  opt.value = name;
  opt.textContent = name;
  schemeSelect.appendChild(opt);
});

// Utility: parse 'rgb(r, g, b)' to [r, g, b]
function rgbArray(str) {
  return str.match(/\d+/g).map(Number);
}

// Utility: convert 'r, g, b' string to hex
function toHex(rgb) {
  const [r, g, b] = rgbArray(rgb);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Compute classification breaks and corresponding colors
function computeBreaks() {
  const scheme = schemeSelect.value || 'YlGn';
  const num = parseInt(classesSelect.value) || 3;
  colors = seq[scheme][num];
  const values = data.features.map(f => f.properties.density);
  const sorted = values.slice().sort((a, b) => a - b);
  breaks = [];
  for (let i = 1; i < num; i++) {
    breaks.push(sorted[Math.floor(i * sorted.length / num)]);
  }
}

// Determine class index for a given value
function getClassIndex(d) {
  const num = parseInt(classesSelect.value) || 3;
  for (let i = num - 1; i > 0; i--) {
    if (d >= breaks[i - 1]) return i;
  }
  return 0;
}

// Style each geoJSON feature
function styleFeature(feature) {
  const idx = getClassIndex(feature.properties.density);
  return { weight: 1, color: 'white', fillColor: colors[idx], fillOpacity: 0.7 };
}

// Show interactive probe with color info
function showProbe(e, idx) {
  const rgb = colors[idx];
  const hex = toHex(rgb);
  const [r, g, b] = rgbArray(rgb);
  probe.innerHTML = `<p>Class ${idx + 1}<br/>HEX: ${hex}<br/>RGB: ${r}, ${g}, ${b}</p>`;
  probe.style.left = e.originalEvent.clientX + 10 + 'px';
  probe.style.top = e.originalEvent.clientY + 10 + 'px';
  probe.style.display = 'block';
}

// Attach interaction events to each layer feature
function onEachFeature(feature, layer) {
  const idx = getClassIndex(feature.properties.density);
  layer.on({
    mouseover(e) { layer.setStyle({ weight: 2 }); showProbe(e, idx); },
    mousemove(e) { showProbe(e, idx); },
    mouseout() { layer.setStyle({ weight: 1 }); probe.style.display = 'none'; }
  });
}

// Build legend UI
function updateLegend() {
  legend.innerHTML = '';
  colors.forEach((col, i) => {
    const chip = document.createElement('div');
    chip.className = 'legend-chip';
    chip.style.backgroundColor = col;
    chip.addEventListener('mouseenter', e => showProbe({ originalEvent: e }, i));
    chip.addEventListener('mousemove', e => showProbe({ originalEvent: e }, i));
    chip.addEventListener('mouseleave', () => { probe.style.display = 'none'; });
    legend.appendChild(chip);
  });
}

// Render map with current settings
function redraw() {
  computeBreaks();
  if (geo) geo.remove();
  geo = L.geoJson(data, { style: styleFeature, onEachFeature }).addTo(map);
  updateLegend();
}

// Load GeoJSON for states or counties
function loadData() {
  const url = layerSelect.value === 'counties' ? 'data/us-counties.json' : 'data/us-states.json';
  fetch(url)
    .then(resp => { if (!resp.ok) throw new Error('Not found: ' + url); return resp.json(); })
    .then(json => { data = json; redraw(); })
    .catch(err => { console.error(err); alert('Could not load ' + url); });
}

// Event listeners
schemeSelect.addEventListener('change', redraw);
classesSelect.addEventListener('change', redraw);
layerSelect.addEventListener('change', loadData);

// Kick off initial load
loadData();
// Initialize Leaflet map
const map = L.map('map').setView([37.8, -96], 4);
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

// Data and style state
let data, geo;
let breaks = [], colors = [];

// ColorBrewer schemes
const seq = colorbrewer;
Object.keys(seq).forEach(name => {
  const opt = document.createElement('option');
  opt.value = name;
  opt.textContent = name;
  schemeSelect.appendChild(opt);
});

// Utility functions
function rgbArray(str) {
  return str.match(/\d+/g).map(Number);
}

function toHex(rgb) {
  const [r, g, b] = rgbArray(rgb);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Compute classification breaks
function computeBreaks() {
  const scheme = schemeSelect.value || 'YlGn';
  const num = parseInt(classesSelect.value) || 3;
  colors = seq[scheme][num];
  const values = data.features.map(f => f.properties.density);
  const sorted = values.slice().sort((a, b) => a - b);
  breaks = [];
  for (let i = 1; i < num; i++) {
    breaks.push(sorted[Math.floor(i * sorted.length / num)]);
  }
}

// Determine class index by value
function getClassIndex(d) {
  const num = parseInt(classesSelect.value) || 3;
  for (let i = num - 1; i > 0; i--) {
    if (d >= breaks[i - 1]) return i;
  }
  return 0;
}

// Style features
function styleFeature(feature) {
  const idx = getClassIndex(feature.properties.density);
  return {
    weight: 1,
    color: 'white',
    fillColor: colors[idx],
    fillOpacity: 0.7
  };
}

// Show color info probe
function showProbe(e, idx) {
  const rgb = colors[idx];
  const hex = toHex(rgb);
  const [r, g, b] = rgbArray(rgb);
  probe.innerHTML = `<p>Class ${idx + 1}<br/>HEX: ${hex}<br/>RGB: ${r}, ${g}, ${b}</p>`;
  probe.style.left = e.originalEvent.clientX + 10 + 'px';
  probe.style.top = e.originalEvent.clientY + 10 + 'px';
  probe.style.display = 'block';
}

// Attach events to each feature
function onEachFeature(feature, layer) {
  const idx = getClassIndex(feature.properties.density);
  layer.on({
    mouseover(e) {
      layer.setStyle({ weight: 2 });
      showProbe(e, idx);
    },
    mousemove(e) {
      showProbe(e, idx);
    },
    mouseout() {
      layer.setStyle({ weight: 1 });
      probe.style.display = 'none';
    }
  });
}

// Update legend display
function updateLegend() {
  legend.innerHTML = '';
  colors.forEach((col, i) => {
    const chip = document.createElement('div');
    chip.className = 'legend-chip';
    chip.style.backgroundColor = col;
    chip.addEventListener('mouseenter', e => showProbe({ originalEvent: e }, i));
    chip.addEventListener('mousemove', e => showProbe({ originalEvent: e }, i));
    chip.addEventListener('mouseleave', () => probe.style.display = 'none');
    legend.appendChild(chip);
  });
}

// Redraw map layer
function redraw() {
  computeBreaks();
  if (geo) geo.remove();
  geo = L.geoJson(data, { style: styleFeature, onEachFeature }).addTo(map);
  updateLegend();
}

// Load selected geoJSON layer and render
function loadData() {
  const url = layerSelect.value === 'counties' ? 'data/us-counties.json' : 'data/us-states.json';
  fetch(url)
    .then(resp => {
      if (!resp.ok) throw new Error('GeoJSON not found: ' + url);
      return resp.json();
    })
    .then(json => {
      data = json;
      redraw();
    })
    .catch(err => {
      console.error(err);
      alert('Could not load ' + url + '.');
    });
}

// Event listeners and initial load
schemeSelect.addEventListener('change', redraw);
classesSelect.addEventListener('change', redraw);
layerSelect.addEventListener('change', loadData);
const schemeNames = Object.keys(seq);

schemeNames.forEach(n => {
  const opt = document.createElement('option');
  opt.textContent = n;
  schemeSelect.appendChild(opt);
});

// Shared data and map layer
let data, geo;
let breaks = [], colors = [];

// Utility functions
function rgbArray(str) {
  return str.match(/\d+/g).map(Number);
}

function toHex(str) {
  const [r, g, b] = rgbArray(str);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2,'0')).join('');
}

function computeBreaks() {
  const selected = schemeSelect.value || 'YlGn';
  const num = parseInt(classesSelect.value, 10) || 3;
  colors = seq[selected][num];
  const values = data.features.map(f => f.properties.density);
  const sorted = values.slice().sort((a, b) => a - b);
  breaks = [];
  for (let i = 1; i < num; i++) {
    breaks.push(sorted[Math.floor(i * values.length / num)]);
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
  const color = colors[idx];
  const [r, g, b] = rgbArray(color);
  probe.innerHTML = `<p>${schemeSelect.value} class ${idx+1}<br/>HEX: ${toHex(color)}<br/>RGB: ${r}, ${g}, ${b}</p>`;
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
  colors.forEach(col => {
    const chip = document.createElement('div');
    chip.className = 'legend-chip';
    chip.style.backgroundColor = col;
    chip.addEventListener('mouseenter', e => {
      const [r, g, b] = rgbArray(col);
      probe.innerHTML = `<p>HEX: ${toHex(col)}<br/>RGB: ${r}, ${g}, ${b}</p>`;
      probe.style.left = (e.clientX + 10) + 'px';
      probe.style.top = (e.clientY + 10) + 'px';
      probe.style.display = 'block';
    });
    chip.addEventListener('mousemove', e => {
      probe.style.left = (e.clientX + 10) + 'px';
      probe.style.top = (e.clientY + 10) + 'px';
    });
    chip.addEventListener('mouseleave', () => { probe.style.display = 'none'; });
    legend.appendChild(chip);
  });
}

function redraw() {
  computeBreaks();
  if (geo) geo.remove();
  geo = L.geoJson(data, { style: styleFeature, onEachFeature }).addTo(map);
  updateLegend();
}

// Load and render selected geoJSON layer
function loadData() {
  const url = layerSelect.value === 'counties' ? 'data/us-counties.json' : 'data/us-states.json';
  fetch(url)
    .then(resp => {
      if (!resp.ok) throw new Error('GeoJSON not found: ' + url);
      return resp.json();
    })
    .then(json => {
      data = json;
      redraw();
    })
    .catch(err => {
      console.error(err);
      alert('Could not load ' + url + '. Please add the file to the data folder.');
    });
}

// Wire up controls
schemeSelect.addEventListener('change', redraw);
classesSelect.addEventListener('change', redraw);
layerSelect.addEventListener('change', loadData);

// Initial load
loadData();
