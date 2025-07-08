// Import Firebase SDK modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Konfigurasi Firebase-mu (GANTI karo punyamu)
const firebaseConfig = {
  apiKey: "GANTI_KENE",
  authDomain: "GANTI_KENE",
  projectId: "GANTI_KENE",
  storageBucket: "GANTI_KENE",
  messagingSenderId: "GANTI_KENE",
  appId: "GANTI_KENE"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ambil elemen form
const form = document.getElementById("registerForm");
const errorDiv = document.getElementById("error");

// Event submit form
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  errorDiv.textContent = ""; // Reset error

  try {
    // 1. Register user Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Update profil (displayName)
    await updateProfile(user, { displayName: name });

    // 3. Simpen data user neng Firestore (koleksi: users)
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: name,
      email: email,
      createdAt: serverTimestamp(),
      online: false
    });

    // 4. Arahke user menyang dashboard
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("Error Register:", error.message);
    errorDiv.textContent = error.message;
  }
});