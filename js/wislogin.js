import { auth } from './firebase-init.js'; import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

console.log("🔥 wislogin.js aktif");

onAuthStateChanged(auth, (user) => { console.log("🧠 Firebase user status:", user); if (user) { console.log("✅ User login, redirecting in 5s");

document.querySelector('.login-container')?.style?.display = 'none';

// Buat popup glowing
const popup = document.createElement('div');
popup.innerHTML = `
  <div class="popup-content">
    <div>🔐 Anda sudah login</div>
    <div>Mengarahkan ke dashboard dalam <span id="countdown">5</span> detik...</div>
  </div>
`;
popup.className = 'modal-login-popup';
document.body.appendChild(popup);

// Tambah style popup + animasi langsung via JS
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeSlideIn {
    0% {
      opacity: 0;
      transform: translate(-50%, -60%);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

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
    animation: fadeSlideIn 0.6s ease-out forwards;
  }

  .modal-login-popup .popup-content > div:first-child {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
`;
document.head.appendChild(style);

// Hitung mundur dengan delay supaya DOM popup siap
setTimeout(() => {
  const countdown = popup.querySelector('#countdown');
  let seconds = 5;
  const timer = setInterval(() => {
    seconds--;
    if (countdown) countdown.textContent = seconds;
    if (seconds === 0) {
      clearInterval(timer);
      window.location.href = "dashboard.html";
    }
  }, 1000);
}, 50);

} else { console.warn("❌ User durung login!"); } });

