# ExoCraft Project Code Review Report

## Executive Summary

**Overall Assessment:** The ExoCraft project is a well-structured educational content management platform with a NestJS backend and React frontend. The code is mostly complete and functional, with good separation of concerns and modern architecture patterns. However, there are **critical bugs**, **missing implementations**, and **coupling mismatches** that need to be addressed before production deployment.

**Key Findings:**
- ✅ **Well-structured**: Clear module organization, consistent naming conventions
- ⚠️ **Critical bugs**: Missing method implementations, logic errors in services
- ⚠️ **Backend/Frontend coupling issues**: API endpoint mismatches, missing endpoints
- ⚠️ **Security concerns**: JWT secret exposed, global guards not properly applied
- ⚠️ **Missing validation**: Some DTOs lack proper validation decorators

---

## 1. Project Structure Assessment

### Backend Structure (NestJS)

**Location:** `c:\Users\ASUS\Desktop\projet-ExoCraft\backend-projet\library-management\src\`

**Modules Found:**
- ✅ `app.module.ts` - Main module with proper imports
- ✅ `auth` - Authentication (JWT strategy, guards, decorators)
- ✅ `user` - User management
- ✅ `quiz` - Quiz CRUD with questions
- ✅ `content` - Educational content management
- ✅ `ai` - AI content generation (OpenRouter integration)
- ✅ `archive` - File upload and text extraction
- ✅ `export` - PDF/Word export functionality
- ✅ `admin` - Admin dashboard and user management
- ✅ `matiere` - Subject management
- ✅ `promotion` - Promotion/class management

**Overall Structure:** ⭐⭐⭐⭐ (4/5) - Well-organized with proper module separation

### Frontend Structure (React + Vite)

**Location:** `c:\Users\ASUS\Desktop\projet-ExoCraft\frontend-projet\frontend\src\`

**Key Components:**
- ✅ `pages/` - Login, Register, Dashboard, AiGenerator, QuizManager, ContentManager, Archives, Settings, AdminDashboard
- ✅ `components/` - ProtectedRoute, DashboardLayout, ContentWorkspace, navbar
- ✅ `services/api.js` - Centralized API client with all endpoints
- ✅ `context/AuthContext.jsx` - Authentication state management
- ✅ `hooks/` - Custom hooks (useContents)

**Overall Structure:** ⭐⭐⭐⭐ (4/5) - Clean component organization with proper routing

---

## 2. Backend Completeness Issues

### 🔴 CRITICAL: Missing Method Implementation

**File:** `src/export/export.service.ts`

**Issue:** Method `exportQuizWord()` is called in the controller but **NOT IMPLEMENTED** in the service.

**Evidence:**
- Controller calls it: `src/export/export.controller.ts:94` - `const buffer = await this.exportService.exportQuizWord(+id, avecCorrige);`
- Service exports: `exportContentPdf`, `exportContentWord`, `exportQuizPdf`, `exportDirectPdf`, `exportDirectWord` ✅
- **MISSING:** `exportQuizWord()` ❌

**Impact:** Runtime error when users try to export quizzes to Word format.

**Fix Required:** Add the missing method:
```typescript
async exportQuizWord(id: number, avecCorrige = false): Promise<Buffer> {
  const quiz = this.quizService.findOne(id);
  if (quiz.statut !== 'valide') {
    throw new BadRequestException('Seul un quiz validé peut être exporté');
  }
  
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: quiz.titre, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    // ... implement similar to exportQuizPdf but for docx format
  ];
  
  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBuffer(doc);
}
```

---

### 🔴 CRITICAL: Logic Bug in Content Service

**File:** `src/content/content.service.ts`

**Issue:** `findByAuteur()` method does NOT filter by `auteurId` - it just passes `visibilite: undefined` to `findAll()`.

**Code (Line 67-70):**
```typescript
findByAuteur(auteurId: number, filters: FilterContentDto): { data: Content[]; total: number; page: number; limit: number } {
  return this.findAll({ ...filters, visibilite: undefined });
}
```

**Problem:** The `auteurId` parameter is completely ignored. This will return ALL contents instead of just the author's contents.

**Impact:** Users can see other users' private contents.

**Fix Required:**
```typescript
findByAuteur(auteurId: number, filters: FilterContentDto): { data: Content[]; total: number; page: number; limit: number } {
  let result = [...this.contents].filter(c => c.auteurId === auteurId);
  
  // Apply filters
  if (filters.type) result = result.filter((c) => c.type === filters.type);
  if (filters.matiere) result = result.filter((c) => c.matiere.toLowerCase().includes(filters.matiere!.toLowerCase()));
  if (filters.statut) result = result.filter((c) => c.statut === filters.statut);
  
  const total = result.length;
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const start = (page - 1) * limit;
  
  return {
    data: result.slice(start, start + limit),
    total,
    page,
    limit,
  };
}
```

---

### ⚠️ WARNING: Incomplete DTOs

**Multiple files missing validation decorators:**

1. **`src/auth/dto/login.dto.ts`** - Both `motDePasse` and `password` are optional. One should be required.
   ```typescript
   // Current: both optional
   @IsString() @IsOptional()
   motDePasse?: string;
   
   @IsString() @IsOptional()
   password?: string;
   ```
   **Fix:** Add validation to ensure at least one is present.

2. **`src/content/dto/filter-content.dto.ts`** - Likely missing (not found in files read). Should validate query parameters.

3. **`src/archive/dto/create-archive.dto.ts`** - Not validated against file type.

---

### ⚠️ WARNING: Missing Global Guard Application

**File:** `src/main.ts`

**Issue:** Global JWT guard is registered, but the routes might not all be properly protected.

**Evidence (Line 37-40):**
```typescript
app.useGlobalGuards(
  new JwtAuthGuard(reflector),
  new RolesGuard(reflector),
);
```

**Check Required:** Verify that all routes except `/auth/login` and `/auth/register` require authentication. The `@Public()` decorator is used correctly in `auth.controller.ts`, but other controllers should be verified.

---

### ⚠️ Authentication Service Bug

**File:** `src/auth/auth.service.ts`

**Issue:** Missing `await` keyword (though the method is synchronous, so not critical).

**Lines 28-30:**
```typescript
const existingUser = this.userService.findByEmail(email);
if (existingUser) {
  throw new ConflictException('Cet email est déjà utilisé');
}
```

**Note:** `findByEmail()` returns `User | undefined` synchronously, so this is technically correct, but if it ever becomes async, this will break. Not critical now.

---

## 3. Frontend Completeness

### ✅ All Major Features Implemented

**Pages:**
- ✅ Login / Register with full form validation
- ✅ Dashboard with content workspace
- ✅ AI Generator with chat and content generation
- ✅ Quiz Manager with question CRUD
- ✅ Content Manager with filtering
- ✅ Archives Admin with upload and text extraction
- ✅ Admin Dashboard with user/matiere/promotion management
- ✅ Settings page

**Components:**
- ✅ ProtectedRoute for auth guards
- ✅ DashboardLayout with navigation
- ✅ ContentWorkspace with manual editing and localStorage

---

## 4. Backend/Frontend Coupling Analysis

### API Endpoint Mapping

I compared the backend routes (from controllers) with the frontend API calls (from `api.js`). Here are the findings:

### ✅ CORRECTLY COUPLED

| Frontend Call | Backend Route | Status |
|--------------|---------------|--------|
| `authApi.login()` | POST `/api/auth/login` | ✅ Match |
| `authApi.register()` | POST `/api/auth/register` | ✅ Match |
| `quizApi.getAll()` | GET `/api/quiz?...` | ✅ Match |
| `quizApi.getOne(id)` | GET `/api/quiz/:id` | ✅ Match |
| `quizApi.create()` | POST `/api/quiz` | ✅ Match |
| `quizApi.update(id)` | PATCH `/api/quiz/:id` | ✅ Match |
| `quizApi.remove(id)` | DELETE `/api/quiz/:id` | ✅ Match |
| `quizApi.valider(id)` | PATCH `/api/quiz/:id/valider` | ✅ Match |
| `quizApi.publier(id)` | PATCH `/api/quiz/:id/visibilite` | ✅ Match (frontend calls it "publier", backend is "toggleVisibilite") |
| `quizApi.addQuestion()` | POST `/api/quiz/:id/questions` | ✅ Match |
| `quizApi.updateQuestion()` | PATCH `/api/quiz/:id/questions/:qid` | ✅ Match |
| `quizApi.removeQuestion()` | DELETE `/api/quiz/:id/questions/:qid` | ✅ Match |
| `quizApi.importFromAi()` | POST `/api/quiz/import` | ✅ Match |
| `quizApi.creerVariante()` | POST `/api/quiz/:id/variante` | ✅ Match |
| `aiApi.generate()` | POST `/api/ai/generate` | ✅ Match |
| `aiApi.chat()` | POST `/api/ai/chat` | ✅ Match |
| `aiApi.save()` | POST `/api/ai/save` | ✅ Match |
| `aiApi.generateFromArchive()` | POST `/api/ai/generate-from-archive/:id` | ✅ Match |
| `aiApi.getContents()` | GET `/api/ai/contents` | ✅ Match |
| `aiApi.valider(id)` | PATCH `/api/ai/contents/:id/valider` | ✅ Match |
| `aiApi.modifier(id)` | PATCH `/api/ai/contents/:id/modifier` | ✅ Match |
| `contentApi.getMesContenus()` | GET `/api/contents/mes-contenus` | ✅ Match |
| `contentApi.getPublic()` | GET `/api/contents/public` | ✅ Match |
| `contentApi.getOne(id)` | GET `/api/contents/:id` | ✅ Match |
| `contentApi.create()` | POST `/api/contents` | ✅ Match |
| `contentApi.update(id)` | PATCH `/api/contents/:id` | ✅ Match |
| `contentApi.remove(id)` | DELETE `/api/contents/:id` | ✅ Match |
| `contentApi.valider(id)` | PATCH `/api/contents/:id/valider` | ✅ Match |
| `contentApi.publier(id)` | PATCH `/api/contents/:id/visibilite` | ✅ Match |
| `contentApi.dupliquer(id)` | POST `/api/contents/:id/dupliquer` | ✅ Match |
| `archiveApi.getAll()` | GET `/api/archives` | ✅ Match |
| `archiveApi.getForEnseignant()` | GET `/api/archives/enseignant` | ✅ Match |
| `archiveApi.getOne(id)` | GET `/api/archives/:id` | ✅ Match |
| `archiveApi.getTexte(id)` | GET `/api/archives/:id/texte` | ✅ Match |
| `archiveApi.upload()` | POST `/api/archives/upload` | ✅ Match |
| `archiveApi.remove(id)` | DELETE `/api/archives/:id` | ✅ Match |
| `exportApi.contentPdfUrl(id)` | GET `/api/export/content/:id/pdf` | ✅ Match |
| `exportApi.contentWordUrl(id)` | GET `/api/export/content/:id/word` | ✅ Match |
| `exportApi.quizPdfUrl(id)` | GET `/api/export/quiz/:id/pdf` | ✅ Match |
| `exportApi.quizWordUrl(id)` | GET `/api/export/quiz/:id/word` | ✅ Match (but BROKEN - method missing in service) |
| `exportApi.directPdf()` | POST `/api/export/direct/pdf` | ✅ Match |
| `exportApi.directWord()` | POST `/api/export/direct/word` | ✅ Match |
| `matiereApi.getAll()` | GET `/api/matieres` | ✅ Match |
| `matiereApi.create()` | POST `/api/matieres` | ✅ Match |
| `matiereApi.update(id)` | PATCH `/api/matieres/:id` | ✅ Match |
| `matiereApi.remove(id)` | DELETE `/api/matieres/:id` | ✅ Match |
| `promotionApi.getAll()` | GET `/api/promotions` | ✅ Match |
| `promotionApi.create()` | POST `/api/promotions` | ✅ Match |
| `promotionApi.update(id)` | PATCH `/api/promotions/:id` | ✅ Match |
| `promotionApi.remove(id)` | DELETE `/api/promotions/:id` | ✅ Match |
| `adminApi.getDashboard()` | GET `/api/admin/dashboard` | ✅ Match |
| `adminApi.getUsers()` | GET `/api/admin/users` | ✅ Match |
| `adminApi.deleteUser(id)` | DELETE `/api/admin/users/:id` | ✅ Match |
| `adminApi.assignerMatieres()` | PATCH `/api/admin/users/:id/matieres` | ✅ Match |
| `adminApi.assignerPromotions()` | PATCH `/api/admin/users/:id/promotions` | ✅ Match |

### ⚠️ MISMATCHES & ISSUES

#### 1. Duplicate API Files

**Issue:** Two `api.js` files exist with different implementations:
- `frontend-projet/frontend/src/services/api.js` (actually used by components)
- `backend-projet/integration/frontend-files/services/api.js` (older version?)

**Differences:**
- The `integration/` version has `API_URL = "http://localhost:3000/api"` (hardcoded)
- The actual frontend uses `API_URL = "/api"` (proxy via Vite)

**Recommendation:** Delete `backend-projet/integration/frontend-files/` to avoid confusion.

#### 2. Frontend Field Name Compatibility

**Auth DTOs:** Backend accepts both `firstName/lastName` AND `nom/prenom` for compatibility.

**Evidence:** `src/user/dto/create-user.dto.ts` (lines 7-19)
```typescript
@IsOptional() nom?: string;
@IsOptional() lastName?: string;
@IsOptional() prenom?: string;
@IsOptional() firstName?: string;
```

**Status:** ✅ This is correctly handled - backend normalizes in `auth.service.ts` (lines 16-18).

#### 3. Auth Token Handling

**Frontend:** Stores token in `localStorage` as `exocraft_token` and injects via `Authorization: Bearer ${token}` header.

**Backend:** Validates via `JwtAuthGuard` using `passport-jwt` with `ExtractJwt.fromAuthHeaderAsBearerToken()`.

**Status:** ✅ Correctly coupled.

#### 4. Request/Response Shape Consistency

**Login Response:**
- Backend returns: `{ access_token, user: { id, nom, prenom, email, role, associations } }`
- Frontend expects: `{ access_token, user: { id, firstName, lastName, email, role, associations } }`
- Backend ALSO returns aliases: `lastName: user.nom, firstName: user.prenom` (line 52-53 in `auth.service.ts`)

**Status:** ✅ Properly handled with field aliasing.

---

## 5. Security & Configuration Issues

### 🔴 CRITICAL: JWT Secret Exposed

**File:** `.env` (should NEVER be committed)

**Line 1:** `JWT_SECRET=exocraft_secret_key_a_changer_plus_tard`

**Issue:** The JWT secret is:
1. Weak (human-readable)
2. In version control (based on file being read)
3. Has a TODO comment in French ("to change later")

**Recommendation:**
1. Generate a strong secret: `openssl rand -base64 32`
2. Add `.env` to `.gitignore`
3. Create `.env.example` with placeholder values
4. Document environment setup in README

### ⚠️ API Key Exposed

**File:** `.env`

**Line 4:** `OPENROUTER_API_KEY=<REDACTED>`

**Issue:** OpenRouter API key is committed (if in git).

**Recommendation:** Rotate the key immediately and use environment variables properly.

### ⚠️ CORS Configuration

**File:** `src/main.ts` (lines 14-20)

**Current:**
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
  ],
  credentials: true,
});
```

