# Audit dashboard et CMS — 6 septembre 2026

## Résultat

Le dashboard a été restructuré autour du vrai modèle du portfolio : une seule page **Accueil** composée de 11 sections ordonnées. Les changements de cette passe sont limités à l'administration, à ses modèles et à ses routes API.

## UX/UI et workflow admin

- Navigation organisée par Workspace, Contenu, Design et Système.
- Entrée **Sections** avec inventaire complet et accès direct aux éditeurs Classic et Visual.
- Interface responsive du dashboard, recherche contextuelle, états de chargement, erreurs récupérables et notifications.
- Éditeurs plein écran au lieu de modales chargées pour les pages, sections et projets.
- Canvas miniatures à largeur desktop réelle (1440 px), réduits visuellement sans déclencher le responsive public.
- Espaces dédiés pour Header, Menu, Footer, Forms, Widgets, SEO, Profil, Site Health, Outils et Backup.

## Page Accueil et sections

- Une seule page logique est affichée dans Pages : `Home Page — One Page`.
- Ordre canonique : Header, Hero, Ticker, About, Manifesto, Projects, Expertise, Experience, Quote, Contact, Footer.
- Correction du saut d'ordre après sauvegarde : la réponse PUT conserve désormais l'ordre du canvas.
- Correction de la disparition des nouvelles sections : les blocs personnalisés et leur ordre global sont maintenant relus depuis MongoDB.
- Création de nouvelles pages persistantes, structure vide ou Hero de départ, édition Classic/Visual et corbeille protégée.
- Déplacement, duplication, visibilité, verrouillage, suppression et réutilisation des blocs.
- Traductions indépendantes EN, FR et AR par section.
- Bibliothèque de blocs enregistrés et blocs globaux réutilisables.

## Éditeurs

- Architecture unifiée : One Page, Section, Header, Widget et Form utilisent désormais le même moteur `UniversalVisualEditor` ; seul l'adaptateur de données et le contexte chargé changent.
- Contexte Page : page complète et réorganisation des sections. Les contextes Section, Header, Widget et Form ne chargent que l'entité sélectionnée.
- Éditeur Classic riche : titres, paragraphes, gras, italique, souligné, listes, liens, alignement, citation, tableaux, médias, undo/redo, collage propre et source HTML.
- Canvas visuel basé sur le rendu réel du site dans une iframe isolée à l'admin.
- Sélection d'un bloc dans le navigateur ou directement dans le canvas.
- Sélection directe des titres, textes, boutons, liens, formulaires et images du composant frontend réel, avec contour compensé selon l'échelle.
- Médiathèque et upload d'image dans l'inspecteur, remplacement immédiat, texte alternatif et réglage `object-fit`.
- Historique Undo/Redo dans le moteur partagé ; protection des changements non sauvegardés et états Saved/Saving/Unsaved/Failed dans l'éditeur Section.
- Les éléments ajoutés peuvent rester dans le flux du conteneur ou utiliser un positionnement libre. Les déplacements et redimensionnements libres reconvertissent les coordonnées écran vers les coordonnées desktop réelles.
- Réorganisation des éléments internes par drag-and-drop, indicateur de sélection et feedback par notification.
- Inspecteur de contenu et actions de bloc.
- Header : sélection et upload de portrait, réglages du formulaire de devis.
- Footer : canvas isolé qui affiche uniquement le footer.
- Projets : édition Classic ou Visual dans une page complète, sans modal.
- Édition directe des textes principaux dans le canvas, déplacement des sections et synchronisation du Navigator.

## Forms, Widgets et Maps

- Formulaires persistants avec création, édition, duplication, corbeille, statut et champs réordonnables.
- Champs texte, email, téléphone, textarea, select, checkbox, radio, nombre, date et bouton Submit.
- Endpoint public de soumission avec validation des champs requis et filtrage des valeurs acceptées.
- Gestion réelle des soumissions : lecture, statut, valeurs et suppression.
- Widgets persistants texte, image, bouton, vidéo, formulaire, CTA, contact, réseaux, composant et carte.
- Widget Maps avec adresse, latitude, longitude, zoom et marqueur ; clé privée conservée dans `MAPS_API_KEY` côté serveur.
- Formulaires et widgets publiés disponibles dans la bibliothèque du Visual Editor.

