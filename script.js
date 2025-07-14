// Firebase config and init
const firebaseConfig = {
  apiKey: "AIzaSyBGJUmD9rYtKNnUKGXasJRs57UyrHVq-6Q",
  authDomain: "bachelor-party-mk.firebaseapp.com",
  projectId: "bachelor-party-mk",
  storageBucket: "bachelor-party-mk.appspot.com",
  messagingSenderId: "588727020923",
  appId: "1:588727020923:web:d742c916c707ee101d21de",
  measurementId: "G-1BH6QYVDKG",
  databaseURL: "https://bachelor-party-mk-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// On window load
window.onload = function () {
  updateCountdown();
  setInterval(updateCountdown, 1000);

  loadClaims();
  loadVotes();
  loadShopping();
  loadGolf();
  loadGolfVotes();
  displayCigars();
  loadOtherActivities();
  if (document.getElementById("map")) initMap();
};

// Countdown
function updateCountdown() {
  const target = new Date("2025-09-12T10:30:00");
  const now = new Date();
  const diff = target - now;
  const timer = document.getElementById("countdown-timer");
  if (!timer) return;

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

// Bedroom Claiming
function claimBed(button) {
  const parent = button.closest(".bed-option");
  const id = parent.dataset.id;
  const name = prompt("Enter your name to claim this bed:");
  if (!name) return;

  parent.classList.add("claimed");
  parent.innerHTML = `<p>Claimed by ${name}</p>`;

  db.ref("claims/" + id).set(name);
}

window.claimBed = claimBed;

function loadClaims() {
  db.ref("claims").on("value", (snap) => {
    const claims = snap.val() || {};
    document.querySelectorAll(".bed-option").forEach((div) => {
      const id = div.dataset.id;
      if (claims[id]) {
        div.classList.add("claimed");
        div.innerHTML = `<p>Claimed by ${claims[id]}</p>`;
      }
    });
  });
}

// Brewery Voting
async function submitVotes() {
  const form = document.getElementById("brewery-form");
  const selected = Array.from(form.querySelectorAll("input:checked")).map(cb => cb.value);
  const snap = await db.ref("breweryVotes").get();
  const votes = snap.val() || {};
  selected.forEach(b => votes[b] = (votes[b] || 0) + 1);
  await db.ref("breweryVotes").set(votes);
  form.reset();
}

function loadVotes() {
  displayVotes();
}

function displayVotes() {
  const container = document.getElementById("vote-results");
  if (!container) return;
  db.ref("breweryVotes").on("value", snap => {
    const votes = snap.val() || {};
    container.innerHTML = `<h3>Current Votes:</h3><ul>${Object.entries(votes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li>${k}: ${v} votes</li>`).join("")}</ul>`;
  });
}

// Interactive Map
function initMap() {
  const map = L.map("map").setView([35.5956, -82.5519], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  const breweries = [
    { name: "Wicked Weed Brewing", lat: 35.5933, lng: -82.5506 },
    { name: "Hi-Wire Brewing", lat: 35.5905, lng: -82.5538 },
    { name: "Burial Beer Co.", lat: 35.5896, lng: -82.5552 },
    { name: "Green Man Brewery", lat: 35.5913, lng: -82.5546 },
    { name: "Catawba Brewing Company", lat: 35.5899, lng: -82.5565 },
    { name: "One World Brewing", lat: 35.5954, lng: -82.5517 },
    { name: "Thirsty Monk Brewery", lat: 35.5947, lng: -82.551 },
    { name: "Asheville Brewing Company", lat: 35.5908, lng: -82.5549 },
    { name: "Twin Leaf Brewery", lat: 35.5892, lng: -82.5547 },
    { name: "Highland Brewing Downtown", lat: 35.5951, lng: -82.552 }
  ];

  breweries.forEach(b => L.marker([b.lat, b.lng]).addTo(map).bindPopup(b.name));

  L.marker([35.5948, -82.5512]).addTo(map).bindPopup("Pack Square Garage (Start/End)");
}

function planRoute() {
  db.ref("breweryVotes").get().then(snap => {
    const votes = snap.val() || {};
    const order = [
      "One World Brewing", "Thirsty Monk Brewery", "Highland Brewing Downtown",
      "Wicked Weed Brewing", "Asheville Brewing Company", "Hi-Wire Brewing",
      "Green Man Brewery", "Twin Leaf Brewery", "Burial Beer Co.", "Catawba Brewing Company"
    ];
    const selected = Object.entries(votes).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const route = order.filter(b => selected.includes(b));
    const url = `https://www.google.com/maps/dir/?api=1&origin=Pack+Square+Garage,Asheville,NC&destination=Pack+Square+Garage,Asheville,NC&waypoints=${route.map(r => encodeURIComponent(`${r}, Asheville, NC`)).join("|")}&travelmode=walking`;
    window.open(url, "_blank");
  });
}

