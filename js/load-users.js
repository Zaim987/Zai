
import { db } from './firebase-init.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  const list = document.getElementById("user-list");
  let delay = 8;
  querySnapshot.forEach((docSnap, index) => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "user-item";
    div.textContent = `${data.displayName || 'No Name'} (${data.email || 'No Email'})`;
    div.style.animationDelay = `${delay + index * 0.3}s`;
    list.appendChild(div);
  });
}
