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

// 🔐 Generate & simpen deviceId unik
let deviceId = localStorage.getItem("deviceId");
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem("deviceId", deviceId);
}
console.log("📱 deviceId:", deviceId);

// ⛔️ Form disembunyikan sek ben ora kedip
loginForm.style.display = "none";

// ✅ Auto redirect nek session valid & device cocok
onAuthStateChanged(async (user) => {
  const sessionId = localStorage.getItem("sessionId");
  if (!user || !sessionId) {
    console.log("ℹ️ Belum login atau sessionId kosong");
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

      console.log("📦 Data Firestore:", data);

      if (
        data.sessionId === sessionId &&
        data.deviceId === deviceId &&
        (now - sessionTimeMs) < maxAge
      ) {
        console.log("✅ Session valid & device cocok, redirecting...");
        window.location.href = "dashboard.html";
        return;
      } else {
        console.warn("⏳ Session mismatch or expired or beda device");
      }
    } else {
      console.warn("❗️ Data user durung ada");
    }
  } catch (err) {
    console.error("🔥 Error pas cek session:", err);
  }

  loginForm.style.display = "block";
});

// ✅ Submit Login
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

  console.log("🔑 Login attempt:", { email });

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

      console.log("🧾 Existing session data:", data);

      if (
        data.sessionId &&
        (now - sessionTimeMs) < maxAge &&
        storedDeviceId !== deviceId
      ) {
        console.warn("🚫 Login ditolak: iseh aktif di device liyo");
        await signOut(auth);
        errorDiv.textContent = "⚠️ Iseh login nang device liyo!";
        return;
      }
    }

    // ✅ Simpen session + deviceId
    console.log("📤 Nyimpen session ke Firestore:", {
      sessionId,
      sessionTimestamp: now,
      deviceId
    });

    try {
      await setDoc(userRef, {
        sessionId,
        sessionTimestamp: now,
        deviceId
      }, { merge: true });
      console.log("✅ Session tersimpen sukses!");
    } catch (err) {
      console.error("❌ Gagal nyimpen Firestore:", err);
      errorDiv.textContent = "🔥 Error nyimpen session Firestore!";
      return;
    }

    localStorage.setItem("sessionId", sessionId);
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("❌ Login error:", error);
    let msg = "Login gagal!";
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
