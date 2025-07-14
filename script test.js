const map = L.map('map').setView([13.41, 122.56], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const colors = {};
const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16);
const markers = L.markerClusterGroup();

function parseCSV(data) {
  const lines = data.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, key, i) => {
      obj[key] = values[i];
      return obj;
    }, {});
  });
}

function loadMap(data) {
  markers.clearLayers();
  const parsedData = parseCSV(data);

  parsedData.forEach(item => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lng);
    if (!lat || !lng) return;

    let color = colors[item.label];
    if (item.type === 'warehouse') {
      color = getRandomColor();
      colors[item.label] = color;
    } else if (item.type === 'truck') {
      color = colors[item.originWarehouseId];
    }

    const icon = L.divIcon({
      className: item.type === 'warehouse' ? 'warehouse-icon' : 'truck-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 48]
    });

    const marker = L.marker([lat, lng], { icon });
    let popup = `${item.label}`;
    if (item.type === 'truck') {
      popup = `<b>${item.label} TO ${item.destination}</b><br>
      Destination: ${item.destination}<br>
      Price: ${item.rateValue}<br>
      Quantity (MT): ${item.quantityMT}<br>
      Vehicle: ${item.vehicleType}<br>
      Created: 7/6/25, 10:59 PM<br>
      Updated: 7/6/25, 10:59 PM`;
    }
    marker.bindPopup(popup);
    markers.addLayer(marker);
  });

  map.addLayer(markers);
}

document.getElementById('csvUpload').addEventListener('change', function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    loadMap(event.target.result);
  };
  reader.readAsText(file);
});
