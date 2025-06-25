// signup.js
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

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
      console.error("Signup Error:", error.message);
      alert("Signup Error: " + error.message);
    });
});
