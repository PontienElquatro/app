/* Appliquer la préférence avant le premier affichage. Aucun contenu sensible stocké. */
try { document.documentElement.dataset.theme = localStorage.getItem('monganga-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch {}
