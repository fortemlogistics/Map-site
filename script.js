const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Add cluster group to the map
const markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);

// Unique colors per warehouse
const warehouseColors = {};

function getColorForWarehouse(id) {
  if (!warehouseColors[id]) {
    warehouseColors[id] = '#' + Math.floor(Math.random() * 16777215).toString(16);
  }
  return warehouseColors[id];
}

// Create a colored icon using Font Awesome
function createIcon(iconType, color) {
  return L.divIcon({
    html: `<div style="color:${color}; font-size:22px;">
             <i class="fas ${iconType}"></i>
           </div>`,
    className: 'custom-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    markerClusterGroup.clearLayers(); // clear old markers
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
      const label = row.label;
      const type = row.type;
      const originId = row.originWarehouseId;

      if (isNaN(lat) || isNaN(lng)) continue;

      // Set color and icon
      let color = '#999';
      let iconType = 'fa-box'; // fallback icon

      if (type === 'warehouse') {
        color = getColorForWarehouse(label);
        iconType = 'fa-warehouse';
      } else {
        color = getColorForWarehouse(originId);
        iconType = 'fa-truck';
      }

      const marker = L.marker([lat, lng], {
        icon: createIcon(iconType, color)
      }).bindPopup(`<b>${type.toUpperCase()}</b><br>${label}`);

      markerClusterGroup.addLayer(marker);
    }
  };

  reader.readAsText(file);
});


