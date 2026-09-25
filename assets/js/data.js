/* Services frontend. Mode API : seul le serveur fournit et modifie les données.
   Mode démo : jeu de données fictives, partagé entre les rôles dans cet onglet. */
(function (root) {
  'use strict';
  const A = root.MongangaApi, C = root.MongangaCatalog;
  const KEY = 'monganga-demo-v2';
  const routes = Object.freeze({
    doctors: ['GET', () => '/doctors'], slots: ['GET', p => `/doctors/${enc(p.doctorId)}/slots${p.excludeBooking ? '?excludeBooking='+enc(p.excludeBooking) : ''}`],
    profile: ['GET', () => '/me/profile'], saveProfile: ['PUT', () => '/me/profile'], avatar: ['POST', () => '/me/avatar'],
    preferences: ['GET', () => '/me/preferences'], savePreferences: ['PUT', () => '/me/preferences'],
    password: ['PUT', () => '/me/password'], dataExport: ['POST', () => '/me/export'],
    bookings: ['GET', () => '/bookings'], booking: ['GET', p => `/bookings/${enc(p.id)}`],
    createBooking: ['POST', () => '/bookings'], cancelBooking: ['POST', p => `/bookings/${enc(p.id)}/cancel`],
    reschedule: ['PUT', p => `/bookings/${enc(p.id)}/slot`],
    paymentStart: ['POST', p => `/bookings/${enc(p.id)}/payment`], paymentStatus: ['GET', p => `/bookings/${enc(p.id)}/payment`],
    paymentCancel: ['POST', p => `/bookings/${enc(p.id)}/payment/cancel`],
    availability: ['GET', () => '/doctors/me/availability'], addSlot: ['POST', () => '/doctors/me/availability'],
    removeSlot: ['DELETE', p => `/doctors/me/availability/${enc(p.id)}`], duplicateWeek: ['POST', () => '/doctors/me/availability/duplicate'],
    patients: ['GET', () => '/doctors/me/patients'], saveNote: ['PUT', p => `/doctors/me/patients/${enc(p.patientId)}/note`],
    prescriptions: ['GET', () => '/prescriptions'], createPrescription: ['POST', () => '/prescriptions'],
    document: ['GET', p => `/prescriptions/${enc(p.id)}/document`],
    notifications: ['GET', () => '/notifications'], readNotifications: ['POST', () => '/notifications/read'],
    room: ['GET', p => `/consultations/${enc(p.id)}`], messages: ['GET', p => `/consultations/${enc(p.id)}/messages`],
    sendMessage: ['POST', p => `/consultations/${enc(p.id)}/messages`], attachment: ['POST', p => `/consultations/${enc(p.id)}/attachments`],
    callToken: ['POST', p => `/consultations/${enc(p.id)}/join`], finishCall: ['POST', p => `/consultations/${enc(p.id)}/finish`],
    review: ['POST', p => `/consultations/${enc(p.id)}/review`],
    adminOverview: ['GET', () => '/admin/dashboard'],
    users: ['GET', () => '/admin/users'], userStatus: ['PUT', p => `/admin/users/${enc(p.id)}/status`],
    applications: ['GET', () => '/admin/applications'], applicationStatus: ['PUT', p => `/admin/applications/${enc(p.id)}/status`],
    applicationDocument: ['GET', p => `/admin/applications/${enc(p.id)}/documents/${enc(p.documentId)}`],
    transactions: ['GET', () => '/transactions'], refund: ['POST', p => `/admin/transactions/${enc(p.id)}/refund`],
    requestStatus: ['PUT', p => `/bookings/${enc(p.id)}/request-status`],
    application: ['POST', () => '/doctor-applications'], contact: ['POST', () => '/contact']
  });
  const enc = value => encodeURIComponent(String(value || ''));
  const id = prefix => `${prefix}-${root.crypto.randomUUID()}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = message => { throw new Error(message); };
  const requireText = (value, label, max = 2000) => { if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${label} : valeur manquante ou trop longue.`); return value.trim(); };
  function generatedSlots(doctorId, now = Date.now()) {
    const slots = [];
    const date = new Date(`${C.dateKey(new Date(now))}T12:00:00+01:00`);
    for (let day = 1; day <= 7; day++) {
      const d = new Date(date); d.setUTCDate(d.getUTCDate() + day);
      for (const time of ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']) {
        const start = new Date(`${C.dateKey(d)}T${time}:00+01:00`).toISOString();
        slots.push({ id: `${doctorId}-${start}`, doctorId, start, durationMinutes: 30 });
      }
    }
    return slots;
  }
  function seed() {
    const doctors = C.doctors.map(d => ({ ...d, bio: `Consultations à distance en ${d.specialty.toLowerCase('fr')}. Profil fictif de démonstration.`, status: 'active', orderNumber: 'DEMO-001' }));
    const completed = { id: 'booking-demo-completed', patientId: 'patient-demo', doctorId: 'ilunga', slot: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'completed', paymentStatus: 'paid', priceCents: 2000, feeCents: 100, totalCents: 2100, method: 'M-Pesa', reference: 'DEMO-EXAMPLE', confirmedAt: new Date(Date.now() - 3 * 86400000).toISOString(), createdAt: new Date().toISOString() };
    return { version: 2, doctors, slots: doctors.flatMap(d => generatedSlots(d.id)),
      users: [{ id: 'patient-demo', name: 'Aline Kabila', email: 'patient@monganga.cd', role: 'patient', status: 'active' },
        { id: 'patient-second', name: 'Patient exemple', email: 'patient2@monganga.cd', role: 'patient', status: 'active' },
        ...doctors.map(d => ({ id: `user-${d.id}`, name: d.name, email: `dr.${d.id}@monganga.cd`, role: 'doctor', doctorId: d.id, status: 'active' })),
        { id: 'admin-demo', name: 'Administration', email: 'admin@monganga.cd', role: 'admin', status: 'active' }],
      profiles: {}, preferences: {}, notes: {}, messages: {}, reviews: [], bookings: [completed],
      transactions: [{ id: 'tx-example', bookingId: completed.id, patientId: 'patient-demo', doctorId: 'ilunga', amountCents: 2100, feeCents: 100, status: 'paid', createdAt: completed.confirmedAt, method: 'M-Pesa', reference: 'DEMO-EXAMPLE' }],
      prescriptions: [{ id: 'rx-example', bookingId: completed.id, patientId: 'patient-demo', doctorId: 'ilunga', issuedAt: completed.slot, medication: 'Exemple de prescription', instructions: 'Contenu fictif pour vérifier la présentation. Ne pas utiliser pour un traitement.', status: 'active' }],
      applications: [{ id: 'app-example', name: 'Dr Exemple', email: 'candidat@example.test', specialty: 'Cardiologie', commune: 'Gombe', bio: 'Profil candidat fictif.', status: 'pending', createdAt: new Date().toISOString(), documents: [{ id: 'cv', name: 'CV exemple.pdf', demo: true }] }], notifications: [], contacts: [] };
  }
  function read() {
    const raw = root.sessionStorage.getItem(KEY);
    if (!raw) { const db = seed(); save(db); return db; }
    try { const db = JSON.parse(raw); if (db.version !== 2 || !Array.isArray(db.bookings)) throw new Error(); return db; }
    catch { fail('Les données de démonstration sont illisibles. Réinitialisez la démo depuis la connexion.'); }
  }
  function save(db) { root.sessionStorage.setItem(KEY, JSON.stringify(db)); }
  function session() { const s = A.getSession(); if (!s) fail('Connectez-vous pour continuer.'); const user = read().users.find(u => u.id === s.id && u.status === 'active'); if (!user) { A.clearSession(); fail('Ce compte n’est plus actif. Reconnectez-vous.'); } return s; }
  function role(...roles) { const s = session(); if (!roles.includes(s.role)) fail('Action non autorisée pour ce compte.'); return s; }
  function ownBooking(db, bookingId) {
    const s = session(); const b = db.bookings.find(item => item.id === bookingId);
    if (!b || !(s.role === 'admin' || (s.role === 'patient' && b.patientId === s.id) || (s.role === 'doctor' && b.doctorId === s.doctorId))) fail('Rendez-vous introuvable.');
    return b;
  }
  function available(db, doctorId, now = Date.now(), excludeBooking) {
    return db.slots.filter(slot => slot.doctorId === doctorId && Date.parse(slot.start) >= now + 86400000 &&
      !db.bookings.some(b => b.id !== excludeBooking && b.doctorId === doctorId && b.slot === slot.start && ['confirmed', 'requested', 'in_progress', 'payment_pending'].includes(b.status)));
  }
  function notice(db, userId, title, message) { db.notifications.unshift({ id: id('notice'), userId, title, message, read: false, createdAt: new Date().toISOString() }); }
  function bookingView(db, b) { return { ...b, doctorName: db.doctors.find(d => d.id === b.doctorId)?.name || 'Médecin', patientName: db.users.find(u => u.id === b.patientId)?.name || 'Patient' }; }
  function demo(name, p = {}) {
    const db = read(); let out;
    const s = A.getSession();
    switch (name) {
      case 'doctors': return db.doctors.filter(d => d.status === 'active').map(d => ({...d, nextSlot: available(db, d.id).sort((a,b) => Date.parse(a.start)-Date.parse(b.start))[0]?.start || null}));
      case 'slots': return available(db, p.doctorId, Date.now(), p.excludeBooking);
      case 'profile': {
        session(); const d = db.doctors.find(d => d.id === s.doctorId);
        return { name: s.name, email: s.email, phone: '', birthDate: '', commune: d?.commune || 'Gombe', bio: d?.bio || '', specialty: d?.specialty || '', bloodType: '', height: '', allergies: '', conditions: '', medications: '', ...db.profiles[s.id] };
      }
      case 'saveProfile': {
        session(); const nameValue = requireText(p.name, 'Nom', 120); if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) fail('Email invalide.');
        if (p.phone && !/^\+?[0-9 ()-]{9,20}$/.test(p.phone)) fail('Téléphone invalide.');
        if (p.birthDate && (!Number.isFinite(Date.parse(p.birthDate)) || Date.parse(p.birthDate) > Date.now())) fail('Date de naissance invalide.');
        const fields = ['email','phone','birthDate','commune','bio','bloodType','height','allergies','conditions','medications'];
        const profile = { ...db.profiles[s.id], name: nameValue }; fields.forEach(k => { if (p[k] !== undefined) profile[k] = String(p[k]).slice(0, 4000); });
        db.profiles[s.id] = profile;
        const user = db.users.find(u => u.id === s.id); Object.assign(user, { name: nameValue, email: profile.email || user.email });
        const d = db.doctors.find(d => d.id === s.doctorId); if (d) Object.assign(d, { name: nameValue, commune: profile.commune, bio: profile.bio });
        out = profile; break;
      }
      case 'avatar': {
        session(); const file = p.get('file'); validateFile(file, true, 5); // Les octets restent dans le formulaire ; pas de base64 dans le stockage.
        return { previewOnly: true };
      }
      case 'preferences': session(); return db.preferences[s.id] || { reminders: true, prescriptions: true, news: false };
      case 'savePreferences': session(); out = db.preferences[s.id] = { reminders: !!p.reminders, prescriptions: !!p.prescriptions, news: !!p.news }; break;
      case 'password': case 'dataExport': fail('Cette opération nécessite le service de compte. Elle est indisponible en démonstration.'); break;
      case 'bookings': session(); return db.bookings.filter(b => s.role === 'admin' || (s.role === 'doctor' ? b.doctorId === s.doctorId : b.patientId === s.id)).map(b => bookingView(db,b));
      case 'booking': case 'paymentStatus': return bookingView(db, ownBooking(db, p.id));
      case 'createBooking': {
        role('patient'); const doctor = db.doctors.find(d => d.id === p.doctorId && d.status === 'active');
        if (!doctor || !available(db, doctor.id).some(slot => slot.start === p.slot)) fail('Ce créneau n’est plus disponible.');
        const existing = db.bookings.find(b => b.patientId === s.id && b.doctorId === p.doctorId && b.slot === p.slot && ['draft','payment_failed'].includes(b.status));
        if (existing) return existing;
        out = { id: id('booking'), patientId: s.id, doctorId: doctor.id, slot: p.slot, status: 'draft', paymentStatus: 'unpaid', priceCents: doctor.priceCents, feeCents: 100, totalCents: doctor.priceCents + 100, createdAt: new Date().toISOString() };
        db.bookings.push(out); break;
      }
      case 'paymentStart': {
        role('patient'); const b = ownBooking(db, p.id);
        if (b.status === 'payment_pending' || b.paymentStatus === 'paid') return b;
        if (!['draft','payment_failed'].includes(b.status)) fail('Ce rendez-vous ne peut plus être payé.');
        if (!available(db, b.doctorId).some(slot => slot.start === b.slot)) fail('Ce créneau a expiré ou est occupé.');
        if (!['M-Pesa','Airtel Money','Orange Money','Visa','Mastercard'].includes(p.method)) fail('Moyen de paiement invalide.');
        b.status = 'payment_pending'; b.paymentStatus = 'pending'; b.method = p.method; out = b; break;
      }
      case 'paymentDemo': {
        role('patient'); const b = ownBooking(db, p.id);
        if (b.paymentStatus === 'paid' && p.success) return b;
        if (b.status !== 'payment_pending') fail('Aucun paiement en attente.');
        b.status = p.success ? 'confirmed' : 'payment_failed'; b.paymentStatus = p.success ? 'paid' : 'failed';
        if (p.success) {
          b.reference = `DEMO-${b.id}`; b.confirmedAt = new Date().toISOString();
          db.transactions.push({ id: id('tx'), bookingId: b.id, patientId: s.id, doctorId: b.doctorId, amountCents: b.totalCents, feeCents: b.feeCents, method: b.method, status: 'paid', reference: b.reference, createdAt: b.confirmedAt });
          notice(db, s.id, 'Rendez-vous confirmé', `${C.formatDate(b.slot)} à ${C.formatTime(b.slot)}`);
        }
        out = b; break;
      }
      case 'paymentCancel': {
        role('patient'); const b = ownBooking(db, p.id); if (b.status !== 'payment_pending') fail('Aucun paiement en attente.'); b.status = 'draft'; b.paymentStatus = 'unpaid'; out = b; break;
      }
      case 'cancelBooking': {
        const b = ownBooking(db, p.id);
        if (!['confirmed','requested','draft','payment_failed'].includes(b.status)) fail('Ce rendez-vous ne peut plus être annulé.');
        requireText(p.reason, 'Motif', 1000); b.status = 'cancelled'; b.reason = p.reason;
        if (b.paymentStatus === 'paid') { b.paymentStatus = 'refund_pending'; const tx = db.transactions.find(t => t.bookingId === b.id); if (tx) tx.status = 'refund_pending'; }
        notice(db, b.patientId, 'Rendez-vous annulé', p.reason); out = b; break;
      }
      case 'reschedule': {
        const b = ownBooking(db, p.id); if (b.status !== 'confirmed' || Date.parse(b.slot) <= Date.now()) fail('Ce rendez-vous ne peut plus être déplacé.');
        if (!available(db, b.doctorId, Date.now(), b.id).some(slot => slot.start === p.slot)) fail('Le nouveau créneau n’est plus disponible.');
        b.slot = p.slot; notice(db, b.patientId, 'Rendez-vous déplacé', C.formatDate(p.slot)); out = b; break;
      }
      case 'availability': role('doctor'); return db.slots.filter(slot => slot.doctorId === s.doctorId).map(slot => ({ ...slot, booked: db.bookings.some(b => b.doctorId === s.doctorId && b.slot === slot.start && ['confirmed','payment_pending','requested','in_progress'].includes(b.status)) }));
      case 'addSlot': {
        role('doctor'); const time = Date.parse(p.start); if (!Number.isFinite(time) || time < Date.now() + 86400000) fail('Choisissez un horaire au moins 24 h à l’avance.');
        if (db.slots.some(slot => slot.doctorId === s.doctorId && Math.abs(Date.parse(slot.start) - time) < 30 * 60000)) fail('Ce créneau chevauche un horaire existant.');
        out = { id: id('slot'), doctorId: s.doctorId, start: new Date(time).toISOString(), durationMinutes: 30 }; db.slots.push(out); break;
      }
      case 'removeSlot': {
        role('doctor'); const slot = db.slots.find(t => t.id === p.id && t.doctorId === s.doctorId); if (!slot) fail('Créneau introuvable.');
        if (db.bookings.some(b => b.doctorId === s.doctorId && b.slot === slot.start && ['confirmed','requested','payment_pending','in_progress'].includes(b.status))) fail('Un rendez-vous occupe ce créneau.');
        db.slots = db.slots.filter(t => t.id !== p.id); out = { removed: true }; break;
      }
      case 'duplicateWeek': {
        role('doctor'); const from = Date.parse(`${p.startDate}T00:00:00+01:00`); if (!Number.isFinite(from)) fail('Semaine invalide.');
        const list = db.slots.filter(t => t.doctorId === s.doctorId && Date.parse(t.start) >= from && Date.parse(t.start) < from + 7 * 86400000);
        if (!list.length) fail('Aucun créneau dans la semaine sélectionnée.'); let count = 0;
        list.forEach(t => { const time = Date.parse(t.start) + 7 * 86400000;
          if (time >= Date.now() + 86400000 && !db.slots.some(o => o.doctorId === s.doctorId && Math.abs(Date.parse(o.start) - time) < 1800000)) { db.slots.push({ ...t, id: id('slot'), start: new Date(time).toISOString() }); count++; }
        }); out = { count }; break;
      }
      case 'requestStatus': {
        role('doctor'); const b = ownBooking(db, p.id); if (b.status !== 'requested') fail('La demande a déjà été traitée.');
        if (!['confirmed','cancelled'].includes(p.status)) fail('Statut invalide.');
        if (p.status === 'cancelled') requireText(p.reason, 'Motif', 1000); b.status = p.status; b.reason = p.reason || '';
        if (p.status === 'cancelled' && b.paymentStatus === 'paid') { b.paymentStatus = 'refund_pending'; const tx = db.transactions.find(t => t.bookingId === b.id); if (tx) tx.status = 'refund_pending'; }
        notice(db, b.patientId, 'Demande traitée', p.status === 'confirmed' ? 'Votre médecin a accepté le rendez-vous.' : p.reason); out = b; break;
      }
      case 'patients': {
        role('doctor'); const ids = new Set(db.bookings.filter(b => b.doctorId === s.doctorId && ['confirmed','completed','in_progress'].includes(b.status)).map(b => b.patientId));
        return db.users.filter(u => ids.has(u.id)).map(u => ({ ...u, profile: db.profiles[u.id] || {}, note: db.notes[`${s.doctorId}:${u.id}`] || '' }));
      }
      case 'saveNote': {
        role('doctor'); if (!demo('patients').some(u => u.id === p.patientId)) fail('Patient non accessible.');
        db.notes[`${s.doctorId}:${p.patientId}`] = String(p.note || '').slice(0, 5000); out = { saved: true }; break;
      }
      case 'prescriptions': session(); return db.prescriptions.filter(rx => s.role === 'admin' || (s.role === 'doctor' ? rx.doctorId === s.doctorId : rx.patientId === s.id)).map(rx => ({...rx,doctorName: db.doctors.find(d => d.id === rx.doctorId)?.name || 'Médecin',patientName: db.users.find(u => u.id === rx.patientId)?.name || 'Patient'}));
      case 'createPrescription': {
        role('doctor'); const b = ownBooking(db, p.bookingId); if (!['completed','in_progress'].includes(b.status)) fail('Une consultation commencée ou terminée est nécessaire.');
        out = { id: id('rx'), bookingId: b.id, patientId: b.patientId, doctorId: b.doctorId, patientName: db.users.find(u => u.id === b.patientId)?.name || 'Patient', medication: requireText(p.medication, 'Médicament', 200), instructions: requireText(p.instructions, 'Prescription', 4000), status: 'active', issuedAt: new Date().toISOString() }; db.prescriptions.unshift(out); notice(db, b.patientId, 'Nouvelle ordonnance', 'Votre document est disponible.'); break;
      }
      case 'document': { if (!demo('prescriptions').some(rx => rx.id === p.id)) fail('Document introuvable.'); return { url: null, qrUrl: null, verificationUrl: null, demo: true }; }
      case 'notifications': session(); return db.notifications.filter(n => n.userId === s.id);
      case 'readNotifications': session(); db.notifications.filter(n => n.userId === s.id).forEach(n => n.read = true); out = { read: true }; break;
      case 'room': {
        const b = ownBooking(db, p.id); if (!['confirmed','in_progress','completed'].includes(b.status)) fail('La consultation n’est pas accessible.');
        return { booking: b, doctor: db.doctors.find(d => d.id === b.doctorId), patient: { name: db.users.find(u => u.id === b.patientId)?.name || 'Patient' }, demo: true };
      }
      case 'messages': ownBooking(db, p.id); return db.messages[p.id] || [];
      case 'sendMessage': {
        const b = ownBooking(db, p.id); if (!['confirmed','in_progress'].includes(b.status)) fail('Cette consultation est terminée.');
        out = { id: id('message'), authorId: s.id, authorName: s.name, text: requireText(p.text, 'Message', 2000), createdAt: new Date().toISOString() };
        (db.messages[p.id] ||= []).push(out); break;
      }
      case 'attachment': { ownBooking(db, p.get('bookingId')); validateFile(p.get('file')); return { demo: true, message: 'Fichier sélectionné. Aucun envoi externe en démonstration.' }; }
      case 'callToken': fail('Aucun appel distant en démonstration. Testez votre caméra et votre microphone.'); break;
      case 'finishCall': { role('doctor'); const b = ownBooking(db, p.id); if (!['confirmed','in_progress'].includes(b.status)) fail('Consultation déjà terminée.'); b.status = 'completed'; b.completedAt = new Date().toISOString(); out = b; break; }
      case 'review': {
        role('patient'); const b = ownBooking(db, p.id); if (b.status !== 'completed') fail('Terminez la consultation avant de donner un avis.');
        if (!Number.isInteger(Number(p.rating)) || p.rating < 1 || p.rating > 5) fail('Choisissez une note entre 1 et 5.');
        const existing = db.reviews.find(r => r.bookingId === b.id); if (existing) return existing;
        out = { bookingId: b.id, rating: Number(p.rating), comment: String(p.comment || '').slice(0, 1000) }; db.reviews.push(out); break;
      }
      case 'adminOverview': {
        role('admin');
        const today=C.dateKey(),current=today.slice(0,7),previous=new Date(`${current}-15T12:00:00+01:00`);previous.setUTCMonth(previous.getUTCMonth()-1);
        const prevMonth=C.dateKey(previous).slice(0,7),dateMonth=v=>v?C.dateKey(new Date(v)).slice(0,7):'';
        const completed=db.bookings.filter(b=>b.status==='completed');
        const before=new Set(completed.filter(b=>dateMonth(b.slot)===prevMonth).map(b=>b.patientId));
        const now=new Set(completed.filter(b=>dateMonth(b.slot)===current).map(b=>b.patientId));
        const treated=db.applications.filter(a=>['approved','rejected'].includes(a.status));
        const growth={};
        for(const [period,length]of [['week',7],['month',6],['year',12]])growth[period]=Array.from({length},(_,i)=>{
          const date=new Date(`${period==='week'?today:current+'-15'}T12:00:00+01:00`);
          if(period==='week')date.setUTCDate(date.getUTCDate()-(length-1-i));else date.setUTCMonth(date.getUTCMonth()-(length-1-i));
          const key=C.dateKey(date).slice(0,period==='week'?10:7);
          return {label:new Intl.DateTimeFormat('fr',period==='week'?{weekday:'short'}:{month:'short'}).format(date),count:db.users.filter(u=>u.createdAt&&C.dateKey(new Date(u.createdAt)).startsWith(key)).length};
        });
        const activity=[...db.applications.map(a=>({at:a.createdAt,title:'Candidature médecin',detail:a.name,status:a.status})),...db.transactions.map(t=>({at:t.createdAt,title:'Paiement de consultation',detail:t.reference||t.id,status:t.status}))].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
        return {metrics:{activeUsers:db.users.filter(u=>u.status==='active').length,doctors:db.users.filter(u=>u.role==='doctor').length,approvalRate:treated.length?treated.filter(a=>a.status==='approved').length/treated.length*100:null,volumeCents:db.transactions.filter(t=>t.status==='paid'&&dateMonth(t.createdAt)===current).reduce((sum,t)=>sum+t.amountCents,0),retentionRate:before.size?[...before].filter(id=>now.has(id)).length/before.size*100:null,consultations:completed.filter(b=>dateMonth(b.slot)===current).length,satisfaction:db.reviews.length?db.reviews.reduce((sum,r)=>sum+Number(r.rating),0)/db.reviews.length:null},growth,growthComplete:db.users.every(u=>!!u.createdAt),activity:activity.slice(0,10),audit:db.applications.filter(a=>['approved','rejected','needs_documents'].includes(a.status)).map(a=>({title:'Décision sur une candidature',detail:a.name,status:a.status})),alerts:{applications:db.applications.filter(a=>a.status==='pending'||a.status==='needs_documents').length,failedPayments:db.transactions.filter(t=>t.status==='failed').length,refunds:db.transactions.filter(t=>t.status==='refund_pending').length}};
      }
      case 'users': role('admin'); return db.users;
      case 'userStatus': {
        role('admin'); const u = db.users.find(u => u.id === p.id); if (!u || u.id === s.id) fail('Action impossible sur ce compte.');
        if (!['active','suspended'].includes(p.status)) fail('Statut invalide.'); u.status = p.status;
        const d = db.doctors.find(d => d.id === u.doctorId); if (d) d.status = p.status; out = u; break;
      }
      case 'applications': role('admin'); return db.applications;
      case 'applicationStatus': {
        role('admin'); const app = db.applications.find(a => a.id === p.id); if (!app || ['approved','rejected'].includes(app.status)) fail('Dossier déjà traité ou introuvable.');
        if (!['approved','rejected','needs_documents'].includes(p.status)) fail('Statut invalide.');
        if (p.status !== 'approved') requireText(p.reason, 'Motif', 1000); app.status = p.status; app.reason = p.reason || '';
        if (p.status === 'approved') { const doctorId = id('doctor'); db.doctors.push({ id: doctorId, name: app.name, initials: 'DR', specialty: app.specialty, commune: app.commune, bio: app.bio, status: 'active', priceCents: 2000, durationMinutes: 30, languages: ['Français'], rating: null, reviews: 0, color: 'blue' }); db.users.push({ id: id('user'), doctorId, name: app.name, email: app.email, role: 'doctor', status: 'active' }); }
        out = app; break;
      }
      case 'applicationDocument': role('admin'); return { url: null, demo: true };
      case 'transactions': session(); return db.transactions.filter(t => s.role === 'admin' || (s.role === 'doctor' ? t.doctorId === s.doctorId : t.patientId === s.id)).map(t => ({...t,patientName: db.users.find(u => u.id === t.patientId)?.name || 'Patient'}));
      case 'refund': {
        role('admin'); const t = db.transactions.find(t => t.id === p.id); if (!t) fail('Transaction introuvable.');
        if (t.status === 'refunded') return t; if (!['paid','refund_pending'].includes(t.status)) fail('Cette transaction ne peut pas être remboursée.');
        requireText(p.reason, 'Motif', 1000); t.status = 'refunded'; t.reason = p.reason;
        const b = db.bookings.find(b => b.id === t.bookingId); if (b) { b.status = 'cancelled'; b.paymentStatus = 'refunded'; notice(db, b.patientId, 'Remboursement de démonstration', 'Votre rendez-vous a été annulé et son paiement remboursé dans la démo.'); }
        out = t; break;
      }
      case 'application': {
        const fields = Object.fromEntries([...p].filter(([,v]) => typeof v === 'string'));
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) fail('Email invalide.');
        if (!fields.consent) fail('Le consentement au traitement du dossier est requis.');
        if (!fields.attestation) fail('Confirmez l’exactitude du dossier.');
        const docs = [];
        for (const name of ['portrait','identity','medicalDiploma','orderCertificate','cv', ...(fields.specialty !== 'Médecine générale' ? ['specializationDiploma'] : [])]) { const f = p.get(name); validateFile(f, name === 'portrait'); docs.push({ id: name, name: f.name, demo: true }); }
        out = { id: id('application'), name: `${requireText(fields.firstName,'Prénom',80)} ${requireText(fields.lastName,'Nom',80)}`, email: fields.email, specialty: fields.specialty, commune: fields.commune, bio: fields.bio, phone: fields.phone, orderNumber: fields.orderNumber, demo: true, documents: docs, status: 'pending', createdAt: new Date().toISOString() }; db.applications.push(out); break;
      }
      case 'contact': requireText(p.name,'Nom',120); requireText(p.message,'Message',4000); if (!p.consent || (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))) fail('Vérifiez votre email et votre consentement.'); out = { id: id('message'), demo: true }; db.contacts.push({ ...p, ...out }); break;
      default: fail('Opération inconnue.');
    }
    save(db); return clone(out);
  }
  function validateFile(file, portrait = false, maxMB = 10) {
    const types = portrait ? ['image/jpeg','image/png','image/webp'] : ['application/pdf','image/jpeg','image/png','image/webp'];
    if (!file || !file.size || file.size > maxMB * 1024 * 1024 || !types.includes(file.type)) fail(`Choisissez ${portrait ? 'une image JPG, PNG ou WebP' : 'un PDF ou une image JPG, PNG ou WebP'} de ${maxMB} Mo maximum.`);
  }
  async function call(name, p = {}, options = {}) {
    if (!A.isConfigured()) return clone(demo(name, p));
    const route = routes[name]; if (!route) fail('Cette simulation est indisponible en mode connecté.');
    const [method, path] = route; const result = await A.request(path(p instanceof FormData ? Object.fromEntries(p) : p), { ...options, method, ...(method !== 'GET' ? { body: p } : {}) });
    return result;
  }
  function demoUsers() { return clone(read().users.filter(u => u.status === 'active')); }
  async function login(p) {
    if (A.isConfigured()) return A.setSession(await A.request('/auth/login', { method: 'POST', body: p }));
    const u = read().users.find(u => u.id === p.demoId && u.status === 'active');
    if (!u) fail('Choisissez un compte de démonstration.'); return A.setSession(u);
  }
  async function register(p) {
    if (!p.consent || (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))) fail('Vérifiez votre email et votre consentement.');
    if (!/^(?=.*[A-Z])(?=.*\d).{8,128}$/.test(p.password)) fail('Mot de passe : 8 caractères minimum, une majuscule et un chiffre.');
    if (!/^\+?[0-9 ()-]{9,20}$/.test(p.phone)) fail('Téléphone invalide.');
    if (A.isConfigured()) return A.request('/auth/register/patient', { method: 'POST', body: p });
    // Le mot de passe est supprimé avant toute persistance de la simulation.
    const challenge = { id: id('challenge'), name: requireText(p.name,'Nom',120), email: p.email || '', phone: p.phone, expiresAt: Date.now()+300000, attempts: 0, resendAt: Date.now()+60000 };
    root.sessionStorage.setItem('monganga-demo-otp', JSON.stringify(challenge)); return { challengeId: challenge.id, expiresAt: challenge.expiresAt, resendAt: challenge.resendAt, demo: true };
  }
  async function verify(p) {
    if (A.isConfigured()) return A.setSession(await A.request('/auth/verify-otp', { method: 'POST', body: p }));
    const c = JSON.parse(root.sessionStorage.getItem('monganga-demo-otp') || 'null');
    if (!c || c.id !== p.challengeId || c.expiresAt < Date.now()) fail('Code expiré. Recommencez l’inscription.');
    if (c.attempts >= 5) fail('Trop de tentatives. Demandez un nouveau code.');
    c.attempts++; root.sessionStorage.setItem('monganga-demo-otp',JSON.stringify(c));
    if (p.code !== '123456') fail('Code incorrect. Code de démonstration : 123456.');
    const db = read(); if (c.email && db.users.some(u => u.email?.toLowerCase() === c.email.toLowerCase())) fail('Cet email est déjà utilisé dans la démo.');
    const u = { id: id('patient'), name:c.name,email:c.email,phone:c.phone,role:'patient',status:'active',createdAt:new Date().toISOString() }; db.users.push(u); db.profiles[u.id]={phone:c.phone}; save(db); root.sessionStorage.removeItem('monganga-demo-otp'); return A.setSession(u);
  }
  async function resend(p) {
    if (A.isConfigured()) return A.request('/auth/resend-otp', { method: 'POST', body: p });
    const c = JSON.parse(root.sessionStorage.getItem('monganga-demo-otp') || 'null');
    if (!c || c.id !== p.challengeId) fail('Inscription introuvable.'); if (Date.now() < c.resendAt) fail('Patientez une minute entre deux demandes.');
    c.expiresAt=Date.now()+300000;c.resendAt=Date.now()+60000;c.attempts=0;root.sessionStorage.setItem('monganga-demo-otp',JSON.stringify(c));return { challengeId:c.id, expiresAt:c.expiresAt,resendAt:c.resendAt,demo:true };
  }
  root.MongangaData = { call, login, register, verify, resend, demoUsers, validateFile, routes,
    resetDemo() { if (A.isConfigured()) fail('Réinitialisation réservée à la démo.'); root.sessionStorage.removeItem(KEY); root.sessionStorage.removeItem('monganga-demo-otp'); A.clearSession(); },
    safeUrl(value, kind = 'document') { if (!value) return null; try { const url = new URL(value, root.location.href); if(url.username||url.password)return null; const allowed = root.MONGANGA_CONFIG?.[kind === 'payment' ? 'paymentOrigins' : 'documentOrigins'] || []; return ((url.origin === root.location.origin && ['http:','https:'].includes(url.protocol)) || (url.protocol === 'https:' && allowed.includes(url.origin))) ? url.href : null; } catch { return null; } }
  };
})(window);
