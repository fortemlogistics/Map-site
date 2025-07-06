const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Cluster group
const markerClusterGroup = L.markerClusterGroup().addTo(map);

// Assign unique colors to each warehouse
const warehouseColors = {};
function getColorForWarehouse(id) {
  if (!warehouseColors[id]) {
    warehouseColors[id] = '#' + Math.floor(Math.random() * 16777215).toString(16);
  }
  return warehouseColors[id];
}

// Create a custom icon with color and icon class
function createIcon(iconClass, color) {
  return L.divIcon({
    html: `<i class="fa-solid ${iconClass}" style="color:${color}; font-size:20px;"></i>`,
    iconSize: [25, 25],
    className: 'custom-marker'
  });
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

      if (isNaN(lat) || isNaN(lng)) continue;

      let color = '#3388ff';
      let iconClass = 'fa-box'; // default to warehouse

      if (type === 'warehouse') {
        color = getColorForWarehouse(label);
        iconClass = 'fa-warehouse';
      } else if (originId) {
        color = getColorForWarehouse(originId);
        iconClass = 'fa-truck';
      }

      const marker = L.marker([lat, lng], {
        icon: createIcon(iconClass, color)
      }).bindPopup(`<b>${type.toUpperCase()}</b><br>${label}`);

      markerClusterGroup.addLayer(marker);
    }
  };

  reader.readAsText(file);
});