// Shopping List
async function addItem() {
  const input = document.getElementById("new-item");
  if (!input.value) return;
  const snap = await db.ref("shopping").get();
  const items = snap.val() || [];
  items.push(input.value);
  await db.ref("shopping").set(items);
  input.value = "";
}

function loadShopping() {
  const ul = document.getElementById("shopping-list");
  if (!ul) return;
  db.ref("shopping").on("value", snap => {
    ul.innerHTML = "";
    (snap.val() || []).forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
  });
}

// Golf
async function addGolf() {
  const input = document.getElementById("new-golf");
  if (!input.value) return;
  const snap = await db.ref("golf").get();
  const list = snap.val() || [];
  list.push(input.value);
  await db.ref("golf").set(list);
  input.value = "";
}

function loadGolf() {
  const ul = document.getElementById("golf-list");
  if (!ul) return;
  db.ref("golf").on("value", snap => {
    ul.innerHTML = "";
    (snap.val() || []).forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
  });
}

async function submitGolfVotes() {
  const form = document.getElementById("golf-form");
  const selected = Array.from(form.querySelectorAll("input:checked")).map(cb => cb.value);
  const snap = await db.ref("golfVotes").get();
  const votes = snap.val() || {};
  selected.forEach(v => votes[v] = (votes[v] || 0) + 1);
  await db.ref("golfVotes").set(votes);
  form.reset();
}

function loadGolfVotes() {
  const container = document.getElementById("golf-vote-results");
  if (!container) return;
  db.ref("golfVotes").on("value", snap => {
    const votes = snap.val() || {};
    container.innerHTML = `<h3>Current Golf Votes:</h3><ul>${Object.entries(votes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li>${k}: ${v} votes</li>`).join("")}</ul>`;
  });
}

// Cigars
async function submitCigars() {
  const form = document.getElementById("cigars-form");
  const choice = form.querySelector("input[name='cigars']:checked")?.value;
  const name = document.getElementById("cigars-name").value.trim();
  const count = choice === "yes" ? document.getElementById("cigars-count").value : "";

  if (!name) return alert("Please enter your name!");

  const snap = await db.ref("cigarsPrefs").get();
  const prefs = snap.val() || [];
  prefs.push({ name, choice, count });
  await db.ref("cigarsPrefs").set(prefs);
  form.reset();
}

function displayCigars() {
  const ul = document.getElementById("cigars-list");
  if (!ul) return;
  db.ref("cigarsPrefs").on("value", snap => {
    ul.innerHTML = "";
    (snap.val() || []).forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${p.name}: ${p.choice === "yes" ? `Yes, ${p.count} cigars` : "No thanks"}`;
      ul.appendChild(li);
    });
  });
}

// Other Activities
async function addActivity() {
  const input = document.getElementById("new-activity");
  if (!input.value) return;
  const snap = await db.ref("otherActivities").get();
  const acts = snap.val() || [];
  acts.push(input.value);
  await db.ref("otherActivities").set(acts);
  input.value = "";
}

function loadOtherActivities() {
  const ul = document.getElementById("activity-list");
  if (!ul) return;
  db.ref("otherActivities").on("value", snap => {
    ul.innerHTML = "";
    (snap.val() || []).forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
  });
  displayOtherVotes();
}

async function submitOtherVotes() {
  const form = document.getElementById("other-activities-form");
  const selected = Array.from(form.querySelectorAll("input:checked")).map(cb => cb.value);
  const snap = await db.ref("otherVotes").get();
  const votes = snap.val() || {};
  selected.forEach(v => votes[v] = (votes[v] || 0) + 1);
  await db.ref("otherVotes").set(votes);
  form.reset();
}

function displayOtherVotes() {
  const div = document.getElementById("other-vote-results");
  if (!div) return;
  db.ref("otherVotes").on("value", snap => {
    const votes = snap.val() || {};
    div.innerHTML = `<h3>Current Votes:</h3><ul>${Object.entries(votes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li>${k}: ${v} votes</li>`).join("")}</ul>`;
  });
}
