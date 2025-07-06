console.log("✅ script.js loaded");

const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);

// ✅ Define fixed warehouse colors
const warehouseColors = {
  'L07': 'blue',
  'L08': 'red',
  'L10': 'green',
  'V01': 'orange',
  'V02': 'pink',
  'V03': 'purple',
  'M03': 'yellow',
  'M01': 'black'
};

// ✅ Get color from warehouse ID
function getColor(id) {
  const key = (id || '').trim().toUpperCase();
  return warehouseColors[key] || '#999';
}

// ✅ Create map icon
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

// ✅ Format current PH timestamp
function getCurrentTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-PH', {
    month: 'numeric', day: 'numeric', year: '2-digit',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  });
}

// ✅ Upload CSV and render map
document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim().replace(/\r/g, ''),
    complete: function (results) {
      const data = results.data;
      const timestamp = getCurrentTimestamp();
      markerClusterGroup.clearLayers();

      console.log("✅ CSV Loaded", data);

      data.forEach(row => {
        const {
          lat, lng, label, type,
          originWarehouseId, destination,
          rateValue, quantityMT, vehicleType
        } = row;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (isNaN(latitude) || isNaN(longitude)) return;

        let color = '#999';
        let iconType = 'fa-box';

        if ((type || '').trim().toLowerCase() === 'warehouse') {
          const warehouseId = (originWarehouseId || '').trim().toUpperCase();
          color = getColor(warehouseId);
          iconType = 'fa-warehouse';
        } else {
          const originId = (originWarehouseId || '').trim().toUpperCase();
          color = getColor(originId);
          iconType = 'fa-truck';
        }

        const popup = `
          <b>${label}</b><br>
          Destination: ${destination || 'N/A'}<br>
          Price: ${rateValue || 'N/A'}<br>
          Quantity (MT): ${quantityMT || 'N/A'}<br>
          Vehicle: ${vehicleType || 'N/A'}<br>
          Created: ${timestamp}<br>
          Updated: ${timestamp}
        `;

        const marker = L.marker([latitude, longitude], {
          icon: createIcon(iconType, color)
        }).bindPopup(popup);

        markerClusterGroup.addLayer(marker);
      });
    },
    error: function (err) {
      console.error("❌ Error parsing CSV:", err);
    }
  });
});

// ✅ Add color legend to map
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = '<strong>📦 Warehouse Colors</strong><br>';
  for (const [id, color] of Object.entries(warehouseColors)) {
    div.innerHTML += `
      <i style="background:${color}; width:12px; height:12px; display:inline-block; margin-right:6px; border-radius:50%;"></i>
      ${id}<br>`;
  }
  return div;
};
legend.addTo(map);

