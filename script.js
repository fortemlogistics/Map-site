console.log("✅ script.js loaded");

const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);

// 🎨 Fixed warehouse color assignments
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

// 🟢 Get color from warehouse ID
function getColor(id) {
  const key = (id || '').trim().toUpperCase();
  return warehouseColors[key] || '#999';
}

// 🛠️ Create map icon
function createIcon(iconType, color) {
  return L.divIcon({
    html: `<div style="color:${color}; font-size:30px;"><i class="fas ${iconType}"></i></div>`,
    className: 'custom-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

// ⏰ Format timestamp
function getCurrentTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-PH', {
    month: 'numeric', day: 'numeric', year: '2-digit',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  });
}

// 📦 Handle CSV upload
document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  transformHeader: h => h.trim().replace(/\r/g, ''),
  complete: function (results) {
    const data = results.data;
    const timestamp = getCurrentTimestamp();

    markerClusterGroup.clearLayers();
    plotData(data);             // <- You probably have this
    updateAnalytics(data);      // ✅ Add this line to update the analytics content

    allData = allData.concat(data); // If you're tracking all uploaded data
  }
});

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

        const cleanType = (type || '').trim().toLowerCase();
        const originId = (originWarehouseId || '').trim().toUpperCase();

        if (cleanType === 'warehouse') {
          color = getColor(originId);
          iconType = 'fa-warehouse';
        } else {
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
    }
  });
});

// 🗺️ Add legend
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

const analyticsToggleControl = L.control({ position: 'bottomleft' });
analyticsToggleControl.onAdd = function () {
  const div = L.DomUtil.create('div', 'analytics-toggle');
  div.innerHTML = `
    <button id="toggle-analytics" style="padding: 6px; font-size: 14px;">📊 Analytics</button>
    <div id="analytics-box" style="display: none; background: white; padding: 8px; margin-top: 6px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.3); font-size: 13px;"></div>
  `;
  return div;
};
analyticsToggleControl.addTo(map);


document.addEventListener('DOMContentLoaded', () => {
  const analyticsBtn = document.getElementById('toggle-analytics');
  if (analyticsBtn) {
    analyticsBtn.addEventListener('click', () => {
      const box = document.getElementById('analytics-box');
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });
  }
});

function updateAnalytics(data) {
  console.log('✅ updateAnalytics called. Data rows:', data.length);  // DEBUG LINE

  const warehouseCount = new Set();
  let truckCount = 0;
  let trailer = 0;
  let cargo = 0;

  data.forEach(row => {
    const type = (row.type || '').toLowerCase();
    if (type === 'warehouse') warehouseCount.add(row.originWarehouseId);
    if (type === 'rating') {
      truckCount++;
      const vType = (row.vehicleType || '').toUpperCase();
      if (vType === 'TRAILER') trailer++;
      if (vType === 'CARGO') cargo++;
    }
  });

  const hasLinks = truckCount > 0;

  const analyticsBox = document.getElementById('analytics-box');
  if (analyticsBox) {
    analyticsBox.innerHTML = `
      <strong>📊 Map Analytics</strong><br>
      Total Warehouses: ${warehouseCount.size}<br>
      Total Trucks/Rates: ${truckCount}<br><br>

      <strong>🏭 Warehouse Details</strong><br>
      ${hasLinks ? 'Warehouses linked to trucks/rates available.' : 'No trucks/rates linked to warehouses yet.'}<br><br>

      <strong>🚚 Vehicle Types</strong><br>
      CARGO: ${cargo}<br>
      TRAILER: ${trailer}<br>
    `;
  } else {
    console.warn('⚠️ #analytics-box not found in DOM.');
  }
}

  const hasLinks = truckCount > 0;

  document.getElementById('analytics-box').innerHTML = `
    <strong>📊 Map Analytics</strong><br>
    Total Warehouses: ${warehouseCount.size}<br>
    Total Trucks/Rates: ${truckCount}<br><br>

    <strong>🏭 Warehouse Details</strong><br>
    ${hasLinks ? 'Warehouses linked to trucks/rates available.' : 'No trucks/rates linked to warehouses yet.'}<br><br>

    <strong>🚚 Vehicle Types</strong><br>
    CARGO: ${cargo}<br>
    TRAILER: ${trailer}<br>
  `;
}
