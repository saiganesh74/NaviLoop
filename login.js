// login.js
document.getElementById("signupPageBtn").addEventListener("click", () => {
  window.location.href = "signup.html";
});

document.getElementById("signinBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login successful!");
      window.location.href = "map.html";
    })
    .catch((error) => {
      console.error("Login Error:", error.message);
      alert("Login Error: " + error.message);
    });
});

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
