// script.js - Full script with Back4App (Parse) for real-time sync and removal

// Back4App Config
Parse.serverURL = 'https://parseapi.back4app.com/';
Parse.initialize('scW56uZgebw17KuDqNLfdaXRNuiGhoKYaiz9GsMm', '91e8FCGbDGRPxztpHw4gw526kAzqU6QVlNwYtFlX');

// Load data on page load
window.onload = function() {
    if (document.getElementById('bedrooms')) loadClaims();
    if (document.getElementById('activities')) {
        loadVotes('BreweryVotes', 'vote-results', 'brewery-vote-list');
        loadVotes('GolfVotes', 'golf-vote-results', 'golf-vote-list');
        loadVotes('OtherVotes', 'other-vote-results', 'other-vote-list');
        loadList('OtherSuggestions', 'activity-list');
        loadList('GolfSuggestions', 'golf-list');
        if (document.getElementById('map')) initMap();
    }
    if (document.getElementById('shopping')) {
        loadList('Shopping', 'shopping-list');
        loadCigars();
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
};

// Helper: Load and listen to list classes with delete
function loadList(className, listId) {
    const list = document.getElementById(listId);
    if (!list) return;
    const Class = Parse.Object.extend(className);
    const query = new Parse.Query(Class);
    query.ascending('createdAt');
    query.find().then(results => {
        list.innerHTML = '';
        results.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.get('item') || item.get('suggestion');
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.onclick = () => item.destroy();
            li.appendChild(delBtn);
            list.appendChild(li);
        });
    });

    // Real-time sync with LiveQuery
    const subscription = query.subscribe();
    subscription.on('create', (item) => {
        const li = document.createElement('li');
        li.textContent = item.get('item') || item.get('suggestion');
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => item.destroy();
        li.appendChild(delBtn);
        list.appendChild(li);
    });
    subscription.on('delete', () => loadList(className, listId)); // Reload on delete
}

// Helper: Add to list
function addToList(className, inputId, field = 'item') {
    const input = document.getElementById(inputId);
    if (input.value) {
        const Class = Parse.Object.extend(className);
        const obj = new Class();
        obj.set(field, input.value);
        obj.save().then(() => {
            input.value = '';
        });
    }
}

// Bedroom Claims
function claimBed(button) {
    const optionDiv = button.parentElement;
    const id = optionDiv.getAttribute('data-id');
    const type = optionDiv.getAttribute('data-type');
    const name = prompt('Enter your name to claim this bed:');
    if (name) {
        optionDiv.classList.add('claimed');
        optionDiv.innerHTML = `<p>Claimed by ${name}</p><button onclick="unclaimBed('${id}', '${type}')">Unclaim</button>`;
        const Claim = Parse.Object.extend('Claims');
        const claim = new Claim();
        claim.set('bedId', id);
        claim.set('name', name);
        claim.save();
    }
}

function unclaimBed(id, type) {
    if (confirm('Unclaim this bed?')) {
        const query = new Parse.Query('Claims');
        query.equalTo('bedId', id);
        query.first().then(claim => {
            if (claim) claim.destroy();
        });
    }
}

function loadClaims() {
    const query = new Parse.Query('Claims');
    query.find().then(results => {
        const claims = {};
        results.forEach(claim => {
            claims[claim.get('bedId')] = claim.get('name');
        });
        document.querySelectorAll('.bed-option').forEach(optionDiv => {
            const id = optionDiv.getAttribute('data-id');
            const type = optionDiv.getAttribute('data-type');
            const name = claims[id];
            if (name) {
                optionDiv.classList.add('claimed');
                optionDiv.innerHTML = `<p>Claimed by ${name}</p><button onclick="unclaimBed('${id}', '${type}')">Unclaim</button>`;
            } else {
                optionDiv.classList.remove('claimed');
                optionDiv.innerHTML = `<p>${type}</p><button onclick="claimBed(this)">Claim</button>`;
            }
        });
    });

    // Real-time sync with LiveQuery
    const subscription = query.subscribe();
    subscription.on('create', () => loadClaims());
    subscription.on('delete', () => loadClaims());
}

