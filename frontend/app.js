// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let map ; 
let marker ;
 
function initMap(){
    map = new google.maps.Map(document.getElementById("map")),{
        zoom : 16 ,
        center: {lat : 0 , lng : 0}
    }
}

marker = new google.maps.Marker({
    position : {lat : 0 , lng :0},
    map : map,
    title : 'Bus Location '
})

  const busRef = database.ref("bus1");
  busRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const newLatLng = new google.maps.LatLng(data.latitude, data.longitude);
      marker.setPosition(newLatLng);
      map.setCenter(newLatLng);
    }
  });