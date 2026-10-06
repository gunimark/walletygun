// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyASuRYYagev8WAAEVONuk_teLqGBs1TNf4",
  authDomain: "gun-ceba8.firebaseapp.com",
  databaseURL: "https://gun-ceba8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gun-ceba8",
  storageBucket: "gun-ceba8.firebasestorage.app",
  messagingSenderId: "325715316934",
  appId: "1:325715316934:web:0d538de1cb7ef24d6c07c7",
  measurementId: "G-RNW47ET122"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let cashflows = [];
let shoppingItems = [];

// Formatting Helpers
const formatMoney = (amount) => '฿' + Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getCurrentDate = () => new Date().toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });

// Listen for Realtime Cashflows Data
db.ref('cashflows').on('value', (snapshot) => {
    const data = snapshot.val();
    cashflows = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    render();
});

// Listen for Realtime Shopping Data
db.ref('shopping').on('value', (snapshot) => {
    const data = snapshot.val();
    shoppingItems = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    render();
});

// Add Income with Confirmation
document.getElementById('incomeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('incDesc').value.trim();
    const amount = parseFloat(document.getElementById('incAmount').value);

    if (desc && amount > 0) {
        Swal.fire({
            title: 'ยืนยันการเพิ่มรายรับ?',
            html: `<b>รายการ:</b> ${desc}<br><b>จำนวนเงิน:</b> ${formatMoney(amount)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                db.ref('cashflows').push({
                    type: 'income',
                    desc: desc,
                    amount: amount,
                    date: getCurrentDate(),
                    timestamp: Date.now()
                });
                e.target.reset();
                Swal.fire({ icon: 'success', title: 'บันทึกรายรับเรียบร้อย!', timer: 1500, showConfirmButton: false });
            }
        });
    }
});

// Add Shopping Item with Confirmation
document.getElementById('shoppingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const item = document.getElementById('shopItem').value.trim();
    const cost = parseFloat(document.getElementById('shopCost').value) || 0;

    if (item) {
        Swal.fire({
            title: 'ยืนยันเพิ่มของที่ต้องซื้อ?',
            html: `<b>สินค้า:</b> ${item}<br><b>ประมาณการ:</b> ${formatMoney(cost)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'เพิ่มรายการ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                db.ref('shopping').push({
                    item: item,
                    cost: cost,
                    bought: false,
                    timestamp: Date.now()
                });
                e.target.reset();
                Swal.fire({ icon: 'success', title: 'เพิ่มรายการซื้อของเรียบร้อย!', timer: 1500, showConfirmButton: false });
            }
        });
    }
});

// Add Expense with Confirmation
document.getElementById('expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('expDesc').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value);

    if (desc && amount > 0) {
        Swal.fire({
            title: 'ยืนยันการเพิ่มรายจ่าย?',
            html: `<b>รายการ:</b> ${desc}<br><b>จำนวนเงิน:</b> ${formatMoney(amount)}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                db.ref('cashflows').push({
                    type: 'expense',
                    desc: desc,
                    amount: amount,
                    date: getCurrentDate(),
                    timestamp: Date.now()
                });

                // Auto-mark shopping item as bought if matched
                const matchedItem = shoppingItems.find(item => item.item.toLowerCase() === desc.toLowerCase() && !item.bought);
                if (matchedItem) {
                    db.ref('shopping/' + matchedItem.id).update({ bought: true });
                }

                e.target.reset();
                Swal.fire({ icon: 'success', title: 'บันทึกรายจ่ายเรียบร้อย!', timer: 1500, showConfirmButton: false });
            }
        });
    }
});

// Auto-fill price when selecting a shopping item
function onExpenseSelect(selectedValue) {
    const matchedItem = shoppingItems.find(item => item.item === selectedValue && !item.bought);
    if (matchedItem && matchedItem.cost > 0) {
        document.getElementById('expAmount').value = matchedItem.cost;
    }
}

// Toggle Shopping Item Status
function toggleBought(id, currentStatus) {
    db.ref('shopping/' + id).update({ bought: !currentStatus });
}

// Delete Individual Cashflow Item
function deleteCashflow(id, desc) {
    Swal.fire({
        title: 'ลบรายการนี้?',
        text: `คุณต้องการลบ "${desc}" ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ลบรายการ',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            db.ref('cashflows/' + id).remove();
            Swal.fire({ icon: 'success', title: 'ลบรายการเรียบร้อย', timer: 1200, showConfirmButton: false });
        }
    });
}

