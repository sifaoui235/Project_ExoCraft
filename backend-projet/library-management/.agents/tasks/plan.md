# Implementation Plan — ExoCraft Frontend/Backend Integration

## Context

- **Frontend** : `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src`
- **Backend** : `c:\Users\ASUS\Desktop\projet-ExoCraft\backend-projet\library-management\src`
- All API functions already exist in `services/api.js` — every new page must import from there; never use localStorage or fetch directly.
- Style pattern: use existing CSS classes from `workspace.css` (`workspace-card`, `workspace-filters`, `workspace-button`, `workspace-badge`, `workspace-error`, `workspace-notice`, `workspace-empty`, etc.) and `App.css`. Add new classes at the **end** of `App.css` only.
- Component pattern: follow `AiGenerator.jsx` — `DashboardLayout` wrapper, `useState` for loading/error/success, async calls wrapped in try/catch.
- Quiz entity fields: `id, titre, theme, matiere, niveau, statut ('brouillon'|'valide'), visibilite ('prive'|'public'), dateGeneration, questions[]`
- Question entity fields: `id, enonce, choixA, choixB, choixC, choixD, reponseCorrecte ('A'|'B'|'C'|'D'), explication`
- Content entity fields: `id, titre, type, matiere, theme, contenu, statut, visibilite, auteurId, dateCreation`
- Archive entity fields: `id, nom, type, matiere, promotion, texteExtrait, taille, dateDepot`
- `user.role === 'administrateur'` is the admin guard (comes from `useAuth().user`).

---

## Items

- [ ] 1. **Create `QuizManager.jsx`** — full quiz management page at route `/quiz`.

  The component contains three logical sections: list view, detail/question view, create/edit form.

  **List view** (`panel === null`):
  - Header: title "Mes Quiz", button "+ Créer un quiz" → opens create form.
  - Filters row (3 inputs via `workspace-filters`): text search on `titre/theme`, `<select>` for `matiere` (freetext or from a loaded list), `<select>` for `statut` (tous / brouillon / valide), `<select>` for `niveau` (tous / debutant / intermediaire / avance).
  - On mount and on filter change: call `quizApi.getAll({ matiere, statut, niveau, page, limit: 10 })`.
  - Pagination: show "Page X / Y" with Prev/Next buttons when `total > 10`.
  - Cards grid (`workspace-cards`): each card shows `titre`, `matiere`, `niveau` badge, `statut` badge, `dateGeneration`. Actions per card: **Voir** (open detail panel), **Modifier** (open edit form), **Dupliquer** → `quizApi.creerVariante(id)`, **Valider** → `quizApi.valider(id)` (hidden if already `valide`), **Publier/Dépublier** → `quizApi.publier(id)` (toggles `visibilite`), **Supprimer** → `quizApi.remove(id)` after confirm.

  **Detail/question panel** (`panel.mode === 'detail'`):
  - Show quiz metadata at top.
  - List all questions with their 4 choices and `reponseCorrecte` highlighted; show `explication`.
  - Action buttons: **Ajouter une question** (open question form), **Modifier** (per question), **Supprimer** (per question → `quizApi.removeQuestion(quizId, qId)`).
  - Question form (inline below list): fields `enonce` (textarea), `choixA/B/C/D` (inputs), `reponseCorrecte` (radio A/B/C/D), `explication` (textarea). Submit calls `quizApi.addQuestion` or `quizApi.updateQuestion`.
  - Export panel at bottom: 4 buttons — PDF étudiant (`exportApi.download(exportApi.quizPdfUrl(id, false))`), Word étudiant, PDF corrigé (`exportApi.download(exportApi.quizPdfUrl(id, true))`), Word corrigé.

  **Create/edit form** (`panel.mode === 'create'` or `'edit'`):
  - Fields: `titre` (input), `theme` (input), `matiere` (input), `niveau` (select), `visibilite` (select prive/public).
  - Submit: `quizApi.create(data)` or `quizApi.update(id, data)`.

  Files: `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src\pages\QuizManager.jsx`

  Verify: open the browser at `/quiz` after starting the dev server — page renders with DashboardLayout, no console errors. API calls are visible in Network tab.

---

