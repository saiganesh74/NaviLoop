// firebase-config.js
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
