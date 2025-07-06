document.addEventListener("DOMContentLoaded", () => {
  const map = L.map('map').setView([13.41, 122.56], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
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
    'M01': 'black'
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

        updateAnalytics(data);
      }
    });
  });

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
    <button onclick="toggleAnalytics()" style="padding: 6px; font-size: 14px;">📊 Analytics</button>
    <div id="analytics-box" style="display: none; background: white; padding: 8px; margin-top: 6px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.3); font-size: 13px;"></div>
  `;
  return div;
};
analyticsToggleControl.addTo(map);

  // Set toggle functionality
 window.toggleAnalytics = function () {
  const box = document.getElementById('analytics-box');
  if (box) {
    if (box.innerHTML.trim() !== '') {
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    } else {
      alert("Please upload a CSV file to view analytics.");
    }
  }
};


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
    }
  }

  // Optional: stub functions for UI buttons
  window.toggleAnalytics = function () {
    const box = document.getElementById('analytics-box');
    if (box) {
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    }
  }

  window.toggleFilters = () => alert("Toggle Filters clicked.");
  window.toggleImport = () => alert("Toggle Import/Update clicked.");
  window.exportAllData = () => alert("Export All Data clicked.");
  window.showHelp = () => alert("Help clicked.");
});
