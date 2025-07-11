// script.js - Fixed with Firebase sync, removal, and all features restored

// Firebase Config
const firebaseConfig = {
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
const db = firebase.firestore();

// Load data on page load
window.onload = function() {
    if (document.querySelector('#bedrooms')) {
        loadClaims();
    }
    if (document.querySelector('#activities')) {
        loadVotes('brewery', 'vote-results', 'brewery-vote-list');
        loadVotes('golf', 'golf-vote-results', 'golf-vote-list');
        loadVotes('other', 'other-vote-results', 'other-vote-list');
        loadList('otherActivities', 'activity-list');
        loadList('golf', 'golf-list');
        if (document.getElementById('map')) initMap();
    }
    if (document.querySelector('#shopping')) {
        loadList('shopping', 'shopping-list');
        loadCigars();
    }
    if (document.getElementById('countdown-timer')) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
};

// Helper: Load and listen to list collections with delete
function loadList(collectionName, listId) {
    const list = document.getElementById(listId);
    if (!list) return;
    db.collection(collectionName).orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const li = document.createElement('li');
            li.textContent = doc.data().item;
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.onclick = () => db.collection(collectionName).doc(doc.id).delete();
            li.appendChild(delBtn);
            list.appendChild(li);
        });
    });
}

// Helper: Add to list
function addToList(collectionName, inputId) {
    const input = document.getElementById(inputId);
    if (input.value) {
        db.collection(collectionName).add({
            item: input.value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
    }
}

// Bedroom Claims
function claimBed(button) {
    const optionDiv = button.parentElement;
    const id = optionDiv.getAttribute('data-id');
    const name = prompt('Enter your name to claim this bed:');
    if (name) {
        db.collection('claims').doc(id).set({ name }).then(() => {
            // Immediate UI update
            optionDiv.classList.add('claimed');
            optionDiv.innerHTML = `<p>Claimed by ${name}</p><button onclick="unclaimBed('${id}')">Unclaim</button>`;
        });
    }
}

function loadClaims() {
    db.collection('claims').onSnapshot(snapshot => {
        document.querySelectorAll('.bed-option').forEach(optionDiv => {
            const id = optionDiv.getAttribute('data-id');
            const doc = snapshot.docs.find(d => d.id === id);
            if (doc) {
                const name = doc.data().name;
                optionDiv.classList.add('claimed');
                optionDiv.innerHTML = `<p>Claimed by ${name}</p><button onclick="unclaimBed('${id}')">Unclaim</button>`;
            } else {
                // Reset to unclaimed state (adjust <p> based on actual bed type)
                optionDiv.classList.remove('claimed');
                optionDiv.innerHTML = '<p>Twin Bed</p><button onclick="claimBed(this)">Claim</button>'; // Customize per bed
            }
        });
    });
}

function unclaimBed(id) {
    if (confirm('Unclaim this bed?')) {
        db.collection('claims').doc(id).delete();
    }
}

// Votes (general with delete/undo)
function submitVotes(type, formId) {
    const form = document.getElementById(formId);
    const selected = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    
    if (selected.length > 0) {
        selected.forEach(item => {
            db.collection(`${type}Votes`).doc(item).set({
                count: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
        });
        form.reset();
    }
}

function loadVotes(type, resultsId, listId) {
    db.collection(`${type}Votes`).onSnapshot(snapshot => {
        const votes = {};
        snapshot.forEach(doc => {
            votes[doc.id] = doc.data().count || 0;
        });
        displayVotes(type, listId, votes);
    });
}

function displayVotes(type, listId, votes) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';
    Object.keys(votes).sort((a,b) => votes[b] - votes[a]).forEach(key => {
        const li = document.createElement('li');
        li.textContent = `${key}: ${votes[key]} votes`;
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Remove Vote';
        delBtn.onclick = () => db.collection(`${type}Votes`).doc(key).update({
            count: firebase.firestore.FieldValue.increment(-1)
        });
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

// Cigars Preference (with delete)
function submitCigars() {
    const form = document.getElementById('cigars-form');
    const choice = form.querySelector('input[name="cigars"]:checked').value;
    const name = document.getElementById('cigars-name').value.trim();
    let count = '';
    
    if (choice === 'yes') {
        count = document.getElementById('cigars-count').value;
    }
    
    if (name) {
        db.collection('cigars').doc(name).set({ choice, count });
        form.reset();
        document.getElementById('cigars-count').disabled = true;
    } else {
        alert('Please enter your name!');
    }
}

function loadCigars() {
    db.collection('cigars').onSnapshot(snapshot => {
        const list = document.getElementById('cigars-list');
        if (!list) return;
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const pref = doc.data();
            const li = document.createElement('li');
            li.textContent = `${doc.id}: ${pref.choice === 'yes' ? `Yes, ${pref.count} cigars` : 'No thanks'}`;
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.onclick = () => db.collection('cigars').doc(doc.id).delete();
            li.appendChild(delBtn);
            list.appendChild(li);
        });
    });
}

// Add event listener for cigars radio
document.addEventListener('DOMContentLoaded', () => {
    const yesRadio = document.querySelector('input[value="yes"]');
    const countSelect = document.getElementById('cigars-count');
    if (yesRadio && countSelect) {
        yesRadio.addEventListener('change', () => {
            countSelect.disabled = !yesRadio.checked;
        });
    }
});

// Countdown Timer
function updateCountdown() {
    const targetDate = new Date('2025-09-12T00:00:00'); // Start of the trip
    const now = new Date();
    const diff = targetDate - now;
    const timer = document.getElementById('countdown-timer');
    if (timer) {
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            timer.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else {
            timer.textContent = 'Party Time!';
        }
    }
}

// Interactive Map (restored)
function initMap() {
    const map = L.map('map').setView([35.5956, -82.5519], 15); // Center on downtown Asheville

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Brewery locations (approx lat/long from maps)
    const breweries = [
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

    breweries.forEach(brew => {
        L.marker([brew.lat, brew.lng]).addTo(map)
            .bindPopup(brew.name);
    });

    // Parking example (Pack Square Garage)
    L.marker([35.5948, -82.5512], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', iconSize: [25, 41]})}).addTo(map)
        .bindPopup('Pack Square Parking Garage (Start/End Point)');
}

// Plan Route (restored, using Firebase get)
function planRoute() {
    db.collection('breweryVotes').get().then(snapshot => {
        const votes = {};
        snapshot.forEach(doc => {
            votes[doc.id] = doc.data().count || 0;
        });
        const selected = Object.keys(votes).sort((a,b) => votes[b] - votes[a]); // Sort by votes descending
        if (selected.length === 0) return alert('No votes yet!');

        // Approx order from parking (manual sort for walking route)
        const order = ['One World Brewing', 'Thirsty Monk Brewery', 'Highland Brewing Downtown', 'Wicked Weed Brewing', 'Asheville Brewing Company', 'Hi-Wire Brewing', 'Green Man Brewery', 'Twin Leaf Brewery', 'Burial Beer Co.', 'Catawba Brewing Company'];
        const sortedSelected = order.filter(name => selected.includes(name));

        // Google Maps link (start/end at parking, waypoints for breweries)
        const parking = 'Pack+Square+Garage,Asheville,NC';
        const waypoints = sortedSelected.map(name => encodeURIComponent(name + ',Asheville,NC')).join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${parking}&destination=${parking}&waypoints=${waypoints}&travelmode=walking`;
        window.open(url, '_blank');
    });
}