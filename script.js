// script.js - Full updated version with all features, Firebase sync, removal, and fixes

// Firebase Config
var firebaseConfig = {
  apiKey: "AIzaSyBGJUmD9rYtKNnUKGXasJRs57UyrHVq-6Q",
  authDomain: "bachelor-party-mk.firebaseapp.com",
  projectId: "bachelor-party-mk",
  storageBucket: "bachelor-party-mk.firebasestorage.app",
  messagingSenderId: "588727020923",
  appId: "1:588727020923:web:d742c916c707ee101d21de",
  measurementId: "G-1BH6QYVDKG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// Load data on page load
window.onload = function() {
    var bedroomsSection = document.getElementById('bedrooms');
    if (bedroomsSection) {
        loadClaims();
    }
    var activitiesSection = document.getElementById('activities');
    if (activitiesSection) {
        loadVotes('brewery', 'vote-results', 'brewery-vote-list');
        loadVotes('golf', 'golf-vote-results', 'golf-vote-list');
        loadVotes('other', 'other-vote-results', 'other-vote-list');
        loadList('otherActivities', 'activity-list');
        loadList('golf', 'golf-list');
        var mapDiv = document.getElementById('map');
        if (mapDiv) {
            initMap();
        }
    }
    var shoppingSection = document.getElementById('shopping');
    if (shoppingSection) {
        loadList('shopping', 'shopping-list');
        loadCigars();
    }
    var countdownTimer = document.getElementById('countdown-timer');
    if (countdownTimer) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
};

// Helper: Load and listen to list collections with delete
function loadList(collectionName, listId) {
    var list = document.getElementById(listId);
    if (!list) return;
    db.collection(collectionName).orderBy('timestamp', 'asc').onSnapshot(function(snapshot) {
        list.innerHTML = '';
        snapshot.forEach(function(doc) {
            var li = document.createElement('li');
            li.textContent = doc.data().item;
            var delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.onclick = function() {
                db.collection(collectionName).doc(doc.id).delete();
            };
            li.appendChild(delBtn);
            list.appendChild(li);
        });
    });
}

// Helper: Add to list
function addToList(collectionName, inputId) {
    var input = document.getElementById(inputId);
    if (input && input.value) {
        db.collection(collectionName).add({
            item: input.value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
    }
}

// Bedroom Claims
function claimBed(button) {
    var optionDiv = button.parentElement;
    var id = optionDiv.getAttribute('data-id');
    var type = optionDiv.getAttribute('data-type');
    var name = prompt('Enter your name to claim this bed:');
    if (name) {
        optionDiv.classList.add('claimed');
        optionDiv.innerHTML = '<p>Claimed by ' + name + '</p><button onclick="unclaimBed(\'' + id + '\', \'' + type + '\')">Unclaim</button>';
        db.collection('claims').doc(id).set({ name: name });
    }
}

function unclaimBed(id, type) {
    if (confirm('Are you sure you want to unclaim this bed?')) {
        db.collection('claims').doc(id).delete();
        // Immediate UI update for unclaim
        var optionDiv = document.querySelector('[data-id="' + id + '"]');
        if (optionDiv) {
            optionDiv.classList.remove('claimed');
            optionDiv.innerHTML = '<p>' + type + '</p><button onclick="claimBed(this)">Claim</button>';
        }
    }
}

function loadClaims() {
    db.collection('claims').onSnapshot(function(snapshot) {
        document.querySelectorAll('.bed-option').forEach(function(optionDiv) {
            var id = optionDiv.getAttribute('data-id');
            var type = optionDiv.getAttribute('data-type');
            var doc = snapshot.docs.find(function(d) { return d.id === id; });
            if (doc) {
                var name = doc.data().name;
                optionDiv.classList.add('claimed');
                optionDiv.innerHTML = '<p>Claimed by ' + name + '</p><button onclick="unclaimBed(\'' + id + '\', \'' + type + '\')">Unclaim</button>';
            } else {
                optionDiv.classList.remove('claimed');
                optionDiv.innerHTML = '<p>' + type + '</p><button onclick="claimBed(this)">Claim</button>';
            }
        });
    });
}

// Votes (general with delete/undo)
function submitVotes(type, formId) {
    var form = document.getElementById(formId);
    var selected = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(function(cb) { return cb.value; });
    
    if (selected.length > 0) {
        selected.forEach(function(item) {
            db.collection(type + 'Votes').doc(item).set({
                count: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
        });
        form.reset();
    }
}

function loadVotes(type, resultsId, listId) {
    db.collection(type + 'Votes').onSnapshot(function(snapshot) {
        var votes = {};
        snapshot.forEach(function(doc) {
            votes[doc.id] = doc.data().count || 0;
        });
        displayVotes(type, listId, votes);
    });
}

function displayVotes(type, listId, votes) {
    var list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';
    Object.keys(votes).sort(function(a,b) { return votes[b] - votes[a]; }).forEach(function(key) {
        var li = document.createElement('li');
        li.textContent = key + ': ' + votes[key] + ' votes';
        var delBtn = document.createElement('button');
        delBtn.textContent = 'Remove Vote';
        delBtn.onclick = function() {
            db.collection(type + 'Votes').doc(key).update({
                count: firebase.firestore.FieldValue.increment(-1)
            });
        };
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

// Cigars Preference
function submitCigars() {
    var form = document.getElementById('cigars-form');
    var choice = form.querySelector('input[name="cigars"]:checked').value;
    var name = document.getElementById('cigars-name').value.trim();
    var count = '';
    
    if (choice === 'yes') {
        count = document.getElementById('cigars-count').value;
    }
    
    if (name) {
        db.collection('cigars').doc(name).set({ choice: choice, count: count });
        form.reset();
        document.getElementById('cigars-count').disabled = true;
    } else {
        alert('Please enter your name!');
    }
}

function loadCigars() {
    db.collection('cigars').onSnapshot(function(snapshot) {
        var list = document.getElementById('cigars-list');
        if (!list) return;
        list.innerHTML = '';
        snapshot.forEach(function(doc) {
            var pref = doc.data();
            var li = document.createElement('li');
            li.textContent = doc.id + ': ' + (pref.choice === 'yes' ? 'Yes, ' + pref.count + ' cigars' : 'No thanks');
            var delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.onclick = function() {
                db.collection('cigars').doc(doc.id).delete();
            };
            li.appendChild(delBtn);
            list.appendChild(li);
        });
    });
}

// Add event listener for cigars radio
document.addEventListener('DOMContentLoaded', function() {
    var yesRadio = document.querySelector('input[value="yes"]');
    var countSelect = document.getElementById('cigars-count');
    if (yesRadio && countSelect) {
        yesRadio.addEventListener('change', function() {
            countSelect.disabled = !yesRadio.checked;
        });
    }
});

// Countdown Timer
function updateCountdown() {
    var targetDate = new Date('2025-09-12T00:00:00'); // Start of the trip
    var now = new Date();
    var diff = targetDate - now;
    var timer = document.getElementById('countdown-timer');
    if (timer) {
        if (diff > 0) {
            var days = Math.floor(diff / (1000 * 60 * 60 * 24));
            var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((diff % (1000 * 60)) / 1000);
            timer.textContent = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
        } else {
            timer.textContent = 'Party Time!';
        }
    }
}

// Interactive Map
function initMap() {
    var map = L.map('map').setView([35.5956, -82.5519], 15); // Center on downtown Asheville

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Brewery locations (approx lat/long from maps)
    var breweries = [
        { name: 'Wicked Weed Brewing', lat: 35.5933, lng: -82.5506 },
        { name: 'Hi-Wire Brewing', lat: 35.5905, lng: -82.5538 },
        { name: 'Burial Beer Co.', lat: 35.5896, lng: -82.5552 },
        { name: 'Green Man Brewery', lat: 35.5913, lng: -82.5546 },
        { name: 'Catawba Brewing Company', lat: 35.5899, lng: -82.5565 },
        { name: 'One World Brewing', lat: 35.5954, lng: -82.5517 },
        { name: 'Thirsty Monk Brewery', lat: 35.5947, lng: -82.5510 },
        { name: 'Asheville Brewing Company', lat: 35.5908, lng: -82.5549 },
        { name: 'Twin Leaf Brewery', lat: 35.5892, lng: -82.5547 },
        { name: 'Highland Brewing Downtown', lat: 35.5951, lng: -82.5520 }
    ];

    breweries.forEach(function(brew) {
        L.marker([brew.lat, brew.lng]).addTo(map)
            .bindPopup(brew.name);
    });

    // Parking example (Pack Square Garage)
    L.marker([35.5948, -82.5512], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', iconSize: [25, 41]})}).addTo(map)
        .bindPopup('Pack Square Parking Garage (Start/End Point)');
}

// Plan Route
function planRoute() {
    db.collection('breweryVotes').get().then(function(snapshot) {
        var votes = {};
        snapshot.forEach(function(doc) {
            votes[doc.id] = doc.data().count || 0;
        });
        var selected = Object.keys(votes).sort(function(a,b) { return votes[b] - votes[a]; }); // Sort by votes descending
        if (selected.length === 0) return alert('No votes yet!');

        // Approx order from parking (manual sort for walking route)
        var order = ['One World Brewing', 'Thirsty Monk Brewery', 'Highland Brewing Downtown', 'Wicked Weed Brewing', 'Asheville Brewing Company', 'Hi-Wire Brewing', 'Green Man Brewery', 'Twin Leaf Brewery', 'Burial Beer Co.', 'Catawba Brewing Company'];
        var sortedSelected = order.filter(function(name) { return selected.includes(name); });

        // Google Maps link (start/end at parking, waypoints for breweries)
        var parking = 'Pack+Square+Garage,Asheville,NC';
        var waypoints = sortedSelected.map(function(name) { return encodeURIComponent(name + ',Asheville,NC'); }).join('|');
        var url = 'https://www.google.com/maps/dir/?api=1&origin=' + parking + '&destination=' + parking + '&waypoints=' + waypoints + '&travelmode=walking';
        window.open(url, '_blank');
    });
}