// Votes (general with delete/undo)
function submitVotes(type, formId) {
    const form = document.getElementById(formId);
    const selected = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    
    if (selected.length > 0) {
        selected.forEach(item => {
            const query = new Parse.Query(type);
            query.equalTo('item', item);
            query.first().then(vote => {
                if (vote) {
                    vote.increment('count');
                    vote.save();
                } else {
                    const Vote = Parse.Object.extend(type);
                    const newVote = new Vote();
                    newVote.set('item', item);
                    newVote.set('count', 1);
                    newVote.save();
                }
            });
        });
        form.reset();
    }
}

function loadVotes(type, resultsId, listId) {
    const query = new Parse.Query(type);
    query.find().then(results => {
        const votes = {};
        results.forEach(vote => {
            votes[vote.get('item')] = vote.get('count') || 0;
        });
        displayVotes(type, listId, votes);
    });

    // Real-time sync with LiveQuery
    const subscription = query.subscribe();
    subscription.on('update', () => loadVotes(type, resultsId, listId));
    subscription.on('create', () => loadVotes(type, resultsId, listId));
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
        delBtn.onclick = () => {
            const query = new Parse.Query(type);
            query.equalTo('item', key);
            query.first().then(vote => {
                if (vote) {
                    vote.increment('count', -1);
                    vote.save();
                }
            });
        };
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
        const query = new Parse.Query('Cigars');
        query.equalTo('name', name);
        query.first().then(pref => {
            if (pref) {
                pref.set('choice', choice);
                pref.set('count', parseInt(count) || 0);
                pref.save();
            } else {
                const Pref = Parse.Object.extend('Cigars');
                const newPref = new Pref();
                newPref.set('name', name);
                newPref.set('choice', choice);
                newPref.set('count', parseInt(count) || 0);
                newPref.save();
            }
        });
        form.reset();
        document.getElementById('cigars-count').disabled = true;
    } else {
        alert('Please enter your name!');
    }
}

function loadCigars() {
    const query = new Parse.Query('Cigars');
    query.find().then(results => {
        const list = document.getElementById('cigars-list');
        if (!list) return;
        list.innerHTML = '';
        results.forEach(pref => {
            const li = document.createElement('li');
            li.textContent = `${pref.get('name')}: ${pref.get('choice') === 'yes' ? `Yes, ${pref.get('count')} cigars` : 'No thanks'}`;
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.onclick = () => pref.destroy();
            li.appendChild(delBtn);
            list.appendChild(li);
        });
    });

    // Real-time sync with LiveQuery
    const subscription = query.subscribe();
    subscription.on('create', () => loadCigars());
    subscription.on('delete', () => loadCigars());
    subscription.on('update', () => loadCigars());
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
    const targetDate = new Date('2025-09-12T00:00:00');
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

// Interactive Map
function initMap() {
    const map = L.map('map').setView([35.5956, -82.5519], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

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

    L.marker([35.5948, -82.5512], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', iconSize: [25, 41]})}).addTo(map)
        .bindPopup('Pack Square Parking Garage (Start/End Point)');
}

// Plan Route
function planRoute() {
    const query = new Parse.Query('BreweryVotes');
    query.find().then(results => {
        const votes = {};
        results.forEach(vote => {
            votes[vote.get('item')] = vote.get('count') || 0;
        });
        const selected = Object.keys(votes).sort((a,b) => votes[b] - votes[a]);
        if (selected.length === 0) return alert('No votes yet!');

        const order = ['One World Brewing', 'Thirsty Monk Brewery', 'Highland Brewing Downtown', 'Wicked Weed Brewing', 'Asheville Brewing Company', 'Hi-Wire Brewing', 'Green Man Brewery', 'Twin Leaf Brewery', 'Burial Beer Co.', 'Catawba Brewing Company'];
        const sortedSelected = order.filter(name => selected.includes(name));

        const parking = 'Pack+Square+Garage,Asheville,NC';
        const waypoints = sortedSelected.map(name => encodeURIComponent(name + ',Asheville,NC')).join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${parking}&destination=${parking}&waypoints=${waypoints}&travelmode=walking`;
        window.open(url, '_blank');
    });
}