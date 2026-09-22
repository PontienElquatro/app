
// ============================================================
// INIT
// ============================================================
lucide.createIcons();

let currentAction = null;
let currentTarget = null;
let adminChart = null;
let reportChart = null;

// ============================================================
// ZONE ROUTER
// ============================================================
function showZone(zoneName) {
  ['public', 'auth', 'patient', 'doctor', 'admin'].forEach(z => {
    const el = document.getElementById('zone-' + z);
    if (el) el.classList.remove('active');
  });
  const target = document.getElementById('zone-' + zoneName);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
  lucide.createIcons();

  if (zoneName === 'admin') setTimeout(() => { initAdminChart(); initReportChart(); }, 100);
}

// ============================================================
// PUBLIC SCREENS
// ============================================================
function showPubScreen(id) {
  document.querySelectorAll('#zone-public .screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('pub-screen-' + id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.pub-nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.pub === id);
  });

  window.scrollTo(0, 0);
  lucide.createIcons();
}

// ============================================================
// AUTH SCREENS
// ============================================================
function switchAuth(view) {
  document.querySelectorAll('#zone-auth .screen').forEach(s => s.classList.remove('active'));
  document.getElementById('auth-screen-' + view).classList.add('active');
  lucide.createIcons();
}

function selectRegRole(role, el) {
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('reg-form-patient').style.display = role === 'patient' ? 'block' : 'none';
  document.getElementById('reg-form-doctor').style.display = role === 'doctor' ? 'block' : 'none';
}

// ============================================================
// LOGIN (détection auto du rôle)
// ============================================================
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.toLowerCase();

  let role = 'patient';
  if (email.includes('admin')) role = 'admin';
  else if (email.includes('doctor') || email.includes('dr.') || email.includes('medecin') || email.includes('médecin')) role = 'doctor';

  showToast('Connexion réussie. Redirection...', 'success');
  setTimeout(() => showZone(role), 500);
}

function handleRegister(e, role) {
  e.preventDefault();
  showToast('Compte créé avec succès', 'success');
  setTimeout(() => showZone(role), 500);
}

function logout() {
  showToast('Vous êtes déconnecté', 'info');
  setTimeout(() => showZone('public'), 300);
}

// ============================================================
// PATIENT SCREENS
// ============================================================
function showPatientScreen(id) {
  document.querySelectorAll('#zone-patient .screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('pat-screen-' + id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.patient-nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.ps === id);
  });

  window.scrollTo(0, 0);
  lucide.createIcons();
}

