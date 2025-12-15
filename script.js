const API_URL = "http://localhost:5000/api";
let pollingInterval = null;
const ALERT_THRESHOLD = 70; 

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('auth-token');
    if (token) showApp();
    else showAuth('landing-page');

    document.getElementById('login-form').onsubmit = (e) => { e.preventDefault(); handleAuth('login'); };
    document.getElementById('register-form').onsubmit = (e) => { e.preventDefault(); handleAuth('register'); };
    document.getElementById('zone-form').onsubmit = (e) => { e.preventDefault(); handleAddZone(); };
});

// --- NAVIGATION LOGIC ---
function showAuth(id) {
    // Hide all auth pages first
    document.querySelectorAll('.auth-page').forEach(p => p.classList.add('hidden'));
    
    // Show the requested page
    document.getElementById(id).classList.remove('hidden');
    
    // Ensure Auth Container is visible & App Container is hidden
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('flex');
}

function showApp() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('flex');
    navigateTo('dashboard', document.querySelector('.sidebar-link'));
    startPolling();
    loadZones();
}

function navigateTo(pageId, el) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-' + pageId).classList.remove('hidden');
    document.getElementById('page-title').innerText = pageId.toUpperCase();
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    if(el) el.classList.add('active');
}

function logout() {
    localStorage.removeItem('auth-token');
    if(pollingInterval) clearInterval(pollingInterval);
    showAuth('landing-page'); // Logout করলে ল্যান্ডিং পেজে যাবে
}