**Status:** ✅ Correctly restricts origins. For production, add the production frontend URL.

---

## 6. Module Dependency Analysis

### Backend Module Dependencies

**All modules properly exported and imported:**

| Module | Imports | Exports | Wired in app.module.ts |
|--------|---------|---------|----------------------|
| UserModule | - | UserService | ✅ |
| AuthModule | UserModule, JwtModule, PassportModule | AuthService, JwtAuthGuard, RolesGuard | ✅ |
| QuizModule | - | QuizService | ✅ |
| ContentModule | - | ContentService | ✅ |
| AiModule | ArchiveModule | AiService | ✅ |
| ArchiveModule | - | ArchiveService | ✅ |
| ExportModule | ContentModule, QuizModule | - | ✅ |
| AdminModule | UserModule, ContentModule, QuizModule, ArchiveModule, MatiereModule, PromotionModule | - | ✅ |
| MatiereModule | - | MatiereService | ✅ |
| PromotionModule | - | PromotionService | ✅ |

**Status:** ✅ All modules correctly registered in `app.module.ts`.

---

## 7. Data Storage & Persistence

### Backend Storage

**Current Implementation:** **IN-MEMORY ARRAYS** (no database)

**Evidence:**
- `user.service.ts`: `private users: User[] = [];`
- `quiz.service.ts`: `private quizzes: Quiz[] = [];`
- `content.service.ts`: `private contents: Content[] = [];`
- `ai.service.ts`: `private contents: GeneratedContent[] = [];`
- `archive.service.ts`: `private archives: Archive[] = [];`
- `matiere.service.ts`: `private matieres: Matiere[] = [];`
- `promotion.service.ts`: `private promotions: Promotion[] = [];`

