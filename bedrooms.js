// Bedroom Claims Module
import { db } from "./firebase"; // Import the db reference
import { ref, onValue, get, set } from "firebase/database";

export function claimBed(button) {
  const optionDiv = button.parentElement;
  const id = optionDiv.getAttribute("data-id");
  const name = prompt("Enter your name to claim this bed:");
  if (name) {
    optionDiv.classList.add("claimed");
    optionDiv.innerHTML = `<p>Claimed by ${name}</p>`;

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

export function loadClaims() {
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