// --- API AUTH ---
async function handleAuth(type) {
    const email = document.getElementById(`${type}-email`).value;
    const password = document.getElementById(`${type}-password`).value;
    try {
        const res = await fetch(`${API_URL}/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            if (type === 'login') {
                localStorage.setItem('auth-token', data.token);
                showApp();
            } else {
                alert('Account Created! Please Login.');
                showAuth('signin-page');
            }
        } else { alert(data.msg); }
    } catch (e) { alert('Backend Server is NOT running! Run "node server.js"'); }
}

// --- POLLING ---
function startPolling() {
    fetchData();
    pollingInterval = setInterval(fetchData, 2000);
}

async function fetchData() {
    try {
        const res = await fetch(`${API_URL}/noise`);
        const logs = await res.json();
        const reversedLogs = [...logs].reverse(); 

        if (reversedLogs.length > 0) {
            const latest = reversedLogs[0];
            updateDashboardCards(latest);
            updateGraph(logs); 
            updateReports(reversedLogs);
            updateHeatmap(latest);
            simulateSensorData(latest);
        } else {
            simulateSensorData({ "Library": 40, "Classroom": 50, "Lab": 45, "ConferenceRoom": 30 });
        }
    } catch (e) { console.log("Polling..."); }
}

// --- DASHBOARD UI ---
function updateDashboardCards(data) {
    const container = document.getElementById('live-cards-container');
    const alertBox = document.getElementById('priority-alert-box');
    container.innerHTML = '';
    let activeAlert = null;
    const rooms = Object.keys(data).filter(k => !['_id', 'timestamp', '__v'].includes(k));

    rooms.forEach(room => {
        const val = data[room];
        const isAlert = val > ALERT_THRESHOLD;
        if (isAlert) activeAlert = { room, val };

        container.innerHTML += `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${isAlert ? 'bg-red-50' : ''}">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="font-bold text-slate-700">${room}</h3>
                    <span class="text-xs px-2 py-1 rounded font-bold ${isAlert ? 'bg-red-600 text-white' : 'bg-green-100 text-green-700'}">
                        ${isAlert ? 'ALERT' : 'NORMAL'}
                    </span>
                </div>
                <div class="flex items-end gap-2">
                    <span class="text-4xl font-bold ${isAlert ? 'text-red-600' : 'text-slate-800'}">${val}</span>
                    <span class="text-gray-400 mb-1">dB</span>
                </div>
            </div>`;
    });

    if (activeAlert) {
        alertBox.classList.remove('hidden');
        alertBox.classList.add('flex');
        document.getElementById('alert-room-name').innerText = activeAlert.room;
        document.getElementById('alert-db-val').innerText = activeAlert.val;
    } else {
        alertBox.classList.add('hidden');
        alertBox.classList.remove('flex');
    }
}

function updateGraph(logs) {
    const container = document.getElementById('bar-chart-container');
    container.innerHTML = '';
    const recentLogs = logs.slice(0, 40).reverse(); 
    recentLogs.forEach(log => {
        const rooms = Object.keys(log).filter(k => !['_id', 'timestamp', '__v'].includes(k));
        const avg = rooms.reduce((sum, r) => sum + (log[r] || 0), 0) / rooms.length;
        const bar = document.createElement('div');
        bar.className = 'w-2 rounded-t opacity-80';
        bar.style.height = `${Math.min(avg, 100)}%`;
        bar.style.backgroundColor = avg > ALERT_THRESHOLD ? '#dc2626' : (avg > 50 ? '#f59e0b' : '#10b981');
        container.appendChild(bar);
    });
}

function updateHeatmap(data) {
    const overlayContainer = document.getElementById('heatmap-overlay');
    const labelsContainer = document.getElementById('heatmap-labels');
    if (!overlayContainer || !labelsContainer) return;

    overlayContainer.innerHTML = '';
    labelsContainer.innerHTML = '';

    const positions = {
        'Library': { top: '28%', left: '22%' },
        'Classroom': { top: '28%', left: '72%' },
        'Lab': { top: '72%', left: '25%' },
        'ConferenceRoom': { top: '72%', left: '72%' }
    };

    Object.keys(data).forEach(room => {
        if (!positions[room]) return;
        const val = data[room];
        const pos = positions[room];
        let centerColor = val > ALERT_THRESHOLD ? 'rgba(220, 38, 38, 0.8)' : (val > 60 ? 'rgba(234, 179, 8, 0.7)' : 'rgba(34, 197, 94, 0.6)');

        const heatBlob = document.createElement('div');
        heatBlob.className = 'absolute w-64 h-64 rounded-full pointer-events-none transition-all duration-1000';
        heatBlob.style.top = `calc(${pos.top} - 8rem)`;
        heatBlob.style.left = `calc(${pos.left} - 8rem)`;
        heatBlob.style.background = `radial-gradient(circle closest-side, ${centerColor} 0%, rgba(0,0,0,0) 70%)`;
        heatBlob.style.mixBlendMode = 'multiply';
        overlayContainer.appendChild(heatBlob);

        const label = document.createElement('div');
        label.className = `absolute z-20 px-3 py-1 rounded shadow-md border text-xs bg-white text-gray-700`;
        label.style.top = pos.top;
        label.style.left = pos.left;
        label.style.transform = 'translate(-50%, -50%)'; 
        label.innerHTML = `<span class="font-bold">${room}</span>: ${val}dB`;
        labelsContainer.appendChild(label);
    });
}

function updateReports(logs) {
    const tbody = document.getElementById('reports-table-body');
    tbody.innerHTML = logs.slice(0, 50).map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `<tr class="border-b hover:bg-gray-50"><td class="p-3 text-xs text-gray-500">${time}</td><td class="p-3">${log.Library}</td><td class="p-3">${log.Classroom}</td><td class="p-3">${log.Lab}</td><td class="p-3">${log.ConferenceRoom || '--'}</td></tr>`;
    }).join('');
}

// --- GUARANTEED PDF DOWNLOAD ---
function downloadPDF() {
    const reportContent = document.getElementById('page-reports').innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
            <h1 style="color:red; text-align:center;">SilentAlert Report</h1>
            <p style="text-align:center; color:grey;">Generated: ${new Date().toLocaleString()}</p>
            <br>
            ${reportContent}
        </div>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); 
}

// --- ZONES ---
async function loadZones() {
    try {
        const res = await fetch(`${API_URL}/zones`);
        const zones = await res.json();
        const tbody = document.getElementById('zones-table-body');
        tbody.innerHTML = zones.map(z => `
            <tr class="border-b hover:bg-slate-50 group">
                <td class="p-4 font-bold text-slate-700">${z.name}</td>
                <td class="p-4">${z.location}</td>
                <td class="p-4"><span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">${z.threshold} dB</span></td>
                <td class="p-4 text-center">
                    <button onclick="deleteZone('${z._id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`).join('');
    } catch(e) {}
}

async function handleAddZone() {
    const name = document.getElementById('zone-name').value;
    const location = document.getElementById('zone-location').value;
    const threshold = document.getElementById('zone-threshold').value;
    await fetch(`${API_URL}/zones`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, location, threshold })
    });
    document.getElementById('zone-form').reset();
    loadZones();
    alert('Zone Added Successfully');
}

async function deleteZone(id) {
    if(!confirm("Are you sure?")) return;
    try {
        const res = await fetch(`${API_URL}/zones/${id}`, { method: 'DELETE' });
        if(res.ok) { loadZones(); alert("Deleted!"); } 
        else { alert("Failed to delete."); }
    } catch (e) { alert("Server Error."); }
}

// --- SIMULATION ---
function simulateSensorData(lastData) {
    const newData = {};
    const rooms = Object.keys(lastData).filter(k => !['_id', 'timestamp', '__v'].includes(k));
    rooms.forEach(room => {
        let change = Math.floor(Math.random() * 10) - 5; 
        let val = (lastData[room] || 40) + change;
        if (val < 30) val = 35; if (val > 95) val = 90;
        newData[room] = val;
    });
    fetch(`${API_URL}/noise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
    }).catch(e => {});
}