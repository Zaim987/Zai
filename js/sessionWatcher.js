import { auth, db } from './firebase-init.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function startSessionWatcher() {
  const localSessionId = localStorage.getItem("sessionId");
  let unsubscribe = null;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const userRef = doc(db, "users", user.uid);

    // pasang listener ke Firestore
    unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const serverSessionId = data.sessionId;

      if (serverSessionId !== localSessionId) {
        console.warn("⚠️ Session konflik! Logout...");
        await signOut(auth);
        localStorage.removeItem("sessionId");
        alert("⚠️ Sampeyan wis login nang device liyo. Sampeyan di-logout otomatis.");
        window.location.href = "login.html";
      } else {
        // Auto masuk dashboard nek session valid
        if (!window.location.href.includes("dashboard.html")) {
          window.location.href = "dashboard.html";
        }
      }
    });
  });
}
