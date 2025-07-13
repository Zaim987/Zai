import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadUsers() {
  const auth = getAuth();
  const db = getFirestore();

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Ngisi elemen salam
      const nameTarget = document.getElementById("displayName");
      nameTarget.textContent = user.displayName || user.email || "Pengguna";

      // Gak usah appendChild maneh
    }
  });
}
