// Firebase Configuration & Imports
import { initializeApp as initializeFirebaseApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyApM08t1ghCxK56_0znbPMT9i5zduOKmn0",
    authDomain: "quantechapp.firebaseapp.com",
    databaseURL: "https://quantechapp-default-rtdb.firebaseio.com",
    projectId: "quantechapp",
    storageBucket: "quantechapp.appspot.com",
    messagingSenderId: "825384610343",
    appId: "1:825384610343:web:e490bc84877e6d7a93bc02",
    measurementId: "G-E9L012VH32"
};

// Initialize Firebase
const app = initializeFirebaseApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sidebarCurrentUser = document.getElementById('sidebarCurrentUser');
const chatTitle = document.getElementById('chatTitle');
const chatSubtitle = document.getElementById('chatSubtitle');
const chatIcon = document.getElementById('chatIcon');
const privateChatsContainer = document.getElementById('privateChats');
const onlineUsersContainer = document.getElementById('onlineUsers');
const onlineCountSpan = document.getElementById('onlineCount');
const newChatModal = document.getElementById('newChatModal');
const userSearchInput = document.getElementById('userSearchInput');
const searchResults = document.getElementById('searchResults');
const allUsersList = document.getElementById('allUsersList');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const errorText = document.getElementById('errorText');
const successText = document.getElementById('successText');

let currentUser = null;
let currentRoom = 'global';
let currentChatPartner = null;
let unsubscribeMessages = null;
let unsubscribeUsers = null;
let unsubscribePrivateChats = null;
let allUsers = [];

window.addEventListener('DOMContentLoaded', () => {
    initAppLogic();
    setupEventListeners();
});

function initAppLogic() {
    showLoading();

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            updateUserOnlineStatus(true);
            showChatInterface();
            loadUsers();
            loadPrivateChats();
            switchToRoom('global');
        } else {
            currentUser = null;
            if (unsubscribeMessages) unsubscribeMessages();
            if (unsubscribeUsers) unsubscribeUsers();
            if (unsubscribePrivateChats) unsubscribePrivateChats();
            showAuthInterface();
        }
        hideLoading();
    });

    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            updateUserOnlineStatus(false);
        }
    });
}

function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    document.getElementById('messageForm').addEventListener('submit', handleSendMessage);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('newChatBtn').addEventListener('click', openNewChatModal);
    userSearchInput.addEventListener('input', handleUserSearch);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('messageForm').dispatchEvent(new Event('submit'));
        }
    });
}

// The rest of the logic remains the same
// ... Paste remaining code here (continued from your current full script)


// Authentication Functions (Same as before)
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
        
        // Add user to users collection
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            displayName: name,
            email: email,
            isOnline: true,
            lastSeen: serverTimestamp(),
            createdAt: serverTimestamp()
        });
        
        showSuccess('Account created successfully!');
    } catch (error) {
        hideLoading();
        showError(getErrorMessage(error.code));
    }
}

async function handleLogout() {
    try {
        await updateUserOnlineStatus(false);
        await signOut(auth);
        showSuccess('Logged out successfully');
    } catch (error) {
        showError('Error logging out');
    }
}

// User Management Functions
async function updateUserOnlineStatus(isOnline) {
    if (!currentUser) return;
    
    try {
        await setDoc(doc(db, 'users', currentUser.uid), {
            displayName: currentUser.displayName || currentUser.email,
            email: currentUser.email,
            isOnline: isOnline,
            lastSeen: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating user status:', error);
    }
}

function loadUsers() {
    if (unsubscribeUsers) unsubscribeUsers();
    
    const usersQuery = query(collection(db, 'users'));
    
    unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        allUsers = [];
        let onlineCount = 0;
        
        snapshot.forEach((doc) => {
            const userData = doc.data();
            if (doc.id !== currentUser.uid) {
                allUsers.push({
                    id: doc.id,
                    ...userData
                });
                
                if (userData.isOnline) {
                    onlineCount++;
                }
            }
        });
        
        displayOnlineUsers();
        displayAllUsersInModal();
        onlineCountSpan.textContent = onlineCount;
    });
}

