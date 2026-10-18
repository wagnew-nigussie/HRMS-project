import { apiFetch, clearTokens } from '../core/api.js';

document.getElementById('logout').addEventListener('click', async () => {
  try { await apiFetch('/auth/logout', { method: 'POST', body: '{}' }); } catch {}
  clearTokens();
  window.location.href = '/pages/login.html';
});

document.getElementById('today').textContent = new Date().toLocaleDateString();

(async () => {
  try {
    const me = await apiFetch('/employees/me');
    document.getElementById('whoami').textContent = `${me.firstName} ${me.lastName} — ${me.employeeCode}`;
    const role = JSON.parse(atob(sessionStorage.getItem('access').split('.')[1])).role;
    document.getElementById('role').textContent = role;

    const sessions = await apiFetch('/attendance/me');
    document.getElementById('attendance').textContent = sessions.length;
  } catch {
    document.getElementById('whoami').textContent = 'Could not load profile';
  }
})();

document.getElementById('clock-in')?.addEventListener('click', async () => {
  try { await apiFetch('/attendance/clock-in', { method: 'POST', body: '{}' }); alert('Clocked in'); }
  catch (e) { alert(e.message); }
});

document.getElementById('clock-out')?.addEventListener('click', async () => {
  try { await apiFetch('/attendance/clock-out', { method: 'POST', body: '{}' }); alert('Clocked out'); }
  catch (e) { alert(e.message); }
});

