# Google Forms OAuth2 Integration for ExoCraft

This change wires a Google Forms export-and-sync flow into ExoCraft's quiz manager. A teacher authenticates once via OAuth2, exports any quiz to a Google Form (isQuiz mode with auto-grading), shares the responder link, and later syncs student scores back into the quiz's results list. The batchUpdate order, pagination, deduplication, and error messages all match the plan. Three issues need attention before this is production-ready: an answer-extraction logic that will silently misidentify student names and matricules, a misleading double-throw pattern in the error catch blocks, and `QuizResultat.prenom` being silently repurposed to carry matricule data.

**Verdict**: NEEDS_CHANGES

---

## High-level view

`handleCallback` stores the refresh token in-memory and falls back to the existing token when Google omits it on repeat consents — correct behavior. The session is lost on server restart by design, acceptable for test mode. The frontend `?googleConnected=true` URL param is cleaned without a page reload.

The batchUpdate sequence follows the required order (isQuiz → Nom text field → Matricule text field → RADIO questions with grading). The idempotency guard prevents re-creating a form that was already exported.

Answer extraction in `syncNotes` uses `Object.values(response.answers)` filtered by `textAnswers`, relying on JavaScript object iteration order to find Nom and Matricule. The Google Forms API keys answers by item ID (GUID), not by position — iteration order is not guaranteed. This will silently produce wrong names and matricules when the order doesn't match.

`mapGoogleError` is declared `never` and always throws. The `throw err` that follows it in both catch blocks is genuinely unreachable but creates a confusing double-throw path for anyone reading the error flow.

`QuizResultat.prenom` is repurposed to carry the matricule value in synced results. The UI column header says "Matricule" and displays correctly, but `quiz.resultats` is shared with the share-link submission path (`soumettre`) which writes a real first name into `prenom`. Any code iterating all results mixes semantics silently.

---

<details>
<summary>Issues (3)</summary>

1. **Answer extraction order not guaranteed** — `Object.values(response.answers)` iterates by insertion order of JS object keys, but the Google Forms API keys answers by item ID, not by position. The filter for `textAnswers` may pick up choice-question text-answer wrappers or return fields in a different order. Fix: look up the item IDs for Nom and Matricule from the form structure (returned by `forms.forms.get` already called in `exportQuiz`), store them on the quiz entity alongside `googleFormId`, and index directly into `response.answers[nomItemId]` in `syncNotes`.

2. **`mapGoogleError` called inside catch but `throw err` follows** — After `this.mapGoogleError(err)` in the catch block, `throw err` runs if `mapGoogleError` doesn't throw (which it always does for known statuses, but re-throws for unknown ones). The pattern creates two consecutive throws on the same error object in the unknown-status path. Simplify by removing the trailing `throw err` lines and letting `mapGoogleError`'s final `throw err` be the sole exit, or change the return type to `void` and keep the trailing throw as the guaranteed unreachable path with a clear comment.

3. **`prenom` field repurposed to carry matricule** — `QuizResultat.prenom` is used to store the matricule value in synced results (`prenom: matricule`). This silently breaks the semantics of `prenom` for any other code that reads `quiz.resultats` (statistics, export, display). Add a proper `matricule?: string` field to `QuizResultat` and populate it directly, leaving `prenom` as an empty string or omitting it.

</details>

---

<details>
<summary>Details</summary>

## Answer extraction fragility in `syncNotes`

The sync loop extracts Nom and Matricule with:

```typescript
const textAnswers = answerValues.filter(
  (a: any) => a.textAnswers?.answers?.[0]?.value !== undefined,
);
const nom = textAnswers[0]?....?.value ?? '';
const matricule = textAnswers[1]?....?.value ?? '';
```

`answerValues` is `Object.values(response.answers)` where the object keys are Google Forms item IDs (GUIDs). JavaScript preserves insertion order for string keys that aren't array indices, but the Google Forms API does not document that responses are ordered by form position. In practice, order matches the form structure most of the time, but a response serialized from a different path (e.g., re-fetched after a partial failure, or from a bulk export) may arrive in a different order. More concretely: the filter `a.textAnswers?.answers?.[0]?.value !== undefined` would match any question whose answer happens to have a `textAnswers` wrapper — which in theory could include a short-answer question added later to the form.

The safe fix is to store the item IDs for Nom and Matricule when the form is created. `forms.forms.get` is already called at the end of `exportQuiz`; the response includes `items[].questionItem.question.questionId`. Store these two IDs as `googleNomItemId` and `googleMatriculeItemId` on the `Quiz` entity, then in `syncNotes` read `response.answers[nomItemId]` directly.

## Double-throw path in error mapping

`mapGoogleError` is declared `never`, meaning it always throws. But it's called inside `catch` blocks that also end with `throw err`:

```typescript
} catch (err: any) {
  this.mapGoogleError(err);
  throw err; // unreachable, but satisfies TS
}
```

For unknown errors, `mapGoogleError` re-throws the original error and the outer `throw err` never executes (the inner throw already exited). The pattern is functionally safe today but creates a misleading read path for anyone tracing the error flow. The cleaner fix: remove the trailing `throw err` lines from the two catch sites — TypeScript accepts `mapGoogleError`'s `never` return type as sufficient proof of exhaustion.

## `prenom` field repurposed for matricule

In `syncNotes`, the code explicitly maps matricule to `prenom`:

```typescript
prenom: matricule, // using prenom field to carry matricule value
```

The sync results table in `QuizManager.jsx` renders `r.prenom` under the "Matricule" column header — correct on screen. But `quiz.resultats` is shared with `soumettre` (the share-link path), which writes a genuine first name into `prenom`. Statistics or export code iterating all results will mix surnames and first names silently. Add `matricule?: string` to `QuizResultat`.

</details>

---

<details>
<summary>Files changed</summary>

| File | Change |
|---|---|
| `src/quiz/entities/quiz.entity.ts` | Added `googleFormId`, `googleFormUrl`, `googleFormResponderUri` to `Quiz`; added `googleResponseId` to `QuizResultat` |
| `src/google-forms/google-forms.service.ts` | New service: OAuth2 client, `getAuthUrl`, `handleCallback`, `isConnected`, `exportQuiz`, `syncNotes`, `mapGoogleError` |
| `src/google-forms/google-forms.controller.ts` | New controller: 5 routes (`auth`, `callback`, `status`, `export/:quizId`, `sync/:quizId`) |
| `src/google-forms/google-forms.module.ts` | New module: imports `QuizModule`, registers controller and service |
| `src/app.module.ts` | Added `GoogleFormsModule` to imports |
| `frontend/src/services/googleFormsApi.js` | New API client: self-contained `apiRequest` + 4 methods |
| `frontend/src/pages/QuizManager.jsx` | Added 4 state variables, 2 effects, 3 handlers, per-card buttons (3 states), Google Forms modal, sync results modal |

Full diff: `git diff HEAD~1 HEAD`

</details>
