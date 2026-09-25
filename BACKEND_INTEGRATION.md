# Raccordement backend — Monganga

Le frontend fonctionne en deux modes **strictement séparés**. La livraison contient uniquement le frontend, sa simulation et le contrat HTTP proposé. Aucun paiement, SMS, email, appel distant ou document signé réel n’est fourni.

## Mise en route

1. `npm ci`, puis `npm start` ; ouvrir `http://localhost:8080`.
2. Démo : `assets/js/config.js` conserve `mode: 'demo'`. Les comptes fictifs se choisissent sur la page de connexion. Les données sont partagées entre les rôles **dans le même onglet** et conservées après rechargement. Un autre onglet peut avoir une autre copie ; aucune synchronisation multiutilisateur n’est simulée.
3. API : utiliser `mode: 'api'`, définir `apiBaseUrl`, servir le frontend en HTTPS et implémenter les routes du contrat `docs/openapi.json`. Aucun retour silencieux vers la démo en cas d’erreur.
4. Ajouter les origines exactes HTTPS du paiement et des documents à `paymentOrigins` et `documentOrigins`. La liste vide accepte uniquement les liens de même origine.
5. Fournir l’adaptateur vidéo décrit ci-dessous. Les clés privées restent exclusivement côté serveur.

`assets/js/data.js` est le point de raccordement unique. Les contrôleurs d’écran ne contactent pas directement un agrégateur, un stockage ou une base de données. Les rares requêtes d’authentification passent par `assets/js/api.js`.

## Responsabilités et priorité

| Priorité | Domaine | Interface déjà préparée | Travail backend attendu |
|---|---|---|---|
| P0 | Comptes et rôles | Connexion, OTP, renvoi, expiration, mot de passe oublié/réinitialisation | Sessions serveur, contrôle des rôles et propriétaires, OTP et email, limitation des tentatives |
| P0 | Réservation | Annuaire, créneaux, montant récapitulatif, annulation, déplacement, agenda partagé | Disponibilités, verrouillage concurrent, calcul des prix, validations de dates et transitions |
| P0 | MaishaPay | Sélection du moyen, redirection de paiement, attente, rafraîchissement du statut, remboursement | Création d’opération chez MaishaPay, webhook vérifié, rapprochement, idempotence, remboursement |
| P0 | Consultation | Test caméra/micro, commandes, chat, pièces jointes, fin de consultation | Autorisation d’entrée, fournisseur WebRTC/vidéo, tokens courts, messages, stockage des pièces |
| P0 | Ordonnances | Rédaction, consultation, impression, téléchargement et partage | Enregistrement, contrôle médecin/patient, PDF signé, liens temporaires, QR et vérification |
| P1 | Candidatures | Champs, documents requis, contrôles de fichiers, examen admin | Stockage privé, contrôle des fichiers, revue, invitation du médecin après validation |
| P1 | Gestion | Profils, préférences, notifications, suspension, transactions et rapports | Persistance, journal des actions, notifications et demandes d’export des données |
| P1 | Contact | Formulaire avec erreurs et confirmation | Enregistrement du ticket et envoi email côté serveur |

## Format commun

- Base suggérée : `/api/v1`. JSON UTF-8 ; dates ISO 8601 avec fuseau (`2026-09-28T09:00:00+01:00` ou UTC `Z`). Affichage à Kinshasa, UTC+1.
- Montants entiers en **centimes USD** : `priceCents`, `feeCents`, `totalCents`, `amountCents`. Ne jamais reprendre les tarifs envoyés par le navigateur comme autorité.
- Les routes de liste renvoient actuellement **un tableau JSON**, limité au périmètre autorisé du compte. Les filtres et exports de l’interface portent sur cette liste. Une pagination serveur à grande échelle demandera un ajustement du service et des écrans ; ne pas remplacer un tableau par une enveloppe paginée sans cette adaptation.
- Les objets et champs consommés sont décrits dans `docs/openapi.json`. Les identifiants sont opaques. La réponse de paiement a la forme d’un `Booking`, avec éventuellement `checkoutUrl`.
- Erreur : `{ "code": "SLOT_UNAVAILABLE", "message": "Ce créneau n’est plus disponible.", "fields": { "slot": "Choisissez un autre horaire." } }`.
- `400/422` : validation ; `401` : session expirée ; `403` : accès refusé ; `404` : ressource absente ; `409` : conflit ; `429` : trop de tentatives ; `5xx` : service indisponible. Le frontend affiche une erreur, conserve le formulaire et réactive l’action.
- Délai client par défaut : 15 secondes. Une erreur réseau ne signifie pas que la mutation n’a pas eu lieu. Le backend doit mémoriser `Idempotency-Key` pour les opérations financières et retourner l’état autoritaire au rechargement.
- `204` est accepté pour les opérations sans résultat. Les opérations utilisées pour naviguer vers une ressource doivent renvoyer l’objet créé avec son `id`.