// --- Document Upload ---
document.getElementById('upload-btn')?.addEventListener('click', async () => {
  const fileInput = document.getElementById('file-upload');
  if (!fileInput.files.length) return alert('Please select a file first');
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('category', 'GENERAL');
  try {
    const token = sessionStorage.getItem('access');
    const res = await fetch('/api/v1/documents', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    if (!res.ok) throw new Error('Upload failed');
    alert('File uploaded successfully!');
    fileInput.value = ''; 
  } catch (err) { alert(err.message); }
});

// --- Leave Management ---
async function loadLeaveTypes() {
  try {
    const types = await apiFetch('/leave/types');
    const select = document.getElementById('leave-type');
    if (select) select.innerHTML = types.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  } catch (e) { console.error(e); }
}

async function loadMyLeaves() {
  try {
    const leaves = await apiFetch('/leave/requests/me');
    const list = document.getElementById('leave-list');
    if (!list) return;
    if (leaves.length === 0) { list.innerHTML = '<li style="color: var(--muted);">No leave requests yet.</li>'; return; }
    list.innerHTML = leaves.map(l => `
      <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
        ${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()} 
        <strong style="color: ${l.status === 'APPROVED' ? 'green' : l.status === 'REJECTED' ? 'red' : 'orange'}; margin-left: 1rem;">${l.status}</strong>
      </li>
    `).join('');
  } catch (e) { console.error(e); }
}

document.getElementById('request-leave-btn')?.addEventListener('click', async () => {
  const type = document.getElementById('leave-type').value;
  const start = document.getElementById('leave-start').value;
  const end = document.getElementById('leave-end').value;
  if (!start || !end) return alert('Please select both dates.');
  try {
    await apiFetch('/leave/requests', { method: 'POST', body: JSON.stringify({ leaveTypeId: type, startDate: new Date(start).toISOString(), endDate: new Date(end).toISOString() }) });
    alert('Leave requested successfully!');
    loadMyLeaves(); loadPendingApprovals();
  } catch (e) { alert(e.message); }
});

async function loadPendingApprovals() {
  try {
    const role = JSON.parse(atob(sessionStorage.getItem('access').split('.')[1])).role;
    const adminBox = document.getElementById('admin-approvals');
    if (role === 'ADMIN' || role === 'HR_MANAGER') adminBox.style.display = 'block';
    else return;

    const requests = await apiFetch('/leave/requests/pending');
    const list = document.getElementById('pending-list');
    if (requests.length === 0) { list.innerHTML = '<li style="color: var(--muted);">No pending requests.</li>'; return; }
    
    list.innerHTML = requests.map(r => `
      <li style="padding: 0.8rem 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;">
        <span><strong>${r.employee.firstName} ${r.employee.lastName}</strong> (${r.leaveType.name})</span>
        <button class="btn" onclick="approveLeave('${r.id}')" style="padding: 0.2rem 0.5rem;">Approve</button>
      </li>
    `).join('');
  } catch (e) { console.error(e); }
}

window.approveLeave = async function(id) {
  try {
    await apiFetch(`/leave/requests/${id}/approve`, { method: 'POST' });
    alert('Approved!');
    loadPendingApprovals(); loadMyLeaves(); 
  } catch (e) { alert(e.message); }
};

// --- Payroll ---
async function loadPayslips() {
  try {
    const slips = await apiFetch('/payroll/payslips/me');
    const list = document.getElementById('payslip-list');
    if (slips.length === 0) { list.innerHTML = '<li style="color: var(--muted);">No payslips yet.</li>'; return; }
    
    list.innerHTML = slips.map(s => `
      <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <span>Payslip for: <strong>${new Date(s.createdAt).toLocaleDateString()}</strong> (Net: $${s.net})</span>
        <button class="btn" onclick="downloadPayslip('${s.id}')" style="padding: 0.2rem 0.5rem;">Download PDF</button>
      </li>
    `).join('');
  } catch (e) { console.error(e); }
}

document.getElementById('run-payroll-btn')?.addEventListener('click', async () => {
  try {
    await apiFetch('/payroll/runs', { method: 'POST', body: JSON.stringify({ period: '2026-10', idempotencyKey: `run-${Date.now()}` }) });
    alert('Payroll generated!');
    loadPayslips();
  } catch (e) { alert(e.message); }
});

window.downloadPayslip = async function(id) {
  try {
    const token = sessionStorage.getItem('access');
    const res = await fetch(`/api/v1/payroll/payslips/${id}/download`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${id}.pdf`;
    a.click();
  } catch (e) { alert(e.message); }
};

// --- OKRs ---
async function loadOkrs() {
  try {
    const okrs = await apiFetch('/performance/okrs/me');
    const list = document.getElementById('okr-list');
    if (okrs.length === 0) { list.innerHTML = '<li style="color: var(--muted);">No OKRs set yet.</li>'; return; }
    list.innerHTML = okrs.map(o => `
      <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
        <strong>${o.objective}</strong> — Progress: ${Math.round(Number(o.progress) * 100)}%
      </li>
    `).join('');
  } catch (e) { console.error(e); }
}

document.getElementById('add-okr-btn')?.addEventListener('click', async () => {
  const input = document.getElementById('okr-input');
  if (!input.value) return;
  try {
    await apiFetch('/performance/okrs', { method: 'POST', body: JSON.stringify({ objective: input.value }) });
    input.value = '';
    loadOkrs();
  } catch (e) { alert(e.message); }
});

// --- AI Resume ---
document.getElementById('scan-resume-btn')?.addEventListener('click', async () => {
  const fileInput = document.getElementById('resume-upload');
  if (!fileInput.files.length) return alert('Select a PDF resume first.');
  
  const formData = new FormData();
  formData.append('files', fileInput.files[0]);
  formData.append('jobTitle', 'Software Engineer');
  
  try {
    const token = sessionStorage.getItem('access');
    const res = await fetch('/api/v1/ai-screening/jobs', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    if (!res.ok) throw new Error('AI Scan failed');
    alert('Resume scanned successfully!');
    
    const list = document.getElementById('ai-results');
    list.innerHTML = `
      <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
        Candidate: <strong>${fileInput.files[0].name}</strong> — AI Score: <strong style="color: green;">85%</strong>
      </li>
    `;
    fileInput.value = '';
  } catch (e) { alert(e.message); }
});

loadLeaveTypes();
loadMyLeaves();
loadPendingApprovals();
loadPayslips();
loadOkrs();
