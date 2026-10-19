import { useMemo, useSyncExternalStore } from "react";
import { CONTENTS_CHANGED, CONTENTS_KEY, parseContents } from "../services/contentStore";

function subscribe(callback) {
  const onStorage = event => {
    if (event.key === CONTENTS_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CONTENTS_CHANGED, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CONTENTS_CHANGED, callback);
  };
}

function snapshot() {
  try { return localStorage.getItem(CONTENTS_KEY); }
  catch { return "unavailable"; }
}

export default function useContents() {
  const raw = useSyncExternalStore(subscribe, snapshot);
  return useMemo(() => {
    try { return { contents: parseContents(raw), error: "" }; }
    catch { return { contents: [], error: "Impossible de lire vos contenus enregistrés. Aucune donnée n'a été modifiée. Vérifiez que le stockage du navigateur est disponible." }; }
  }, [raw]);
}
