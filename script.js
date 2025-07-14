document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([13.41, 122.56], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const markerClusterGroup = L.markerClusterGroup({
    iconCreateFunction: function (cluster) {
      const markers = cluster.getAllChildMarkers();
      let color = '#999';

      if (markers.length > 0) {
        const icon = markers[0].options.icon;
        const colorMatch = icon.options.html.match(/color:(.*?);/);
        if (colorMatch) {
          color = colorMatch[1].trim();
        }
      }

      return L.divIcon({
        html: `<div style="
          background-color: ${color};
          color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          line-height: 40px;
          text-align: center;
          font-size: 16px;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        ">${cluster.getChildCount()}</div>`,
        className: 'custom-cluster-icon',
        iconSize: [40, 40]
      });
    }
  });

  map.addLayer(markerClusterGroup);

  const warehouseColors = {
    'L07': 'blue',
    'L08': 'red',
    'L10': 'green',
    'V01': 'orange',
    'V02': 'pink',
    'V03': 'purple',
    'M03': 'yellow',
    'M01': 'black',
    'M04': 'gray'
  };

  function getColor(id) {
    const key = (id || '').trim().toUpperCase();
    return warehouseColors[key] || '#999';
  }

  function createIcon(iconType, color) {
    return L.divIcon({
      html: `<div style="color:${color}; font-size:30px;"><i class="fas ${iconType}"></i></div>`,
      className: 'custom-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }

  function getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleString('en-PH', {
      month: 'numeric', day: 'numeric', year: '2-digit',
      hour: 'numeric', minute: '2-digit',
      hour12: true
    });
  }

  let analyticsDataAvailable = false;

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

          let color = getColor(originWarehouseId);
          let iconType = (type || '').trim().toLowerCase() === 'warehouse' ? 'fa-warehouse' : 'fa-truck';

          const popup = type.trim().toLowerCase() === 'warehouse'
            ? `<b>${label}</b>`
            : `
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

        updateAnalytics(data);
        analyticsDataAvailable = true;
      }
    });
  });

  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = '<strong>Warehouse Colors</strong><br>';
    for (const [id, color] of Object.entries(warehouseColors)) {
      div.innerHTML += `
        <i style="background:${color}; width:12px; height:12px; display:inline-block; margin-right:6px; border-radius:50%;"></i>
        ${id}<br>`;
    }
    return div;
  };
  legend.addTo(map);

  // ✅ Analytics toggle
window.toggleAnalytics = function () {
    const banner = document.getElementById('analytics-banner');
    banner.classList.toggle('hidden');
};

window.toggleImport = function () {
    const container = document.getElementById('import-container');
    container.classList.toggle('hidden');
};

function updateAnalytics(data) {
    const banner = document.getElementById('analytics-banner');
    banner.classList.add('hidden'); // <-- Force it to stay hidden after upload

    const content = document.getElementById('analytics-content');
    const warehouseCount = new Set();
    let truckCount = 0;
    let trailer = 0;
    let cargo = 0;

    data.forEach(row => {
        const type = (row.type || '').toLowerCase();
        if (type === 'warehouse') warehouseCount.add(row.originWarehouseId);
        if (type === 'rating') {
            truckCount++;
            const vehicle = (row.vehicleType || '').toUpperCase();
            if (vehicle === 'TRAILER') trailer++;
            if (vehicle === 'CARGO') cargo++;
        }
    });

    content.innerHTML = `
        <h2>Fortem Cement Logistics</h2>
        <strong>Map Analytics</strong><br>
        Total Warehouses: ${warehouseCount.size}<br>
        Total Trucks/Rates: ${truckCount}<br><br>
        <strong>Vehicle Types</strong><br>
        Cargo: ${cargo}<br>
        Trailer: ${trailer}<br>
    `;
}

});
