import { auth } from './firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

onAuthStateChanged(auth, (user) => {
  if (user) {
    const notice = document.getElementById('autoLoginNotice');
    const countdown = document.getElementById('countdown');
    let detik = 3;

    document.querySelector('.login-container')?.style?.display = 'none';
    notice.style.display = 'block';
    countdown.innerText = detik;

    const tiker = setInterval(() => {
      detik--;
      countdown.innerText = detik;
      if (detik === 0) {
        clearInterval(tiker);
        window.location.href = "dashboard.html";
      }
    }, 1000);
  }
});
