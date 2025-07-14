// Import CSS
import "./styles.css";

// Import Firebase to initialize it early
import "./firebase"; // This runs the init

// Import all modules
// import { initializePage } from "./modules/pageInitializer";
import { claimBed, loadClaims } from "./modules/bedrooms";
import {
  submitVotes,
  loadVotes,
  displayVotes,
  planRoute,
  initMap,
} from "./modules/breweries";
import {
  submitOtherVotes,
  displayOtherVotes,
  addActivity,
  loadOtherActivities,
} from "./modules/activities";
import {
  submitGolfVotes,
  displayGolfVotes,
  addGolf,
  loadGolf,
} from "./modules/golf";
import { addItem, loadShopping } from "./modules/shopping";
import { submitCigars, displayCigars } from "./modules/cigars";
import { updateCountdown } from "./modules/countdown";

// Make functions globally available for HTML onclick handlers
window.claimBed = claimBed;
window.submitVotes = submitVotes;
window.planRoute = planRoute;
window.submitOtherVotes = submitOtherVotes;
window.addActivity = addActivity;
window.submitGolfVotes = submitGolfVotes;
window.addGolf = addGolf;
window.addItem = addItem;
window.submitCigars = submitCigars;

// Initialize page when DOM is loaded
// document.addEventListener("DOMContentLoaded", () => {
//   initializePage();
// });

// Also run initialization on window load for compatibility
window.onload = function() {
  loadClaims();
  loadVotes();
  loadShopping();
  loadGolf();
  loadOtherActivities();
  displayCigars();
  if (document.getElementById("map")) initMap();
  updateCountdown();
  setInterval(updateCountdown, 1000);
};