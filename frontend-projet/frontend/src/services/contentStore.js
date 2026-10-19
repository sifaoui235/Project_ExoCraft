export const CONTENTS_KEY = "exocraft_contents";
export const CONTENTS_CHANGED = "exocraft:contents-changed";

export const contentTypes = {
  course: { label: "Cours", icon: "📘" },
  summary: { label: "Résumé", icon: "📄" },
  exercises: { label: "Série d'exercices", icon: "✎" },
  quiz: { label: "Quiz", icon: "☑" },
  exam: { label: "Examen", icon: "📋" },
};

export function parseContents(raw) {
  if (raw === null) return [];
  const contents = JSON.parse(raw);
  if (!Array.isArray(contents) || contents.some(item => !item || typeof item !== "object" || item.id == null)) {
    throw new Error("Les contenus enregistrés sont illisibles. Aucune donnée n'a été modifiée.");
  }
  return contents;
}

export function readContents(storage = localStorage) {
  return parseContents(storage.getItem(CONTENTS_KEY));
}

function commit(change, storage) {
  // Read the latest list for each operation; active and archived items share one atomic write.
  const next = change(readContents(storage));
  storage.setItem(CONTENTS_KEY, JSON.stringify(next));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONTENTS_CHANGED));
  return next;
}

export function saveContent(draft, storage = localStorage) {
  if (!draft.title?.trim() || !draft.body?.trim() || !contentTypes[draft.type] || !draft.className?.trim() || !draft.section?.trim()) {
    throw new Error("Renseignez le titre, le type, la classe et la section du contenu.");
  }
  return commit(contents => {
    const now = new Date().toISOString();
    const fields = {
      title: draft.title.trim(), type: draft.type, body: draft.body.trim(),
      subject: draft.subject?.trim() || "", promotion: draft.promotion?.trim() || "",
      className: draft.className.trim(), section: draft.section.trim(),
      status: draft.status === "valid" ? "valid" : "draft", updatedAt: now,
    };
    if (draft.id != null) {
      const current = contents.find(item => String(item.id) === String(draft.id));
      if (!current || current.archivedAt) throw new Error("Ce contenu a été supprimé ou archivé. Revenez à la liste.");
      return contents.map(item => item === current ? { ...item, ...fields } : item);
    }
    return [{ ...fields, id: crypto.randomUUID(), createdAt: now, visibility: "private" }, ...contents];
  }, storage);
}

function changeArchive(id, archive, storage) {
  return commit(contents => {
    const current = contents.find(item => String(item.id) === String(id));
    if (!current) throw new Error("Ce contenu n'existe plus.");
    return contents.map(item => {
      if (item !== current) return item;
      if (archive) return { ...item, archivedAt: item.archivedAt || new Date().toISOString() };
      const restored = { ...item };
      delete restored.archivedAt;
      return restored;
    });
  }, storage);
}

export function archiveContent(id, storage = localStorage) {
  return changeArchive(id, true, storage);
}

export function restoreContent(id, storage = localStorage) {
  return changeArchive(id, false, storage);
}

// Existing structured contents remain intact in storage and can be read in the manual editor.
export function contentText(content) {
  if (typeof content.body === "string") return content.body;
  const render = item => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    const options = Array.isArray(item.options)
      ? item.options.map((option, index) => `${index + 1}. ${typeof option === "string" ? option : option.text || ""}`).join("\n") : "";
    const answer = Number.isInteger(item.answer) && item.options?.[item.answer]
      ? `Bonne réponse : ${item.options[item.answer]}` : "";
    return [item.title, item.question, item.content, item.statement, item.description,
      options, answer, item.explanation, ...(item.questions || []).map(render)]
      .filter(value => typeof value === "string" && value).join("\n\n");
  };
  const blocks = content.sections || content.questions || content.exercises;
  return Array.isArray(blocks) ? blocks.map(render).join("\n\n") : render(content);
}
