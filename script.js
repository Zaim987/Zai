import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// =================== Firebase Config ===================
const firebaseConfig = {
  apiKey: "AIzaSyApM08t1ghCxK56_0znbPMT9i5zduOKmn0",
  authDomain: "quantechapp.firebaseapp.com",
  databaseURL: "https://quantechapp-default-rtdb.firebaseio.com",
  projectId: "quantechapp",
  storageBucket: "quantechapp.firebasestorage.app",
  messagingSenderId: "825384610343",
  appId: "1:825384610343:web:e490bc84877e6d7a93bc02",
  measurementId: "G-E9L012VH32"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ===================== DOM =====================

const authContainer = document.getElementById('auth-container');
const loginForm     = document.getElementById('login-form');
const registerForm  = document.getElementById('register-form');
const toRegisterBtn = document.getElementById('to-register');
const toLoginBtn    = document.getElementById('to-login');
const loginError    = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

const chatApp   = document.getElementById('chat-app');
const chatForm  = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMsgs  = document.getElementById('chat-messages');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// =============== Auth Logic ===============

// Switch Auth Forms
toRegisterBtn.onclick = e => {
  loginForm.classList.remove('active');
  registerForm.classList.add('active');
  loginError.textContent = '';
  registerError.textContent = '';
};
toLoginBtn.onclick = e => {
  registerForm.classList.remove('active');
  loginForm.classList.add('active');
  loginError.textContent = '';
  registerError.textContent = '';
};

// Handle Register
registerForm.onsubmit = async e => {
  e.preventDefault();
  registerError.textContent = '';
  const email = document.getElementById('register-email').value.trim();
  const pass  = document.getElementById('register-password').value;

  // Simple Email & Password Validation
  if (!email.match(/^[\w\-.]+@[\w\-]+(\.[\w\-]+)+$/)) {
    registerError.textContent = "Format email tidak valid!";
    return;
  }
  if (pass.length < 6) {
    registerError.textContent = "Password minimal 6 karakter";
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch(err) {
    if (err.code === 'auth/email-already-in-use') registerError.textContent = "Email sudah digunakan";
    else if (err.code === 'auth/weak-password') registerError.textContent = "Password terlalu lemah";
    else registerError.textContent = err.message;
  }
};

// Handle Login
loginForm.onsubmit = async e => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(err) {
    if (err.code === 'auth/wrong-password') loginError.textContent = "Password salah";
    else if (err.code === 'auth/user-not-found') loginError.textContent = "User tidak ditemukan";
    else if (err.code === 'auth/invalid-email') loginError.textContent = "Format email salah";
    else loginError.textContent = err.message;
  }
};

// Handle Logout
logoutBtn.onclick = () => signOut(auth);

// =============== Realtime Chat Logic ===============

let unsubscribeChat = null;

function showChat(user) {
  authContainer.style.display = 'none';
  chatApp.style.display = 'flex';

  userEmail.textContent = user.email;

  // --- Realtime Listener ---
  if (unsubscribeChat) unsubscribeChat();
  
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
  unsubscribeChat = onSnapshot(q, snap => {
    chatMsgs.innerHTML = "";
    snap.forEach(doc => {
      const msg = doc.data();
      addMessageToUI(msg, user);
    });
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  });
}

function showAuth() {
  authContainer.style.display = 'flex';
  chatApp.style.display = 'none';
  chatInput.value = "";
  if (unsubscribeChat) unsubscribeChat();
}

// Add Message to Chat
function addMessageToUI(msg, user) {
  const wrap = document.createElement('div');
  wrap.className = "message" + (user && msg.uid === user.uid ? " own" : "");
  const sender = document.createElement('span');
  sender.className = "sender";
  sender.textContent = msg.displayName || msg.email.split("@")[0];
  wrap.appendChild(sender);

  const text = document.createElement('span');
  text.textContent = msg.text;
  wrap.appendChild(text);

  // Time
  const time = document.createElement('span');
  time.className = "msg-time";
  time.textContent = msg.createdAt?.toDate ? formatTime(msg.createdAt.toDate()) : '';
  wrap.appendChild(time);

  chatMsgs.appendChild(wrap);
}

function formatTime(dt) {
  let d = new Date(dt);
  return (
    d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) +
    " " +
    d.toLocaleDateString()
  );
}

// Send Message
chatForm.onsubmit = async e => {
  e.preventDefault();
  const msgVal = chatInput.value.trim();
  chatInput.value = '';

  if (!auth.currentUser || !msgVal) return;
  await addDoc(collection(db, 'messages'), {
    text: msgVal,
    uid: auth.currentUser.uid,
    email: auth.currentUser.email,
    displayName: auth.currentUser.email.split("@")[0],
    createdAt: serverTimestamp()
  });
};

// =============== Auth State Listener ===============
onAuthStateChanged(auth, user => {
  if (user) showChat(user);
  else showAuth();
});
