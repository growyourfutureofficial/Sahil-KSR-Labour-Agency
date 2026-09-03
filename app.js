// LOOPHOLE FIX 1: Signal the HTML Watchdog that ES Modules are running
window.appModuleLoaded = true; 

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getDatabase, ref, push, set, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

// 1. FIREBASE CONFIG 
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
const newBillScreen = document.getElementById('new-bill-screen');
const prevBillsScreen = document.getElementById('prev-bills-screen');

const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const authError = document.getElementById('auth-error');
const loginBtn = document.getElementById('login-btn');
const splashText = document.querySelector('.loading-text');

// 3. ADVANCED SPNWA ROUTING ENGINE (Hardware Backpress Loophole Fixed)
const navigateTo = (screenElement, addToHistory = true) => {
    // Hide all screens
    [splashScreen, loginScreen, mainApp, newBillScreen, prevBillsScreen].forEach(el => {
        if(el) el.classList.add('hidden');
    });
    
    // Smooth transition
    setTimeout(() => {
        if(screenElement) screenElement.classList.remove('hidden');
    }, 50); 

    // Inject state to Browser History to hijack Native Back Button
    if (addToHistory && screenElement.id !== 'splash-screen' && screenElement.id !== 'login-screen') {
        history.pushState({ screen: screenElement.id }, '', `#${screenElement.id}`);
    }
};

// Listen for Android Back Button / Browser Back
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.screen) {
        const targetScreen = document.getElementById(event.state.screen);
        if (targetScreen) navigateTo(targetScreen, false); // false prevents infinite loop
    } else {
        // Fallback: If no history, go to dashboard if logged in
        if(auth && auth.currentUser) navigateTo(mainApp, false);
    }
});

// INITIALIZATION WITH STRICT ERROR BOUNDARY
let app, auth, db;

try {
    if(!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
        throw new Error("FIREBASE_CONFIG_MISSING");
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);

    const failsafeTimer = setTimeout(() => {
        if(splashText) {
            splashText.innerText = "Network Issue: Taking too long to connect...";
            splashText.style.color = "var(--error-color)";
        }
    }, 7000);

    // 4. AUTHENTICATION STATE OBSERVER
    onAuthStateChanged(auth, (user) => {
        clearTimeout(failsafeTimer); 
        if(splashText) splashText.innerText = "Securing Connection...";
        
        setTimeout(() => {
            if (user) {
                navigateTo(mainApp);
            } else {
                navigateTo(loginScreen);
            }
        }, 1000); 
    });
} catch (error) {
    console.error("System Initialization Failed:", error);
    if(splashText) {
        if(error.message === "FIREBASE_CONFIG_MISSING") {
            splashText.innerText = "Dev Error: Add correct Firebase config in app.js";
        } else {
            splashText.innerText = "System Error! Check Browser Console.";
        }
        splashText.style.color = "var(--error-color)";
    }
}

// 5. LOGIN & LOGOUT LOGIC 
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginBtn.innerText = "Authenticating...";
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const dummyEmail = `${username.toLowerCase()}@billgen.private`;

    signInWithEmailAndPassword(auth, dummyEmail, password)
        .then(() => {
            loginBtn.innerText = "Authenticate";
            authError.classList.add('hidden');
        })
        .catch((error) => {
            loginBtn.innerText = "Authenticate";
            authError.innerText = "Invalid Username or Password";
            authError.classList.remove('hidden');
        });
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).catch((error) => console.error("Logout Error:", error));
});

// 6. PWA / SERVICE WORKER REGISTRATION
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./firebase-messaging-sw.js')
            .catch((error) => console.log('SW Registration failed:', error));
    });
}

// --- 7. NEW BILL & DASHBOARD EVENTS ---
const btnOpenNewBill = document.getElementById('btn-open-new-bill');
const btnOpenPrevBills = document.getElementById('btn-open-prev-bills');
const backButtons = document.querySelectorAll('.back-btn');
const btnAddRow = document.getElementById('btn-add-row');
const billItemsContainer = document.getElementById('bill-items-container');
const btnGeneratePdf = document.getElementById('btn-generate-pdf');
const prevBillsContainer = document.getElementById('prev-bills-container');

btnOpenNewBill.addEventListener('click', () => navigateTo(newBillScreen));

backButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Find closest button in case user clicked the icon inside the button
        const targetBtn = e.target.closest('.back-btn');
        const targetId = targetBtn.getAttribute('data-target');
        navigateTo(document.getElementById(targetId));
    });
});

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

