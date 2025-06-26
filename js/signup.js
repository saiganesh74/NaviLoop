const firebaseConfig = {
  apiKey: "AIzaSyDRqdgXPnn1tiqKOreGOcyJifbEuyy_TdI",
  authDomain: "naviloop-test.firebaseapp.com",
  databaseURL: "https://naviloop-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "naviloop-test",
  storageBucket: "naviloop-test.appspot.com",
  messagingSenderId: "116376630309",
  appId: "1:116376630309:web:e7f9365947502ace11bbcc",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

document.getElementById("signupBtn").addEventListener("click", () => {
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!email || !password) {
    alert("Please fill all fields.");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userData = {
        email: user.email,
        uid: user.uid,
        method: "email",
        createdAt: new Date().toISOString()
      };
      db.ref("users/" + user.uid).set(userData);
      alert("Signup successful!");
      window.location.href = "map.html";
    })
    .catch((error) => {
      alert("Signup Error: " + error.message);
    });
});
