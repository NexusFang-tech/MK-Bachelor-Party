// script.js - Firebase version

// Load saved data on page load
window.onload = function () {
  loadClaims();
  loadVotes();
  loadShopping();
  loadGolf();
  loadGolfVotes();
  loadOtherActivities();
  if (document.getElementById("map")) initMap(); // Only init map if on activities page
  updateCountdown();
  setInterval(updateCountdown, 1000);
};

// Bedroom Claims
function claimBed(button) {
  const optionDiv = button.parentElement;
  const id = optionDiv.getAttribute("data-id");
  const name = prompt("Enter your name to claim this bed:");
  if (name) {
    db.ref("bedClaims/" + id).set(name);
  }
}

function loadClaims() {
  db.ref("bedClaims").on("value", (snapshot) => {
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
function submitVotes() {
  const form = document.getElementById("brewery-form");
  const selected = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  selected.forEach((brew) => {
    const ref = db.ref("breweryVotes/" + brew);
    ref.transaction((current) => (current || 0) + 1);
  });

  form.reset();
}

function loadVotes() {
  db.ref("breweryVotes").on("value", (snapshot) => {
    const votes = snapshot.val() || {};
    const resultsDiv = document.getElementById("vote-results");
    if (!resultsDiv) return;
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

// Golf Votes
function submitGolfVotes() {
  const form = document.getElementById("golf-form");
  const selected = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  selected.forEach((course) => {
    const ref = db.ref("golfVotes/" + course);
    ref.transaction((current) => (current || 0) + 1);
  });

  form.reset();
}

function loadGolfVotes() {
  db.ref("golfVotes").on("value", (snapshot) => {
    const votes = snapshot.val() || {};
    const resultsDiv = document.getElementById("golf-vote-results");
    if (!resultsDiv) return;
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

// Other Activities Votes
function submitOtherVotes() {
  const form = document.getElementById("other-activities-form");
  const selected = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  selected.forEach((act) => {
    const ref = db.ref("otherVotes/" + act);
    ref.transaction((current) => (current || 0) + 1);
  });

  form.reset();
}

function displayOtherVotes() {
  db.ref("otherVotes").on("value", (snapshot) => {
    const votes = snapshot.val() || {};
    const resultsDiv = document.getElementById("other-vote-results");
    if (!resultsDiv) return;
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
function addActivity() {
  const input = document.getElementById("new-activity");
  if (input && input.value) {
    const ref = db.ref("otherActivities").push();
    ref.set(input.value);
    input.value = "";
  }
}

function loadOtherActivities() {
  const list = document.getElementById("activity-list");
  if (!list) return;
  db.ref("otherActivities").on("value", (snapshot) => {
    const items = snapshot.val() || {};
    list.innerHTML = "";
    Object.values(items).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  });
  displayOtherVotes();
}

// Shopping List
function addItem() {
  const input = document.getElementById("new-item");
  if (input && input.value) {
    const ref = db.ref("shoppingList").push();
    ref.set(input.value);
    input.value = "";
  }
}

function loadShopping() {
  const list = document.getElementById("shopping-list");
  if (!list) return;
  db.ref("shoppingList").on("value", (snapshot) => {
    const items = snapshot.val() || {};
    list.innerHTML = "";
    Object.values(items).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  });
}

// Cigars
function submitCigars() {
  const form = document.getElementById("cigars-form");
  const choice = form.querySelector('input[name="cigars"]:checked').value;
  const name = document.getElementById("cigars-name").value.trim();
  let count = "";

  if (choice === "yes") {
    count = document.getElementById("cigars-count").value;
  }

  if (name) {
    const ref = db.ref("cigarsPrefs").push();
    ref.set({ name, choice, count });
    form.reset();
    document.getElementById("cigars-count").disabled = true;
  } else {
    alert("Please enter your name!");
  }
}

function displayCigars() {
  const list = document.getElementById("cigars-list");
  if (!list) return;
  db.ref("cigarsPrefs").on("value", (snapshot) => {
    const prefs = snapshot.val() || {};
    list.innerHTML = "";
    Object.values(prefs).forEach((pref) => {
      const li = document.createElement("li");
      li.textContent = `${pref.name}: ${
        pref.choice === "yes" ? `Yes, ${pref.count} cigars` : "No thanks"
      }`;
      list.appendChild(li);
    });
  });
}

// Enable/disable cigar count on radio change
document.addEventListener("DOMContentLoaded", () => {
  const yesRadio = document.querySelector('input[value="yes"]');
  const countSelect = document.getElementById("cigars-count");
  if (yesRadio && countSelect) {
    yesRadio.addEventListener("change", () => {
      countSelect.disabled = !yesRadio.checked;
    });
  }
  displayCigars();
});

// Interactive Map
function initMap() {
  const map = L.map("map").setView([35.5956, -82.5519], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

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
  db.ref("breweryVotes").once("value", (snapshot) => {
    const votes = snapshot.val() || {};
    const selected = Object.keys(votes).sort((a, b) => votes[b] - votes[a]);

    if (selected.length === 0)
      return alert("No votes yet!");

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

    const parking = "Pack+Square+Garage,Asheville,NC";
    const waypoints = sortedSelected
      .map((name) => encodeURIComponent(name + ",Asheville,NC"))
      .join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${parking}&destination=${parking}&waypoints=${waypoints}&travelmode=walking`;
    window.open(url, "_blank");
  });
}

// Countdown Timer
function updateCountdown() {
  const targetDate = new Date("2025-09-12T10:30:00");
  const now = new Date();
  const diff = targetDate - now;
  const timer = document.getElementById("countdown-timer");
  if (timer) {
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      timer.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      timer.textContent = "Party Time!";
    }
  }
}
