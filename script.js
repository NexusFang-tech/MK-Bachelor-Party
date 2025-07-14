// Firebase config and init
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

// Countdown
function updateCountdown() {
  const timer = document.getElementById("countdown-timer");
  if (!timer) return;

  const target = new Date("2025-09-12T10:30:00");
  const now = new Date();
  const diff = target - now;

  if (diff <= 0) {
    timer.textContent = "Party Time!";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  timer.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Claim bed
function claimBed(button) {
  const parent = button.closest(".bed-option");
  const id = parent.dataset.id;
  const name = prompt("Enter your name to claim this bed:");
  if (!name) return;

  db.ref("claims/" + id).set(name);
}

// Load claims from Firebase
function loadClaims() {
  db.ref("claims").on("value", snapshot => {
    const claims = snapshot.val() || {};

    document.querySelectorAll(".bed-option").forEach(div => {
      const id = div.dataset.id;

      if (claims[id]) {
        div.classList.add("claimed");
        div.innerHTML = `<p>Claimed by ${claims[id]}</p>`;
      }
    });
  });
}

// Assign global access for inline onclick
window.claimBed = claimBed;

// Initialize features on load
window.onload = () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);
  loadClaims();
};
