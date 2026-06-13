# Fiche Technique — UrSkin AI

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite 5 |
| Style | CSS Modules (Petal OS design system) |
| Animations | Framer Motion + CSS keyframes |
| Backend | FastAPI + Uvicorn |
| Modèle IA | MobileNetV2 fine-tuné (TensorFlow/Keras) |
| Détection visage | Zone detector custom |
| i18n | Objet `I18N` maison (FR / EN) |

---

## Architecture générale

```
skin-analyzer/
├── backend/
│   ├── main.py                         — API FastAPI principale
│   ├── auth.py                         — Auth (hash, tokens HMAC)
│   ├── product_matcher.py              — Algorithme de matching produits
│   ├── cause_engine.py                 — Inférence des causes d'acné
│   ├── zone_detector.py                — Détection zones faciales
│   ├── skincare_product_database.json  — 35 produits
│   ├── users.json                      — Comptes utilisateurs
│   ├── signups.json                    — Waitlist early access
│   └── .auth_secret                    — Clé HMAC persistante
└── frontend/src/
    ├── App.jsx / App.css               — Router principal + auth state
    ├── LandingPage.jsx / .css          — Page d'accueil complète
    ├── api.js                          — Toutes les fonctions HTTP
    ├── i18n.js                         — Traductions FR/EN
    └── steps/
        ├── AnalyzingStep               — Loader analyse IA
        ├── ResultStep                  — Résultats + confiance modèle
        ├── QuestionnaireStep           — Questionnaire mode de vie
        ├── ReportStep                  — Rapport causes + routine
        ├── GlowRoutine                 — Composant routine (2 steps)
        ├── GlowRoutinePage             — Page standalone routine
        └── SkinHistory                 — Historique analyses
```

---

## Deux parcours utilisateur

### PATH 1 — Analyse photo
```
Landing → Upload/Caméra → Analyzing (IA)
→ Result (condition + confiance) → Questionnaire
→ Report (causes classées) → Glow Routine
```

### PATH 2 — Routine directe (sans photo)
```
Landing → "Construire ma routine" → GlowRoutinePage
→ Objectifs (13 choix) → Profil cutané → Routine générée
```

---

