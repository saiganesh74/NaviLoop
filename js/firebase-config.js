const firebaseConfig = {
  apiKey: "AIzaSyDRqdgXPnn1tiqKOreGOcyJifbEuyy_TdI",
  authDomain: "naviloop-test.firebaseapp.com",
  databaseURL: "https://naviloop-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "naviloop-test",
  storageBucket: "naviloop-test.firebasestorage.app",
  messagingSenderId: "116376630309",
  appId: "1:116376630309:web:e7f9365947502ace11bbcc"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
