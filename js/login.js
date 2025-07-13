import { auth, db } from './firebase-init.js';
import {
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ AUTO REDIRECT NEK WIS LOGIN & SESSION VALID
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  const sessionId = localStorage.getItem("sessionId");
  if (!sessionId) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const timestamp = data.sessionTimestamp;

      let sessionTimeMs;
      if (typeof timestamp === 'number') {
        sessionTimeMs = timestamp;
      } else if (timestamp.toMillis) {
        sessionTimeMs = timestamp.toMillis();
      } else {
        return;
      }

      const now = Date.now();
      const maxAge = 30 * 60 * 1000;

      if (
        data.sessionId === sessionId &&
        (now - sessionTimeMs) < maxAge
      ) {
        console.log("✅ Session valid, redirecting...");
        window.location.href = "dashboard.html";
      }
    }
  } catch (err) {
    console.error("🔥 Error pas cek session:", err);
  }
});

// ✅ LOGIN SUBMIT
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("error");
  const loginBtn = document.getElementById("loginBtn");

  const sessionId = crypto.randomUUID(); // Session unik
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 menit

  loginBtn.classList.add("loading");
  loginBtn.disabled = true;
  errorDiv.textContent = "";

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const timestamp = data.sessionTimestamp;

      let sessionTimeMs;
      if (typeof timestamp === 'number') {
        sessionTimeMs = timestamp;
      } else if (timestamp?.toMillis) {
        sessionTimeMs = timestamp.toMillis();
      }

      if (data.sessionId && (now - sessionTimeMs) < maxAge) {
        await signOut(auth);
        errorDiv.textContent = "⚠️ Iseh login nang device liyo!";
        return;
      }
    }

    // Simpen session anyar
    await setDoc(userRef, {
      sessionId,
      sessionTimestamp: now
    }, { merge: true });

    localStorage.setItem("sessionId", sessionId);
    window.location.href = "dashboard.html";

  } catch (error) {
    let msg = "Login gagal, jancok!";
    if (error.code === 'auth/user-not-found') msg = "📛 Email ora ketemu.";
    else if (error.code === 'auth/wrong-password') msg = "🔒 Password salah, goblok.";
    else if (error.code === 'auth/invalid-email') msg = "📬 Email ra valid.";
    else if (error.code === 'auth/too-many-requests') msg = "🚫 Kakehan nyoba, enteni sek!";
    errorDiv.textContent = msg;
  } finally {
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
  }
});