// --- 8. PREVIOUS BILLS (Realtime Database Fetcher) ---
btnOpenPrevBills.addEventListener('click', () => {
    navigateTo(prevBillsScreen);
    const user = auth.currentUser;
    if(!user) return;

    const billsRef = ref(db, `bills/${user.uid}`);
    
    // onValue creates a live connection, memory-leak proofed by rewriting innerHTML
    onValue(billsRef, (snapshot) => {
        prevBillsContainer.innerHTML = ''; 
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Convert to array and reverse to show newest first
            const billsArray = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();
            
            billsArray.forEach(bill => {
                const dateObj = new Date(bill.date);
                const displayDate = dateObj.toLocaleDateString('en-IN') + " " + dateObj.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});
                
                const cardHTML = `
                    <div class="db-bill-card">
                        <div class="bill-details">
                            <h4>Bill #${bill.id.substring(1, 7).toUpperCase()}</h4>
                            <p>${displayDate}</p>
                            <p>${bill.items.length} Items</p>
                        </div>
                        <div class="bill-amount">₹${bill.total.toFixed(2)}</div>
                    </div>
                `;
                prevBillsContainer.insertAdjacentHTML('beforeend', cardHTML);
            });
        } else {
            prevBillsContainer.innerHTML = '<p style="text-align:center; margin-top:20px; color:#a0aec0;">No previous bills found.</p>';
        }
    });
});


// --- 9. ENGINEERED PDF GENERATOR ---

// Promise wrapper to prevent JS-PDF crash while loading image
const loadImage = (url) => new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); 
});

btnGeneratePdf.addEventListener('click', async () => {
    const rows = document.querySelectorAll('.bill-row');
    const tableData = [];
    let grandTotal = 0;
    let isValid = true;

    rows.forEach((row, index) => {
        const desc = row.querySelector('.item-desc').value.trim();
        const pree = parseFloat(row.querySelector('.item-pree').value) || 0;
        const per = parseFloat(row.querySelector('.item-per').value) || 0;
        
        if(!desc || pree <= 0 || per <= 0) isValid = false;
        
        const amount = (pree * per);
        grandTotal += amount;
        tableData.push([index + 1, desc, pree.toFixed(2), per.toFixed(2), `Rs. ${amount.toFixed(2)}`]);
    });

    if(!isValid) {
        alert("Please fill all fields with valid numbers!");
        return;
    }

    const invoiceData = { date: new Date().toISOString(), items: tableData, total: grandTotal, timestamp: serverTimestamp() };

    try {
        btnGeneratePdf.innerText = "Processing...";
        
        // Save to DB
        const user = auth.currentUser;
        if(user) {
            const billRef = push(ref(db, `bills/${user.uid}`));
            await set(billRef, invoiceData);
        }

        // Generate Premium PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Load Logo Asynchronously
        const logoPath = './assets/image/logo.png'; 
        const logoImg = await loadImage(logoPath);
        if(logoImg) {
            // Centers the logo based on A4 width
            doc.addImage(logoImg, 'PNG', (pageWidth/2) - 15, 10, 30, 30);
        }

        // Multi-Color Branding Header
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 130, 246); // Material Blue Branding
        doc.text("EXPERT ENGINEERS LTD.", pageWidth/2, 48, { align: "center" });
        
        // Contact Details
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("123 Advanced Tech Park, IT City, India", pageWidth/2, 54, { align: "center" });
        doc.text("Email: billing@expertengineers.com | Phone: +91-9876543210", pageWidth/2, 59, { align: "center" });

        // Divider Line
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 65, pageWidth - 14, 65); 

        // Bill Meta
        const today = new Date().toLocaleDateString('en-IN');
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "bold");
        doc.text(`Invoice Date: ${today}`, 14, 75);
        doc.text(`Invoice No: INV-${Math.floor(Math.random()*100000)}`, pageWidth - 14, 75, { align: "right" });

        // AutoTable
        doc.autoTable({
            startY: 85,
            head: [['S.No', 'Designation', 'Pree Days', 'Per Day', 'Amount (INR)']],
            body: tableData,
            foot: [['', '', '', 'Grand Total:', `Rs. ${grandTotal.toFixed(2)}`]],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255 }, 
            footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
            styles: { fontSize: 10 }
        });

        // Professional Authorized Signature Space
        const finalY = doc.lastAutoTable.finalY || 150;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("__________________________", pageWidth - 14, finalY + 45, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.text("Authorized Signatory", pageWidth - 20, finalY + 52, { align: "right" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text("Thank you for your business. This is a computer generated invoice.", pageWidth/2, finalY + 70, { align: "center" });

        doc.save(`Expert_Bill_${today.replace(/\//g, '-')}.pdf`);

        btnGeneratePdf.innerText = "Generate & Save PDF";
        
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
        navigateTo(mainApp); 

    } catch (error) {
        console.error("Operation Failed: ", error);
        alert("Error saving bill. Check network.");
        btnGeneratePdf.innerText = "Generate & Save PDF";
    }
});
