const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const warehouseColors = {};

function getColorForWarehouse(id) {
  if (!warehouseColors[id]) {
    warehouseColors[id] = '#' + Math.floor(Math.random() * 16777215).toString(16);
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
        row[h.trim()] = values[idx]?.trim();
      });

      const lat = parseFloat(row.lat);
      const lng = parseFloat(row.lng);
      const type = row.type;
      const label = row.label;
      const originId = row.originWarehouseId;

      if (isNaN(lat) || isNaN(lng)) continue; // Skip invalid rows

      let color = '#3388ff'; // default blue

      if (type === 'warehouse') {
        color = getColorForWarehouse(label);
      } else if (originId) {
        color = getColorForWarehouse(originId);
      }

      const radius = type === 'warehouse' ? 10 : 6;

      L.circleMarker([lat, lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.8
      })
      .addTo(map)
      .bindPopup(`<b>${type.toUpperCase()}</b><br>${label}`);
    }
  };

  reader.readAsText(file);
});
