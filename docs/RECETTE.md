# Recette du 25 septembre 2026 — mises en page restaurées

La recette porte sur la restauration des écrans signalés et la conservation des parcours fonctionnels.

| Vérification | Résultat |
|---|---|
| Contenu et styles spécifiques de `faq.html` et `how.html` | Identiques à la sauvegarde antérieure à la refonte ; comparaison du texte du corps de page et du CSS embarqué |
| Dashboards | Structures d’origine rétablies ; indicateurs, graphiques, actions et menus présents |
| Connexion et inscription | Cartes originales sur fond sombre, champs et onglets Patient/Médecin |
| Tests métier, sessions, API, DOM, liens et CSS | 43 tests réussis |
| Parcours navigateur et responsive | 291 vérifications réussies, aucune erreur JavaScript non gérée |
| Restauration ciblée | Menus, graphiques, onglets, affichage du mot de passe, inscription sans email, OTP incorrect/correct et connexion API vérifiés |
| Mode API avec réponses HTTP de recette | Prix serveur, conservation de saisie, idempotence, rejet d’un retour de paiement falsifié, confirmation serveur et expiration de session vérifiés |

## Rendu inspecté

Captures dans `captures-restauration/` : connexion, inscription patient et médecin, dashboards patient/médecin/admin, FAQ et Comment ça marche. Des vues mobiles sont incluses. Les captures ont été prises avec les animations arrêtées pour éviter un état intermédiaire.

Les écrans du parcours existant ont été parcourus aux largeurs 360, 768, 1024 et 1440 px. Les captures ciblées utilisent également 390 px. Le thème sombre de la recherche, les menus au clavier, leur fermeture avec Échap et le retour du focus font partie de la recette.

`browser-results.json` détaille les 291 vérifications. `contenus-restaures.json` conserve les empreintes du contenu et des styles spécifiques retrouvés pour FAQ/Comment ça marche. Les chiffres des dashboards proviennent du jeu de démonstration ou des réponses API, pas des anciennes valeurs statiques des maquettes.

## Reproduire

Avec Node.js compatible (voir `package.json`) :

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run test:restoration
npm run test:api
```

Les tests navigateur démarrent et arrêtent leur serveur local. `CHROMIUM_EXECUTABLE` permet de sélectionner un Chromium déjà installé. `QA_OUTPUT` permet de changer le répertoire des captures.

## Limites de la recette

- Le backend réel n’est pas inclus. Le contrat `openapi.json` décrit 48 chemins à raccorder, dont la synthèse d’administration.
- Aucun paiement réel, SMS, email, appel entre deux participants, signature médicale ou validation de pièce d’identité n’a été exécuté.
- Les réponses HTTP de test valident le comportement du frontend, pas un serveur de production.
- Cette recette Chromium ne remplace pas des essais sur Safari, Firefox et appareils physiques.
