
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".menu-btn.logout");
  logoutBtn?.addEventListener("click", () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, { online: false });
          await signOut(auth);
          window.location.href = "login.html";
        } catch (err) {
          console.error("Logout error:", err);
        }
      }
    });
  });
});
