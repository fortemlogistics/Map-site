// Initialize the map centered over the Philippines
const map = L.map('map').setView([13.41, 122.56], 6);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Sales data per location
const salesData = {
  "Manila": { coords: [14.5995, 120.9842], sales: 15000 },
  "Cebu": { coords: [10.3157, 123.8854], sales: 9800 },
  "Davao": { coords: [7.1907, 125.4553], sales: 7500 },
  "Baguio": { coords: [16.4023, 120.5960], sales: 6200 }
};

// Add markers with sales info
for (const city in salesData) {
  const data = salesData[city];
  L.marker(data.coords).addTo(map)
    .bindPopup(`<b>${city}</b><br>Sales: ₱${data.sales.toLocaleString()}`);
}
