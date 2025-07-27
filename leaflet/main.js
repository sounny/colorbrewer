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

// Shared data and style state
let data, geo;
let breaks = [], colors = [];

// Populate color scheme options
const seq = colorbrewer;
Object.keys(seq).forEach(name => {
  const opt = document.createElement('option');
  opt.value = name;
  opt.textContent = name;
  schemeSelect.appendChild(opt);
});

// Utility helpers
function rgbArray(str) {
  return str.match(/\d+/g).map(Number);
}

function toHex(str) {
  const [r, g, b] = rgbArray(str);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function computeBreaks() {
  const scheme = schemeSelect.value || 'YlGn';
  const num = parseInt(classesSelect.value, 10) || 3;
  colors = seq[scheme][num];
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
  const col = colors[idx];
  const [r, g, b] = rgbArray(col);
  probe.innerHTML = `<p>${schemeSelect.value} class ${idx + 1}<br/>HEX: ${toHex(col)}<br/>RGB: ${r}, ${g}, ${b}</p>`;
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
loadData();
