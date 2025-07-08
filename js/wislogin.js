import { auth } from './js/firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

console.log("🔥 wislogin.js aktif");

onAuthStateChanged(auth, (user) => {
  console.log("🧠 Firebase user status:", user);
  if (user) {
    alert("🔐 AUTO LOGIN SUCCESS! Redirecting...");
    window.location.href = "dashboard.html";
  } else {
    console.warn("❌ User durung login!");
  }
});