// ============================================================
// DOCTOR SCREENS
// ============================================================
function showDoctorScreen(id, el) {
  document.querySelectorAll('#zone-doctor .d-screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('d-' + id);
  if (target) target.classList.add('active');

  if (el) {
    document.querySelectorAll('#docSidebar .menu-item').forEach(m => m.classList.remove('active'));
    el.classList.add('active');
  }
  if (window.innerWidth <= 1024) toggleDashSidebar('doc');
  window.scrollTo(0, 0);
  lucide.createIcons();
}

// ============================================================
// ADMIN SCREENS
// ============================================================
function showAdminScreen(id, el) {
  document.querySelectorAll('#zone-admin .d-screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('d-' + id);
  if (target) target.classList.add('active');

  if (el) {
    document.querySelectorAll('#adminSidebar .menu-item').forEach(m => m.classList.remove('active'));
    el.classList.add('active');
  }
  if (window.innerWidth <= 1024) toggleDashSidebar('admin');
  window.scrollTo(0, 0);
  lucide.createIcons();

  if (id === 'admin-dashboard') setTimeout(initAdminChart, 100);
  if (id === 'admin-reports') setTimeout(initReportChart, 100);
}

// ============================================================
// MOBILE MENU (public)
// ============================================================
function toggleMobileMenu() {
  const menu = document.getElementById('pubMobileMenu');
  const overlay = document.getElementById('pubMenuOverlay');
  const isOpen = menu.style.right === '0px';
  menu.style.right = isOpen ? '-300px' : '0px';
  overlay.classList.toggle('active');
  lucide.createIcons();
}

// ============================================================
// DASH SIDEBAR MOBILE
// ============================================================
function toggleDashSidebar(type) {
  const sidebar = document.getElementById(type === 'doc' ? 'docSidebar' : 'adminSidebar');
  const overlay = document.getElementById(type === 'doc' ? 'docSidebarOverlay' : 'adminSidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

// ============================================================
// THEME
// ============================================================
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');

  ['pubThemeIcon', 'patThemeIcon', 'docThemeIcon', 'adminThemeIcon'].forEach(id => {
    const icon = document.getElementById(id);
    if (icon) icon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
  });
  lucide.createIcons();
  updateChartsTheme();

  try { localStorage.setItem('monganga-theme', isDark ? 'light' : 'dark'); } catch(e) {}
}

(function restoreTheme() {
  try {
    if (localStorage.getItem('monganga-theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setTimeout(() => {
        ['pubThemeIcon', 'patThemeIcon', 'docThemeIcon', 'adminThemeIcon'].forEach(id => {
          const icon = document.getElementById(id);
          if (icon) icon.setAttribute('data-lucide', 'sun');
        });
        lucide.createIcons();
      }, 100);
    }
  } catch(e) {}
})();

// ============================================================
// INTERACTIONS
// ============================================================
function selectSlot(el, label) {
  el.parentNode.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  const box = document.getElementById('pat-recap-box');
  if (box) {
    box.style.display = 'block';
    document.getElementById('pat-recap-slot').textContent = label;
  }
}

function selectPayment(el) {
  document.querySelectorAll('.payment-method').forEach(m => {
    m.style.borderColor = 'var(--border)';
    m.style.background = 'transparent';
    const radio = m.querySelector('span:last-child');
    if (radio) {
      radio.style.borderColor = 'var(--border-strong)';
      radio.innerHTML = '';
    }
  });
  el.style.borderColor = 'var(--primary)';
  el.style.background = 'var(--primary-light)';
  const radio = el.querySelector('span:last-child');
  if (radio) {
    radio.style.borderColor = 'var(--primary)';
    radio.innerHTML = '<span style="width:10px; height:10px; border-radius:50%; background:var(--primary);"></span>';
  }
}

function toggleDispo(el) {
  if (el.classList.contains('open')) {
    el.classList.remove('open'); el.classList.add('closed');
  } else {
    el.classList.remove('closed'); el.classList.add('open');
  }
}

function toggleFaq(el) {
  el.classList.toggle('open');
}

// ============================================================
// DRAWER
// ============================================================
function openDrawer(name, spec, doc, date, status, ref) {
  document.getElementById('drawer-name').innerText = name;
  document.getElementById('drawer-spec').innerText = spec;
  document.getElementById('drawer-doc').innerText = doc;
  document.getElementById('drawer-date').innerText = date;
  document.getElementById('drawer-ref').innerText = ref;

  const statusEl = document.getElementById('drawer-status');
  const map = { 'En attente': 'warning', 'Validé': 'success', 'Confirmé': 'success', 'Rejeté': 'danger' };
  const cls = map[status] || 'warning';
  statusEl.className = 'badge ' + cls;
  statusEl.innerText = status;

  document.getElementById('drawer').classList.add('active');
  document.getElementById('drawer-overlay').classList.add('active');
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('active');
  document.getElementById('drawer-overlay').classList.remove('active');
}

function triggerModalFromDrawer(action) {
  const name = document.getElementById('drawer-name').innerText;
  closeDrawer();
  setTimeout(() => triggerModal(action, name), 250);
}

// ============================================================
// MODAL
// ============================================================
function triggerModal(action, name) {
  currentAction = action;
  currentTarget = name;

  const icon = document.getElementById('modal-icon');
  const title = document.getElementById('modal-title');
  const msg = document.getElementById('modal-message');
  const btn = document.getElementById('modal-confirm-btn');

  if (action === 'validate') {
    icon.className = 'modal-icon validate';
    icon.innerHTML = '<i data-lucide="check-circle-2"></i>';
    title.innerText = 'Valider';
    msg.innerText = `Confirmer la validation de ${name} ?`;
    btn.style.background = 'var(--success)';
    btn.innerText = 'Confirmer';
  } else {
    icon.className = 'modal-icon reject';
    icon.innerHTML = '<i data-lucide="alert-triangle"></i>';
    title.innerText = 'Rejeter';
    msg.innerText = `Confirmer le rejet de ${name} ? Une notification sera envoyée.`;
    btn.style.background = 'var(--danger)';
    btn.innerText = 'Confirmer le rejet';
  }

  document.getElementById('modal-subtitle').innerText = 'Cible: ' + name;
  document.getElementById('modal-overlay').classList.add('active');
  lucide.createIcons();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  currentAction = null;
  currentTarget = null;
}

function confirmModal() {
  const action = currentAction;
  const target = currentTarget;

  if (action === 'validate') {
    showToast('✅ ' + target + ' validé', 'success');
    const badge = document.getElementById('adminValidationsBadge');
    if (badge) badge.innerText = Math.max(0, parseInt(badge.innerText) - 1);
  } else {
    showToast('❌ ' + target + ' rejeté', 'error');
    const badge = document.getElementById('adminValidationsBadge');
    if (badge) badge.innerText = Math.max(0, parseInt(badge.innerText) - 1);
  }
  closeModal();
}

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDrawer();
  }
});

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  const icon = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-circle' : 'info';
  toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  document.body.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// CHARTS
