window.appModuleLoaded = true; 

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getDatabase, ref, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js"; // NEW: Database added

// 1. FIREBASE CONFIG (Replace with your own from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCC8cHl9TxOGft76mxNbl3UOcg8qZrv3Uo",
  authDomain: "bill-maker-6bfa7.firebaseapp.com",
  databaseURL: "https://bill-maker-6bfa7-default-rtdb.asia-southeast1.firebasedatabase.app/", 
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


// --- NEW BILL MODULE LOGIC ---

// Database Instance
const db = getDatabase(app);

// DOM Elements
const newBillScreen = document.getElementById('new-bill-screen');
const prevBillsScreen = document.getElementById('prev-bills-screen');
const btnOpenNewBill = document.getElementById('btn-open-new-bill');
const btnOpenPrevBills = document.getElementById('btn-open-prev-bills');
const backButtons = document.querySelectorAll('.back-btn');
const btnAddRow = document.getElementById('btn-add-row');
const billItemsContainer = document.getElementById('bill-items-container');
const btnGeneratePdf = document.getElementById('btn-generate-pdf');

// Navigation Events
btnOpenNewBill.addEventListener('click', () => navigateTo(newBillScreen));
btnOpenPrevBills.addEventListener('click', () => navigateTo(prevBillsScreen));

backButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetId = e.target.getAttribute('data-target');
        navigateTo(document.getElementById(targetId));
    });
});

// Dynamic Row Generator
btnAddRow.addEventListener('click', () => {
    const rowHTML = `
        <div class="bill-row neumorphic-inset">
            <input type="text" class="item-desc" placeholder="Designation (e.g. Developer)" required>
            <div class="row-math">
                <input type="number" class="item-pree" placeholder="Pree Days" step="0.01" required>
                <input type="number" class="item-per" placeholder="Per Day ₹" step="0.01" required>
            </div>
        </div>
    `;
    billItemsContainer.insertAdjacentHTML('beforeend', rowHTML);
});

// Engineered PDF Generation & Database Save Function
btnGeneratePdf.addEventListener('click', async () => {
    const rows = document.querySelectorAll('.bill-row');
    const tableData = [];
    let grandTotal = 0;
    
    // 1. Data Extraction & Floating Point Math Fix
    let isValid = true;
    rows.forEach((row, index) => {
        const desc = row.querySelector('.item-desc').value.trim();
        const pree = parseFloat(row.querySelector('.item-pree').value) || 0;
        const per = parseFloat(row.querySelector('.item-per').value) || 0;
        
        if(!desc || pree <= 0 || per <= 0) isValid = false;

        const amount = (pree * per);
        grandTotal += amount;

        // Push formatted data for PDF Array
        tableData.push([
            index + 1, 
            desc, 
            pree.toFixed(2), 
            per.toFixed(2), 
            `Rs. ${amount.toFixed(2)}`
        ]);
    });

    if(!isValid) {
        alert("Please fill all fields with valid numbers!");
        return;
    }

    // Prepare Invoice Data Object for Database
    const invoiceData = {
        date: new Date().toISOString(),
        items: tableData,
        total: grandTotal,
        timestamp: serverTimestamp()
    };

    try {
        btnGeneratePdf.innerText = "Processing...";
        
        // 2. Save to Firebase Realtime Database FIRST (Security Loophole Blocked)
        const user = auth.currentUser;
        if(user) {
            const billRef = push(ref(db, `bills/${user.uid}`));
            await set(billRef, invoiceData);
        }

        // 3. Generate Vector PDF (Crisp A4 Size)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Brand Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("COMPANY BRANDING LTD.", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        const today = new Date().toLocaleDateString('en-IN');
        doc.text(`Invoice Date: ${today}`, 14, 28);
        doc.text(`Invoice No: INV-${Math.floor(Math.random()*10000)}`, 14, 34);

        // AutoTable for absolute exact dimensions
        doc.autoTable({
            startY: 45,
            head: [['S.No', 'Designation', 'Pree Days', 'Per Day', 'Amount (INR)']],
            body: tableData,
            foot: [['', '', '', 'Grand Total:', `Rs. ${grandTotal.toFixed(2)}`]],
            theme: 'grid',
            headStyles: { fillColor: [74, 85, 104] }, // Matches Neumorphic dark accent
            footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
        });

        // 4. Native Download Trigger
        doc.save(`BillGen_${today.replace(/\//g, '-')}.pdf`);

        btnGeneratePdf.innerText = "Generate & Save PDF Bill";
        
        // Reset Form
        billItemsContainer.innerHTML = `
            <div class="bill-row neumorphic-inset">
                <input type="text" class="item-desc" placeholder="Designation (e.g. Developer)" required>
                <div class="row-math">
                    <input type="number" class="item-pree" placeholder="Pree Days" step="0.01" required>
                    <input type="number" class="item-per" placeholder="Per Day ₹" step="0.01" required>
                </div>
            </div>
        `;
        navigateTo(mainApp); // Go back to dash after success

    } catch (error) {
        console.error("Operation Failed: ", error);
        alert("Error saving bill. Check network.");
        btnGeneratePdf.innerText = "Generate & Save PDF Bill";
    }
});