function displayOnlineUsers() {
    onlineUsersContainer.innerHTML = '';
    
    const onlineUsers = allUsers.filter(user => user.isOnline);
    
    onlineUsers.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.onclick = () => startPrivateChat(user);
        
        userDiv.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="user-info">
                <span class="user-name">${escapeHtml(user.displayName)}</span>
                <span class="user-status online">Online</span>
            </div>
        `;
        
        onlineUsersContainer.appendChild(userDiv);
    });
}

function displayAllUsersInModal() {
    allUsersList.innerHTML = '';
    
    allUsers.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'search-user-item';
        userDiv.onclick = () => {
            startPrivateChat(user);
            closeNewChatModal();
        };
        
        userDiv.innerHTML = `
            <div class="search-user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="search-user-info">
                <div class="search-user-name">${escapeHtml(user.displayName)}</div>
                <div class="search-user-email">${escapeHtml(user.email)}</div>
            </div>
        `;
        
        allUsersList.appendChild(userDiv);
    });
}

// Private Chat Functions
async function startPrivateChat(user) {
    const chatId = generateChatId(currentUser.uid, user.id);
    
    // Create or update private chat document
    try {
        await setDoc(doc(db, 'privateChats', chatId), {
            participants: [currentUser.uid, user.id],
            participantDetails: {
                [currentUser.uid]: {
                    displayName: currentUser.displayName || currentUser.email,
                    email: currentUser.email
                },
                [user.id]: {
                    displayName: user.displayName,
                    email: user.email
                }
            },
            lastMessage: null,
            lastMessageTime: null,
            createdAt: serverTimestamp()
        }, { merge: true });
        
        switchToRoom('private', chatId, user);
    } catch (error) {
        showError('Failed to start private chat');
        console.error('Error starting private chat:', error);
    }
}

function generateChatId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

function loadPrivateChats() {
    if (unsubscribePrivateChats) unsubscribePrivateChats();
    
    const privateChatsQuery = query(
        collection(db, 'privateChats'),
        where('participants', 'array-contains', currentUser.uid)
    );
    
    unsubscribePrivateChats = onSnapshot(privateChatsQuery, (snapshot) => {
        privateChatsContainer.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const chatData = doc.data();
            const partnerId = chatData.participants.find(id => id !== currentUser.uid);
            const partnerData = chatData.participantDetails[partnerId];
            
            if (partnerData) {
                displayPrivateChat(doc.id, partnerData);
            }
        });
    });
}

function displayPrivateChat(chatId, partnerData) {
    const chatDiv = document.createElement('div');
    chatDiv.className = 'room-item';
    chatDiv.setAttribute('data-room', `private_${chatId}`);
    chatDiv.onclick = () => switchToRoom('private', chatId, partnerData);
    
    chatDiv.innerHTML = `
        <div class="room-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="room-info">
            <span class="room-name">${escapeHtml(partnerData.displayName)}</span>
            <span class="room-info-text">Private chat</span>
        </div>
    `;
    
    privateChatsContainer.appendChild(chatDiv);
}

// Chat Functions
function switchToRoom(roomType, chatId = null, partnerData = null) {
    // Remove active class from all room items
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (roomType === 'global') {
        currentRoom = 'global';
        currentChatPartner = null;
        chatTitle.textContent = 'Global Chat';
        chatSubtitle.textContent = 'Public channel for everyone';
        chatIcon.className = 'fas fa-globe';
        
        // Add active class to global chat
        document.querySelector('.room-item[data-room="global"]').classList.add('active');
        
        loadGlobalMessages();
    } else if (roomType === 'private' && chatId && partnerData) {
        currentRoom = chatId;
        currentChatPartner = partnerData;
        chatTitle.textContent = partnerData.displayName;
        chatSubtitle.textContent = 'Private conversation';
        chatIcon.className = 'fas fa-user';
        
        // Add active class to private chat
        const privateRoomElement = document.querySelector(`.room-item[data-room="private_${chatId}"]`);
        if (privateRoomElement) {
            privateRoomElement.classList.add('active');
        }
        
        loadPrivateMessages(chatId);
    }
    
    messageInput.focus();
}

function loadGlobalMessages() {
    if (unsubscribeMessages) unsubscribeMessages();
    
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
    });
}

function loadPrivateMessages(chatId) {
    if (unsubscribeMessages) unsubscribeMessages();
    
    const messagesQuery = query(
        collection(db, 'privateChats', chatId, 'messages'),
        orderBy('timestamp', 'asc')
    );
    
    unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        messagesContainer.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const messageData = doc.data();
            displayMessage(messageData);
        });
        
        scrollToBottom();
    });
}

async function handleSendMessage(e) {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    if (message.length > 500) {
        showError('Message too long (max 500 characters)');
        return;
    }
    
    try {
        const messageData = {
            text: message,
            sender: currentUser.displayName || currentUser.email,
            senderEmail: currentUser.email,
            timestamp: serverTimestamp(),
            userId: currentUser.uid
        };
        
        if (currentRoom === 'global') {
            // Send to global chat
            await addDoc(collection(db, 'messages'), messageData);
        } else {
            // Send to private chat
            await addDoc(collection(db, 'privateChats', currentRoom, 'messages'), messageData);
            
            // Update last message in private chat document
            await updateDoc(doc(db, 'privateChats', currentRoom), {
                lastMessage: message,
                lastMessageTime: serverTimestamp()
            });
        }
        
        messageInput.value = '';
        messageInput.focus();
    } catch (error) {
        showError('Failed to send message');
        console.error('Error sending message:', error);
    }
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

// Modal Functions
function openNewChatModal() {
    newChatModal.classList.remove('hidden');
    userSearchInput.value = '';
    displayAllUsersInModal();
    userSearchInput.focus();
}

function closeNewChatModal() {
    newChatModal.classList.add('hidden');
}

function handleUserSearch() {
    const searchTerm = userSearchInput.value.toLowerCase().trim();
    searchResults.innerHTML = '';
    
    if (searchTerm.length === 0) {
        searchResults.classList.add('hidden');
        return;
    }
    
    searchResults.classList.remove('hidden');
    
    const filteredUsers = allUsers.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    
    if (filteredUsers.length === 0) {
        searchResults.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">No users found</p>';
        return;
    }
    
    filteredUsers.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'search-user-item';
        userDiv.onclick = () => {
            startPrivateChat(user);
            closeNewChatModal();
        };
        
        userDiv.innerHTML = `
            <div class="search-user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="search-user-info">
                <div class="search-user-name">${escapeHtml(user.displayName)}</div>
                <div class="search-user-email">${escapeHtml(user.email)}</div>
            </div>
        `;
        
        searchResults.appendChild(userDiv);
    });
}

// UI Helper Functions (Same as before, plus new ones)
function showAuthInterface() {
    authContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    clearAuthForms();
}

function showChatInterface() {
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    const displayName = currentUser.displayName || currentUser.email.split('@')[0];
    sidebarCurrentUser.textContent = displayName;
    
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

// Utility Functions (Same as before)
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
window.closeNewChatModal = closeNewChatModal;
window.switchToRoom = switchToRoom;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (unsubscribeMessages) unsubscribeMessages();
    if (unsubscribeUsers) unsubscribeUsers();
    if (unsubscribePrivateChats) unsubscribePrivateChats();
});
