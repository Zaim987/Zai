import { auth, db } from './firebase-init.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorDiv = document.getElementById("error");

// 🔐 Generate & simpen deviceId unik per perangkat
let deviceId = localStorage.getItem("deviceId");
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem("deviceId", deviceId);
}

// ⛔️ Form disembunyikan dulu sampe auth siap
loginForm.style.display = "none";

// ✅ Cek session saat halaman dibuka
onAuthStateChanged(async (user) => {
  const sessionId = localStorage.getItem("sessionId");
  if (!user || !sessionId) {
    loginForm.style.display = "block";
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const ts = data.sessionTimestamp;
      const sessionTimeMs = ts?.toMillis ? ts.toMillis() : ts;
      const now = Date.now();
      const maxAge = 30 * 60 * 1000;

      const storedDeviceId = data.deviceId;

      if (
        data.sessionId === sessionId &&
        storedDeviceId === deviceId &&
        (now - sessionTimeMs) < maxAge
      ) {
        console.log("✅ Session valid & device cocok. Redirecting...");
        window.location.href = "dashboard.html";
        return;
      }
    }
  } catch (err) {
    console.error("🔥 Error cek session:", err);
  }

  // Nek gagal redirect, tampilno form
  loginForm.style.display = "block";
});

// ✅ Proses login manual
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginBtn.classList.add("loading");
  loginBtn.disabled = true;
  errorDiv.textContent = "";

  const sessionId = crypto.randomUUID();
  const now = Date.now();
  const maxAge = 30 * 60 * 1000;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const ts = data.sessionTimestamp;
      const sessionTimeMs = ts?.toMillis ? ts.toMillis() : ts;
      const storedDeviceId = data.deviceId;

      // ❌ Nek isih aktif & beda device, tolak
      if (
        data.sessionId &&
        (now - sessionTimeMs) < maxAge &&
        storedDeviceId !== deviceId
      ) {
        await signOut(auth);
        errorDiv.textContent = "⚠️ Iseh login nang device liyo!";
        return;
      }
    }

    // ✅ Simpen session anyar karo deviceId
    await setDoc(userRef, {
      sessionId,
      sessionTimestamp: now,
      deviceId
    }, { merge: true });

    localStorage.setItem("sessionId", sessionId);
    window.location.href = "dashboard.html";

  } catch (error) {
    let msg = "Login gagal, jancok!";
    if (error.code === 'auth/user-not-found') msg = "📛 Email ora ketemu.";
    else if (error.code === 'auth/wrong-password') msg = "🔒 Password salah.";
    else if (error.code === 'auth/invalid-email') msg = "📬 Email ra valid.";
    else if (error.code === 'auth/too-many-requests') msg = "🚫 Kakehan nyoba, enteni sek!";
    errorDiv.textContent = msg;
  } finally {
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
  }
});
