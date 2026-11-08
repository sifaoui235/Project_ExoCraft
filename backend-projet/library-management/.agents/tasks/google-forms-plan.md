# Implementation Plan — Google Forms OAuth2 Integration

## Context (discovered by reading the codebase)

- **Backend**: NestJS 12, `"type": "module"`, all local imports **must** end with `.js` (even for `.ts` files).
- **Persistence**: In-memory via `Persist` (JSON-file store) — no DB. The `Quiz` entity is a plain TypeScript class, not an ORM entity.
- **Auth pattern**: Every route is JWT-protected by the global `JwtAuthGuard`. Public routes are marked `@Public()` from `src/auth/decorators/public.decorator.ts`.
- **Module pattern** (see `ExportModule`): import `QuizModule` to inject `QuizService`, declare service + controller, no exports needed.
- **Frontend fetch pattern** (see `api.js`): `apiRequest(endpoint, options)` handles token injection, 401 redirect, error parsing. New API objects follow the same shape.
- **`googleapis` v189** is already installed — use `google.auth.OAuth2` from `'googleapis'`.
- **refreshToken storage**: stored in-memory as a private field on `GoogleFormsService` (no DB). The teacher must re-authorize after a server restart (acceptable for test mode).
- **`quiz.resultats`**: array of `QuizResultat` objects on the `Quiz` entity; `syncNotes` appends to it, deduplicating by `responseId` stored as a new optional field `googleResponseId` on the resultat.
- **Build command (backend)**: `npm run build` (= `nest build`) — run from `backend-projet/library-management/`.
- **Build command (frontend)**: `npm run build` (= `vite build`) — run from `frontend-projet/frontend/`.
- **Test command (backend)**: `npx vitest run` — run from `backend-projet/library-management/`.
- **Git root**: assumed at `c:\Users\ASUS\Desktop\projet-ExoCraft`.

---

## Ordered Implementation Steps

- [ ] 1. **Extend `Quiz` entity with Google Forms fields**

  Add three optional fields to the `Quiz` class: `googleFormId?: string`, `googleFormUrl?: string`, and `googleFormResponderUri?: string`. Also add `googleResponseId?: string` to `QuizResultat` (used by sync to deduplicate by Forms response ID).

  Files:
  - `src/quiz/entities/quiz.entity.ts`

  Verify: `cd backend-projet/library-management && npm run build` — must compile with no errors.

---

