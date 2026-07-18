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

  let globalCSVData = []; 

  document.getElementById('csv-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().replace(/\r/g, ''),
      complete: function (results) {
        globalCSVData = results.data;
        
        // Reset filter selection to All when importing a new file
        if (document.getElementById('map-filter')) {
          document.getElementById('map-filter').value = 'ALL';
        }
        
        renderMapLayers(globalCSVData);
        updateAnalytics(globalCSVData);

        // Automatically hide the import container after successful upload
        const container = document.getElementById('import-container');
        if (container) {
          container.classList.add('hidden');
        }
      }
    });
  });

  // Main rendering processor handling vehicle type or warehouse filtering
  function renderMapLayers(data, filterValue = 'ALL') {
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

      const isWarehouse = (type || '').trim().toLowerCase() === 'warehouse';
      const rowWarehouseId = (originWarehouseId || '').trim().toUpperCase();
      const vehicle = (vehicleType || '').toUpperCase().trim();

      // 1. WAREHOUSE FILTER LOGIC
      if (filterValue.startsWith('W_')) {
        const targetWarehouse = filterValue.replace('W_', '');
        
        // If it's a warehouse row, only show the selected one
        if (isWarehouse && rowWarehouseId !== targetWarehouse) return;
        
        // If it's a truck row, only show trucks originating from that warehouse
        if (!isWarehouse && rowWarehouseId !== targetWarehouse) return;
      }

      // 2. VEHICLE TYPE FILTER LOGIC
      if (!isWarehouse && filterValue.startsWith('V_')) {
        const vehicleFilter = filterValue.replace('V_', '');
        if (vehicleFilter === 'CARGO' && !vehicle.includes('CARGO') && vehicle !== '') return;
        if (vehicleFilter === 'TRAILER' && !vehicle.includes('TRAILER')) return;
        if (vehicleFilter === 'ELF' && !vehicle.includes('ELF')) return;
        if (vehicleFilter === 'BULK' && !vehicle.includes('BULK')) return;
        if (vehicleFilter === 'FORWARD' && !vehicle.includes('FORWARD')) return;
      }

      let color = getColor(originWarehouseId);
      let iconType = 'fa-truck';
      let cargoBadge = ''; 

      if (isWarehouse) {
        iconType = 'fa-warehouse';
      } else {
        if (vehicle.includes('TRAILER')) {
          cargoBadge = '<span class="cargo-badge cargo-text-badge">Trailer</span>';
        } else if (vehicle.includes('BULK')) { 
          cargoBadge = '<span class="cargo-badge cargo-text-badge">Bulk Truck</span>';
        } else if (vehicle.includes('FORWARD')) { 
          cargoBadge = '<span class="cargo-badge cargo-text-badge">Forward</span>';
        } else if (vehicle.includes('ELF')) {
          cargoBadge = '<span class="cargo-badge cargo-text-badge">Elf</span>';
        } else if (vehicle.includes('CARGO') || vehicle === '') { 
          cargoBadge = '<span class="cargo-badge cargo-text-badge">Cargo</span>';
        }
      }

      const popup = isWarehouse
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
  }

  // Triggered when dropdown selection updates
  window.applyMapFilter = function(selectedValue) {
    if (!selectedValue || selectedValue === 'IGNORE') return;
    if (globalCSVData.length === 0) return;
    renderMapLayers(globalCSVData, selectedValue);
  };

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
            <div>🚛 TRAILER 40 (20 Sling or 40 Jumbo)</div>
            <div>📦 18-20 CRATES (Plywood)</div>
            <div>⬜ 10-13 CRATES (Cement Board)</div>
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
    let elf = 0;
    let bulk = 0;
    let forward = 0;

    data.forEach(row => {
        const rowType = (row.type || '').trim().toLowerCase();
        const warehouseId = (row.originWarehouseId || '').trim().toUpperCase();
        
        // Filters out the head office L00 from counts
        if (rowType === 'warehouse' && warehouseId !== 'L00') {
            warehouseCount.add(row.originWarehouseId);
        } else if (rowType !== 'warehouse') {
            truckCount++;
            const vehicle = (row.vehicleType || '').toUpperCase().trim();
            
            if (vehicle.includes('TRAILER')) trailer++;
            else if (vehicle.includes('ELF')) elf++;
            else if (vehicle.includes('BULK')) bulk++;
            else if (vehicle.includes('FORWARD')) forward++;
            else if (vehicle.includes('CARGO') || vehicle === '') cargo++;
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
        Elf: ${elf}<br>
        Bulk Truck: ${bulk}<br>
        Forward: ${forward}<br>
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
