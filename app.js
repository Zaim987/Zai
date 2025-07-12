import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, query, orderBy, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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
const db = getFirestore(app);

// --- UI Elements ---
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authMsg = document.getElementById('auth-msg');
const postForm = document.getElementById('post-form');
const postInput = document.getElementById('post-input');
const postsFeed = document.getElementById('posts-feed');
const usersList = document.getElementById('users-list');
const chatUsers = document.getElementById('chat-users');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

let currentUser = null;
let currentChatUser = null;

// --- Auth Handlers ---
loginBtn.onclick = async () => {
  try {
    const email = emailInput.value;
    const password = passwordInput.value;
    await signInWithEmailAndPassword(auth, email, password);
    authMsg.textContent = '';
  } catch (e) {
    authMsg.textContent = e.message;
  }
};
registerBtn.onclick = async () => {
  try {
    const email = emailInput.value;
    const password = passwordInput.value;
    await createUserWithEmailAndPassword(auth, email, password);
    authMsg.textContent = '';
  } catch (e) {
    authMsg.textContent = e.message;
  }
};
logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    authSection.style.display = 'none';
    mainSection.style.display = 'flex';
    setUserOnline(user.uid, user.email);
    renderFeed();
    renderUsers();
  } else {
    currentUser = null;
    authSection.style.display = 'block';
    mainSection.style.display = 'none';
  }
});

// --- Presence Tracking ---
async function setUserOnline(uid, email) {
  await setDoc(doc(db, 'presence', uid), { email, online: true, lastActive: serverTimestamp() });
  window.addEventListener('beforeunload', async () => {
    await setDoc(doc(db, 'presence', uid), { email, online: false, lastActive: serverTimestamp() });
  });
}

function renderUsers() {
  onSnapshot(collection(db, 'presence'), snapshot => {
    usersList.innerHTML = '';
    snapshot.forEach(doc => {
      const user = doc.data();
      if (user.online) {
        const li = document.createElement('li');
        li.textContent = user.email;
        li.onclick = () => openChat(doc.id, user.email);
        usersList.appendChild(li);
      }
    });
  });
}

// --- Feed (Text Only) ---
postForm.onsubmit = async e => {
  e.preventDefault();
  if (postInput.value.trim()) {
    await addDoc(collection(db, 'posts'), {
      uid: currentUser.uid,
      email: currentUser.email,
      text: postInput.value,
      created: serverTimestamp()
    });
    postInput.value = '';
  }
};
function renderFeed() {
  const q = query(collection(db, 'posts'), orderBy('created', 'desc'));
  onSnapshot(q, snapshot => {
    postsFeed.innerHTML = '';
    snapshot.forEach(doc => {
      const post = doc.data();
      const li = document.createElement('li');
      li.innerHTML = `<b>${post.email}</b>: ${post.text}`;
      postsFeed.appendChild(li);
    });
  });
}

// --- 1-on-1 Chat ---
function openChat(uid, email) {
  currentChatUser = { uid, email };
  chatForm.style.display = 'block';
  chatWindow.innerHTML = `<h3>Chat with ${email}</h3><div id="chat-messages"></div>`;
  renderChat(uid);
}
chatForm.onsubmit = async e => {
  e.preventDefault();
  if (chatInput.value.trim() && currentChatUser) {
    const chatId = getChatId(currentUser.uid, currentChatUser.uid);
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      from: currentUser.uid,
      to: currentChatUser.uid,
      text: chatInput.value,
      created: serverTimestamp()
    });
    chatInput.value = '';
  }
};
function renderChat(otherUid) {
  const chatId = getChatId(currentUser.uid, otherUid);
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('created', 'asc'));
  onSnapshot(q, snapshot => {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `<b>${msg.from === currentUser.uid ? 'You' : currentChatUser.email}:</b> ${msg.text}`;
      chatMessages.appendChild(div);
    });
  });
}
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}