// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDRqdgXPnn1tiqKOreGOcyJifbEuyy_TdI",
  authDomain: "naviloop-test.firebaseapp.com",
  databaseURL: "https://naviloop-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "naviloop-test",
  storageBucket: "naviloop-test.firebasestorage.app",
  messagingSenderId: "116376630309",
  appId: "1:116376630309:web:e7f9365947502ace11bbcc",
  measurementId: "G-M6HD0F04CE"
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ✅ Initialize Leaflet Map (Centered on Hyderabad)
const map = L.map('map').setView([17.3850, 78.4867], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ✅ Bus Icon (optional custom marker)
const busIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61205.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// ✅ Initialize Marker
let marker = L.marker([17.3850, 78.4867], { icon: busIcon }).addTo(map)
  .bindPopup('Bus Location')
  .openPopup();

// ✅ Listen to Firebase for updates
const busRef = database.ref("bus1");
busRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (data && data.latitude && data.longitude) {
    const newLatLng = [data.latitude, data.longitude];
    marker.setLatLng(newLatLng);
    map.setView(newLatLng);
  }
});
