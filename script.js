// Firebase Configuration & Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const currentUserSpan = document.getElementById('currentUser');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const errorText = document.getElementById('errorText');
const successText = document.getElementById('successText');

// Global Variables
let currentUser = null;
let unsubscribeMessages = null;

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    showLoading();
    
    // Monitor authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            showChatInterface();
            loadMessages();
        } else {
            currentUser = null;
            showAuthInterface();
        }
        hideLoading();
    });
}

function setupEventListeners() {
    // Authentication Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Chat Form
    document.getElementById('messageForm').addEventListener('submit', handleSendMessage);
    
    // Logout Button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Enter key for message input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('messageForm').dispatchEvent(new Event('submit'));
        }
    });
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    showLoading();
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showSuccess('Welcome back!');
    } catch (error) {
        hideLoading();
        showError(getErrorMessage(error.code));
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (!name || !email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    showLoading();
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        showSuccess('Account created successfully!');
    } catch (error) {
        hideLoading();
        showError(getErrorMessage(error.code));
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        showSuccess('Logged out successfully');
    } catch (error) {
        showError('Error logging out');
    }
}

// Chat Functions
async function handleSendMessage(e) {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    if (message.length > 500) {
        showError('Message too long (max 500 characters)');
        return;
    }
    
    try {
        await addDoc(collection(db, 'messages'), {
            text: message,
            sender: currentUser.displayName || currentUser.email,
            senderEmail: currentUser.email,
            timestamp: serverTimestamp(),
            userId: currentUser.uid
        });
        
        messageInput.value = '';
        messageInput.focus();
    } catch (error) {
        showError('Failed to send message');
        console.error('Error sending message:', error);
    }
}

function loadMessages() {
    // Unsubscribe from previous listener if exists
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }
    
    const messagesQuery = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'asc')
    );
    
    unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        messagesContainer.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const messageData = doc.data();
            displayMessage(messageData);
        });
        
        scrollToBottom();
    }, (error) => {
        console.error('Error loading messages:', error);
        showError('Failed to load messages');
    });
}

function displayMessage(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.userId === currentUser.uid ? 'own' : ''}`;
    
    const time = messageData.timestamp ? 
        formatTime(messageData.timestamp.toDate()) : 
        formatTime(new Date());
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender">${escapeHtml(messageData.sender)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(messageData.text)}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
}

// UI Helper Functions
function showAuthInterface() {
    authContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    clearAuthForms();
}

function showChatInterface() {
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Display current user info
    const displayName = currentUser.displayName || currentUser.email.split('@')[0];
    currentUserSpan.textContent = displayName;
    
    // Focus message input
    setTimeout(() => {
        messageInput.focus();
    }, 100);
}

function showLogin() {
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    clearAuthForms();
}

function showRegister() {
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    clearAuthForms();
}

function clearAuthForms() {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showSuccess(message) {
    successText.textContent = message;
    successMessage.classList.remove('hidden');
    
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 3000);
}

function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Utility Functions
function formatTime(date) {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password is too weak',
        'auth/invalid-email': 'Invalid email format',
        'auth/too-many-requests': 'Too many failed attempts. Try again later',
        'auth/network-request-failed': 'Network error. Check your connection'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again';
}

// Make functions global for HTML onclick handlers
window.showLogin = showLogin;
window.showRegister = showRegister;
window.hideError = hideError;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }
});
