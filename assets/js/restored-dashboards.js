/* Remplir les blocs d’origine, sans reconstruire la page ni sa navigation. */
(function(root){
  'use strict';
  const U=root.Monganga,A=root.MongangaApi,D=root.MongangaData,C=root.MongangaCatalog;
  const {$,$$,esc}=U;
  const txt=(selector,value)=>{const el=$(selector);if(el)el.textContent=value;};
  const initial=name=>String(name||'').replace(/^Dr\.?\s*/i,'').split(' ').filter(Boolean).map(n=>n[0]).slice(0,2).join('').toUpperCase();
  const month=value=>value?C.dateKey(new Date(value)).slice(0,7):'';
  const metric=(index,value,note)=>{txt(`#metric-${index}`,value);txt(`#metric-note-${index}`,note);};
  const empty=message=>`<p class="dashboard-empty">${esc(message)}</p>`;
  const listRow=(name,detail,href,badge='')=>`<a class="list-row dashboard-patient-row" href="${esc(href)}"><div class="list-main"><div class="doctor-avatar">${esc(initial(name))}</div><div><div class="list-name">${esc(name)}</div><div class="list-meta">${esc(detail)}</div></div></div>${badge||U.icon('chevron-right')}</a>`;
  function chart(items,caption=''){
    items=items.map(item=>({...item,count:Number.isFinite(Number(item.count))?Math.max(0,Math.trunc(Number(item.count))):0}));
    const el=$('#dashboard-chart'),max=Math.max(1,...items.map(item=>item.count));
    el.innerHTML=items.map(item=>`<div class="bar-col" aria-label="${esc(item.label)} : ${item.count}"><span class="bar-value">${item.count}</span><div class="bar-stack" style="height:${Math.round(item.count/max*105)}px" aria-hidden="true"></div><span class="bar-label">${esc(item.label)}</span></div>`).join('');
    let p=$('#chart-caption');if(!p){p=document.createElement('p');p.id='chart-caption';p.className='chart-caption';el.after(p);}p.textContent=caption;p.hidden=!caption;
  }
  U.pages.patientDashboard=async()=>{
    const [bookings,rx,transactions]=await Promise.all([D.call('bookings'),D.call('prescriptions'),D.call('transactions')]);
    const session=A.getSession(),now=Date.now(),current=month(new Date().toISOString());
    const upcoming=bookings.filter(b=>['confirmed','requested','in_progress'].includes(b.status)&&(Date.parse(b.slot)>=now||b.status==='in_progress')).sort((a,b)=>Date.parse(a.slot)-Date.parse(b.slot));
    const paid=transactions.filter(t=>['paid','refund_pending'].includes(t.status)&&month(t.createdAt)===current);
    txt('#dashboard-greeting',`Bonjour ${session.name.split(' ')[0]} 👋`);
    metric(0,upcoming.length,upcoming[0]?C.nextSlotLabel(upcoming[0].slot):'Aucun rendez-vous prévu');
    metric(1,rx.filter(r=>r.status==='active').length,'Actives');
    metric(2,bookings.filter(b=>b.status==='completed').length,'Consultations terminées');
    metric(3,C.formatMoney(paid.reduce((sum,t)=>sum+t.amountCents,0)),`${paid.length} paiement${paid.length>1?'s':''}`);
    const next=upcoming[0],link=$('#next-rdv-link'),badge=$('#next-rdv-status');
    if(next){
      txt('#next-rdv-label',U.when(next.slot));txt('#next-rdv-avatar',initial(next.doctorName));txt('#next-rdv-doctor',next.doctorName);txt('#next-rdv-specialty',next.specialty||'Téléconsultation • Vidéo');
      badge.innerHTML=U.badge(next.status);badge.className='';
      const confirmed=['confirmed','in_progress'].includes(next.status);link.href=confirmed?`consult.html?id=${encodeURIComponent(next.id)}`:'history.html';link.innerHTML=`${U.icon(confirmed?'video':'calendar')} ${confirmed?'Rejoindre':'Voir le rendez-vous'}`;
    }else{
      txt('#next-rdv-label','Aucun rendez-vous à venir');txt('#next-rdv-avatar','—');txt('#next-rdv-doctor','Votre prochain rendez-vous apparaîtra ici');txt('#next-rdv-specialty','Choisissez un médecin et un créneau disponible.');badge.hidden=true;link.href='search.html';link.innerHTML=U.icon('search')+' Trouver un médecin';
    }
    U.initLucide();
  };
  U.pages.doctorDashboard=async()=>{
    const [bookings,patients,transactions,profile]=await Promise.all([D.call('bookings'),D.call('patients'),D.call('transactions'),D.call('profile')]);
    const today=C.dateKey(),current=today.slice(0,7),previous=new Date(`${today}T12:00:00+01:00`);previous.setUTCDate(previous.getUTCDate()-1);
    const active=bookings.filter(b=>['confirmed','in_progress','completed'].includes(b.status));
    const agenda=active.filter(b=>C.dateKey(new Date(b.slot))===today).sort((a,b)=>Date.parse(a.slot)-Date.parse(b.slot));
    const yesterday=active.filter(b=>C.dateKey(new Date(b.slot))===C.dateKey(previous)).length;
    const requests=bookings.filter(b=>b.status==='requested');
    const gains=transactions.filter(t=>t.status==='paid'&&month(t.createdAt)===current).reduce((sum,t)=>sum+t.amountCents-t.feeCents,0);
    txt('#dashboard-greeting',`Bonjour, ${A.getSession().name}`);txt('.doctor-mini-meta span',profile.specialty||'Médecin');
    const diff=agenda.length-yesterday;
    metric(0,agenda.length,`${diff>=0?'+':''}${diff} vs. hier`);metric(1,patients.length,'Patients de votre cabinet');metric(2,requests.length,'À examiner');metric(3,C.formatMoney(gains),'Après frais de service');
    txt('#agenda-date',C.formatDate(new Date().toISOString()));
    $('#dashboard-agenda').innerHTML=agenda.length?agenda.map(b=>`<div class="timeline-item"><div class="timeline-main"><span class="timeline-time">${esc(C.formatTime(b.slot))}</span><span class="timeline-dot"></span><div><div class="timeline-name">${esc(b.patientName)}</div><div class="timeline-meta">Téléconsultation • 30 min</div></div></div><div class="timeline-actions">${U.badge(b.status)}${b.status==='completed'?'<a class="btn btn-secondary btn-sm" href="patients.html">Dossier</a>':`<a class="btn btn-primary btn-sm" href="consult.html?id=${encodeURIComponent(b.id)}">${U.icon('video')} Rejoindre</a>`}</div></div>`).join(''):empty('Aucune consultation programmée aujourd’hui.');
    $('#dashboard-requests').innerHTML=requests.length?requests.slice(0,3).map(b=>listRow(b.patientName,U.when(b.slot),'demandes.html',U.badge(b.status))).join(''):empty('Vous n’avez aucune demande en attente.');
    const completed=active.filter(b=>b.status==='completed').sort((a,b)=>Date.parse(b.slot)-Date.parse(a.slot));
    const seen=new Set(),recent=completed.filter(b=>!seen.has(b.patientId)&&seen.add(b.patientId)).slice(0,3);
    $('#dashboard-patients').innerHTML=recent.length?recent.map(b=>listRow(b.patientName,C.formatDate(b.slot),'patients.html')).join(''):empty('Vos patients apparaîtront après leur consultation.');
    const next=agenda.find(b=>b.status!=='completed');if(next)$('.quick-action').href=`consult.html?id=${encodeURIComponent(next.id)}`;
    const update=()=>{
      const period=$('#performance-period').value,now=new Date(`${today}T12:00:00+01:00`),year=Number(today.slice(0,4));let items;
      if(period==='year')items=Array.from({length:12},(_,i)=>({label:new Intl.DateTimeFormat('fr',{month:'short'}).format(new Date(year,i,15)),count:completed.filter(b=>month(b.slot)===`${year}-${String(i+1).padStart(2,'0')}`).length}));
      else if(period==='week'){const day=(now.getUTCDay()+6)%7;now.setUTCDate(now.getUTCDate()-day);items=Array.from({length:7},(_,i)=>{const date=new Date(now);date.setUTCDate(date.getUTCDate()+i);return {label:new Intl.DateTimeFormat('fr',{weekday:'short'}).format(date),count:completed.filter(b=>C.dateKey(new Date(b.slot))===C.dateKey(date)).length};});}
      else items=Array.from({length:5},(_,i)=>({label:`S${i+1}`,count:completed.filter(b=>month(b.slot)===current&&Math.floor((Number(C.dateKey(new Date(b.slot)).slice(-2))-1)/7)===i).length}));
      chart(items,items.some(i=>i.count)?'Consultations terminées sur la période.':'Aucune consultation terminée sur cette période.');
    };$('#performance-period').onchange=update;update();U.initLucide();
  };
  U.pages.adminDashboard=async()=>{
    const data=await D.call('adminOverview'),m=data.metrics;
    const percent=v=>v==null?'—':`${new Intl.NumberFormat('fr',{maximumFractionDigits:1}).format(v)} %`;
    metric(0,m.activeUsers,'Comptes actifs');metric(1,m.doctors,'Comptes médecins');metric(2,percent(m.approvalRate),'Candidatures traitées');metric(3,C.formatMoney(m.volumeCents),'Paiements reçus ce mois');
    txt('#performance-0',percent(m.retentionRate));txt('#performance-1',m.consultations);txt('#performance-2',m.satisfaction==null?'—':`${new Intl.NumberFormat('fr',{maximumFractionDigits:1}).format(m.satisfaction)}/5`);
    $('#performance-0').title=m.retentionRate==null?'Historique insuffisant pour calculer la rétention.':'Patients du mois précédent revenus ce mois.';
    $('#performance-2').title=m.satisfaction==null?'Aucun avis disponible.':'Moyenne des avis de consultation.';
    const update=()=>{const period=$('#growth-period').value;txt('#growth-range',{week:'7 derniers jours',month:'6 derniers mois',year:'12 derniers mois'}[period]);chart(data.growth[period],data.growthComplete?'Nouveaux comptes sur la période.':'Historique des inscriptions incomplet.');};
    $('#growth-period').onchange=update;update();
    $('#dashboard-activity').innerHTML=data.activity.length?data.activity.slice(0,4).map(e=>`<div class="timeline-item"><div class="timeline-main"><span class="timeline-time">${esc(C.formatTime(e.at))}</span><span class="timeline-dot"></span><div><div class="timeline-name">${esc(e.title)}</div><div class="timeline-meta">${esc(e.detail)}</div></div></div>${U.badge(e.status)}</div>`).join(''):empty('Aucune activité récente.');
    $('#dashboard-alerts').innerHTML=listRow(`${data.alerts.applications} candidature${data.alerts.applications>1?'s':''} à examiner`,'Documents médicaux en attente','validations.html')+listRow(`${data.alerts.failedPayments} paiement${data.alerts.failedPayments>1?'s':''} échoué${data.alerts.failedPayments>1?'s':''}`,'Consulter les transactions','transactions.html')+(data.alerts.refunds?listRow(`${data.alerts.refunds} remboursement${data.alerts.refunds>1?'s':''} à traiter`,'Rendez-vous annulés','transactions.html'):'');
    $('#dashboard-audit').innerHTML=data.audit.length?data.audit.slice(0,4).map(e=>`<div class="list-row"><div><div class="list-name">${esc(e.title)}</div><div class="list-meta">${esc(e.detail)}</div></div>${U.badge(e.status)}</div>`).join(''):empty('Aucune action administrative enregistrée.');
    $('#export-summary').onclick=()=>U.csv('monganga-synthese-admin.csv',[['Indicateur','Valeur'],['Utilisateurs actifs',m.activeUsers],['Médecins inscrits',m.doctors],['Demandes validées',percent(m.approvalRate)],['Volume transactions',C.formatMoney(m.volumeCents)],['Consultations ce mois',m.consultations],['Rétention',percent(m.retentionRate)],['Satisfaction',m.satisfaction??'Non disponible']]);
    U.initLucide();
  };
})(window);
