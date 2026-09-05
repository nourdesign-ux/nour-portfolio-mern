# Nour Mastouri Portfolio — MERN V1

Migration V1 du portfolio vers MongoDB + Express + React + Node.js.

## Architecture
- `client/` — React + Vite
- `server/` — Express + MongoDB/Mongoose
- Auth admin — JWT
- Projects / Pages — MongoDB
- Media — upload local en développement + metadata MongoDB

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
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/pages`
- `PUT /api/pages/:key`
- `GET/POST/PUT/DELETE /api/media`

## Notes V1
- Le Hero reprend la direction actuelle : photo existante dominante, crop uniquement en bas, zéro génération d'image.
- Les 8 projets existants sont seedés dans MongoDB.
- Ajouter un projet dans l'admin le fait apparaître automatiquement dans `Selected Work`.
- Le stockage media est local en V1 de développement. Pour production, on pourra brancher Cloudinary/S3.
