// script.js - Full code

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, get } from "firebase/database";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGJUmD9rYtKNnUKGXasJRs57UyrHVq-6Q",
  authDomain: "bachelor-party-mk.firebaseapp.com",
  projectId: "bachelor-party-mk",
  storageBucket: "bachelor-party-mk.firebasestorage.app",
  messagingSenderId: "588727020923",
  appId: "1:588727020923:web:d742c916c707ee101d21de",
  measurementId: "G-1BH6QYVDKG"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Load saved data on page load
window.onload = function () {
  loadClaims();
  loadVotes();
  loadShopping();
  loadGolf();
  if (document.getElementById("map")) initMap(); // Only init map if on activities page
  updateCountdown();
  setInterval(updateCountdown, 1000);
  loadGolfVotes();
  displayCigars(); // Added for cigars
  loadOtherActivities(); // Loads suggestions and votes
};

// Bedroom Claims
function claimBed(button) {
  const optionDiv = button.parentElement;
  const id = optionDiv.getAttribute("data-id");
  const name = prompt("Enter your name to claim this bed:");
  if (name) {
    optionDiv.classList.add("claimed");
    optionDiv.innerHTML = `<p>Claimed by ${name}</p>`; // Replace content with claimed message

    // Save to Firebase
    const claimsRef = ref(db, 'claims');
    get(claimsRef).then((snapshot) => {
      let claims = snapshot.val() || {};
      claims[id] = name;
      set(claimsRef, claims);
    }).catch((error) => {
      console.error("Error saving claim:", error);
    });
  }
}

function loadClaims() {
  const claimsRef = ref(db, 'claims');
  onValue(claimsRef, (snapshot) => {
    const claims = snapshot.val() || {};
    document.querySelectorAll(".bed-option").forEach((optionDiv) => {
      const id = optionDiv.getAttribute("data-id");
      if (claims[id]) {
        optionDiv.classList.add("claimed");
        optionDiv.innerHTML = `<p>Claimed by ${claims[id]}</p>`;
      }
    });
  });
}

// Brewery Votes
async function submitVotes() {
  const form = document.getElementById("brewery-form");
  const selected = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  if (selected.length > 0) {
    const votesRef = ref(db, 'breweryVotes');
    const snapshot = await get(votesRef);
    let votes = snapshot.val() || {};
    selected.forEach((brew) => {
      votes[brew] = (votes[brew] || 0) + 1;
    });
    await set(votesRef, votes);
    form.reset();
  }
}

function loadVotes() {
  displayVotes();
}

function displayVotes() {
  const resultsDiv = document.getElementById("vote-results");
  if (!resultsDiv) return; // Skip if not on page
  const votesRef = ref(db, 'breweryVotes');
  onValue(votesRef, (snapshot) => {
    const votes = snapshot.val() || {};
    let html = "<h3>Current Votes:</h3><ul>";
    Object.keys(votes)
      .sort((a, b) => votes[b] - votes[a])
      .forEach((brew) => {
        html += `<li>${brew}: ${votes[brew]} votes</li>`;
      });
    html += "</ul>";
    resultsDiv.innerHTML = html;
  });
}

// Interactive Map
function initMap() {
  const map = L.map("map").setView([35.5956, -82.5519], 15); // Center on downtown Asheville

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Brewery locations (approx lat/long from maps)
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
    { name: "Highland Brewing Downtown", lat: 35.5951, lng: -82.552 },
  ];

  breweries.forEach((brew) => {
    L.marker([brew.lat, brew.lng]).addTo(map).bindPopup(brew.name);
  });

  // Parking example (Pack Square Garage)
  L.marker([35.5948, -82.5512], {
    icon: L.icon({
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      iconSize: [25, 41],
    }),
  })
    .addTo(map)
    .bindPopup("Pack Square Parking Garage (Start/End Point)");
}