- [ ] 2. **Create `GoogleFormsService`**

  Create `src/google-forms/google-forms.service.ts`. The service is `@Injectable()` and imports `QuizService` via constructor injection. It also imports `google` from `'googleapis'`.

  Implement the following methods — **all secrets read from `process.env`, never hardcoded**:

  **2a. Private helpers**
  ```
  private refreshToken: string | null = null;
  private getOAuth2Client(): OAuth2Client   // constructs from GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI; sets credentials if refreshToken exists; auto-refreshes on 401
  ```

  **2b. Public methods**

  `getAuthUrl(): string`
  - Construct `getOAuth2Client()`, call `generateAuthUrl` with:
    - `access_type: 'offline'`
    - `prompt: 'consent'`
    - `scope: ['https://www.googleapis.com/auth/forms.body', 'https://www.googleapis.com/auth/forms.responses.readonly']`
  - Return the URL string.

  `async handleCallback(code: string): Promise<void>`
  - Call `getOAuth2Client().getToken(code)`, store `tokens.refresh_token` (or keep existing if new one is null — Google only returns refresh_token on first consent).
  - Throw `BadRequestException` if no refresh token is available after exchange.

  `isConnected(): { connected: boolean }`
  - Returns `{ connected: this.refreshToken !== null }`.

  `async exportQuiz(quizId: number): Promise<{ lien: string; formId: string }>`
  1. Load quiz via `this.quizService.findOne(quizId)`.
  2. Guard: if `quiz.questions.length === 0` → throw `BadRequestException('Ce quiz ne contient aucune question. Ajoutez des questions avant d\'exporter')`.
  3. Guard: if `!this.refreshToken` → throw `BadRequestException('Veuillez d\'abord connecter votre compte Google')`.
  4. If `quiz.googleFormId` already set → skip creation, return existing `{ lien: quiz.googleFormUrl!, formId: quiz.googleFormId! }`.
  5. Build `OAuth2Client`, create Google Forms client via `google.forms({ version: 'v1', auth })`.
  6. `forms.create({ requestBody: { info: { title: quiz.titre } } })` → get `formId`.
  7. `forms.forms.batchUpdate` with these requests **in order**:
     - `{ updateSettings: { settings: { quizSettings: { isQuiz: true } }, updateMask: 'quizSettings' } }`
     - `{ createItem: { item: { title: 'Nom', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } }, location: { index: 0 } } }`
     - `{ createItem: { item: { title: 'Matricule', questionItem: { question: { required: true, textQuestion: { paragraph: false } } } }, location: { index: 1 } } }`
     - For each question at `index i+2`: `{ createItem: { item: { title: q.enonce, questionItem: { question: { required: true, grading: { pointValue: 1, correctAnswers: { answers: [{ value: q['choix' + q.reponseCorrecte] }] } }, choiceQuestion: { type: 'RADIO', options: [{ value: q.choixA }, { value: q.choixB }, { value: q.choixC }, { value: q.choixD }] } } }, location: { index: i+2 } } }`
  8. Fetch the form back with `forms.forms.get({ formId })` to get `responderUri`.
  9. Persist: `quiz.googleFormId = formId; quiz.googleFormUrl = responderUri; quiz.googleFormResponderUri = responderUri`.
  10. Return `{ lien: responderUri, formId }`.

  Error mapping (wrap the Google API call in try/catch):
  - `err.status === 401 || err.status === 403` → throw `BadRequestException('Token Google expiré. Reconnectez votre compte Google (le mode test expire après 7 jours)')`
  - `err.status === 429` → throw `BadRequestException('Quota Google dépassé. Réessayez dans quelques minutes')`
  - `err.status === 404` → throw `BadRequestException('Le formulaire Google a été supprimé. Exportez à nouveau le quiz')`
  - Default → rethrow.

  `async syncNotes(quizId: number): Promise<{ resultats: QuizResultat[] }>`
  1. Load quiz.
  2. Guard: no `googleFormId` → throw `BadRequestException('Ce quiz n\'a pas encore été exporté vers Google Forms')`.
  3. Guard: no `refreshToken` → same "connecter compte Google" error.
  4. Build Forms client, call `forms.responses.list({ formId: quiz.googleFormId })` with pagination (`nextPageToken` loop until exhausted).
  5. For each response:
     - Extract `responseId`.
     - Skip if `quiz.resultats` already contains a result with `googleResponseId === responseId`.
     - Find the answer for the "Nom" question (first text question at index 0) and "Matricule" (second at index 1).
     - `totalScore` = `response.totalScore ?? 0`.
     - `note` = `Math.round((totalScore / quiz.questions.length) * 20 * 100) / 100`.
     - Build a `QuizResultat` object: `{ id: (quiz.resultats?.length ?? 0) + 1, nom, prenom: '', score: totalScore, total: quiz.questions.length, note, pourcentage: Math.round((totalScore / quiz.questions.length) * 100), date: new Date(response.lastSubmittedTime), reponses: [], googleResponseId: responseId }`.
  6. Push new results into `quiz.resultats`.
  7. Return `{ resultats: quiz.resultats }`.

  Same error mapping as `exportQuiz`.

  Files:
  - `src/google-forms/google-forms.service.ts` (create)

  Verify: `npm run build` — must compile with no type errors.

---

- [ ] 3. **Create `GoogleFormsController`**

  Create `src/google-forms/google-forms.controller.ts`. Decorate with `@Controller('google-forms')`.

  Routes:

  ```
  @Get('auth')
  getAuth(): { url: string }
  → return { url: this.googleFormsService.getAuthUrl() }

  @Public()
  @Get('callback')
  async handleCallback(@Query('code') code: string, @Res() res: Response)
  → await this.googleFormsService.handleCallback(code)
  → res.redirect(`${process.env.FRONTEND_URL}/quiz?googleConnected=true`)

  @Get('status')
  getStatus(): { connected: boolean }
  → return this.googleFormsService.isConnected()

  @Post('export/:quizId')
  @HttpCode(200)
  async exportQuiz(@Param('quizId') quizId: string)
  → return this.googleFormsService.exportQuiz(+quizId)

  @Post('sync/:quizId')
  @HttpCode(200)
  async syncNotes(@Param('quizId') quizId: string)
  → return this.googleFormsService.syncNotes(+quizId)
  ```

  Inject `GoogleFormsService` via constructor. Import `Res` from `@nestjs/common` and `Response` from `express` for the redirect. Import `Public` from `'../auth/decorators/public.decorator.js'`.

  Files:
  - `src/google-forms/google-forms.controller.ts` (create)

  Verify: `npm run build` — no errors.

