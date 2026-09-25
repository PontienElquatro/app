(function(root){
'use strict';
const TIME_ZONE='Africa/Kinshasa';
  const doctors = [
    { id: 'ilunga', name: 'Dr Ilunga', initials: 'DI', specialty: 'Médecine générale', commune: 'Gombe', rating: 4.8, reviews: 32, distance: 2.3, color: 'blue', dayOffset: 1, languages: ['Français', 'Lingala', 'Swahili'] },
    { id: 'kabila', name: 'Dr Kabila', initials: 'DK', specialty: 'Pédiatrie', commune: 'Lingwala', rating: 4.6, reviews: 28, distance: 4.1, color: 'teal', dayOffset: 1, languages: ['Français', 'Lingala'] },
    { id: 'mbuyi', name: 'Dr Mbuyi', initials: 'DM', specialty: 'Dermatologie', commune: 'Kalamu', rating: 4.7, reviews: 41, distance: 5.2, color: 'sand', dayOffset: 1, languages: ['Français', 'Lingala'] },
    { id: 'lukusa', name: 'Dr Lukusa', initials: 'DL', specialty: 'Gynécologie', commune: 'Gombe', rating: 4.9, reviews: 56, distance: 1.8, color: 'violet', dayOffset: 1, languages: ['Français', 'Lingala'] },
    { id: 'tshimanga', name: 'Dr Tshimanga', initials: 'DT', specialty: 'Cardiologie', commune: 'Limete', rating: 4.8, reviews: 37, distance: 6.4, color: 'blue', dayOffset: 2, languages: ['Français', 'Lingala'] },
    { id: 'ntumba', name: 'Dr Ntumba', initials: 'DN', specialty: 'Ophtalmologie', commune: 'Ngaliema', rating: 4.5, reviews: 22, distance: 7.1, color: 'teal', dayOffset: 2, languages: ['Français', 'Lingala'] }
  ].map(doctor => Object.freeze({ ...doctor, languages: Object.freeze(doctor.languages), priceCents: 2000, durationMinutes: 30 }));

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();
  }
  function getDoctor(id) { return doctors.find(doctor => doctor.id === id) || null; }
  function dateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
  }
  function formatDate(value) {
    return new Intl.DateTimeFormat('fr-CD', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
  }
  function formatTime(value) {
    return new Intl.DateTimeFormat('fr-CD', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
  }
  function formatMoney(cents) {
    return `${new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} $`;
  }
  function nextSlotLabel(slot, now = Date.now()) {
    if (!slot) return 'Aucun créneau disponible';
    const tomorrow = new Date(`${dateKey(new Date(now))}T12:00:00+01:00`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return `${dateKey(new Date(slot)) === dateKey(tomorrow) ? 'Demain' : new Intl.DateTimeFormat('fr-CD', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' }).format(new Date(slot))} à ${formatTime(slot)}`;
  }

root.MongangaCatalog={doctors,normalize,getDoctor,dateKey,formatDate,formatTime,formatMoney,nextSlotLabel};
})(window);
