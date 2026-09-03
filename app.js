// LOOPHOLE FIX 1: Signal the HTML Watchdog that ES Modules are successfully running
window.appModuleLoaded = true; 

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// 1. FIREBASE CONFIG (Replace with your own from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCC8cHl9TxOGft76mxNbl3UOcg8qZrv3Uo",
  authDomain: "bill-maker-6bfa7.firebaseapp.com",
  projectId: "bill-maker-6bfa7",
  storageBucket: "bill-maker-6bfa7.firebasestorage.app",
  messagingSenderId: "120775881134",
  appId: "1:120775881134:web:ac5bd352edc75a4f45983f"
};

// 2. DOM ELEMENTS
const splashScreen = document.getElementById('splash-screen');
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const authError = document.getElementById('auth-error');
const loginBtn = document.getElementById('login-btn');
const splashText = document.querySelector('.loading-text'); // New Element for Feedback

// 3. SPNWA ROUTING ENGINE
const navigateTo = (screenElement) => {
    [splashScreen, loginScreen, mainApp].forEach(el => el.classList.add('hidden'));
    setTimeout(() => {
        screenElement.classList.remove('hidden');
    }, 50); 
};

// INITIALIZATION WITH STRICT ERROR BOUNDARY
let app, auth;

try {
    // Loophole Fix 1: Catching Dummy/Missing API Keys locally before Firebase crashes
    if(!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
        throw new Error("FIREBASE_CONFIG_MISSING");
    }

    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Loophole Fix 2: Failsafe Timer (Prevents Infinite Splash Screen)
    const failsafeTimer = setTimeout(() => {
        splashText.innerText = "Network Issue: Taking too long to connect...";
        splashText.style.color = "var(--error-color)";
    }, 7000);

    // 4. AUTHENTICATION STATE OBSERVER
    onAuthStateChanged(auth, (user) => {
        clearTimeout(failsafeTimer); // Connection successful, clear failsafe
        splashText.innerText = "Securing Connection...";
        
        setTimeout(() => {
            if (user) {
                navigateTo(mainApp);
            } else {
                navigateTo(loginScreen);
            }
        }, 1000); // Snappier native feel
    });
} catch (error) {
    console.error("System Initialization Failed:", error);
    
    // UI Feedback for the developer instead of infinite freezing
    if(error.message === "FIREBASE_CONFIG_MISSING") {
        splashText.innerText = "Dev Error: Add correct Firebase config in app.js";
    } else {
        splashText.innerText = "System Error! Check Browser Console.";
    }
    splashText.style.color = "var(--error-color)";
}

// 5. LOGIN LOGIC (Mapped Username Setup)
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginBtn.innerText = "Authenticating...";
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // ENGINEERED SECURITY FIX: 
    // We map 'admin' to 'admin@billgen.private' (Set this exact email in your Firebase Auth tab manually).
    // This avoids fetching passwords dynamically which is a critical loophole.
    const dummyEmail = `${username.toLowerCase()}@billgen.private`;

    signInWithEmailAndPassword(auth, dummyEmail, password)
        .then((userCredential) => {
            loginBtn.innerText = "Authenticate";
            authError.classList.add('hidden');
            // onAuthStateChanged will handle the navigation
        })
        .catch((error) => {
            loginBtn.innerText = "Authenticate";
            authError.innerText = "Invalid Username or Password";
            authError.classList.remove('hidden');
            console.error("Auth Error:", error.code);
        });
});

// 6. LOGOUT LOGIC
logoutBtn.addEventListener('click', () => {
    signOut(auth).catch((error) => console.error("Logout Error:", error));
});

// 7. PWA / SERVICE WORKER REGISTRATION
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // ENGINEERED FIX 2: Changed '/' to './' to prevent GitHub Pages 404 pathing loopholes
        navigator.serviceWorker.register('./firebase-messaging-sw.js')
            .then((registration) => {
                console.log('SW Registered successfully with scope:', registration.scope);
            })
            .catch((error) => {
                console.log('SW Registration failed:', error);
            });
    });
}