---

- [ ] 4. **Create `GoogleFormsModule`**

  Create `src/google-forms/google-forms.module.ts`:

  ```typescript
  import { Module } from '@nestjs/common';
  import { GoogleFormsService } from './google-forms.service.js';
  import { GoogleFormsController } from './google-forms.controller.js';
  import { QuizModule } from '../quiz/quiz.module.js';

  @Module({
    imports: [QuizModule],
    controllers: [GoogleFormsController],
    providers: [GoogleFormsService],
  })
  export class GoogleFormsModule {}
  ```

  Files:
  - `src/google-forms/google-forms.module.ts` (create)

  Verify: `npm run build` — no errors.

---

- [ ] 5. **Register `GoogleFormsModule` in `AppModule`**

  Add import line and module reference to `src/app.module.ts`:

  ```typescript
  import { GoogleFormsModule } from './google-forms/google-forms.module.js';
  // …add GoogleFormsModule to imports array
  ```

  Files:
  - `src/app.module.ts`

  Verify: `npm run build` — full backend build passes.

---

- [ ] 6. **Create `googleFormsApi.js` in the frontend**

  Create `frontend-projet/frontend/src/services/googleFormsApi.js`. Follow the exact pattern of `api.js` — use the shared `apiRequest` function (import from `./api.js`), use relative `/api/google-forms/...` paths, no token duplication.

  ```javascript
  import { apiRequest } from './api.js';   // named export — verify api.js exports it or use the pattern below

  // NOTE: apiRequest is not exported from api.js — replicate the same fetch pattern inline
  // OR export apiRequest from api.js (see step 7). Use whichever approach is chosen in step 7.

  const BASE = '/api/google-forms';

  export const googleFormsApi = {
    getStatus:   ()       => apiRequest(`${BASE}/status`),   // GET — { connected: boolean }
    getAuthUrl:  ()       => apiRequest(`${BASE}/auth`),     // GET — { url: string }
    export:      (quizId) => apiRequest(`${BASE}/export/${quizId}`, { method: 'POST' }),  // { lien, formId }
    sync:        (quizId) => apiRequest(`${BASE}/sync/${quizId}`,   { method: 'POST' }),  // { resultats }
  };
  ```

  **Implementation note**: `apiRequest` is not currently exported from `api.js`. Two options — pick the simpler one:
  - Option A (preferred — minimal change): copy `apiRequest` and `getToken` helpers into `googleFormsApi.js` as private functions. Keeps `api.js` untouched.
  - Option B: add `export` to `apiRequest` in `api.js` and import it. Choose this only if it doesn't risk breaking existing consumers (it won't, since adding `export` is non-breaking).

  **Decision**: use Option A — copy the two helpers. No changes to `api.js`.

  Files:
  - `frontend-projet/frontend/src/services/googleFormsApi.js` (create)

  Verify: `npm run build` in `frontend-projet/frontend/` — Vite build passes with no import errors.

---