## Site Health

- Mesures réelles du frontend, de l'admin, de l'API, de MongoDB et du dossier de stockage.
- Latence frontend/base, uptime, runtime Node et mémoire du processus.
- Comptages Pages, Sections, Projets, Médias, Forms, Widgets, Brouillons et Publications.
- État des API CMS, Media, Forms et Maps sans exposer de secret.
- Mode public Online, Coming Soon ou Maintenance affiché séparément de la santé technique.

## Cookies et statut public

- Écran Cookies avec activation, textes, boutons, politique, position, layout, couleurs, rayon, espacement et aperçu.
- Consentement persistant côté navigateur avec catégories Necessary, Analytics et Marketing et événement d'intégration pour les scripts optionnels.
- Écrans Coming Soon et Maintenance avec contenu, image, CTA, contact, compte à rebours et aperçu administrateur.
- Bascule Online / Coming Soon / Maintenance protégée par confirmation.
- Quand le mode est Online, le composant Portfolio existant reste rendu sans modification.
- L'administration, l'authentification, l'API et les assets restent accessibles dans tous les modes.

## Ergonomie et sécurité des éditeurs

- Sidebar et contenu principal défilent indépendamment ; navigation active remise automatiquement dans la zone visible.
- Les liens, boutons et formulaires des previews Section, Menu, Footer et Header ne déclenchent plus de navigation ou soumission.
- Confirmations professionnelles pour les suppressions et l'abandon de changements, sans `window.confirm()` sur les nouveaux parcours.
- Démarrage API synchronisé avec la première tentative MongoDB pour supprimer la fenêtre de réponses 503 au lancement.
- Migration idempotente du formulaire Devis réel du Hero vers la collection Forms, sans duplication.

## SEO

- Score sur 100 pour la page, chaque section et chaque projet.
- Score moyen, contenus optimisés, contenus faibles et champs manquants.
- Classement du meilleur au moins bon et priorités d'action.
- Réglages globaux : titre, description, mots-clés et image Open Graph.
- Aperçu de résultat Google et compteurs de longueur.

## API, CRUD et sécurité

- JWT obligatoire sur les routes d'administration.
- Lecture publique limitée aux contenus publiés ou planifiés arrivés à échéance.
- Algorithme JWT HS256 explicite, limitation des tentatives de connexion et comparaison sûre des secrets.
- CORS restreint, en-têtes de sécurité, erreurs JSON non bavardes et suppression de `X-Powered-By`.
- Validation et liste blanche des champs Projet et Réglages.
- Upload SVG refusé, contrôle MIME/taille et suppression limitée au dossier uploads.
- Timeout client et messages distincts pour API ou base indisponible.
- CRUD des projets, médias, pages, réglages et blocs enregistrés.
- Corbeille/restauration des projets et historique de révisions des pages techniques.
- Backup complet, validation d'un fichier de backup, santé système, statistiques de stockage et synchronisation des sections.

## Audit UX/UI Pages et cohérence globale

- La liste Pages dispose maintenant d'un résumé Pages / Publiées / Sections, d'un compteur de résultats et de lignes plus descriptives avec slug, nombre de sections et statut.
- Les extraits de contenu sont nettoyés du HTML avant affichage dans la liste.
- L'écran d'informations Page sépare clairement Informations principales, Call to action, Référencement SEO, Publication et Révisions.
- Le Classic Editor de la Home One Page écrit désormais directement dans le bloc principal réellement persisté, y compris titre, eyebrow, contenu, CTA et image.
- Les champs optionnels sont normalisés afin d'éviter les erreurs et avertissements sur les valeurs absentes.
- Une même échelle typographique, les mêmes surfaces, bordures, focus clavier, boutons et espacements sont appliqués aux autres vues du dashboard.
- Les listes Sections, Forms, Widgets, Media, SEO, Health, Tools, Settings et Profile partagent maintenant une largeur de travail et une densité cohérentes.
- Les layouts Pages et Page Editor se replient proprement sur tablette et mobile.
- Sections, Forms, Widgets et Projects utilisent désormais le même chrome d'édition, la même hiérarchie d'actions et les mêmes règles responsive que Pages.
- Le mode Visual Canvas des Projects est séparé du formulaire Classic et permet d'enregistrer directement sans revenir au mode classique.

