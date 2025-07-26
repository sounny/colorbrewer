const map = L.map('map').setView([37.8, -96], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const schemeSelect = document.getElementById('scheme');
const classesSelect = document.getElementById('classes');

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
    function styleFeature(feature) {
      const selected = schemeSelect.value || 'YlGn';
      const num = parseInt(classesSelect.value, 10) || 3;
      const values = data.features.map(f => f.properties.density);
      const sorted = values.slice().sort((a,b)=>a-b);
      const breaks = [];
      for(let i=1;i<num;i++) breaks.push(sorted[Math.floor(i*values.length/num)]);
      function getColor(d){
        const colors = seq[selected][num];
        for(let i=num-1;i>0;i--){ if(d>=breaks[i-1]) return colors[i]; }
        return colors[0];
      }
      return {
        weight:1,
        color:'white',
        fillColor: getColor(feature.properties.density),
        fillOpacity:0.7
      };
    }

    function redraw(){
      if(geo) geo.remove();
      geo = L.geoJson(data, {style: styleFeature}).addTo(map);
    }

    schemeSelect.addEventListener('change', redraw);
    classesSelect.addEventListener('change', redraw);
    redraw();
  });