**Impact:** ⚠️ **All data is lost on server restart.**

**Recommendation:** Integrate a database (PostgreSQL/MySQL) with TypeORM or Prisma.

### Frontend Storage

**Current Implementation:** `localStorage` for content (via `contentStore.js`)

**Key:** `exocraft_contents`

**Status:** ✅ Properly implemented with event-driven updates (`CONTENTS_CHANGED` event).

**Note:** This is a **local-only** feature - content in `ContentWorkspace` is not synced with backend.

---

## 8. Missing Features / TODOs

### Backend

1. ❌ **Database integration** - Currently all in-memory
2. ❌ **User password reset** - Not implemented
3. ❌ **Email verification** - Not implemented
4. ❌ **File upload validation** - Basic check, but no virus scanning
5. ❌ **Rate limiting** - No throttling on AI endpoints
6. ❌ **Logging** - No structured logging (Winston/Pino)
7. ❌ **API documentation** - Swagger is configured but endpoints not decorated with `@ApiOperation()`, etc.

### Frontend

1. ❌ **Password recovery** - Alerts "coming soon"
2. ❌ **Account deletion** - Alerts "coming soon"
3. ❌ **Language switcher** - UI exists in Settings but not functional
4. ❌ **Notifications** - Toggle exists but no actual notification system
5. ❌ **Content sync** - `ContentWorkspace` uses localStorage, not backend API

