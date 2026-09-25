# Correction des mises en page — 25 septembre 2026

Les modifications visuelles non demandées ont été retirées des pages signalées.

- Dashboards patient, médecin et administration : retour aux structures HTML d’origine, avec leurs indicateurs, sections, graphiques et actions. Les données sont injectées dans les blocs existants.
- Médecin et administration : barres latérales d’origine rétablies sur les sous-pages fonctionnelles. Patient : en-tête, menu mobile et navigation basse d’origine.
- `public/faq.html` et `public/how.html` : contenu du corps de page et styles spécifiques comparés à la sauvegarde antérieure, identiques. La FAQ conserve ses filtres et accepte le clavier.
- Connexion et inscription : cartes originales sur fond sombre, champs, boutons et onglets Patient/Médecin rétablis. Les pages OTP, oubli et réinitialisation utilisent cette même présentation.
- Inscription par téléphone avec email facultatif ; connexion par identifiant email ou téléphone. Pas de déduction de rôle à partir du texte saisi. Les comptes de démo sont explicites.
- Photo d’accueil conservée sans carte du Dr Ilunga ni cœur superposé.

Les scripts `build-pages.py` et `normalize-public.cjs` de la refonte ont été retirés : les fichiers HTML sont les sources de mise en page. Les anciens rendus génériques des dashboards et des pages d’authentification ont également été retirés des contrôleurs.

Le contrat backend inclut `GET /admin/dashboard`, les données des graphiques et les indicateurs des blocs restaurés. Les fonctions réelles restent à implémenter côté serveur. Les valeurs indisponibles apparaissent sous forme de tiret ; elles ne sont pas remplacées par des statistiques commerciales inventées.

Les captures actualisées se trouvent dans `docs/captures-restauration/`. Voir `docs/RECETTE.md` pour les vérifications.

---

# Monganga — livraison frontend 2.0

Cette version étend les améliorations aux espaces patient, médecin et administration. Elle remplace les interactions isolées par un service commun, avec un mode de démonstration et un mode API distincts.

## Présentation et navigation

- Accueil conservé avec la photo d’origine, sans carte du Dr Ilunga ni cœur animé. Une version WebP est utilisée pour alléger son chargement ; l’original reste dans les assets.
- Recherche restructurée : champ principal, filtres repliables sur téléphone, cartes homogènes, spécialité, commune, disponibilité, tri, compteur, état vide et pagination.
- Navigation mobile sur les trois espaces, menu utilisable au clavier, fermeture par Échap, retour du focus et blocage du défilement sous le menu.
- Thèmes clair/sombre partagés, mémorisation de la préférence, affichage initial sans attendre les contrôleurs de page.
- Formulaires avec labels, contrôles natifs, erreurs visibles, conservation de saisie en cas d’échec et boutons désactivés pendant l’opération.
- États de chargement, absence de résultats, erreur, nouvelle tentative et absence de connexion.
- Dialogues de confirmation natifs pour annulations, remboursements, décisions et suspensions.
- FAQ au clavier, liens d’évitement, titres, métadonnées et exclusion des espaces privés de l’indexation.
- Polices et icônes locales avec versions et licences incluses. Suppression du chargement Lucide « latest » et des dépendances aux CDN.

## Patient

- Connexion démo par compte explicite ; inscription avec OTP simulé, délai de renvoi et limite d’essais.
- Écrans prêts pour connexion réelle, OTP, mot de passe oublié et réinitialisation.
- Recherche → profil médecin → créneau → paiement → confirmation → historique cohérents.
- Paiements en attente, échec, reprise et annulation ; un retour URL ne suffit jamais à confirmer un paiement en mode API.
- Déplacement et annulation des rendez-vous, affichage du statut de remboursement, export CSV de la liste filtrée.
- Profil, informations de santé facultatives, préférences, aperçu de photo et raccord d’upload réel.
- Ordonnances reliées aux consultations : aperçu imprimable, raccord PDF/QR/partage avec liens signés.
- Avis après consultation et notifications de démonstration liées aux changements de données.

## Médecin

