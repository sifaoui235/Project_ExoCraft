import { createContext, useContext, useState } from "react";
import { authApi, removeToken, setToken } from "../services/api";

const AuthContext = createContext();

export const CLASS_OPTIONS = [
  "1ère ingénieur",
  "2ème ingénieur",
  "3ème ingénieur",
  "4ème ingénieur",
  "5ème ingénieur",
];
export const SECTION_OPTIONS = ["Cloud", "Data Science", "Cyber Security", "Génie logiciel"];
export const COMMON_SECTION = "Tronc commun";

export function buildAssociations(classes = CLASS_OPTIONS, sections = SECTION_OPTIONS) {
  return classes.flatMap((className) =>
    CLASS_OPTIONS.indexOf(className) < 3
      ? [{ className, section: COMMON_SECTION }]
      : sections.map((section) => ({ className, section }))
  );
}

export function defaultGroups() {
  return buildAssociations();
}

function normalizeAssociations(associations) {
  if (!Array.isArray(associations)) return [];
  return associations
    .filter((item) => item?.className && item?.section)
    .map((item) => ({ className: String(item.className), section: String(item.section) }));
}

export function AuthProvider({ children }) {
  // Restaurer l'utilisateur depuis localStorage au démarrage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("exocraft_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, associations: normalizeAssociations(parsed.associations) };
      }
    } catch {
      localStorage.removeItem("exocraft_user");
    }
    return null;
  });

  // ── Login via backend ──────────────────────────────
  const login = async (emailOrData, password) => {
    // Accepte login({ email, password }) ou login(email, password)
    const credentials =
      typeof emailOrData === "object"
        ? emailOrData
        : { email: emailOrData, password };

    const data = await authApi.login(credentials);
    // data = { access_token, user: { id, firstName, lastName, email, role, associations } }

    const nextUser = {
      ...data.user,
      associations: normalizeAssociations(data.user.associations),
    };
    setUser(nextUser);
    localStorage.setItem("exocraft_user", JSON.stringify(nextUser));
    return nextUser;
  };

  // ── Register via backend ───────────────────────────
  const register = async ({ firstName, lastName, email, password, associations }) => {
    const data = await authApi.register({ firstName, lastName, email, password, associations });

    const nextUser = {
      ...data.user,
      associations: normalizeAssociations(data.user.associations),
    };
    setUser(nextUser);
    localStorage.setItem("exocraft_user", JSON.stringify(nextUser));
    return nextUser;
  };

  // ── Mise à jour profil local (sans appel backend) ──
  const updateUser = (updates) => {
    const nextUser = {
      ...(user || {}),
      ...updates,
      associations: normalizeAssociations(updates.associations ?? user?.associations),
    };
    setUser(nextUser);
    localStorage.setItem("exocraft_user", JSON.stringify(nextUser));
  };

  // ── Logout ─────────────────────────────────────────
  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
