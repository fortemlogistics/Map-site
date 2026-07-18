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
    'L02': 'brown', 
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

  function createIcon(iconType, color, cargoBadge = '') {
    return L.divIcon({
      html: `
        <div style="color:${color}; font-size:30px; text-shadow: 0 0 3px rgba(0,0,0,0.8); position: relative;">
          <i class="fas ${iconType}"></i>
          ${cargoBadge}
        </div>
      `,
      className: 'custom-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
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
          let iconType = 'fa-truck';
          let cargoBadge = ''; 

          if ((type || '').trim().toLowerCase() === 'warehouse') {
            iconType = 'fa-warehouse';
          } else {
            const vehicle = (vehicleType || '').toUpperCase().trim();
            const dest = (destination || '').toUpperCase().trim();
            
            if (vehicle.includes('TRAILER')) {
              cargoBadge = '<span class="cargo-badge">TR</span>';
            } else if (vehicle.includes('PLYWOOD') || dest.includes('PLYWOOD')) {
              cargoBadge = '<span class="cargo-badge">PW</span>';
            } else if (vehicle.includes('CEMENT') || dest.includes('CEMENT')) {
              cargoBadge = '<span class="cargo-badge">CB</span>';
            }
          }

          const popup = type.trim().toLowerCase() === 'warehouse'
            ? `<b>${label}</b>`
            : `
              <b>${label}</b><br>
              Destination: ${destination || 'N/A'}<br>
              Price: ${rateValue || 'N/A'}<br>
              Quantity (MT): ${quantityMT || 'N/A'}<br>
              Vehicle: ${vehicleType || 'N/A'}<br>
            `;

          const marker = L.marker([latitude, longitude], {
            icon: createIcon(iconType, color, cargoBadge)
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
    const div = L.DomUtil.create('div', 'legend-container');
    div.innerHTML = `
        <div class="legend-column">
            <strong>Warehouse Colors</strong>
            ${Object.entries(warehouseColors).map(([id, color]) => `
                <div class="legend-row" onclick="navigateToWarehouse('${id}')" style="cursor: pointer;">
                    <i style="background:${color};"></i> ${id}
                </div>
            `).join('')}
        </div>
        <div class="legend-column">
            <strong>Capacity</strong>
            <div><span class="cargo-badge" style="position:static; display:inline-block; margin-right:5px;">TR</span> 🚛 TRAILER 40 (20 Sling or 40 Jumbo)</div>
            <div><span class="cargo-badge" style="position:static; display:inline-block; margin-right:5px;">PW</span> 📦 18-20 CRATES (Plywood)</div>
            <div><span class="cargo-badge" style="position:static; display:inline-block; margin-right:5px;">CB</span> ⬜ 10-13 CRATES (Cement Board)</div>
        </div>
    `;
    return div;
  };
  legend.addTo(map);

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
    banner.classList.add('hidden'); 

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

  window.navigateToWarehouse = function(warehouseId) {
    let foundMarker = null;

    markerClusterGroup.eachLayer(marker => {
        if (marker.getPopup() && marker.getPopup().getContent().includes(warehouseId)) {
            foundMarker = marker;
        }
    });

    if (foundMarker) {
        const latLng = foundMarker.getLatLng();
        map.flyTo(latLng, 15, {
            animate: true,
            duration: 1.5 
        });
        
        setTimeout(() => {
            markerClusterGroup.zoomToShowLayer(foundMarker, () => {
                foundMarker.openPopup();
            });
        }, 1500);
    } else {
        alert(`Warehouse ${warehouseId} location not found on the map. Make sure your CSV data is imported.`);
    }
  };
});
