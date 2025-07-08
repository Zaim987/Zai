
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyApM08t1ghCxK56_0znbPMT9i5zduOKmn0",
  authDomain: "quantechapp.firebaseapp.com",
  projectId: "quantechapp",
  storageBucket: "quantechapp.appspot.com",
  messagingSenderId: "825384610343",
  appId: "1:825384610343:web:e490bc84877e6d7a93bc02"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