- [ ] 7. **Update `QuizManager.jsx` — Google Forms UI**

  Modify `frontend-projet/frontend/src/pages/QuizManager.jsx`. All new state and logic goes inside the existing `QuizManager` default export component. Keep all existing code intact — add only new state, effects, and UI elements.

  **7a. New state variables** (inside `QuizManager()`):
  ```javascript
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleModal, setGoogleModal] = useState(null); // { quiz, lien } | null
  const [syncResults, setSyncResults] = useState(null); // { resultats } | null
  const [googleLoading, setGoogleLoading] = useState({}); // { [quizId]: 'export'|'sync'|null }
  ```

  **7b. On mount effect** — check Google connection status:
  ```javascript
  useEffect(() => {
    googleFormsApi.getStatus()
      .then(({ connected }) => setIsGoogleConnected(connected))
      .catch(() => {});
  }, []);
  ```

  **7c. URL param check effect** — detect `?googleConnected=true`:
  ```javascript
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('googleConnected') === 'true') {
      setIsGoogleConnected(true);
      // show toast
      alert('✅ Compte Google connecté !');
      // clean URL param without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete('googleConnected');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  ```

  **7d. Handler functions**:

  ```javascript
  const handleConnectGoogle = async () => {
    try {
      const { url } = await googleFormsApi.getAuthUrl();
      window.location.href = url;
    } catch (err) { alert('Erreur : ' + err.message); }
  };

  const handleExportToForms = async (quiz) => {
    setGoogleLoading(prev => ({ ...prev, [quiz.id]: 'export' }));
    try {
      const { lien, formId } = await googleFormsApi.export(quiz.id);
      quiz.googleFormId = formId;
      quiz.googleFormUrl = lien;
      setGoogleModal({ quiz, lien });
      loadQuizzes(); // refresh list
    } catch (err) { alert('Erreur : ' + err.message); }
    finally { setGoogleLoading(prev => ({ ...prev, [quiz.id]: null })); }
  };

  const handleSyncNotes = async (quiz) => {
    setGoogleLoading(prev => ({ ...prev, [quiz.id]: 'sync' }));
    try {
      const { resultats } = await googleFormsApi.sync(quiz.id);
      setSyncResults({ quiz, resultats });
    } catch (err) { alert('Erreur : ' + err.message); }
    finally { setGoogleLoading(prev => ({ ...prev, [quiz.id]: null })); }
  };
  ```

  **7e. Per-quiz card buttons** — add inside the existing `.workspace-card-actions` div for each quiz card, after the existing "🔗 Partager" button:

  ```jsx
  {/* Google Forms button — three states */}
  {!isGoogleConnected && (
    <button onClick={handleConnectGoogle}
      style={{ background: '#e8f0fe', color: '#1a73e8', border: '1px solid #c5d9f7', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
      🔗 Connecter Google
    </button>
  )}
  {isGoogleConnected && !q.googleFormId && (
    <button
      disabled={googleLoading[q.id] === 'export'}
      onClick={() => handleExportToForms(q)}
      style={{ background: '#e6f4ea', color: '#1e8e3e', border: '1px solid #b7dfbf', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
      {googleLoading[q.id] === 'export' ? '⏳ Export...' : '📤 Exporter vers Forms'}
    </button>
  )}
  {isGoogleConnected && q.googleFormId && (
    <button
      onClick={() => { navigator.clipboard.writeText(q.googleFormUrl); setGoogleModal({ quiz: q, lien: q.googleFormUrl }); }}
      style={{ background: '#e6f4ea', color: '#1e8e3e', border: '1px solid #b7dfbf', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
      📋 Voir le formulaire
    </button>
  )}
  {/* Sync Notes — only if already exported */}
  {q.googleFormId && (
    <button
      disabled={googleLoading[q.id] === 'sync'}
      onClick={() => handleSyncNotes(q)}
      style={{ background: '#fce8e6', color: '#d93025', border: '1px solid #f5c6c4', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
      {googleLoading[q.id] === 'sync' ? '⏳ Sync...' : '📊 Sync Notes'}
    </button>
  )}
  ```

  **7f. Google Forms link modal** — add after the existing `showLienModal` modal block:

  ```jsx
  {googleModal && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}
      onClick={() => setGoogleModal(null)}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', width: '90%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 8px', color: '#1a1a3e', fontSize: 18 }}>📋 Google Forms — {googleModal.quiz.titre}</h2>
        <p style={{ color: '#69647b', fontSize: 13, marginBottom: 16 }}>Partagez ce lien avec vos étudiants pour qu'ils répondent au quiz.</p>
        <div style={{ padding: '12px 16px', background: '#f8f7ff', borderRadius: 10, border: '1.5px solid #dcd9e7', marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: '#4c416d', wordBreak: 'break-all' }}>{googleModal.lien}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button onClick={() => { navigator.clipboard.writeText(googleModal.lien); alert('✓ Lien copié !'); }}
            style={{ flex: 1, padding: 12, borderRadius: 10, background: '#1a73e8', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            📋 Copier le lien
          </button>
          <button onClick={() => { const s = encodeURIComponent('Quiz Google Forms'); const b = encodeURIComponent(`Voici le lien du quiz :\n${googleModal.lien}`); window.open(`mailto:?subject=${s}&body=${b}`); }}
            style={{ flex: 1, padding: 12, borderRadius: 10, background: '#f0edff', color: '#6c5ce7', border: '1.5px solid #dcd9e7', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            ✉️ Envoyer par mail
          </button>
        </div>
        <button onClick={() => setGoogleModal(null)}
          style={{ width: '100%', padding: 10, borderRadius: 10, background: 'transparent', border: '1px solid #dcd9e7', color: '#8888aa', cursor: 'pointer', fontSize: 13 }}>
          Fermer
        </button>
      </div>
    </div>
  )}
  ```

  **7g. Sync results modal** — add after the Google Forms modal:

  ```jsx
  {syncResults && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}
      onClick={() => setSyncResults(null)}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', width: '90%', maxWidth: 640, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px', color: '#1a1a3e', fontSize: 18 }}>📊 Notes — {syncResults.quiz.titre}</h2>
        {syncResults.resultats?.length === 0
          ? <p style={{ color: '#69647b' }}>Aucune réponse reçue pour l'instant.</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f7ff' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1.5px solid #dcd9e7' }}>Nom</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1.5px solid #dcd9e7' }}>Matricule</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1.5px solid #dcd9e7' }}>Score</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1.5px solid #dcd9e7' }}>Note /20</th>
                </tr>
              </thead>
              <tbody>
                {syncResults.resultats.map((r, i) => (
                  <tr key={r.id ?? i} style={{ borderBottom: '1px solid #f0eeff' }}>
                    <td style={{ padding: '8px 12px' }}>{r.nom}</td>
                    <td style={{ padding: '8px 12px' }}>{r.prenom}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{r.score}/{r.total}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: r.note >= 10 ? '#1e8e3e' : '#d93025' }}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
        <button onClick={() => setSyncResults(null)}
          style={{ width: '100%', marginTop: 16, padding: 10, borderRadius: 10, background: 'transparent', border: '1px solid #dcd9e7', color: '#8888aa', cursor: 'pointer', fontSize: 13 }}>
          Fermer
        </button>
      </div>
    </div>
  )}
  ```

  **7h. Add import** at the top of `QuizManager.jsx`:
  ```javascript
  import { googleFormsApi } from '../services/googleFormsApi.js';
  ```

  Files:
  - `frontend-projet/frontend/src/pages/QuizManager.jsx`

  Verify: `npm run build` in `frontend-projet/frontend/` — Vite build passes with no errors.