// Delete Individual Shopping Item
function deleteShopping(id, item) {
    Swal.fire({
        title: 'ลบรายการซื้อของ?',
        text: `คุณต้องการลบ "${item}" ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ลบรายการ',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            db.ref('shopping/' + id).remove();
            Swal.fire({ icon: 'success', title: 'ลบรายการเรียบร้อย', timer: 1200, showConfirmButton: false });
        }
    });
}

// Clear All Cashflows
function clearCashflow() {
    Swal.fire({
        title: 'ล้างประวัติทั้งหมด?',
        text: 'ประวัติรายรับ-รายจ่ายทั้งหมดจะถูกลบออกอย่างถาวร!',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ล้างทั้งหมด',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            db.ref('cashflows').remove();
            Swal.fire({ icon: 'success', title: 'ล้างประวัติเรียบร้อย', timer: 1500, showConfirmButton: false });
        }
    });
}

// Clear All Shopping List
function clearShopping() {
    Swal.fire({
        title: 'ล้างรายการซื้อของทั้งหมด?',
        text: 'รายการของที่ต้องซื้อทั้งหมดจะถูกลบออกอย่างถาวร!',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ล้างทั้งหมด',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            db.ref('shopping').remove();
            Swal.fire({ icon: 'success', title: 'ล้างรายการซื้อของเรียบร้อย', timer: 1500, showConfirmButton: false });
        }
    });
}

// Update Dropdown Options for Expense Form
function updateShoppingOptions() {
    const datalist = document.getElementById('shoppingOptions');
    const unboughtItems = shoppingItems.filter(item => !item.bought);

    datalist.innerHTML = unboughtItems.map(item =>
        `<option value="${item.item}">${item.cost > 0 ? ' (ประมาณการ: ' + formatMoney(item.cost) + ')' : ''}</option>`
    ).join('');
}

// Render Data to UI
function render() {
    updateShoppingOptions();

    // Calculate Totals
    const totalInc = cashflows.filter(i => i.type === 'income').reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExp = cashflows.filter(i => i.type === 'expense').reduce((sum, i) => sum + Number(i.amount), 0);
    const balance = totalInc - totalExp;

    document.getElementById('totalIncome').innerText = formatMoney(totalInc);
    document.getElementById('totalExpense').innerText = formatMoney(totalExp);
    document.getElementById('totalBalance').innerText = formatMoney(balance);

    // Render Cashflow List
    const cashflowEl = document.getElementById('cashflowList');
    if (cashflows.length === 0) {
        cashflowEl.innerHTML = `<li class="text-slate-400 text-center py-4">ยังไม่มีรายการบันทึก</li>`;
    } else {
        cashflowEl.innerHTML = cashflows.slice().reverse().map(item => `
                    <li class="flex justify-between items-center p-2.5 rounded-lg border ${item.type === 'income' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}">
                        <div>
                            <span class="font-medium text-slate-700">${item.desc}</span>
                            <span class="text-xs text-slate-400 ml-2">${item.date || ''}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="font-semibold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}">
                                ${item.type === 'income' ? '+' : '-'}${formatMoney(item.amount)}
                            </span>
                            <button onclick="deleteCashflow('${item.id}', '${item.desc}')" class="text-slate-400 hover:text-rose-500">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </li>
                `).join('');
    }

    // Render Shopping List
    const shoppingEl = document.getElementById('shoppingList');
    if (shoppingItems.length === 0) {
        shoppingEl.innerHTML = `<li class="text-slate-400 text-center py-4">ยังไม่มีของที่ต้องซื้อ</li>`;
    } else {
        shoppingEl.innerHTML = shoppingItems.slice().reverse().map(item => `
                    <li class="flex justify-between items-center p-2.5 rounded-lg border bg-slate-50 border-slate-200">
                        <div class="flex items-center space-x-2">
                            <input type="checkbox" ${item.bought ? 'checked' : ''} onchange="toggleBought('${item.id}', ${item.bought})" class="rounded text-amber-500 focus:ring-amber-400">
                            <span class="${item.bought ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}">${item.item}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs text-slate-500">${item.cost > 0 ? formatMoney(item.cost) : ''}</span>
                            <button onclick="deleteShopping('${item.id}', '${item.item}')" class="text-slate-400 hover:text-rose-500">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </li>
                `).join('');
    }
}