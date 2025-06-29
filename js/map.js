// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDRqdgXPnn1tiqKOreGOcyJifbEuyy_TdI",
  authDomain: "naviloop-test.firebaseapp.com",
  databaseURL: "https://naviloop-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "naviloop-test",
  storageBucket: "naviloop-test.appspot.com",
  messagingSenderId: "116376630309",
  appId: "1:116376630309:web:e7f9365947502ace11bbcc"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ✅ Leaflet Map Initialization
const   map = L.map("map").setView([17.385044, 78.486671], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// ✅ Bus Marker
let busMarker = L.marker([17.385044, 78.486671])
  .addTo(map)
  .bindPopup("Bus Location");

// ✅ Realtime Bus Selector Logic
let currentBusRef = db.ref("bus1");
const selector = document.getElementById("busSelector");

function trackBus(busId) {
  if (currentBusRef) currentBusRef.off();
  currentBusRef = db.ref(busId);
  currentBusRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (data?.latitude && data?.longitude) {
      const latlng = [data.latitude, data.longitude];
      busMarker.setLatLng(latlng);
      map.setView(latlng, 14);
    }
  });
}

selector.addEventListener("change", () => {
  const selectedBus = selector.value;
  trackBus(selectedBus);
});

trackBus("bus1"); // default

//let userMarker;

if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const userIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      if (!userMarker) {
        userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
        userMarker.bindPopup("You are here").openPopup();
        map.setView([lat, lng], 15); // ✅ Center map on user
      } else {
        userMarker.setLatLng([lat, lng]); // ✅ Update on move
      }
    },
    (err) => {
      alert("Location access denied or unavailable.");
      console.error(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
} else {
  alert("Geolocation is not supported by your browser.");
}


// ✅ Hamburger Toggle
function toggleMenu() {
  document.getElementById("navbar").classList.toggle("show");
}

// ✅ Logout
function logout() {
  alert("Logging out...");
  window.location.href = "index.html";
}
