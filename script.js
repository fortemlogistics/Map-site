console.log("✅ script.js loaded");

const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);

// Fixed colors for specific warehouses
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

// Get color from warehouse ID
function getColor(id) {
  const key = (id || '').trim().toUpperCase();
  return warehouseColors[key] || '#999'; // default gray if unknown
}

// Create custom icon
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

// Format PH timestamp
function getCurrentTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-PH', {
    month: 'numeric', day: 'numeric', year: '2-digit',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  });
}

// Handle CSV upload
document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim().replace(/\r/g, ""), // clean \r characters
    complete: function (results) {
      markerClusterGroup.clearLayers();
      const timestamp = getCurrentTimestamp();
      const data = results.data;

      console.log("✅ Cleaned Headers:", Object.keys(data[0]));

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

// Add color legend
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
