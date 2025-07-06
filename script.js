console.log("✅ script.js loaded");

const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);

// Store warehouse colors
const warehouseColors = {};

// Assign and return color by warehouse ID (normalized)
function assignColorForWarehouse(id) {
  const key = (id || '').trim().toUpperCase();
  if (!warehouseColors[key]) {
    warehouseColors[key] = '#' + Math.floor(Math.random() * 16777215).toString(16);
  }
  return warehouseColors[key];
}

// Get already assigned color
function getColor(id) {
  return warehouseColors[(id || '').trim().toUpperCase()] || '#999';
}

// Create icon for map
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

// Get current timestamp
function getCurrentTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-PH', {
    month: 'numeric', day: 'numeric', year: '2-digit',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  });
}

// File upload
document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      markerClusterGroup.clearLayers();
      const timestamp = getCurrentTimestamp();
      const data = results.data;

      // Step 1: Assign colors to each warehouse label
      data.forEach(row => {
        if (row.type === 'warehouse' && row.label) {
          assignColorForWarehouse(row.label);
        }
      });

      // Step 2: Place markers for all rows
      data.forEach(row => {
        const {
          lat, lng, label, type, originWarehouseId,
          destination, rateValue, quantityMT, vehicleType
        } = row;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (isNaN(latitude) || isNaN(longitude)) return;

        let color = '#999';
        let iconType = 'fa-box';

        if (type === 'warehouse') {
          color = getColor(label);
          iconType = 'fa-warehouse';
        } else {
          color = getColor(originWarehouseId);
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
