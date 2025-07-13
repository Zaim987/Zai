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

// 🔁 Auto redirect nek wis login valid
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const sessionId = localStorage.getItem("sessionId");
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const now = Date.now();
      const maxAge = 30 * 60 * 1000;

      if (
        data.sessionId === sessionId &&
        (now - data.sessionTimestamp) < maxAge
      ) {
        window.location.href = "dashboard.html";
      }
    }
  }
});

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
      if (data.sessionId && (now - data.sessionTimestamp) < maxAge) {
        await signOut(auth);
        errorDiv.textContent = "⚠️ Iseh login nang device liyo!";
        return;
      }
    }

    // Update session anyar
    await setDoc(userRef, {
      sessionId,
      sessionTimestamp: now,
    }, { merge: true });

    localStorage.setItem("sessionId", sessionId);
    window.location.href = "dashboard.html";

  } catch (error) {
    let msg = "Login gagal, cok!";
    if (error.code === 'auth/user-not-found') msg = "📛 Email ora ketemu.";
    else if (error.code === 'auth/wrong-password') msg = "🔒 Password salah, goblok.";
    else if (error.code === 'auth/invalid-email') msg = "📬 Email ra valid.";
    errorDiv.textContent = msg;
  } finally {
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
  }
});