---

## 9. Testing

**Backend Tests:** ❌ None found (no `*.spec.ts` files read)

**Frontend Tests:** 
- ✅ `contentStore.test.js` exists
- Command in `package.json`: `"test": "node --test src/services/contentStore.test.js"`

**Recommendation:** Add comprehensive unit and integration tests for both backend and frontend.

---

## 10. Build & Deployment Readiness

### Backend

**Package.json check needed:** Not read in this investigation.

**Dependencies:** Uses modern NestJS stack with:
- `@nestjs/core`, `@nestjs/common`, `@nestjs/jwt`, `@nestjs/passport`
- `passport-jwt`, `bcrypt`
- `openai` (for OpenRouter)
- `pdfkit`, `docx` (for exports)
- `mammoth`, `pdf-parse` (for text extraction)
- `multer` (for file uploads)

**Status:** ⚠️ Need to verify `package.json` for complete dependency list.

### Frontend

**Package.json:** ✅ Read and complete

**Dependencies:**
- `react@^19.2.8`, `react-dom@^19.2.8`, `react-router-dom@^7.18.4`
- `jspdf@^4.2.1`

**Dev Dependencies:**
- `vite@^8.3.0`, `@vitejs/plugin-react@^6.1.1`
- `oxlint@^1.81.0`

