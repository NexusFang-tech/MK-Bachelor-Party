// script.js - Updated with removal options

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

// Load saved data on page load
window.onload = function() {
    loadClaims();
    loadVotes('brewery', 'vote-results', 'vote-list'); // Brewery
    loadVotes('golf', 'golf-vote-results', 'golf-vote-list'); // Golf
    // Add loadVotes for other if using
    loadList('shopping', 'shopping-list');
    loadList('golf', 'golf-list');
    // Add loadList for otherActivities if using
    loadCigars();
    if (document.getElementById('map')) initMap();
    updateCountdown();
    setInterval(updateCountdown, 1000);
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
        db.collection('claims').doc(id).set({ name });
    }
}

function loadClaims() {
    db.collection('claims').onSnapshot(snapshot => {
        document.querySelectorAll('.bed-option').forEach(optionDiv => {
            const id = optionDiv.getAttribute('data-id');
            const doc = snapshot.doc(id);
            if (doc.exists) {
                const name = doc.data().name;
                optionDiv.classList.add('claimed');
                optionDiv.innerHTML = `<p>Claimed by ${name}</p><button onclick="unclaimBed('${id}')">Unclaim</button>`;
            } else {
                // Reset if unclaimed
                optionDiv.classList.remove('claimed');
                optionDiv.innerHTML = '<p>Twin Bed</p><button onclick="claimBed(this)">Claim</button>'; // Adjust per bed type
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
        displayVotes(type, resultsId, listId, votes);
    });
}

function displayVotes(type, resultsId, listId, votes) {
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

// Cigars Preference
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
    if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        document.getElementById('countdown-timer').textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
        document.getElementById('countdown-timer').textContent = 'Party Time!';
    }
}

// ... (add initMap and planRoute as before if not included)