- [ ] 2. **Create `ContentManager.jsx`** — full content management page at route `/contents`.

  **List view** (`panel === null`):
  - Two tabs: "Mes Contenus" (calls `contentApi.getMesContenus(params)`) and "Contenus publics" (calls `contentApi.getPublic(params)`).
  - Filters: text search on `titre/theme`, `<select>` type (tous / cours / resume / serie / examen / quiz), `<select>` statut (tous / brouillon / valide). Pass as query params.
  - Pagination: `page/limit=10`, show Prev/Next.
  - Cards: show `titre`, `type` badge, `statut` badge, `matiere`, `dateCreation`. Actions: **Voir** (opens preview panel with `contenu` displayed as `pre`), **Modifier** (opens edit form), **Dupliquer** → `contentApi.dupliquer(id)`, **Valider** → `contentApi.valider(id)` (hidden if already `valide`), **Publier/Dépublier** → `contentApi.publier(id)`, **Supprimer** → `contentApi.remove(id)` after confirm. Export buttons per card: PDF (`exportApi.download(exportApi.contentPdfUrl(id))`), Word (`exportApi.download(exportApi.contentWordUrl(id))`).

  **Create/edit form** (`panel.mode === 'create'` or `'edit'`):
  - Fields: `titre` (input), `type` (select: cours/resume/serie/examen/quiz), `matiere` (input), `theme` (input), `contenu` (textarea, 14 rows).
  - Submit: `contentApi.create(data)` or `contentApi.update(id, data)`.

  Files: `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src\pages\ContentManager.jsx`

  Verify: navigate to `/contents` — tabs switch, cards render from API, export buttons trigger download.

---

- [ ] 3. **Create `ArchivesAdmin.jsx`** — replaces the old localStorage-based `Archives.jsx` at route `/archives`.

  **List view**:
  - Header: "Archives pédagogiques", button "+ Uploader un fichier" → shows upload form inline.
  - Filters: `<select>` matière (free text input or select built from unique matières in results), `<select>` promotion. Pass to `archiveApi.getAll({ matiere, promotion, page, limit: 10 })`.
  - Pagination Prev/Next.
  - Cards: show `nom`, `type` badge (pdf / word), `matiere`, `promotion`, `taille` (formatted KB/MB), `dateDepot`. Actions per card: **Voir le texte extrait** → calls `archiveApi.getTexte(id)`, shows text in a modal/panel below the card; **Générer depuis cette archive** → navigates to `/ai?archiveId=<id>` (using `useNavigate`); **Supprimer** → `archiveApi.remove(id)` after confirm.

  **Upload form** (shown inline when upload panel is open):
  - Fields: file input (accept `.pdf,.doc,.docx`), `matiere` (text input), `promotion` (text input).
  - Submit: `archiveApi.upload(file, matiere, promotion)` — uses FormData handled in `api.js`.
  - On success: refresh list, show success notice.

  Files: `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src\pages\ArchivesAdmin.jsx`

  Verify: navigate to `/archives` — list loads from API, upload form works, "Générer depuis cette archive" navigates to `/ai?archiveId=X`.

---

- [ ] 4. **Update `AiGenerator.jsx`** — read `archiveId` from URL query param and pre-fill generate-from-archive flow.

  - At top of `AiGeneratorForm` (or in the parent `AiGenerator`), read `const [searchParams] = useSearchParams()` and extract `archiveId = searchParams.get('archiveId')`.
  - If `archiveId` is present: show an info banner "Génération depuis l'archive #X", and in `handleGenerate` call `aiApi.generateFromArchive(archiveId, payload)` instead of `aiApi.generate(payload)`.
  - No other changes to `AiGenerator.jsx`.

  Files: `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src\pages\AiGenerator.jsx`

  Verify: navigate to `/ai?archiveId=5` — banner appears, generate button calls `generateFromArchive`.

---

- [ ] 5. **Create `AdminDashboard.jsx`** — admin-only page at route `/admin`.

  - Guard: at top of component, `const { user } = useAuth(); if (user?.role !== 'administrateur') return <Navigate to="/dashboard" replace />;`

  **Stats section**:
  - On mount call `adminApi.getDashboard()`.
  - Display returned stats in `workspace-stats` grid (total users, total quiz, total contenus, etc. — use whatever fields the backend returns).

  **Users section**:
  - Call `adminApi.getUsers()` on mount.
  - Table or card list: show `nom`, `prenom`, `email`, `role`, `associations`.
  - Per user actions: **Supprimer** → `adminApi.deleteUser(id)` after confirm; **Assigner matières** → inline mini-form with multi-select or comma-separated input, submit → `adminApi.assignerMatieres(id, list)`; **Assigner promotions** → same pattern → `adminApi.assignerPromotions(id, list)`.

  **Matières CRUD section**:
  - Call `matiereApi.getAll()` on mount.
  - List with **Supprimer** (`matiereApi.remove(id)`).
  - Inline create form: `nom` + `description` inputs → `matiereApi.create(data)`.
  - Inline edit form per item: same fields → `matiereApi.update(id, data)`.

  **Promotions CRUD section**:
  - Same pattern as Matières but using `promotionApi`.

  Files: `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src\pages\AdminDashboard.jsx`

  Verify: log in as a user with `role === 'administrateur'`, navigate to `/admin` — stats load, user list renders, CRUD operations work. Non-admin navigating to `/admin` redirects to `/dashboard`.

---

