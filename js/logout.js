import { auth, db } from './firebase-init.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".menu-btn.logout");

  logoutBtn?.addEventListener("click", () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);

          // 🔥 Update: hapus sessionId & sessionTimestamp
          await updateDoc(userRef, {
            sessionId: "",
            sessionTimestamp: 0,
            online: false // opsional, sesuai logika sebelumnya
          });

          // 🧼 Bersihin localStorage
          localStorage.removeItem("sessionId");

          await signOut(auth);
          window.location.href = "login.html";
        } catch (err) {
          console.error("Logout error:", err);
        }
      }
    });
  });
});