## Sessions et autorisations

`POST /auth/login` reçoit `{identifier, password, remember}` : identifier est un email ou un téléphone vérifié. Le rôle vient uniquement du serveur. `POST /auth/forgot-password` reçoit `{identifier}` et déclenche l’envoi du lien par email ou SMS. La réponse reste neutre pour éviter l’énumération de comptes.

`POST /auth/register/patient` accepte un email facultatif (absent ou chaîne vide), mais exige un téléphone, un mot de passe conforme et le consentement. Le compte reste inactif avant validation OTP. Une session de compte sans email renvoie `email: ""`.

`POST /auth/login` et `GET /auth/me` renvoient `{id, name, email, role, doctorId?, expiresAt}`. Rôles autorisés : `patient`, `doctor`, `admin`. L’inscription publique ne crée que des patients ; un médecin passe par la candidature et l’agrément.

L’API pose une session **HttpOnly, Secure**, avec une politique SameSite adaptée au domaine de déploiement. Le navigateur utilise `credentials: 'include'`. Aucune clé d’API ni aucun token d’authentification n’est conservé dans localStorage. En mode connecté, les métadonnées de session sont uniquement en mémoire.

Le client envoie `X-CSRF-Token` à partir du cookie lisible `monganga_csrf`. Si aucun token n’est disponible, il appelle d’abord `GET /auth/csrf`, qui renvoie `{csrfToken}` et prépare la protection côté serveur. Ce token est conservé uniquement en mémoire. Le serveur vérifie le token et l’origine pour les mutations et limite les origines CORS si l’API est sur un domaine distinct. Préférer une API de même origine ; si un cookie lisible est utilisé, son domaine et son chemin doivent permettre sa lecture depuis le frontend.

**Les protections d’écran ne sont pas des contrôles de sécurité.** Chaque route vérifie la session, le rôle, la suspension et la propriété de la ressource. Un patient accède seulement à ses rendez-vous/documents ; un médecin aux consultations et dossiers autorisés ; l’admin aux opérations de gestion. Le backend fixe explicitement les droits d’accès aux données médicales et journalise les actions sensibles. Un rôle ou un ID reçu du navigateur ne constitue jamais une autorisation.

L’OTP renvoie `{challengeId, expiresAt, resendAt}` ; les deux dates peuvent être des ISO ou des millisecondes epoch. Le code de démo `123456` est exclusivement local et n’est jamais utilisé par le mode API. Le serveur gère expiration, nombre d’essais et délai de renvoi. Le mot de passe n’est pas conservé dans les données de démonstration.

## Réservation et paiement

Transitions attendues :

- `draft` → `payment_pending` → `confirmed` (avec `paymentStatus: paid`).
- `payment_pending` → `payment_failed` si le prestataire confirme l’échec ; reprise possible si le créneau reste libre.
- Le refus d’une tentative de paiement libère le verrou selon la règle serveur ; un timeout du navigateur n’autorise pas à supposer l’échec.
- `confirmed` → `in_progress` → `completed` ; `requested` est disponible pour les rendez-vous exigeant une acceptation préalable du médecin.
- Annulation d’un paiement confirmé : `cancelled` + `refund_pending`, puis `refunded` uniquement après confirmation du prestataire.

Le serveur vérifie **atomiquement** que le médecin est actif, que le créneau est libre, qu’il respecte le délai de 24 h et que son tarif est à jour. Il fixe une durée de réservation provisoire et libère les verrous expirés. Un déplacement conserve l’ID et le paiement existants ; le serveur arbitre tout supplément avant de confirmer.

L’interface n’enregistre aucun numéro de carte. Le paiement par carte est hébergé par le prestataire. Le backend choisit l’opérateur MaishaPay et renvoie `checkoutUrl` lorsque nécessaire. Les cinq moyens affichés dans la démo sont à aligner avec les moyens activés sur le compte marchand. Aucun appel direct à MaishaPay n’est inclus.

**Ne jamais confirmer un paiement depuis un paramètre de retour URL.** Le client relit `GET /bookings/{id}/payment`. Le serveur vérifie les webhooks MaishaPay, leur authenticité et les montants, gère les livraisons répétées et les messages désordonnés. Les remboursements sont idempotents, avec motif et journal d’audit.

## Vidéo, messages et fichiers

Charger le SDK du fournisseur choisi et un adaptateur avant les scripts des pages de consultation. Exposer :

```js
window.MongangaCallProvider = {
  async join({ container, session, onState }) {
    // session vient de POST /consultations/{id}/join.
    // Monter ici la vidéo distante et locale avec le SDK du fournisseur.
    // Appeler onState('connected' | 'reconnecting' | 'disconnected').
    // Résoudre seulement lorsque la connexion est établie.
    return {
      async setMicrophoneEnabled(enabled) { /* SDK réel */ },
      async setCameraEnabled(enabled) { /* SDK réel */ },
      async leave() { /* libérer tous les flux, listeners et ressources */ }
    };
  }
};
```