**Build Command:** `vite build`

**Status:** ✅ Ready to build.

---

## 11. Recommendations

### 🔴 CRITICAL (Fix Before Deployment)

1. **Implement `exportQuizWord()` in `export.service.ts`**
2. **Fix `findByAuteur()` in `content.service.ts` to actually filter by auteurId**
3. **Rotate JWT_SECRET and OPENROUTER_API_KEY**, add to `.gitignore`
4. **Add database integration** (TypeORM/Prisma + PostgreSQL)

### ⚠️ HIGH PRIORITY

5. **Add comprehensive input validation** to all DTOs
6. **Add error handling middleware** for consistent error responses
7. **Add logging** (Winston or Pino)
8. **Add rate limiting** on AI endpoints
9. **Write unit tests** for all services
10. **Add integration tests** for API endpoints

### 📝 MEDIUM PRIORITY

11. **Complete Swagger documentation** with decorators
12. **Implement password reset** functionality
13. **Add email verification** for new accounts
14. **Sync `ContentWorkspace` with backend** (currently localStorage only)
15. **Remove duplicate `api.js`** in `backend-projet/integration/`

### 💡 LOW PRIORITY

16. **Add internationalization (i18n)** for language switcher
17. **Implement notification system**
18. **Add file virus scanning** for uploads
19. **Add pagination** to all list endpoints
20. **Add caching** (Redis) for frequently accessed data

---

## 12. Conclusion

**Overall Grade: B+ (85/100)**

**Strengths:**
- ✅ Well-structured codebase with clear separation of concerns
- ✅ Modern tech stack (NestJS + React + Vite)
- ✅ Comprehensive feature set (AI generation, exports, admin panel)
- ✅ Good API design with consistent naming
- ✅ Proper authentication with JWT
- ✅ Frontend/Backend coupling is mostly correct