---

- [ ] 8. **Final build verification and commit**

  Run both builds clean, stage only the changed/created files, and commit:

  ```bash
  # From backend root
  cd c:\Users\ASUS\Desktop\projet-ExoCraft\backend-projet\library-management
  npm run build

  # From frontend root
  cd c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend
  npm run build

  # From repo root
  cd c:\Users\ASUS\Desktop\projet-ExoCraft
  git add backend-projet/library-management/src/quiz/entities/quiz.entity.ts
  git add backend-projet/library-management/src/google-forms/google-forms.service.ts
  git add backend-projet/library-management/src/google-forms/google-forms.controller.ts
  git add backend-projet/library-management/src/google-forms/google-forms.module.ts
  git add backend-projet/library-management/src/app.module.ts
  git add frontend-projet/frontend/src/services/googleFormsApi.js
  git add frontend-projet/frontend/src/pages/QuizManager.jsx
  git commit -m "feat: integration Google Forms OAuth2 + export quiz + sync notes"
  git push origin master
  ```

  **Never stage `.env`.**

  Verify: both `npm run build` commands exit 0; `git push` succeeds.

---

## Key decisions and rationale

1. **refreshToken stored in-memory** (not persisted to `db/data.json`): The `Persist` store is built for domain data. OAuth tokens are a runtime credential that expires after 7 days in Google's test mode anyway. In-memory is simpler and avoids token leaks in the JSON file. The teacher sees "non connecté" after a server restart and re-authorizes with one click.

2. **No new DTO files**: All controller params are primitives (`string`, `number`) or use `@Query`/`@Param`. No complex body shapes, so no validation DTO needed.

3. **`googleFormResponderUri` stored on entity**: `responderUri` (the direct fill-out link) differs from the edit URL. Storing it lets the sync route and frontend always read it without a second Forms API call.

4. **`googleResponseId` on `QuizResultat`**: Deduplication of sync responses is done by Forms response ID, not by name+matricule (which could collide). Adding the field as optional maintains full backward compatibility with existing share-link results.

5. **`apiRequest` copied into `googleFormsApi.js`** rather than re-exporting from `api.js`: Avoids any risk of breaking existing imports while keeping the file self-contained.

6. **`@Public()` only on `/callback`**: `/auth` and `/status` should still require a valid teacher JWT. The callback is hit by Google's redirect (no JWT context), so it must be public.

7. **batchUpdate order enforces quiz structure**: `isQuiz=true` must come first (Google Forms API requirement). Nom and Matricule text fields come before question items so their indices are predictable for sync parsing.
