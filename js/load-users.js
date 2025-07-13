import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function loadUsers() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const nameDisplay = document.getElementById("displayName");
    nameDisplay.textContent = user.displayName || user.email || "Pengguna";
  }
}