// Plan Route
function planRoute() {
  const votesRef = ref(db, 'breweryVotes');
  get(votesRef).then((snapshot) => {
    const votes = snapshot.val() || {};
    const selected = Object.keys(votes).sort((a, b) => votes[b] - votes[a]); // Sort by votes descending
    if (selected.length === 0) return alert("No votes yet!");

    // Approx order from parking (manual sort for walking route)
    const order = [
      "One World Brewing",
      "Thirsty Monk Brewery",
      "Highland Brewing Downtown",
      "Wicked Weed Brewing",
      "Asheville Brewing Company",
      "Hi-Wire Brewing",
      "Green Man Brewery",
      "Twin Leaf Brewery",
      "Burial Beer Co.",
      "Catawba Brewing Company",
    ];
    const sortedSelected = order.filter((name) => selected.includes(name));

    // Google Maps link (start/end at parking, waypoints for breweries)
    const parking = "Pack+Square+Garage,Asheville,NC";
    const waypoints = sortedSelected
      .map((name) => encodeURIComponent(name + ",Asheville,NC"))
      .join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${parking}&destination=${parking}&waypoints=${waypoints}&travelmode=walking`;
    window.open(url, "_blank");
  }).catch((error) => {
    console.error("Error planning route:", error);
  });
}

// Shopping List
async function addItem() {
  const input = document.getElementById("new-item");
  if (input && input.value) {
    const li = document.createElement("li");
    li.textContent = input.value;
    document.getElementById("shopping-list").appendChild(li);

    // Save to Firebase
    const shoppingRef = ref(db, 'shopping');
    const snapshot = await get(shoppingRef);
    let shopping = snapshot.val() || [];
    shopping.push(input.value);
    await set(shoppingRef, shopping);

    input.value = "";
  }
}

function loadShopping() {
  const list = document.getElementById("shopping-list");
  if (list) {
    const shoppingRef = ref(db, 'shopping');
    onValue(shoppingRef, (snapshot) => {
      const shopping = snapshot.val() || [];
      list.innerHTML = ""; // Clear and reload
      shopping.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
    });
  }
}

// Golf Suggestions
async function addGolf() {
  const input = document.getElementById("new-golf");
  if (input && input.value) {
    const li = document.createElement("li");
    li.textContent = input.value;
    document.getElementById("golf-list").appendChild(li);

    // Save to Firebase
    const golfRef = ref(db, 'golf');
    const snapshot = await get(golfRef);
    let golf = snapshot.val() || [];
    golf.push(input.value);
    await set(golfRef, golf);

    input.value = "";
  }
}

function loadGolf() {
  const list = document.getElementById("golf-list");
  if (list) {
    const golfRef = ref(db, 'golf');
    onValue(golfRef, (snapshot) => {
      const golf = snapshot.val() || [];
      list.innerHTML = ""; // Clear and reload
      golf.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
    });
  }
}

// Countdown Timer
function updateCountdown() {
  const targetDate = new Date("2025-09-12T10:30:00"); // Start of the trip
  const now = new Date();
  const diff = targetDate - now;
  const timer = document.getElementById("countdown-timer");
  if (timer) {
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      timer.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      timer.textContent = "Party Time!";
    }
  }
}

// Golf Votes
async function submitGolfVotes() {
  const form = document.getElementById("golf-form");
  const selected = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  if (selected.length > 0) {
    const votesRef = ref(db, 'golfVotes');
    const snapshot = await get(votesRef);
    let votes = snapshot.val() || {};
    selected.forEach((course) => {
      votes[course] = (votes[course] || 0) + 1;
    });
    await set(votesRef, votes);
    form.reset();
  }
}

function loadGolfVotes() {
  displayGolfVotes();
}

function displayGolfVotes() {
  const resultsDiv = document.getElementById("golf-vote-results");
  if (!resultsDiv) return;
  const votesRef = ref(db, 'golfVotes');
  onValue(votesRef, (snapshot) => {
    const votes = snapshot.val() || {};
    let html = "<h3>Current Golf Votes:</h3><ul>";
    Object.keys(votes)
      .sort((a, b) => votes[b] - votes[a])
      .forEach((course) => {
        html += `<li>${course}: ${votes[course]} votes</li>`;
      });
    html += "</ul>";
    resultsDiv.innerHTML = html;
  });
}

// Cigars Preference
async function submitCigars() {
  const form = document.getElementById("cigars-form");
  const choice = form.querySelector('input[name="cigars"]:checked').value;
  const name = document.getElementById("cigars-name").value.trim();
  let count = "";

  if (choice === "yes") {
    count = document.getElementById("cigars-count").value;
  }

  if (name) {
    const prefsRef = ref(db, 'cigarsPrefs');
    const snapshot = await get(prefsRef);
    let prefs = snapshot.val() || [];
    prefs.push({ name, choice, count });
    await set(prefsRef, prefs);
    form.reset();
    document.getElementById("cigars-count").disabled = true; // Reset disable
  } else {
    alert("Please enter your name!");
  }
}

function displayCigars() {
  const list = document.getElementById("cigars-list");
  if (!list) return;
  const prefsRef = ref(db, 'cigarsPrefs');
  onValue(prefsRef, (snapshot) => {
    const prefs = snapshot.val() || [];
    list.innerHTML = "";
    prefs.forEach((pref) => {
      const li = document.createElement("li");
      li.textContent = `${pref.name}: ${
        pref.choice === "yes" ? `Yes, ${pref.count} cigars` : "No thanks"
      }`;
      list.appendChild(li);
    });
  });
}

// Enable/disable count select based on radio
document.addEventListener("DOMContentLoaded", () => {
  const yesRadio = document.querySelector('input[value="yes"]');
  const countSelect = document.getElementById("cigars-count");
  if (yesRadio && countSelect) {
    yesRadio.addEventListener("change", () => {
      countSelect.disabled = !yesRadio.checked;
    });
  }
  displayCigars(); // Load on page load
});

// Other Activities Votes
async function submitOtherVotes() {
  const form = document.getElementById("other-activities-form");
  const selected = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  if (selected.length > 0) {
    const votesRef = ref(db, 'otherVotes');
    const snapshot = await get(votesRef);
    let votes = snapshot.val() || {};
    selected.forEach((act) => {
      votes[act] = (votes[act] || 0) + 1;
    });
    await set(votesRef, votes);
    form.reset();
  }
}

function displayOtherVotes() {
  const resultsDiv = document.getElementById("other-vote-results");
  if (!resultsDiv) return;
  const votesRef = ref(db, 'otherVotes');
  onValue(votesRef, (snapshot) => {
    const votes = snapshot.val() || {};
    let html = "<h3>Current Votes:</h3><ul>";
    Object.keys(votes)
      .sort((a, b) => votes[b] - votes[a])
      .forEach((act) => {
        html += `<li>${act}: ${votes[act]} votes</li>`;
      });
    html += "</ul>";
    resultsDiv.innerHTML = html;
  });
}

// Other Activities Suggestions
async function addActivity() {
  const input = document.getElementById("new-activity");
  if (input && input.value) {
    const li = document.createElement("li");
    li.textContent = input.value;
    document.getElementById("activity-list").appendChild(li);

    // Save to Firebase
    const activitiesRef = ref(db, 'otherActivities');
    const snapshot = await get(activitiesRef);
    let activities = snapshot.val() || [];
    activities.push(input.value);
    await set(activitiesRef, activities);

    input.value = "";
  }
}

function loadOtherActivities() {
  const list = document.getElementById("activity-list");
  if (list) {
    const activitiesRef = ref(db, 'otherActivities');
    onValue(activitiesRef, (snapshot) => {
      const activities = snapshot.val() || [];
      list.innerHTML = ""; // Clear and reload
      activities.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
    });
  }
  displayOtherVotes(); // Load votes too
}