- [ ] 6. **Update `App.jsx`** — add routes for new pages and replace `/archives`.

  - Add imports: `QuizManager`, `ContentManager`, `ArchivesAdmin`, `AdminDashboard`.
  - Replace `<Route path="/archives" element={<ProtectedRoute><Archives /></ProtectedRoute>} />` with `<Route path="/archives" element={<ProtectedRoute><ArchivesAdmin /></ProtectedRoute>} />`.
  - Add three new routes (all inside `<ProtectedRoute>`):
    - `<Route path="/quiz" element={<ProtectedRoute><QuizManager /></ProtectedRoute>} />`
    - `<Route path="/contents" element={<ProtectedRoute><ContentManager /></ProtectedRoute>} />`
    - `<Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />`
  - Keep all existing routes and `legacyPaths` redirects unchanged.
  - Remove the `Archives` import (no longer used).

  Files: `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src\App.jsx`

  Verify: `npm run build` in the frontend directory completes with no errors.

---

- [ ] 7. **Update `DashboardLayout.jsx`** — add new menu items with role-based conditional display.

  - Replace the static `menuItems` array with a dynamic one built inside the component, after extracting `user` from `useAuth()`:
    ```js
    const baseItems = [
      { path: "/dashboard", page: "dashboard", icon: "▣", label: "Tableau de bord" },
      { path: "/ai",        page: "ai",        icon: "✨", label: "Assistant IA" },
      { path: "/quiz",      page: "quiz",       icon: "☑", label: "Mes Quiz" },
      { path: "/contents",  page: "contents",   icon: "📚", label: "Mes Contenus" },
      { path: "/archives",  page: "archives",   icon: "▧", label: "Archives" },
    ];
    const adminItem = { path: "/admin", page: "admin", icon: "⚙", label: "Administration" };
    const menuItems = user?.role === "administrateur" ? [...baseItems, adminItem] : baseItems;
    ```
  - Move `const { user, logout } = useAuth();` before the menuItems construction (it's already there, just reorder).
  - The `navigation()` render function already maps over `menuItems`, so no other changes needed there.
  - In the topbar user info section, replace the hardcoded `"ESPACE ENSEIGNANT"` label with a conditional: `user?.role === 'administrateur' ? 'ADMINISTRATEUR' : 'ESPACE ENSEIGNANT'`.

  Files: `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src\components\DashboardLayout.jsx`

  Verify: sidebar renders 5 items for regular users and 6 items for admin; the label changes correctly.

---

- [ ] 8. **Add CSS styles to `App.css`** — append new classes needed by the 4 new pages at the end of the file without modifying existing rules.

  Add styles for:
  - `.quiz-export-panel` — flex row with gap, wrapping, margin-top.
  - `.quiz-export-btn` — small button variant (border, border-radius, padding, bg #fff, hover #f4f1ff).
  - `.quiz-export-btn.corrige` — accent color `#6652e8` border for corrigé variants.
  - `.quiz-question-card` — card for each question in detail view: border, border-radius, padding, margin-bottom.
  - `.quiz-question-choices` — grid 2 columns for choices display.
  - `.quiz-question-correct` — highlighted choice (background `#eaf7ef`, color `#23714d`).
  - `.admin-section` — margin-top 36px, padding-top 24px, border-top `1px solid #e8e7ef`.
  - `.admin-table` — full width table, border-collapse, font-size 14px.
  - `.admin-table th` — text-align left, padding 10px 14px, background `#f4f1ff`, color `#45405f`.
  - `.admin-table td` — padding 10px 14px, border-bottom `1px solid #efedf5`.
  - `.admin-assign-form` — inline flex with gap 8px, align-items center, flex-wrap wrap.
  - `.admin-assign-form input` — border, border-radius 8px, padding 7px 10px, font inherit.
  - `.archive-text-panel` — white-space pre-wrap, max-height 300px, overflow-y auto, border, border-radius 10px, padding 16px, background `#faf9ff`, font-size 13px, line-height 1.7.
  - `.tabs-row` — display flex, gap 8px, margin-bottom 24px.
  - `.tab-btn` — padding 10px 20px, border-radius 8px, border `1px solid #dedbe8`, background white, font-weight 600, color `#4c416d`, cursor pointer.
  - `.tab-btn.active` — background `#6652e8`, color white, border-color `#6652e8`.

  Files: `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src\App.css`

  Verify: `npm run build` still passes; visual spot-check of quiz detail and admin table in the browser.

---

## Dependency order

Items 1–5 are independent of each other (each is a self-contained page file) and can be implemented in parallel or in any order.  
Item 6 (`App.jsx`) depends on items 1–5 being created (imports them).  
Item 7 (`DashboardLayout.jsx`) is independent of all other items.  
Item 8 (`App.css`) is independent — append-only, no risk of breaking existing pages.

The recommended implementation sequence for a single coder: **8 → 1 → 2 → 3 → 4 → 5 → 7 → 6**, so styles are ready before pages, and `App.jsx` is last (requires all page files to exist).
