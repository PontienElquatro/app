/* Interface commune : navigation, session, formulaires, dialogues accessibles. */
(function (root) {
  'use strict';
  const A = root.MongangaApi, D = root.MongangaData;
  const base = document.querySelector('meta[name="app-base"]')?.content || (location.pathname.includes('/public/') ? '../' : '');
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const href = path => base + path;
  const icon = name => `<i data-lucide="${esc(name)}" aria-hidden="true"></i>`;
  const link = (label, path, style = 'secondary') => `<a class="btn btn-${style}" href="${esc(href(path))}">${esc(label)}</a>`;
  const button = (label, id, style = 'secondary', extra = '') => `<button class="btn btn-${style}" type="button" id="${esc(id)}" ${extra}>${esc(label)}</button>`;
  const field = (name, label, type = 'text', value = '', extra = '') => `<div class="field"><label for="${esc(name)}">${esc(label)}</label><input class="form-input" id="${esc(name)}" name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></div>`;
  const area = (name, label, value = '', extra = '') => `<div class="field"><label for="${esc(name)}">${esc(label)}</label><textarea class="form-input" id="${esc(name)}" name="${esc(name)}" rows="4" ${extra}>${esc(value)}</textarea></div>`;
  const options = (values, selected) => values.map(v => { const [value,label] = Array.isArray(v) ? v : [v,v]; return `<option value="${esc(value)}" ${String(value)===String(selected)?'selected':''}>${esc(label)}</option>`; }).join('');
  const select = (name,label,values,selected='',extra='') => `<div class="field"><label for="${esc(name)}">${esc(label)}</label><select class="form-input" id="${esc(name)}" name="${esc(name)}" ${extra}>${options(values,selected)}</select></div>`;
  const check = (name,label,checked=false,extra='') => `<label class="check"><input type="checkbox" name="${esc(name)}" id="${esc(name)}" ${checked?'checked':''} ${extra}><span>${esc(label)}</span></label>`;
  const errorBox = () => '<p class="notice danger form-error" role="alert" tabindex="-1" hidden></p>';
  const submit = label => `${errorBox()}<button class="btn btn-primary" type="submit">${esc(label)}</button>`;
  const empty = (title, text='', action='') => `<div class="empty-state">${icon('inbox')}<h2>${esc(title)}</h2><p>${esc(text)}</p>${action}</div>`;
  const heading = (title,desc='',action='') => `<header class="page-heading"><div><p class="eyebrow">MONGANGA · ${esc({patient:'Espace patient',doctor:'Espace médecin',admin:'Administration'}[document.body.dataset.role]||'Votre santé, à votre rythme')}</p><h1>${esc(title)}</h1>${desc?`<p>${esc(desc)}</p>`:''}</div><div class="actions">${action}</div></header>`;
  const statusNames = {draft:'À payer',payment_pending:'Paiement en attente',payment_failed:'Paiement échoué',requested:'À confirmer',confirmed:'Confirmé',in_progress:'En cours',completed:'Terminé',cancelled:'Annulé',paid:'Payé',unpaid:'Non payé',failed:'Échoué',pending:'En attente',refund_pending:'Remboursement à traiter',refunded:'Remboursé',active:'Actif',suspended:'Suspendu',approved:'Approuvé',rejected:'Refusé',needs_documents:'À compléter'};
  const badge = status => `<span class="state state-${esc(status)}">${esc(statusNames[status]||status)}</span>`;
  function icons(){ root.lucide?.createIcons(); }
  function render(html){ const el=$('#page-root'); if(el){el.innerHTML=html;el.removeAttribute('aria-busy');} icons(); }
  function toast(message,type='success') {
    let el=$('#app-toast'); if(!el){el=document.createElement('div');el.id='app-toast';el.setAttribute('role','status');document.body.append(el);}
    el.className=`app-toast ${type==='error'?'danger':''}`;el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true;},6500);
  }
  async function run(buttonEl, task, scope) {
    if(buttonEl?.disabled)return;
    const label=buttonEl?.innerHTML; const error=scope?.querySelector('.form-error'); if(error)error.hidden=true;
    if(buttonEl){buttonEl.disabled=true;buttonEl.setAttribute('aria-busy','true');buttonEl.textContent='Veuillez patienter…';}
    try{return await task();}catch(e){const message=A?.errorMessage(e)||e.message;if(error){error.textContent=message;error.hidden=false;error.id ||= 'error-'+crypto.randomUUID();for(const [name,detail]of Object.entries(e.fields||{})){const input=scope.elements?.namedItem(name);if(input?.setAttribute){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',error.id);input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');},{once:true});}}error.focus();}else toast(message,'error');}
    finally{if(buttonEl){buttonEl.disabled=false;buttonEl.removeAttribute('aria-busy');buttonEl.innerHTML=label;}}
  }
  function bindForm(id,task){const form=$(`#${id}`);form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;form.dataset.requestId ||= crypto.randomUUID();run($('[type="submit"]',form),async()=>{await task(Object.fromEntries(new FormData(form)),form);delete form.dataset.requestId;},form);});return form;}
  function on(id,fn){$(`#${id}`)?.addEventListener('click',e=>run(e.currentTarget,()=>fn(e)));}
  function dialog(title,html,onSubmit) {
    const el=document.createElement('dialog');el.className='app-dialog';el.setAttribute('aria-labelledby','dialog-title');
    el.innerHTML=`<div class="dialog-top"><h2 id="dialog-title">${esc(title)}</h2><button type="button" class="btn btn-ghost btn-icon" aria-label="Fermer">${icon('x')}</button></div><div class="dialog-body">${html}</div>`;
    const origin=document.activeElement;document.body.append(el);$('.dialog-top button',el).onclick=()=>el.close();
    el.addEventListener('click',e=>{if(e.target===el){const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)el.close();}});
    el.addEventListener('close',()=>{el.remove();origin?.focus();},{once:true});
    if(onSubmit){const form=$('form',el);form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;form.dataset.requestId ||= crypto.randomUUID();run($('[type="submit"]',form),async()=>{await onSubmit(Object.fromEntries(new FormData(form)),form);el.close();},form);});}
    icons();el.showModal();return el;
  }
  function confirm(title,description,action,withReason=true,label='Confirmer'){
    return dialog(title,`<p class="muted">${esc(description)}</p><form class="stack">${withReason?area('reason','Motif','','required maxlength="1000"'):''}${submit(label)}</form>`,action);
  }
  function csv(filename,rows){const quote=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};download(filename,new Blob(['\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));}
  function download(filename,blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function safeReturn(value,role){if(!value)return `${role}/dashboard.html`; const clean=String(value);return new RegExp(`^${role}/[a-z-]+\\.html(?:\\?[^#]*)?$`).test(clean)&&!/[\\\r\n]/.test(clean)?clean:`${role}/dashboard.html`;}
  function go(path){location.href=href(path);}
  async function logout(){if(A.isConfigured())await A.request('/auth/logout',{method:'POST'});A.clearSession();go('auth/login.html');}
  function toggleTheme(){const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';try{localStorage.setItem('monganga-theme',dark?'dark':'light');}catch{}themeLabel();}
  function themeLabel(){$$('[data-theme-button], [onclick="toggleTheme()"] button').forEach(b=>b.setAttribute('aria-label',document.documentElement.dataset.theme==='dark'?'Activer le thème clair':'Activer le thème sombre'));}
  let drawerOrigin;
  function toggleMobileMenu(){const drawer=$('#mobile-menu');if(!drawer)return;const open=drawer.dataset.open!=='true';drawer.dataset.open=String(open);drawer.classList.toggle('is-open',open);drawer.style.right=open?'0px':'-320px';drawer.hidden=!open;$('#mobile-menu-overlay')?.classList.toggle('active',open);$$('[data-menu-button],.mobile-menu-btn').forEach(b=>b.setAttribute('aria-expanded',String(open)));document.body.style.overflow=open?'hidden':'';
    const mains=$$('main,body > footer');mains.forEach(el=>el.inert=open);
    if(open){drawerOrigin=document.activeElement;drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','Navigation');$('button,a',drawer)?.focus();}else{drawer.removeAttribute('aria-modal');drawerOrigin?.focus();}}
  async function notifications(){const list=await D.call('notifications');const el=dialog('Notifications',`<div class="stack">${list.length?list.map(n=>`<article class="panel ${n.read?'':'unread'}"><h3>${esc(n.title)}</h3><p>${esc(n.message)}</p></article>`).join(''):empty('Aucune notification','Les changements de vos rendez-vous apparaîtront ici.')}${list.some(n=>!n.read)?button('Tout marquer comme lu','read-notices'):''}</div>`);$('#read-notices',el)?.addEventListener('click',e=>run(e.currentTarget,async()=>{await D.call('readNotifications');el.close();toast('Notifications marquées comme lues.');}));}
  const U=root.Monganga={$, $$,esc,href,icon,link,button,field,area,options,select,check,errorBox,submit,empty,heading,badge,render,showToast:toast,toast,run,bindForm,on,dialog,confirm,csv,download,safeReturn,go,initLucide:icons,toggleTheme,logout,openNotifications:notifications,pages:{}};
  root.toggleTheme=toggleTheme;root.toggleMobileMenu=toggleMobileMenu;root.showToast=toast;
  document.addEventListener('keydown',e=>{const drawer=$('#mobile-menu');if(drawer?.dataset.open!=='true')return;if(e.key==='Escape')toggleMobileMenu();if(e.key==='Tab'){const focusable=$$('a[href],button:not([disabled])',drawer);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  function redirectLogin(){if(!document.body.dataset.role)return;document.body.dataset.authState='pending';$('#page-root')?.replaceChildren();go(`auth/login.html?returnTo=${encodeURIComponent(location.pathname.split('/').slice(-2).join('/')+location.search)}`);}
  root.addEventListener('monganga:unauthorized',redirectLogin);
  async function init(){
    try{document.documentElement.dataset.theme=localStorage.getItem('monganga-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}catch{}
    icons();themeLabel();
    $$('[data-theme-button]').forEach(b=>b.onclick=toggleTheme);$$('[data-menu-button]').forEach(b=>b.onclick=toggleMobileMenu);$$('[data-logout]').forEach(b=>{b.onclick=()=>run(b,logout);if(b.getAttribute('role')==='button')b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click();}};});$$('[data-notifications]').forEach(b=>b.onclick=()=>run(b,notifications));
    const drawer=$('#mobile-menu');if(drawer){drawer.hidden=true;$$('a',drawer).forEach(a=>a.addEventListener('click',()=>{if(drawer.dataset.open==='true')toggleMobileMenu();}));}
    matchMedia('(min-width: 1000px)').addEventListener('change',e=>{if(e.matches&&drawer?.dataset.open==='true')toggleMobileMenu();});
    const mode=$('#mode-indicator');if(mode){mode.hidden=A.isConfigured();if(!mode.hidden)mode.innerHTML=`Démo · données fictives dans cet onglet. ${link('Changer de compte','auth/login.html','ghost')}`;}
    const offline=$('#offline-notice');const connection=()=>{if(offline)offline.hidden=navigator.onLine;};connection();root.addEventListener('online',connection);root.addEventListener('offline',connection);
    const role=document.body.dataset.role;
    const staticLayout=document.body.hasAttribute('data-static-layout');
    const report=html=>{if(staticLayout){document.body.dataset.authState='error';const status=$('#page-status');status.hidden=false;status.innerHTML=html;icons();}else render(html);};
    async function load(){try{if(role){const s=await A.restore();if(!s){redirectLogin();return;}if(s.role!==role){report(empty('Espace non autorisé','Ce compte appartient à un autre espace.',link('Ouvrir mon espace',`${s.role}/dashboard.html`)));return;}$$('[data-user-name]').forEach(el=>el.textContent=s.name);U.refreshIdentity?.();}
      const page=U.pages[document.body.dataset.page];if(page)await page();document.body.dataset.authState='ready';if(staticLayout)$('#page-status').hidden=true;
    }catch(e){if(e.status===401&&role)return;report(`${staticLayout?'<h2>Chargement impossible</h2>':heading('Chargement impossible')}<div class="notice danger" role="alert">${esc(A.errorMessage(e))}</div>${button('Réessayer','retry-page')}`);on('retry-page',load);}}
    await load();
    root.addEventListener('pageshow',e=>{if(e.persisted&&role)load();});
    root.addEventListener('focus',()=>{if(role&&!A.getSession())redirectLogin();});
  }
  document.addEventListener('DOMContentLoaded',init);
})(window);
