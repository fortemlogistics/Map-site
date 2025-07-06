console.log("✅ script.js loaded");

const map = L.map('map').setView([13.41, 122.56], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Marker clustering
const markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);

// Warehouse color store
const warehouseColors = {};
function getColorForWarehouse(id) {
  if (!warehouseColors[id]) {
    warehouseColors[id] = '#' + Math.floor(Math.random() * 16777215).toString(16);
  }
  return warehouseColors[id];
}

// Icon generator (truck or warehouse)
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

// Timestamp formatter
function getCurrentTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-PH', {
    month: 'numeric', day: 'numeric', year: '2-digit',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  });
}

// CSV Upload and Parsing
document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      markerClusterGroup.clearLayers();
      const timestamp = getCurrentTimestamp();
      const data = results.data;

      // ✅ First loop: Assign colors to all warehouses by label (e.g., M01)
      data.forEach(row => {
        const { type, label } = row;
        if (type === 'warehouse' && label) {
          getColorForWarehouse(label.trim());
        }
      });

      // ✅ Second loop: Place markers with consistent warehouse-based colors
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
          color = getColorForWarehouse(label.trim());
          iconType = 'fa-warehouse';
        } else {
          color = getColorForWarehouse(originWarehouseId.trim());
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

