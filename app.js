// ✅ Firebase config
console.log("Script loaded");
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
const auth = firebase.auth();

// ✅ Signup
document.getElementById("signupBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userData = {
        email: user.email,
        uid: user.uid,
        method: "email",
        createdAt: new Date().toISOString()
      };
      database.ref("users/" + user.uid).set(userData);
      alert("Signup successful!");
      window.location.href = "map.html";
    })
    .catch((error) => {
      alert("Signup Error: " + error.message);
    });
});

// ✅ Signin
document.getElementById("signinBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login successful!");
      window.location.href = "map.html";
    })
    .catch((error) => {
      alert("Login Error: " + error.message);
    });
});

// ✅ Google Login
document.getElementById("googleBtn").addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      const userData = {
        email: user.email,
        uid: user.uid,
        method: "google",
        createdAt: new Date().toISOString()
      };
      database.ref("users/" + user.uid).set(userData);
      alert("Google Login successful!");
      window.location.href = "map.html";
    })
    .catch((error) => {
      alert("Google Login Error: " + error.message);
    });
});
