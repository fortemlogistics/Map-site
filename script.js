const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const warehouseColors = {};

function getColorForWarehouse(id) {
  if (!warehouseColors[id]) {
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    warehouseColors[id] = color;
  }
  return warehouseColors[id];
}

document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    const lines = reader.result.trim().split('\n');
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx].trim();
      });

      const { type, name, lat, lng, warehouse_id } = row;
      const color = getColorForWarehouse(warehouse_id);

      const markerOptions = {
        radius: type === 'warehouse' ? 10 : 6,
        color: color,
        fillColor: color,
        fillOpacity: 0.8
      };

      L.circleMarker([parseFloat(lat), parseFloat(lng)], markerOptions)
        .addTo(map)
        .bindPopup(`<b>${type.toUpperCase()}</b><br>${name}<br>Warehouse ID: ${warehouse_id}`);
    }
  };

  reader.readAsText(file);
});
