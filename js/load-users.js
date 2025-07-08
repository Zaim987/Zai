import { auth, db } from './firebase-init.js';
import {
  collection, getDocs,
  doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Fungsi utama: nampilin user lan update teks welcome
export async function loadUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  const list = document.getElementById("user-list");
  let delay = 8;

  querySnapshot.forEach((docSnap, index) => {
  const data = docSnap.data();
  const isCurrentUser = data.email === auth.currentUser?.email;
  if (isCurrentUser) return; // 👉 Skip user sing lagi login

  const div = document.createElement("div");
  div.className = "user-item";
  div.textContent = `${data.displayName || 'No Name'} (${data.email || 'No Email'})`;
  div.style.animationDelay = `${delay + index * 0.3}s`;
  list.appendChild(div);
});

  // Tambahan: Ganti teks "Selamat Datang, Zaim!"
  try {
    const waitForAuth = () =>
      new Promise(resolve => {
        const unsub = auth.onAuthStateChanged(user => {
          if (user) {
            unsub();
            resolve(user);
          }
        });
      });

    const user = auth.currentUser || await waitForAuth();
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const displayName = userSnap.data().displayName || "Pengguna";
      const welcomeEl = document.querySelector(".welcome-text");
      if (welcomeEl) {
        welcomeEl.textContent = `Selamat Datang, ${displayName}!`;
      }
    } else {
      console.warn("Dokumen user tidak ditemukan.");
    }
  } catch (err) {
    console.error("Gagal ambil displayName:", err);
  }
}
