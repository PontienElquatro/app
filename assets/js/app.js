/* ============================================================
   MONGANGA — Logique partagée
   ============================================================ */

// ---------- Init Lucide ----------
function initLucide() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ---------- Theme ----------
function initTheme() {
  const saved = localStorage.getItem('monganga-theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  updateThemeIcons();
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('monganga-theme', isDark ? 'light' : 'dark');
  updateThemeIcons();
  if (typeof updateChartsTheme === 'function') updateChartsTheme();
}

function updateThemeIcons() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('[data-theme-icon]').forEach(icon => {
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  });
  initLucide();
}

// ---------- Toast ----------
function showToast(message, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  const icon = type === 'success' ? 'check-circle-2'
             : type === 'error' ? 'alert-circle'
             : 'info';
  toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  document.body.appendChild(toast);
  initLucide();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function openNotifications() {
  document.getElementById('monganga-notifications')?.remove();
  const panel = document.createElement('aside');
  panel.id = 'monganga-notifications';
  panel.className = 'notifications-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'notifications-title');
  panel.innerHTML = `
    <div class="notifications-header">
      <div><strong id="notifications-title">Notifications</strong><span>3 nouvelles</span></div>
      <button class="btn btn-ghost btn-icon" type="button" aria-label="Fermer" data-close-notifications><i data-lucide="x"></i></button>
    </div>
    <div class="notification-item unread"><i data-lucide="calendar-check"></i><div><strong>Rendez-vous confirmé</strong><p>Votre consultation avec Dr Ilunga est prévue jeudi à 10h.</p><small>Il y a 12 min</small></div></div>
    <div class="notification-item unread"><i data-lucide="file-text"></i><div><strong>Nouvelle ordonnance</strong><p>Votre ordonnance est disponible dans votre espace.</p><small>Il y a 1 h</small></div></div>
    <div class="notification-item"><i data-lucide="shield-check"></i><div><strong>Profil sécurisé</strong><p>Vos informations sont protégées.</p><small>Hier</small></div></div>
    <button class="btn btn-secondary btn-block" type="button" data-mark-notifications>Marquer comme lues</button>`;
  document.body.appendChild(panel);
  initLucide();
  panel.querySelector('[data-close-notifications]').addEventListener('click', () => panel.remove());
  panel.querySelector('[data-mark-notifications]').addEventListener('click', () => {
    panel.querySelectorAll('.unread').forEach(item => item.classList.remove('unread'));
    document.querySelectorAll('.dot-badge').forEach(dot => dot.remove());
    showToast('Notifications marquées comme lues', 'success');
  });
}

function setButtonLoading(button, loading, label = 'Chargement...') {
  if (!button) return;
  if (loading) {
    button.dataset.originalLabel = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="loader" aria-hidden="true"></span> ${label}`;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalLabel || button.innerHTML;
  }
}

function applySavedAvatars() {
  document.querySelectorAll('[data-avatar-storage]').forEach(avatar => {
    const image = localStorage.getItem(avatar.dataset.avatarStorage);
    if (!image) return;
    avatar.textContent = '';
    const img = document.createElement('img');
    img.src = image;
    img.alt = avatar.dataset.avatarAlt || 'Photo de profil';
    img.className = 'avatar-image';
    avatar.appendChild(img);
    avatar.classList.add('has-image');
  });
}

// ---------- Modal ----------
let modalState = { action: null, target: null };

function openModal({ action, title, message, target, confirmLabel, confirmClass, onConfirm }) {
  modalState = { action, target, onConfirm };

  const icon = document.getElementById('modal-icon');
  const titleEl = document.getElementById('modal-title');
  const subEl = document.getElementById('modal-subtitle');
  const msgEl = document.getElementById('modal-message');
  const btnEl = document.getElementById('modal-confirm-btn');

  if (icon) {
    const iconType = action === 'validate' ? 'validate'
                   : action === 'reject' ? 'reject'
                   : 'info';
    const iconName = action === 'validate' ? 'check-circle-2'
                    : action === 'reject' ? 'alert-triangle'
                    : 'info';
    icon.className = 'modal-icon ' + iconType;
    icon.innerHTML = `<i data-lucide="${iconName}"></i>`;
  }

  if (titleEl) titleEl.innerText = title || 'Confirmer';
  if (subEl) subEl.innerText = 'Cible : ' + (target || '—');
  if (msgEl) msgEl.innerText = message || 'Êtes-vous sûr ?';
  if (btnEl) {
    btnEl.innerText = confirmLabel || 'Confirmer';
    btnEl.className = confirmClass || 'btn btn-primary';
    btnEl.onclick = () => {
      if (typeof modalState.onConfirm === 'function') modalState.onConfirm();
      else closeModal();
    };
  }

  document.getElementById('modal-overlay')?.classList.add('active');
  initLucide();
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('active');
  modalState = { action: null, target: null, onConfirm: null };
}

// ---------- Drawer ----------
function openDrawer(details = {}) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val || '—';
  };

  set('drawer-title', details.title || 'Détails');
  set('drawer-ref', details.ref);
  set('drawer-name', details.name);
  set('drawer-spec', details.spec);
  set('drawer-date', details.date);
  set('drawer-doc', details.doc);

  const statusEl = document.getElementById('drawer-status');
  if (statusEl && details.status) {
    const map = {
      'En attente': 'warning',
      'Validé': 'success',
      'Confirmé': 'success',
      'Actif': 'success',
      'Rejeté': 'danger',
      'Échoué': 'danger',
      'Suspendu': 'danger'
    };
    const cls = map[details.status] || 'warning';
    statusEl.className = 'badge ' + cls;
    statusEl.innerText = details.status;
  }

  document.getElementById('drawer')?.classList.add('active');
  document.getElementById('drawer-overlay')?.classList.add('active');
  initLucide();
}

function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('active');
  document.getElementById('drawer-overlay')?.classList.remove('active');
}

// ---------- Sidebar mobile ----------
function toggleSidebar(sidebarId, overlayId) {
  const sidebar = document.getElementById(sidebarId);
  const overlay = document.getElementById(overlayId);
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

// ---------- Escape / backdrop ----------
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDrawer();
    document.getElementById('monganga-notifications')?.remove();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Modal close on backdrop
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  // Drawer close on backdrop
  document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);

  // Init
  initTheme();
  initLucide();
  applySavedAvatars();

  // Stagger class auto
  document.querySelectorAll('[data-stagger]').forEach(el => {
    el.classList.add('stagger');
  });
});

// ---------- Helpers ----------
function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  }).format(date);
}

function classNames(...args) {
  return args.filter(Boolean).join(' ');
}

// Exposer les helpers globaux
window.Monganga = {
  showToast,
  openModal,
  closeModal,
  openDrawer,
  closeDrawer,
  toggleTheme,
  toggleSidebar,
  initLucide,
  openNotifications,
  setButtonLoading
};