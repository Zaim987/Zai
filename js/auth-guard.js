
import { auth } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    setTimeout(() => {
      document.getElementById('splash-screen').style.display = 'none';
      document.getElementById('main-content').classList.remove('hidden');
    }, 3500);
  }
});
