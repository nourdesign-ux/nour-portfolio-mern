# Nour Mastouri Portfolio — MERN CMS

Migration V1 du portfolio vers MongoDB + Express + React + Node.js.

## Architecture
- `client/` — React + Vite
- `server/` — Express + MongoDB/Mongoose
- Auth admin — JWT
- Projects / Pages — MongoDB
- Media — upload local en développement + metadata MongoDB

## CMS admin
- Overview alimenté par les vraies collections MongoDB
- Projects : tous les champs du modèle, recherche, filtres, actions groupées, brouillon/publication et corbeille avec restauration
- Pages : édition limitée aux enregistrements existants, SEO contextuel et autosave
- Media : médiathèque, drag & drop, upload, texte alternatif et suppression confirmée
- États de chargement, erreurs, vues vides, notifications et modales accessibles
- Navigation responsive et recherche au clavier (`Ctrl/Cmd + K`)

## 1. Installer
À la racine :
```bash
npm install
npm run install:all
```

## 2. Configurer MongoDB
Copier :
- `server/.env.example` → `server/.env`
- `client/.env.example` → `client/.env`

Pour MongoDB local :
`MONGODB_URI=mongodb://127.0.0.1:27017/nour_portfolio`

Ou remplace par ton URI MongoDB Atlas.

IMPORTANT : change `JWT_SECRET` et `ADMIN_PASSWORD` avant production.

## 3. Initialiser les données
```bash
npm run seed --prefix server
```

## 4. Lancer frontend + backend
```bash
npm run dev
```

Frontend : http://localhost:5173
API : http://localhost:5000/api
Admin : http://localhost:5173/admin/login

## API
- `POST /api/auth/login`
- `GET /api/projects`
- `GET /api/projects?all=1`
- `GET /api/projects?trash=1`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/restore`
- `GET /api/pages`
- `PUT /api/pages/:key`
- `GET/POST/PUT/DELETE /api/media`

Les vues `?all=1` et `?trash=1`, ainsi que toutes les mutations, nécessitent le JWT admin.

## Notes
- Le Hero reprend la direction actuelle : photo existante dominante, crop uniquement en bas, zéro génération d'image.
- Les 8 projets existants sont seedés dans MongoDB.
- Ajouter un projet dans l'admin le fait apparaître automatiquement dans `Selected Work`.
- Le stockage media reste local et réel dans `server/uploads`. Aucun comportement cloud fictif n'est exposé.
