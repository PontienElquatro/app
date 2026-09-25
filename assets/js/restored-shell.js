/* Navigation des espaces d’origine ; aucun remplacement de leur contenu. */
(function(root){
  'use strict';
  const U=root.Monganga,A=root.MongangaApi;
  const {$,$$}=U;
  U.refreshIdentity=()=>{
    const s=A.getSession();if(!s)return;
    const name=$('.doctor-mini-meta strong');if(name)name.textContent=s.name;
    const avatar=$('.doctor-mini-avatar');if(avatar)avatar.textContent=s.name.split(' ').filter(n=>!/^dr\.?$/i.test(n)).map(n=>n[0]).slice(0,2).join('').toUpperCase();
    const meta=$('.doctor-mini-meta span');if(meta&&s.role==='doctor')meta.textContent=(!A.isConfigured()&&root.MongangaCatalog.doctors.find(d=>d.id===s.doctorId)?.specialty)||'Médecin';
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const patient=$('#patMenu'),sidebar=$('.doctor-sidebar'),drawer=patient||sidebar;
    if(!drawer)return;
    const media=matchMedia(patient?'(max-width:900px)':'(max-width:980px)');
    const overlay=patient?$('#patMenuOverlay'):$('.workspace-sidebar-overlay');
    const triggers=patient?$$('[onclick="toggleMenu()"]'):$$('[data-sidebar-toggle]');
    let open=false,origin;
    const setOpen=value=>{
      open=!!value&&media.matches;
      drawer.classList.toggle(patient?'active':'is-open',open);
      overlay?.classList.toggle('active',open);
      if(!patient)document.body.classList.toggle('workspace-sidebar-open',open);
      drawer.inert=media.matches&&!open;
      $$('main,.pat-mobile-nav').forEach(e=>e.inert=open);
      document.body.style.overflow=open?'hidden':'';
      triggers.forEach(e=>{if(e.tagName==='BUTTON')e.setAttribute('aria-expanded',String(open));});
      if(open){origin=document.activeElement;drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','Navigation');$('a[href],button',drawer)?.focus();}
      else{drawer.removeAttribute('aria-modal');drawer.removeAttribute('role');if(origin){origin.focus();origin=null;}}
    };
    triggers.forEach(e=>{e.removeAttribute('onclick');e.addEventListener('click',()=>setOpen(!open));});
    $$('a[href]',drawer).forEach(e=>e.addEventListener('click',()=>setOpen(false)));
    document.addEventListener('keydown',e=>{
      if(!open)return;
      if(e.key==='Escape'){setOpen(false);return;}
      if(e.key!=='Tab')return;
      const list=$$('a[href],button:not([disabled]),[tabindex="0"]',drawer).filter(e=>e.getClientRects().length);
      if(e.shiftKey&&document.activeElement===list[0]){e.preventDefault();list.at(-1)?.focus();}
      else if(!e.shiftKey&&document.activeElement===list.at(-1)){e.preventDefault();list[0]?.focus();}
    });
    media.addEventListener('change',()=>setOpen(false));setOpen(false);
    U.refreshIdentity();
  });
})(window);
