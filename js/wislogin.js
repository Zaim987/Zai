import { auth } from './firebase-init.js'; import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

console.log("🔥 wislogin.js aktif");

onAuthStateChanged(auth, (user) => { console.log("🧠 Firebase user status:", user);

if (user) { console.log("✅ User login, redirecting in 5s");

document.querySelector('.login-container')?.style?.setProperty('display', 'none');

const popup = document.createElement('div');
popup.innerHTML = `
  <div class="popup-content" id="popup-content">
    <div>🔐 Anda sudah login</div>
    <div>Mengarahkan ke dashboard dalam <span id="countdown">5</span> detik...</div>
  </div>
`;
popup.className = 'modal-login-popup';
document.body.appendChild(popup);

const style = document.createElement('style');
style.textContent = `
  .modal-login-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #0d1117;
    padding: 2rem;
    border-radius: 16px;
    box-shadow: 0 0 25px #00f0ff;
    color: #00f0ff;
    text-align: center;
    font-size: 1.1rem;
    z-index: 999;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .modal-login-popup.show {
    opacity: 1;
  }
  .modal-login-popup .popup-content > div:first-child {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
`;
document.head.appendChild(style);

requestAnimationFrame(() => {
  popup.classList.add('show');
});

setTimeout(() => {
  const countdown = document.getElementById('countdown');
  if (!countdown) {
    console.error("❌ Countdown element NOT FOUND");
    return;
  }

  let seconds = 5;
  countdown.innerText = seconds;

  const timer = setInterval(() => {
    seconds--;
    countdown.innerText = seconds;
    console.log("⏱️ Detik ke:", seconds);

    if (seconds <= 0) {
      clearInterval(timer);
      console.log("➡️ Redirecting to dashboard...");
      window.location.href = "dashboard.html";
    }
  }, 1000);
}, 100);

} else { console.warn("❌ User durung login!"); } });