La réponse `/join` inclut les paramètres nécessaires au fournisseur (`roomId`, `token`, `expiresAt`, etc.) avec un token de courte durée. Le serveur vérifie les participants, le paiement et la fenêtre d’accès. Aucun appel n’est déclaré connecté si l’adaptateur est absent ou échoue.

Le chat interroge la liste des messages toutes les 5 secondes en mode API, uniquement quand la page est visible ; un bouton permet aussi d’actualiser. Une future couche temps réel peut remplacer ce transport derrière le même service. Les messages sont rendus comme texte. La fin de consultation relève du médecin ; quitter la salle coupe les périphériques sans clôturer le dossier du patient.

Les pièces jointes utilisent `multipart/form-data` : `id`, `bookingId`, `file`. La candidature utilise les champs du formulaire et les fichiers `portrait`, `identity`, `medicalDiploma`, `orderCertificate`, `cv`, `specializationDiploma` (obligatoire pour un spécialiste). **Aucun Serment d’Hippocrate n’est demandé.** Photo : JPG/PNG/WebP ; documents : PDF/JPG/PNG/WebP ; 10 Mo par pièce (avatar : 5 Mo).

Les contrôles navigateur facilitent la saisie. Le serveur recontrôle taille, signature réelle, contenu, droits et quotas ; stocke les documents hors accès public ; utilise des URL signées temporaires. La démo conserve uniquement les noms des fichiers de candidature, jamais leurs octets.

## Documents médicaux

`GET /prescriptions/{id}/document` renvoie `{url, qrUrl, verificationUrl, expiresAt}`. Le frontend vérifie les origines autorisées. Il ne génère pas de faux QR code et ne crée pas de signature médicale dans le navigateur. Le PDF doit être créé par le serveur à partir de l’ordonnance persistée, avec la politique de signature/validation retenue par le projet.

La vérification par QR doit éviter de rendre publiques les informations médicales. Les liens de téléchargement et de partage peuvent expirer. Prévoir un renouvellement par la même route. L’aperçu imprimable de démonstration porte explicitement la mention « sans valeur médicale ».

## Points de recette avant la connexion réelle

- Tester deux patients concurrents sur le même créneau, une double soumission et un retour de paiement falsifié.
- Vérifier qu’un compte ne peut lire ni modifier la ressource d’un autre, y compris par un ID deviné et après une suspension.
- Tester les webhooks, remboursements, OTP/SMS/email, invitation médecin, PDF signé et session vidéo avec deux appareils réels.
- Revoir les textes publics, tarifs, contacts et mentions légales avec les responsables du projet. Ils font partie de la maquette tant que la configuration réelle n’est pas finalisée.
- Déployer les fichiers frontend nécessaires ; ne pas exposer `node_modules`, tests, sauvegardes, notes internes ou secrets. Le serveur `npm start` est un serveur local de développement, pas un serveur de production.


## Dashboard d’administration restauré

`GET /admin/dashboard` est réservé au rôle `admin`. La réponse `AdminOverview` est décrite dans `docs/openapi.json` et remplit les blocs d’origine :

- `metrics.activeUsers` : comptes dont le statut est actif ; `doctors` : comptes médecins inscrits.
- `metrics.approvalRate` : pourcentage approuvé parmi les candidatures approuvées ou refusées, `null` si aucune décision.
- `metrics.volumeCents` : paiements du mois courant au statut payé, montants entiers en centimes USD ; `consultations` : consultations terminées ce mois.
- `metrics.retentionRate` : pourcentage des patients ayant terminé une consultation le mois précédent et revenus ce mois ; `null` sans cohorte précédente.
- `metrics.satisfaction` : moyenne des notes de consultation, ou `null` sans avis.
- `growth.week`, `.month`, `.year` : tableaux chronologiques de `{label,count}` pour 7 jours, 6 mois et 12 mois. Le champ `growthComplete` signale la disponibilité de l’historique des inscriptions.
- `activity` : événements autorisés avec `{at,title,detail,status}` ; `audit` : dernières actions administratives avec `{title,detail,status}` et date facultative.
- `alerts` : compteurs `applications` (en attente ou à compléter), `failedPayments`, `refunds` (à traiter).

Périodes calculées en heure de Kinshasa. Les métriques ne remplacent pas un journal comptable. La démo calcule ce qu’elle peut avec ses données locales ; les historiques absents ne sont pas inventés. Les graphiques médecins utilisent les consultations terminées et leurs dates dans la même zone horaire.

Les textes de la FAQ et de la page Comment ça marche sont ceux du projet d’origine. Leur restauration ne constitue pas l’implémentation d’une bascule audio, d’un paiement externe, d’un SMS ou d’un document signé : ces services restent à raccorder et à valider avant la mise en production.
