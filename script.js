// script.js

// --- Variabel Global & Elemen HTML ---
const loginContainer = document.getElementById('login-container');
const mainApp = document.getElementById('main-app');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

const addExpenseForm = document.getElementById('add-expense-form');
const expenseDateInput = document.getElementById('expense-date');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseDescriptionInput = document.getElementById('expense-description');
const expenseList = document.getElementById('expense-list');
const recapContainer = document.getElementById('recap-container');

let currentUserId = null; // ID pengguna yang sedang login

// Set default tanggal hari ini saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    expenseDateInput.value = today;
});

// --- AUTENTIKASI (Login/Daftar/Logout) ---

registerBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            alert('Pendaftaran Berhasil! Silakan login.');
        })
        .catch(error => {
            alert('Error Daftar: ' + error.message);
        });
});

loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            alert('Error Login: ' + error.message);
        });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Pemantau Status Autentikasi: Tentukan UI mana yang tampil
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        userInfo.textContent = `Login sebagai: ${user.email}`;
        logoutBtn.style.display = 'inline';
        loginContainer.style.display = 'none';
        mainApp.style.display = 'block';
        
        loadExpenses(); // Panggil fungsi utama saat login
    } else {
        currentUserId = null;
        userInfo.textContent = `Anda belum login.`;
        logoutBtn.style.display = 'none';
        loginContainer.style.display = 'block';
        mainApp.style.display = 'none';
        recapContainer.innerHTML = ''; 
        expenseList.innerHTML = ''; 
    }
});


// --- MENCATAT PENGELUARAN (CREATE) ---

addExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUserId) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    const date = expenseDateInput.value; // Format: YYYY-MM-DD
    const amount = parseInt(expenseAmountInput.value);
    const description = expenseDescriptionInput.value;

    db.collection("users").doc(currentUserId).collection("expenses").add({
        date: date,
        amount: amount,
        description: description,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        addExpenseForm.reset();
        expenseDateInput.value = new Date().toISOString().split('T')[0];
    })
    .catch((error) => {
        alert("Gagal mencatat pengeluaran: " + error.message);
    });
});


// --- MEMUAT & MENGHITUNG PENGELUARAN (READ & CALCULATE) ---

function loadExpenses() {
    if (!currentUserId) return;

    // Real-time listener
    db.collection("users").doc(currentUserId).collection("expenses")
        .orderBy("date", "desc") 
        .onSnapshot(querySnapshot => {
            expenseList.innerHTML = '';
            let dailyTotal = {}; // { 'YYYY-MM-DD': total }
            let monthlyTotal = {}; // { 'YYYY-MM': total }

            querySnapshot.forEach(doc => {
                const expense = doc.data();
                const id = doc.id;
                const dateKey = expense.date; 
                const monthKey = expense.date.substring(0, 7); // YYYY-MM

                // 1. Perhitungan Total Harian
                dailyTotal[dateKey] = (dailyTotal[dateKey] || 0) + expense.amount;

                // 2. Perhitungan Total Bulanan (Mengelompokkan per bulan)
                monthlyTotal[monthKey] = (monthlyTotal[monthKey] || 0) + expense.amount;

                // 3. Tampilkan Riwayat
                const li = document.createElement('li');
                const formattedAmount = expense.amount.toLocaleString('id-ID');

                li.innerHTML = `
                    **[${expense.date}]** - ${expense.description} : **Rp ${formattedAmount}** <button onclick="deleteExpense('${id}')">Hapus</button>
                `;
                expenseList.appendChild(li);
            });

            // 4. Tampilkan Rekap Total di UI
            displayTotals(dailyTotal, monthlyTotal);

        }, error => {
            console.error("Error memuat data:", error);
        });
}

function displayTotals(dailyTotal, monthlyTotal) {
    let html = '';

    // Tampilkan Total Bulanan
    html += '<h3>Total Bulanan</h3>';
    // Urutkan bulan dari yang terbaru
    const sortedMonths = Object.keys(monthlyTotal).sort().reverse(); 
    
    sortedMonths.forEach(month => {
        const formattedTotal = monthlyTotal[month].toLocaleString('id-ID');
        html += `<p>Bulan **${month}**: **Rp ${formattedTotal}**</p>`;
    });
    
    html += '<hr>';
    
    // Tampilkan Total Harian
    html += '<h3>Total Harian (Riwayat)</h3>';
    const sortedDates = Object.keys(dailyTotal).sort().reverse(); 
    
    // Tampilkan data harian
    sortedDates.forEach(date => {
        const total = dailyTotal[date];
        const formattedTotal = total.toLocaleString('id-ID');
        html += `<p>Tanggal **${date}**: **Rp ${formattedTotal}**</p>`;
    });
    
    recapContainer.innerHTML = html;
}

// --- FUNGSI HAPUS (DELETE) ---

window.deleteExpense = function(expenseId) {
    if (!currentUserId || !confirm("Yakin ingin menghapus pengeluaran ini?")) return;

    db.collection("users").doc(currentUserId).collection("expenses").doc(expenseId).delete()
        .then(() => {
            console.log("Pengeluaran berhasil dihapus!");
        })
        .catch(error => {
            alert("Gagal menghapus dokumen: " + error.message);
        });
}
