// Firebase SDKs
document.write('<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js"><\/script>');

// Initialize after delay to ensure Firebase loads
window.addEventListener("load", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBGJUmD9rYtKNnUKGXasJRs57UyrHVq-6Q",
    authDomain: "bachelor-party-mk.firebaseapp.com",
    databaseURL: "https://bachelor-party-mk-default-rtdb.firebaseio.com",
    projectId: "bachelor-party-mk",
    storageBucket: "bachelor-party-mk.appspot.com",
    messagingSenderId: "588727020923",
    appId: "1:588727020923:web:d742c916c707ee101d21de"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // Claim bed handler
  window.claimBed = function (button) {
    const parent = button.closest(".bed-option");
    const id = parent.dataset.id;
    const name = prompt("Enter your name to claim this bed:");
    if (!name) return;

    db.ref("claims/" + id).set(name)
      .then(() => {
        parent.classList.add("claimed");
        parent.innerHTML = `<p>Claimed by ${name}</p>`;
      })
      .catch((error) => {
        console.error("Error saving claim:", error);
        alert("Something went wrong claiming this bed. Please try again.");
      });
  };

  function loadClaims() {
    db.ref("claims").on("value", (snapshot) => {
      const claims = snapshot.val() || {};
      document.querySelectorAll(".bed-option").forEach((div) => {
        const id = div.dataset.id;
        if (claims[id]) {
          div.classList.add("claimed");
          div.innerHTML = `<p>Claimed by ${claims[id]}</p>`;
        }
      });
    });
  }

  loadClaims(); // ← Now it actually works
});
// Firebase SDKs
document.write('<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js"><\/script>');

// Initialize after delay to ensure Firebase loads
window.addEventListener("load", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBGJUmD9rYtKNnUKGXasJRs57UyrHVq-6Q",
    authDomain: "bachelor-party-mk.firebaseapp.com",
    databaseURL: "https://bachelor-party-mk-default-rtdb.firebaseio.com",
    projectId: "bachelor-party-mk",
    storageBucket: "bachelor-party-mk.appspot.com",
    messagingSenderId: "588727020923",
    appId: "1:588727020923:web:d742c916c707ee101d21de"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // Claim bed handler
  window.claimBed = function (button) {
    const parent = button.closest(".bed-option");
    const id = parent.dataset.id;
    const name = prompt("Enter your name to claim this bed:");
    if (!name) return;

    db.ref("claims/" + id).set(name)
      .then(() => {
        parent.classList.add("claimed");
        parent.innerHTML = `<p>Claimed by ${name}</p>`;
      })
      .catch((error) => {
        console.error("Error saving claim:", error);
        alert("Something went wrong claiming this bed. Please try again.");
      });
  };

  function loadClaims() {
    db.ref("claims").on("value", (snapshot) => {
      const claims = snapshot.val() || {};
      document.querySelectorAll(".bed-option").forEach((div) => {
        const id = div.dataset.id;
        if (claims[id]) {
          div.classList.add("claimed");
          div.innerHTML = `<p>Claimed by ${claims[id]}</p>`;
        }
      });
    });
  }

  loadClaims(); // ← Now it actually works
});