// ============================================================
function getChartTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#94A3B8' : '#64748B',
    gridColor: isDark ? '#283346' : '#E2E8F0',
    theme: isDark ? 'dark' : 'light'
  };
}

function initAdminChart() {
  const el = document.querySelector("#adminChart");
  if (!el || adminChart) return;
  const { textColor, gridColor, theme } = getChartTheme();

  adminChart = new ApexCharts(el, {
    series: [
      { name: 'Consultations', data: [31, 40, 28, 51, 42, 68, 55, 72, 65, 82, 78, 95] },
      { name: 'Ordonnances', data: [18, 22, 15, 30, 25, 40, 35, 48, 42, 55, 52, 65] }
    ],
    chart: { type: 'area', height: 300, toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans', foreColor: textColor },
    colors: ['#3C50E0', '#80CAEE'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
      labels: { style: { colors: textColor, fontSize: '12px' } }
    },
    yaxis: { labels: { style: { colors: textColor, fontSize: '12px' } } },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: textColor } },
    tooltip: { theme }
  });
  adminChart.render();
}

function initReportChart() {
  const el = document.querySelector("#reportChart");
  if (!el || reportChart) return;
  const { textColor, gridColor, theme } = getChartTheme();

  reportChart = new ApexCharts(el, {
    series: [
      { name: '2025', data: [45, 52, 38, 65, 48, 72, 60, 78, 68, 85, 78, 92] },
      { name: '2026', data: [55, 68, 52, 82, 72, 95, 85, 105, 98, 118, 112, 135] }
    ],
    chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans', foreColor: textColor },
    colors: ['#80CAEE', '#3C50E0'],
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 6, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
      labels: { style: { colors: textColor, fontSize: '12px' } }
    },
    yaxis: { labels: { style: { colors: textColor, fontSize: '12px' } } },
    grid: { borderColor: gridColor, strokeDasharray: 4 },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: textColor } },
    tooltip: { theme }
  });
  reportChart.render();
}

function updateChartsTheme() {
  const { textColor, gridColor, theme } = getChartTheme();
  const opts = {
    chart: { foreColor: textColor },
    xaxis: { labels: { style: { colors: textColor } } },
    yaxis: { labels: { style: { colors: textColor } } },
    grid: { borderColor: gridColor },
    legend: { labels: { colors: textColor } },
    tooltip: { theme }
  };
  if (adminChart) adminChart.updateOptions(opts);
  if (reportChart) reportChart.updateOptions(opts);
}
