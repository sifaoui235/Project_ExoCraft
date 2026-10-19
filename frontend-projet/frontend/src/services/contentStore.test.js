import test from "node:test";
import assert from "node:assert/strict";
import { CONTENTS_KEY, archiveContent, contentText, readContents, restoreContent, saveContent } from "./contentStore.js";

function memoryStorage(initial = null) {
  let raw = initial;
  return { getItem: () => raw, setItem: (key, value) => { assert.equal(key, CONTENTS_KEY); raw = value; } };
}

test("create, edit, archive and restore preserve a single record and its content", () => {
  const storage = memoryStorage();
  saveContent({ title: " Cours de test ", type: "course", body: "Texte conservé", subject: "Réseaux", className: "4ème ingénieur", section: "Cloud" }, storage);
  const original = readContents(storage)[0];
  assert.equal(original.title, "Cours de test");
  assert.equal(original.archivedAt, undefined);
  saveContent({ ...original, body: "Texte modifié", status: "valid" }, storage);
  archiveContent(original.id, storage);
  const archived = readContents(storage)[0];
  assert.ok(archived.archivedAt);
  assert.equal(archived.body, "Texte modifié");
  assert.equal(archived.createdAt, original.createdAt);
  assert.throws(() => saveContent({ ...archived, body: "stale editor" }, storage), /archivé/);
  restoreContent(original.id, storage);
  const restored = readContents(storage);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].archivedAt, undefined);
  assert.equal(restored[0].body, "Texte modifié");
  assert.equal(restored[0].status, "valid");
});

test("legacy numeric IDs and structured payloads survive archive and restore", () => {
  const content = { id: 7, type: "course", title: "Ancien cours", sections: [{ title: "Chapitre", content: "Texte", file: { name: "annexe.pdf" } }], createdAt: "04/10/2026", visibility: "private" };
  const storage = memoryStorage(JSON.stringify([content]));
  archiveContent("7", storage);
  restoreContent(7, storage);
  assert.deepEqual(readContents(storage), [content]);
  assert.match(contentText(content), /Chapitre\n\nTexte/);
});

test("writes reread the latest list and do not drop unrelated contents", () => {
  const storage = memoryStorage(JSON.stringify([{ id: "a", title: "A" }]));
  const other = { id: "b", title: "B", questions: [{ question: "Question", options: ["Oui", "Non"], answer: 0 }] };
  storage.setItem(CONTENTS_KEY, JSON.stringify([...readContents(storage), other]));
  archiveContent("a", storage);
  assert.deepEqual(readContents(storage)[1], other);
  assert.match(contentText(other), /Bonne réponse : Oui/);
});

test("empty storage stays empty; invalid storage is never overwritten", () => {
  assert.deepEqual(readContents(memoryStorage()), []);
  for (const raw of ["not json", "{}", "[null]"]) {
    const storage = memoryStorage(raw);
    assert.throws(() => saveContent({ title: "X", type: "course", body: "Y" }, storage));
    assert.equal(storage.getItem(CONTENTS_KEY), raw);
  }
});

test("storage failure and invalid drafts cannot silently delete data", () => {
  const storage = memoryStorage(JSON.stringify([{ id: "a", title: "A" }]));
  const original = storage.getItem(CONTENTS_KEY);
  assert.throws(() => saveContent({ title: " ", type: "course", body: "x" }, storage));
  assert.equal(storage.getItem(CONTENTS_KEY), original);
  storage.setItem = () => { throw new Error("Quota exceeded"); };
  assert.throws(() => archiveContent("a", storage), /Quota/);
  assert.equal(storage.getItem(CONTENTS_KEY), original);
});