## Endpoints API

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/health` | Statut + classes modèle |
| `POST` | `/api/predict` | Prédiction skin condition |
| `POST` | `/api/full` | Predict + zones + causes |
| `POST` | `/api/glow-routine` | Routine produits personnalisée |
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Connexion → token |
| `GET` | `/api/auth/me` | Profil (Bearer token) |
| `POST` | `/api/signup` | Waitlist early access |
| `GET` | `/api/signups` | Liste waitlist |

---

## Modèle IA

- **Architecture** : MobileNetV2 fine-tuné
- **Dataset** : 5 261 images cliniques
- **Accuracy** : 80.18% — F1-score 0.80
- **6 classes** : `Level_0` (acné légère), `Level_1` (modérée), `Level_2` (sévère), `Eczema`, `Rosacea`, `Normal`
- **Input** : image JPG/PNG/WebP, max 10 MB, min 64×64 px
- **Rate limiting** : 10 req/60s par IP

---

## Système d'authentification

### Backend (`auth.py`)
- **Mot de passe** : SHA-256 + salt 16 bytes aléatoires
- **Token** : `base64(email:timestamp:hmac32)` — HMAC-SHA256 signé
- **TTL** : 30 jours
- **Secret** : généré une seule fois, stocké dans `.auth_secret` (survit aux redémarrages)
- **Stockage** : `users.json` — `{ email: { name, password_hash, skin, created_at } }`

### Frontend
- Token stocké dans `localStorage` (`urskin_user`)
- Session restaurée automatiquement au chargement
- Avatar initiale dans la nav quand connecté
- Logout : efface localStorage + reset state

---

## Algorithme de matching produits

### Base de données
35 produits avec pour chaque :
- `category` (cleanser, treatment, spot_treatment, moisturizer, sunscreen, mask)
- `best_for_skin_types`
- `concerns_supported`
- `budget_level` (low / medium / high)
- `sensitivity_compatibility`
- `experience_level`
- `climate_fit`
- `key_ingredients`

### Scoring (par produit, par étape)

| Critère | Points |
|---------|--------|
| Type de peau match | +4 |
| Concern overlaps | +3 par concern |
| Climat compatible | +2 |
| Cause → concern (indirect) | +1 par match |
| Produit avec marque | +0.5 |

### Exclusions dures (score = -99)
- Budget produit > budget utilisateur
- Sensibilité incompatible
- Niveau expérience non supporté

### Sources de concerns (cumulatifs)
1. **Condition IA** (Level_0/1/2, Eczema, Rosacea)
2. **Causes questionnaire** (hormonal, stress, diet…)
3. **Objectifs utilisateur** (13 goals → concern keywords)

---

## Questionnaire mode de vie

**12 questions** regroupées en 3 blocs :

| Bloc | Questions |
|------|-----------|
| Hormonal & Alimentation | Genre, cycle, laitages, sucres |
| Sommeil & Stress | Heures sommeil (slider), niveau stress (scale 1–5) |
| Habitudes quotidiennes | Produits changés, toucher visage, téléphone, taie, médicaments |

---

## Glow Routine — paramètres envoyés au backend

```json
{
  "skin_type": "combination",
  "budget": "low | medium | high",
  "sensitivity": "low | medium | high",
  "climate": "hot | humid | cold | dry",
  "experience": "beginner | intermediate | advanced",
  "condition": "Level_1",
  "causes": ["hormonal", "stress"],
  "goals": ["acne", "brightening", "hydration"]
}
```

---

## Objectifs disponibles (PATH 2)

| Valeur | Label FR | Label EN |
|--------|----------|----------|
| `acne` | Réduire l'acné | Reduce acne |
| `dark_circles` | Cernes | Dark circles |
| `hyperpigmentation` | Hyperpigmentation | Hyperpigmentation |
| `brightening` | Éclat du teint | Brighten skin |
| `glow` | Peau lumineuse | Glowing skin |
| `redness` | Rougeurs | Reduce redness |
| `wrinkles` | Anti-âge | Anti-aging |
| `hydration` | Hydratation | Hydration |
| `barrier` | Barrière cutanée | Skin barrier |
| `pores` | Pores dilatés | Minimize pores |
| `oiliness` | Sébum / Brillance | Control oiliness |
| `blackheads` | Points noirs | Blackheads |
| `texture` | Texture de peau | Skin texture |

---

## Design System — Petal OS

### Couleurs

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--primary` | `#D4587B` | Rose poudré — CTA, accents |
| `--accent` | `#9B84D1` | Lavande — tags, chips |
| `--peach` | `#F2956D` | Pêche — blobs décoratifs |
| `--bg-surface` | `#FEF5EF` | Fond crème principal |
| `--text` | `#2D1B22` | Texte principal |
| `--border` | `rgba(212,88,123,0.14)` | Bordures légères |

### Typographie
- **Titres** : Playfair Display (serif, italic)
- **Corps** : Jost / DM Sans

### Effets 3D et animations

| Effet | Technique |
|-------|-----------|
| Hover cards 3D | `perspective()` + `rotateX/Y` CSS |
| Parallaxe hero | `mousemove` → `element.style.transform` |
| Grille perspective | `::after` + `rotateX(70deg)` + `mask-image` |
| Animations persistantes | `@keyframes` actifs au repos, `paused` au hover |
| Blobs décoratifs | `border-radius` animé + `filter: blur` |

---

## Images publiques

| Fichier | Usage |
|---------|-------|
| `/hero-model.jpg` | Femme peau lumineuse — hero split |
| `/products-gold.jpg` | Flacons blanc & or — bento large card |
| `/products-pastel.jpg` | Flatlay pastel — section about |
| `/routine-flatlay.jpg` | Ingrédients naturels — card routine directe |

---

## Fichiers de démarrage

```bat
restart_backend.bat   — Lance uvicorn via le venv Python (skin-analyzer-train)
start_signup.bat      — Serveur signup séparé (legacy)
```

| Service | URL |
|---------|-----|
| Backend | `http://localhost:8000` |
| Frontend dev | `http://localhost:5173` |
| API docs | `http://localhost:8000/docs` |

---

## Variables d'environnement

| Variable | Fichier | Valeur par défaut |
|----------|---------|-------------------|
| `VITE_API_URL` | `.env` (frontend) | `` (même origine) |
| `TF_ENABLE_ONEDNN_OPTS` | `main.py` | `0` |
| `TF_CPP_MIN_LOG_LEVEL` | `main.py` | `2` |

---

*Généré le 10 juin 2026 — UrSkin v2.0*