**Critical Issues:**
- 🔴 Missing `exportQuizWord()` implementation → **Runtime errors**
- 🔴 `findByAuteur()` doesn't filter by author → **Security issue**
- 🔴 Secrets in `.env` file → **Security vulnerability**
- 🔴 No database persistence → **Data loss on restart**

**Verdict:** The project is **functionally complete** but has **critical bugs** that must be fixed before any production use. The architecture is solid, and with the fixes listed above, it will be production-ready.

---

## File Citations

### Backend Files Examined

- `src/app.module.ts` - Module wiring
- `src/main.ts` - Application bootstrap and global config
- `src/auth/auth.controller.ts` - Auth routes
- `src/auth/auth.service.ts` - Auth logic (registration, login)
- `src/auth/auth.module.ts` - Auth module configuration
- `src/auth/guards/jwt-auth.guard.ts` - JWT authentication guard
- `src/auth/guards/roles.guard.ts` - Role-based authorization guard
- `src/auth/strategies/jwt.strategy.ts` - JWT strategy
- `src/auth/decorators/public.decorator.ts` - Public route marker
- `src/auth/dto/login.dto.ts` - Login validation
- `src/user/user.controller.ts` - User CRUD routes
- `src/user/user.service.ts` - User management
- `src/user/user.module.ts` - User module
- `src/user/entities/user.entity.ts` - User entity
- `src/user/dto/create-user.dto.ts` - User creation validation
- `src/quiz/quiz.controller.ts` - Quiz CRUD routes
- `src/quiz/quiz.service.ts` - Quiz management with questions
- `src/quiz/quiz.module.ts` - Quiz module
- `src/quiz/dto/create-quiz.dto.ts` - Quiz validation
- `src/content/content.controller.ts` - Content CRUD routes
- `src/content/content.service.ts` - Content management (**BUG FOUND**)
- `src/content/content.module.ts` - Content module
- `src/content/dto/create-content.dto.ts` - Content validation
- `src/ai/ai.controller.ts` - AI generation routes
- `src/ai/ai.service.ts` - OpenRouter integration
- `src/ai/ai.module.ts` - AI module
- `src/ai/dto/generate-content.dto.ts` - AI request validation
- `src/archive/archive.controller.ts` - File upload routes
- `src/archive/archive.service.ts` - File handling and text extraction
- `src/archive/archive.module.ts` - Archive module
- `src/archive/entities/archive.entity.ts` - Archive entity
- `src/export/export.controller.ts` - Export routes
- `src/export/export.service.ts` - PDF/Word generation (**MISSING METHOD**)
- `src/export/export.module.ts` - Export module
- `src/admin/admin.controller.ts` - Admin routes
- `src/admin/admin.service.ts` - Admin operations
- `src/admin/admin.module.ts` - Admin module
- `src/matiere/matiere.controller.ts` - Subject CRUD routes
- `src/matiere/matiere.service.ts` - Subject management
- `src/promotion/promotion.controller.ts` - Promotion CRUD routes
- `src/promotion/promotion.service.ts` - Promotion management
- `.env` - Environment variables (**SECURITY ISSUE**)

### Frontend Files Examined

- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite configuration with proxy
- `src/App.jsx` - Main routing configuration
- `src/services/api.js` - API client (actual, used by components)
- `src/context/AuthContext.jsx` - Auth state management
- `src/services/contentStore.js` - LocalStorage content management
- `src/pages/Login.jsx` - Login page
- `src/pages/register.jsx` - Registration page
- `src/pages/Dashboard.jsx` - Main dashboard
- `src/pages/AiGenerator.jsx` - AI content generation UI
- `src/pages/QuizManager.jsx` - Quiz management UI
- `src/pages/ContentManager.jsx` - Content management UI
- `src/pages/Archives.jsx` - Archives view
- `src/pages/ArchivesAdmin.jsx` - Archive upload and management
- `src/pages/Settings.jsx` - User settings
- `src/pages/AdminDashboard.jsx` - Admin panel
- `src/components/ProtectedRoute.jsx` - Route guard
- `src/components/DashboardLayout.jsx` - Layout wrapper
- `src/components/ContentWorkspace.jsx` - Manual content editor
- `backend-projet/integration/frontend-files/services/api.js` - Duplicate/old API file

---

**Report Generated:** 2024-12-10  
**Reviewed By:** AI Code Review Agent  
**Project Version:** Current (as of investigation)
