// script.js - Full code

// Load saved data on page load
window.onload = function () {
  loadClaims();
  loadVotes();
  loadShopping();
  loadGolf();
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
    optionDiv.classList.add("claimed");
    optionDiv.innerHTML = `<p>Claimed by ${name}</p>`; // Replace content with claimed message

    // Save to localStorage
    let claims = JSON.parse(localStorage.getItem("claims") || "{}");
    claims[id] = name;
    localStorage.setItem("claims", JSON.stringify(claims));
  }
}

function loadClaims() {
  let claims = JSON.parse(localStorage.getItem("claims") || "{}");
  document.querySelectorAll(".bed-option").forEach((optionDiv) => {
    const id = optionDiv.getAttribute("data-id");
    if (claims[id]) {
      optionDiv.classList.add("claimed");
      optionDiv.innerHTML = `<p>Claimed by ${claims[id]}</p>`;
    }
  });
}

// Brewery Votes
function submitVotes() {
  const form = document.getElementById("brewery-form");
  const selected = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  if (selected.length > 0) {
    let votes = JSON.parse(localStorage.getItem("breweryVotes") || "{}");
    selected.forEach((brew) => {
      votes[brew] = (votes[brew] || 0) + 1;
    });
    localStorage.setItem("breweryVotes", JSON.stringify(votes));
    displayVotes();
    form.reset();
  }
}

function loadVotes() {
  displayVotes();
}

function displayVotes() {
  const resultsDiv = document.getElementById("vote-results");
  if (!resultsDiv) return; // Skip if not on page
  const votes = JSON.parse(localStorage.getItem("breweryVotes") || "{}");
  let html = "<h3>Current Votes:</h3><ul>";
  Object.keys(votes)
    .sort((a, b) => votes[b] - votes[a])
    .forEach((brew) => {
      html += `<li>${brew}: ${votes[brew]} votes</li>`;
    });
  html += "</ul>";
  resultsDiv.innerHTML = html;
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
  const votes = JSON.parse(localStorage.getItem("breweryVotes") || "{}");
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
}

// Shopping List
function addItem() {
  const input = document.getElementById("new-item");
  if (input && input.value) {
    const li = document.createElement("li");
    li.textContent = input.value;
    document.getElementById("shopping-list").appendChild(li);

    // Save
    let shopping = JSON.parse(localStorage.getItem("shopping") || "[]");
    shopping.push(input.value);
    localStorage.setItem("shopping", JSON.stringify(shopping));

    input.value = "";
  }
}

function loadShopping() {
  let shopping = JSON.parse(localStorage.getItem("shopping") || "[]");
  const list = document.getElementById("shopping-list");
  if (list) {
    shopping.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  }
}

// Golf Suggestions
function addGolf() {
  const input = document.getElementById("new-golf");
  if (input && input.value) {
    const li = document.createElement("li");
    li.textContent = input.value;
    document.getElementById("golf-list").appendChild(li);

    // Save
    let golf = JSON.parse(localStorage.getItem("golf") || "[]");
    golf.push(input.value);
    localStorage.setItem("golf", JSON.stringify(golf));

    input.value = "";
  }
}

function loadGolf() {
  let golf = JSON.parse(localStorage.getItem("golf") || "[]");
  const list = document.getElementById("golf-list");
  if (list) {
    golf.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
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
function submitGolfVotes() {
  const form = document.getElementById("golf-form");
  const selected = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  if (selected.length > 0) {
    let votes = JSON.parse(localStorage.getItem("golfVotes") || "{}");
    selected.forEach((course) => {
      votes[course] = (votes[course] || 0) + 1;
    });
    localStorage.setItem("golfVotes", JSON.stringify(votes));
    displayGolfVotes();
    form.reset();
  }
}

function loadGolfVotes() {
  displayGolfVotes();
}

function displayGolfVotes() {
  const resultsDiv = document.getElementById("golf-vote-results");
  if (!resultsDiv) return;
  const votes = JSON.parse(localStorage.getItem("golfVotes") || "{}");
  let html = "<h3>Current Golf Votes:</h3><ul>";
  Object.keys(votes)
    .sort((a, b) => votes[b] - votes[a])
    .forEach((course) => {
      html += `<li>${course}: ${votes[course]} votes</li>`;
    });
  html += "</ul>";
  resultsDiv.innerHTML = html;
}

// Cigars Preference
function submitCigars() {
  const form = document.getElementById("cigars-form");
  const choice = form.querySelector('input[name="cigars"]:checked').value;
  const name = document.getElementById("cigars-name").value.trim();
  let count = "";

  if (choice === "yes") {
    count = document.getElementById("cigars-count").value;
  }

  if (name) {
    let prefs = JSON.parse(localStorage.getItem("cigarsPrefs") || "[]");
    prefs.push({ name, choice, count });
    localStorage.setItem("cigarsPrefs", JSON.stringify(prefs));
    displayCigars();
    form.reset();
    document.getElementById("cigars-count").disabled = true; // Reset disable
  } else {
    alert("Please enter your name!");
  }
}

function displayCigars() {
  const list = document.getElementById("cigars-list");
  if (!list) return;
  list.innerHTML = "";
  const prefs = JSON.parse(localStorage.getItem("cigarsPrefs") || "[]");
  prefs.forEach((pref) => {
    const li = document.createElement("li");
    li.textContent = `${pref.name}: ${
      pref.choice === "yes" ? `Yes, ${pref.count} cigars` : "No thanks"
    }`;
    list.appendChild(li);
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
function submitOtherVotes() {
  const form = document.getElementById("other-activities-form");
  const selected = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  if (selected.length > 0) {
    let votes = JSON.parse(localStorage.getItem("otherVotes") || "{}");
    selected.forEach((act) => {
      votes[act] = (votes[act] || 0) + 1;
    });
    localStorage.setItem("otherVotes", JSON.stringify(votes));
    displayOtherVotes();
    form.reset();
  }
}

function displayOtherVotes() {
  const resultsDiv = document.getElementById("other-vote-results");
  if (!resultsDiv) return;
  const votes = JSON.parse(localStorage.getItem("otherVotes") || "{}");
  let html = "<h3>Current Votes:</h3><ul>";
  Object.keys(votes)
    .sort((a, b) => votes[b] - votes[a])
    .forEach((act) => {
      html += `<li>${act}: ${votes[act]} votes</li>`;
    });
  html += "</ul>";
  resultsDiv.innerHTML = html;
}

// Other Activities Suggestions
function addActivity() {
  const input = document.getElementById("new-activity");
  if (input && input.value) {
    const li = document.createElement("li");
    li.textContent = input.value;
    document.getElementById("activity-list").appendChild(li);

    // Save
    let activities = JSON.parse(
      localStorage.getItem("otherActivities") || "[]"
    );
    activities.push(input.value);
    localStorage.setItem("otherActivities", JSON.stringify(activities));

    input.value = "";
  }
}

function loadOtherActivities() {
  let activities = JSON.parse(localStorage.getItem("otherActivities") || "[]");
  const list = document.getElementById("activity-list");
  if (list) {
    activities.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  }
  displayOtherVotes(); // Load votes too
}
