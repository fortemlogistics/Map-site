console.log("✅ script.js loaded");

const map = L.map('map').setView([13.41, 122.56], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Marker clustering
const markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);

// Store warehouse colors
const warehouseColors = {};

// Assign and return a consistent color for a warehouse ID
function getColorForWarehouse(rawId) {
  const id = (rawId || '').trim().toUpperCase(); // Normalize key
  if (!warehouseColors[id]) {
    warehouseColors[id] = '#' + Math.floor(Math.random() * 16777215).toString(16);
  }
  return warehouseColors[id];
}

// Create truck or warehouse icon
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

// Format timestamp
function getCurrentTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-PH', {
    month: 'numeric', day: 'numeric', year: '2-digit',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  });
}

// Handle file upload
document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      markerClusterGroup.clearLayers();
      const timestamp = getCurrentTimestamp();
      const data = results.data;

      // 1️⃣ First: assign color to all warehouse labels
      data.forEach(row => {
        const { type, label } = row;
        if (type === 'warehouse' && label) {
          getColorForWarehouse(label);
        }
      });

      // 2️⃣ Second: create markers for all rows
      data.forEach(row => {
        const {
          lat, lng, label, type, originWarehouseId,
          destination, rateValue, quantityMT, vehicleType
        } = row;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (isNaN(latitude) || isNaN(longitude)) return;

        let color = '#999';
        let iconType = 'fa-box'; // fallback

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
          Vehicle: ${vehicleType || 'N/A'}<br>
          Created: ${timestamp}<br>
          Updated: ${timestamp}
        `;

        const marker = L.marker([latitude, longitude], {
          icon: createIcon(iconType, color)
        }).bindPopup(popup);

        markerClusterGroup.addLayer(marker);
      });
    }
  });
});
