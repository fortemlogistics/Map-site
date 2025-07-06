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

const warehouseFilter = L.control({ position: 'topright' });
warehouseFilter.onAdd = function () {
  const div = L.DomUtil.create('div', 'filter-control');
  div.innerHTML = `<select id="warehouse-select"><option value="all">All Warehouses</option></select>`;
  return div;
};
warehouseFilter.addTo(map);

// 2. Add date range filter (optional based on CSV structure)
const dateFilter = L.control({ position: 'topright' });
dateFilter.onAdd = function () {
  const div = L.DomUtil.create('div', 'date-filter');
  div.innerHTML = `
    <input type="date" id="start-date" />
    <input type="date" id="end-date" />
  `;
  return div;
};
dateFilter.addTo(map);

// 3. Export map to image
const exportBtn = L.control({ position: 'topleft' });
exportBtn.onAdd = function () {
  const div = L.DomUtil.create('div', 'export-btn');
  div.innerHTML = `<button onclick="exportMap()">🖼 Export Map</button>`;
  return div;
};
exportBtn.addTo(map);

function exportMap() {
  html2canvas(document.getElementById('map')).then(canvas => {
    const link = document.createElement('a');
    link.download = 'map.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}

// 4. Support multiple CSV uploads
let allData = [];
document.getElementById('csv-file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      allData = allData.concat(results.data);
      plotData(allData);
    }
  });
});

// 5. Add Analytics
const analyticsControl = L.control({ position: 'bottomleft' });
analyticsControl.onAdd = function () {
  const div = L.DomUtil.create('div', 'analytics');
  div.id = 'analytics-box';
  return div;
};
analyticsControl.addTo(map);

function updateAnalytics(data) {
  const warehouseCount = new Set();
  let truckCount = 0;
  let trailer = 0;
  let cargo = 0;

  data.forEach(row => {
    const type = (row.type || '').toLowerCase();
    if (type === 'warehouse') warehouseCount.add(row.originWarehouseId);
    if (type === 'rating') {
      truckCount++;
      if ((row.vehicleType || '').toUpperCase() === 'TRAILER') trailer++;
      if ((row.vehicleType || '').toUpperCase() === 'CARGO') cargo++;
    }
  });

  document.getElementById('analytics-box').innerHTML = `
    <strong>Map Analytics</strong><br>
    Total Warehouses: ${warehouseCount.size}<br>
    Total Trucks/Rates: ${truckCount}<br><br>
    <strong>Vehicle Types</strong><br>
    CARGO: ${cargo}<br>
    TRAILER: ${trailer}<br>
  `;
}

const toggleFilterControl = L.control({ position: 'topright' });
toggleFilterControl.onAdd = function () {
  const div = L.DomUtil.create('div', 'toggle-control');
  div.innerHTML = `
    <label style="background: white; padding: 4px; display: block;">
      <input type="checkbox" id="toggle-filters" checked />
      Show Filters
    </label>
  `;
  return div;
};
toggleFilterControl.addTo(map);

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-filters');
  toggle.addEventListener('change', function () {
    const filterControls = document.querySelectorAll('.filter-control, .date-filter');
    filterControls.forEach(el => {
      el.style.display = this.checked ? 'block' : 'none';
    });
  });
});