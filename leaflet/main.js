const map = L.map('map').setView([37.8, -96], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const schemeSelect = document.getElementById('scheme');
const classesSelect = document.getElementById('classes');
const legend = document.getElementById('legend');
const probe = document.getElementById('probe');

const seq = colorbrewer;
const schemeNames = Object.keys(seq);

schemeNames.forEach(n => {
  const opt = document.createElement('option');
  opt.textContent = n;
  schemeSelect.appendChild(opt);
});

fetch('data/us-states.json')
  .then(resp => resp.json())
  .then(data => {
    let geo;
    let breaks = [];
    let colors = [];

    function rgbArray(str){
      return str.match(/\d+/g).map(Number);
    }
    function toHex(str){
      const [r,g,b] = rgbArray(str);
      return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
    }

    function computeBreaks(){
      const selected = schemeSelect.value || 'YlGn';
      const num = parseInt(classesSelect.value, 10) || 3;
      colors = seq[selected][num];
      const values = data.features.map(f => f.properties.density);
      const sorted = values.slice().sort((a,b)=>a-b);
      breaks = [];
      for(let i=1;i<num;i++) breaks.push(sorted[Math.floor(i*values.length/num)]);
    }

    function getClassIndex(d){
      const num = parseInt(classesSelect.value, 10) || 3;
      for(let i=num-1;i>0;i--){ if(d>=breaks[i-1]) return i; }
      return 0;
    }

    function styleFeature(feature) {
      const idx = getClassIndex(feature.properties.density);
      return {
        weight:1,
        color:'white',
        fillColor: colors[idx],
        fillOpacity:0.7
      };
    }

    function showProbeFromEvent(e, idx){
      const color = colors[idx];
      const [r,g,b] = rgbArray(color);
      probe.innerHTML = `<p>${schemeSelect.value} class ${idx+1}<br/>HEX: ${toHex(color)}<br/>RGB: ${r}, ${g}, ${b}</p>`;
      probe.style.left = (e.clientX + 10) + 'px';
      probe.style.top = (e.clientY + 10) + 'px';
      probe.style.display = 'block';
    }

    function onEachFeature(feature, layer){
      const idx = getClassIndex(feature.properties.density);
      layer.on({
        mouseover(e){
          layer.setStyle({weight:2});
          showProbeFromEvent(e.originalEvent, idx);
        },
        mousemove(e){
          showProbeFromEvent(e.originalEvent, idx);
        },
        mouseout(){
          layer.setStyle({weight:1});
          probe.style.display = 'none';
        }
      });
    }

    function updateLegend(){
      legend.innerHTML = '';
      colors.forEach(col => {
        const chip = document.createElement('div');
        chip.className = 'legend-chip';
        chip.style.backgroundColor = col;
        chip.addEventListener('mouseenter', e => {
          const [r,g,b] = rgbArray(col);
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

    function redraw(){
      computeBreaks();
      if(geo) geo.remove();
      geo = L.geoJson(data, {style: styleFeature, onEachFeature}).addTo(map);
      updateLegend();
    }

    schemeSelect.addEventListener('change', redraw);
    classesSelect.addEventListener('change', redraw);
    redraw();
  });