- Tableau de bord calculé à partir des rendez-vous et transactions du compte.
- Agenda filtré, disponibilités modifiables et duplication sur la semaine suivante.
- Refus des chevauchements, du retrait d’un créneau réservé et des horaires à moins de 24 h.
- Acceptation/refus des demandes, avec motif et statut cohérent.
- Patients liés aux consultations du médecin, dossiers et notes privées.
- Ordonnances rattachées à une consultation commencée ou terminée, accessibles au patient concerné.
- Revenus calculés à partir des paiements, filtrage et export CSV.

## Administration et candidature

- Utilisateurs filtrables, suspension/réactivation avec confirmation ; protection de l’administrateur contre sa propre suspension.
- Candidature structurée, pièces requises contrôlées, diplôme de spécialisation conditionnel, consentements et conservation des fichiers sélectionnés en cas d’erreur.
- Examen des candidatures, demande de pièces, approbation et refus. L’approbation de démonstration crée un médecin sans disponibilités inventées.
- Transactions, traitement simulé des remboursements, rapports par période et exports des données filtrées.

## Consultation

- Accès depuis un rendez-vous autorisé, affichage des participants et du statut.
- Test local caméra/micro, activation et coupure des pistes, nettoyage des périphériques en quittant la page.
- Messages rendus comme texte et liés à la consultation ; aucune réponse automatique présentée comme venant d’un médecin.
- Raccord d’envoi de pièces jointes, adaptateur vidéo documenté, fin de consultation par le médecin.
- Aucun faux appel distant, QR médical ou paiement validé uniquement côté client en mode API.

## Architecture et reprise

| Fichier | Responsabilité |
|---|---|
| `assets/js/config.js` | Mode, URL API, délais et origines autorisées |
| `assets/js/api.js` | HTTP, erreurs, session, CSRF et annulation/timeout |
| `assets/js/data.js` | Services métier et simulation ; point de raccordement backend |
| `assets/js/catalog.js` | Catalogue fictif et formatage à l’heure de Kinshasa |
| `assets/js/app.js` | Navigation, thème, dialogues, formulaires et fonctions partagées |
| `assets/js/pages.js` | Profil, contact et composants de données |
| `assets/js/patient-pages.js` | Annuaire, réservation, paiement et ordonnances |
| `assets/js/professional-pages.js` | Médecin, administration, rapports |
| `assets/js/consultation.js` | Caméra/micro, vidéo et messagerie |
| `assets/js/application.js` | Candidature et justificatifs |
| `assets/css/ui.css` | Styles responsive partagés des écrans dynamiques |
| `assets/js/restored-dashboards.js` | Données dans les blocs des dashboards d’origine |
| `assets/js/restored-auth.js` | Formulaires dans les cartes d’authentification d’origine |
| `assets/js/restored-shell.js` | Navigation des espaces et menus mobiles |
| `assets/js/restored-public.js` | Accordéon et filtres de la FAQ |
| `assets/css/restored.css` | Compléments ciblés, sans remplacer les styles d’origine |
| `scripts/build-contract.cjs` | Génération du contrat OpenAPI depuis le catalogue de routes |

Les anciens scripts de réservation et stockages concurrents ont été retirés. Le mode démo utilise un modèle commun dans `sessionStorage`, propre à l’onglet. Les mots de passe, octets des pièces jointes et tokens d’authentification réels n’y sont pas stockés. Seule la préférence de thème utilise `localStorage`.

## Validation et limites

43 tests métier/DOM/HTTP/statique réussis ; recette Chromium de 291 vérifications, complétée par les contrôles du thème sombre et du mode API avec réponses contrôlées. Le détail figure dans `docs/RECETTE.md`.

Le backend réel reste à réaliser. Le dossier `BACKEND_INTEGRATION.md` et le contrat `docs/openapi.json` précisent les opérations attendues : comptes, MaishaPay, agenda transactionnel, vidéo, SMS/email, fichiers privés, notifications et documents signés. Les vérifications de permissions de la démo ne remplacent pas les contrôles serveur.

La simulation partage les changements uniquement au sein du même onglet ; ce n’est pas une synchronisation multiutilisateur. Les listes API sont actuellement des tableaux complets filtrés côté client ; la pagination serveur pour de grands volumes est une évolution à coordonner. Les tests ne couvrent pas Safari/Firefox, des appareils physiques, les appels distants, le paiement réel ou une certification d’accessibilité. Les textes publics et règles commerciales restent à valider avant le lancement réel.
