// script.js - Full fixed version with Firebase, all features restored, sync, and removal

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
    var bedroomsSection = document.querySelector('#bedrooms');
    if (bedroomsSection) {
        loadClaims();
    }
    var activitiesSection = document.querySelector('#activities');
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
    var shoppingSection = document.querySelector('#shopping');
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
    var optionDiv = button.parentElement;
    var id = optionDiv.getAttribute('data-id');
    var type = optionDiv.getAttribute('data-type');
    var name = prompt('Enter your name to claim this bed:');
    if (name) {
        // Immediate UI update
        optionDiv.classList.add('claimed');
        optionDiv.innerHTML = '<p>Claimed by ' + name + '</p><button onclick="unclaimBed(\'' + id + '\', \'' + type + '\')">Unclaim</button>';
        
        // Save to Firebase
        db.collection('claims').doc(id).set({ name: name });
    }
}

function unclaimBed(id, type) {
    if (confirm('Are you sure you want to unclaim this bed?')) {
        db.collection('claims').doc(id).delete();
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
    var choice = form.querySelector('input