## Workflow global des éditeurs

- L'ouverture d'une Page ou d'une Section mène d'abord à un écran d'informations clair avec le Classic Editor.
- Le Visual Editor est une action de second niveau et dispose d'un écran dédié avec retour explicite vers les informations.
- Header, Page, Section, Formulaire et Widget reposent sur le même moteur de canvas et partagent sélection, bibliothèque, historique et inspecteur.
- Le canvas est organisé en trois zones : bibliothèque recherchable et repliable, aperçu dominant, inspecteur contextuel Content / Style / Advanced.
- Les formats Desktop 1440 × 900, Tablette 768 × 1024 et Mobile 390 × 844 utilisent un viewport réel sans recharger l'iframe lors du changement de format.
- Les interactions publiques dans le canvas sont neutralisées : aucun lien, bouton ou formulaire de preview ne déclenche d'action publique.
- Les états Saved, Saving, Unsaved changes, Save failed et l'historique sont centralisés dans l'inspecteur droit.
- Le Classic Editor inclut titres, listes, citations, alignements, tableaux, médias, boutons, source HTML et insertion de lien sans dialogue navigateur natif.

## Validation exécutée

- Build Vite : succès, 63 modules transformés.
- Vérification syntaxique de tous les fichiers `server/src/**/*.js` : succès.
- `git diff --check` : succès ; seuls les avertissements LF/CRLF de Windows sont informatifs.
- MongoDB Atlas : connecté.
- Authentification : HTTP 200.
- Lecture, sauvegarde et relecture One Page : HTTP 200.
- 11 sections présentes et ordre stable après sauvegarde : confirmé.
- Lecture et écriture des réglages, état des outils et validation de backup : HTTP 200.
- CRUD temporaire des blocs enregistrés : création, modification et suppression confirmées.
- Page : création 201, mise à jour 200, suppression et purge de test confirmées.
- Section : création, insertion, réorganisation, relecture et nettoyage confirmés.
- Projet : création 201, mise à jour 200, duplication 201 et purge confirmées.
- Formulaire : création 201, soumission 201, lecture/mise à jour/suppression de soumission 200.
- Widget : création et duplication 201, suppression et purge confirmées.
- Média : upload 201, remplacement 200 et suppression confirmés.
- Site Health : HTTP 200 ; frontend, base de données et stockage mesurés `healthy`.
- `npm audit --omit=dev` client et serveur : 0 vulnérabilité connue.
- Formulaire Devis chargé automatiquement : 1 instance, champs Name, Email, Service, Budget, Project et Submit.
- Endpoint public de configuration : HTTP 200 sans authentification et sans secret.
- Bascule Coming Soon → Maintenance → Online et relecture publique : confirmées, puis état initial restauré.
- Aucun `window.alert` ou `window.confirm` natif restant dans le dashboard ; les actions sensibles utilisent les dialogues CMS.
- Persistance des adaptateurs du moteur partagé : Form et Widget créés avec `settings.editorElements`, relus avec leurs coordonnées/dimensions, puis supprimés et purgés sans résidu.

## Limites restantes

- Aucun moteur de navigateur compatible n'est installé dans l'environnement d'audit. Les contrôles de compilation, syntaxe et workflows API sont complets, mais une recette visuelle manuelle finale dans Chrome/Edge reste recommandée.
- La limitation de connexion est en mémoire et convient à une instance unique. Pour plusieurs instances de production, utiliser un stockage partagé ou la protection du reverse proxy.
- Le dépôt ne contient pas encore de suite E2E persistante ; les parcours ont été rejoués par script pendant cet audit.
