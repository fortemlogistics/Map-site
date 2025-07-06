const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Marker clustering
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

// Custom icon generator
function createIcon(iconType, color) {
  return L.divIcon({
    html: `<div style="color:${color}; font-size:30px;">
             <i class="fas ${iconType}"></i>
           </div>`,
    className: 'custom-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    markerClusterGroup.clearLayers();
    const lines = reader.result.trim().split('\n');
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx]?.trim();
      });

      const {
        lat, lng, label, type, originWarehouseId,
        destination, rateValue, quantityMT, vehicleType
      } = row;

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      if (isNaN(latitude) || isNaN(longitude)) continue;

      let color = '#999';
      let iconType = 'fa-box'; // default

      if (type === 'warehouse') {
        color = getColorForWarehouse(label);
        iconType = 'fa-warehouse';
      } else {
        color = getColorForWarehouse(originWarehouseId);
        iconType = 'fa-truck';
      }

      const popup = `
        <b>${label}</b><br>
        Destination: ${destination || 'N/A'}<br>
        Price: ${rateValue || 'N/A'}<br>
        Quantity (MT): ${quantityMT || 'N/A'}<br>
        Vehicle: ${vehicleType || 'N/A'}
      `;

      const marker = L.marker([latitude, longitude], {
        icon: createIcon(iconType, color)
      }).bindPopup(popup);

      markerClusterGroup.addLayer(marker);
    }
  };

  reader.readAsText(file);
});
