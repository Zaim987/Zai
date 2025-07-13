import { auth, db } from './firebase-init.js';
import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔐 Generate persistent device ID
let deviceId = localStorage.getItem("deviceId");
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem("deviceId", deviceId);
}

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("error");
  const loginBtn = document.getElementById("loginBtn");

  const sessionId = crypto.randomUUID(); // Sesi unik
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 menit

  loginBtn.classList.add("loading");
  errorDiv.textContent = "";

  try {
    // 🟢 Proses login
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      // 🔒 Cek deviceId cocok
      if (data.deviceId && data.deviceId !== deviceId) {
        await signOut(auth);
        errorDiv.textContent = "⚠️ Akun iki wes login ing device liyo!";
        loginBtn.classList.remove("loading");
        return;
      }

      // 🕒 Cek session aktif durung expired
      if (data.sessionId && (now - data.sessionTimestamp) < maxAge) {
        await signOut(auth);
        errorDiv.textContent = "⚠️ Iseh aktif sesi lawas!";
        loginBtn.classList.remove("loading");
        return;
      }
    }

    // 💾 Simpen deviceId + session anyar
    await setDoc(userRef, {
      deviceId,
      sessionId,
      sessionTimestamp: now
    }, { merge: true });

    // 💾 Simpen sesi lokal
    localStorage.setItem("sessionId", sessionId);
    window.location.href = "dashboard.html";

  } catch (error) {
    errorDiv.textContent = "Login gagal: " + error.message;
  } finally {
    loginBtn.classList.remove("loading");
  }
});
