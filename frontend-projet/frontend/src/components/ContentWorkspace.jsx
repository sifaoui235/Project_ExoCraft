import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { defaultGroups } from "../context/AuthContext";
import useContents from "../hooks/useContents";
import { archiveContent, contentText, contentTypes, restoreContent, saveContent } from "../services/contentStore";

function displayDate(value) {
  if (!value) return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}

function ContentEditor({ content, onSave, onCancel, groups, selectedGroup }) {
  const groupDefaults = groups.length ? groups : defaultGroups();
  const initialGroup = groupDefaults.find((item) => item.className === content?.className && item.section === content?.section) || selectedGroup || groupDefaults[0];
  const [draft, setDraft] = useState(() => ({
    id: content?.id, title: content?.title || "", type: content?.type || "course",
    subject: content?.subject || "", promotion: content?.promotion || "",
    className: initialGroup?.className || "", section: initialGroup?.section || "",
    status: content?.status || "draft", body: content ? contentText(content) : "",
  }));
  const [error, setError] = useState("");
  const titleInput = useRef(null);
  useEffect(() => { titleInput.current?.focus(); }, []);
  const update = event => setDraft(current => {
    const next = { ...current, [event.target.name]: event.target.value };
    if (event.target.name === "className") {
      const firstSection = groupDefaults.find((item) => item.className === event.target.value)?.section || "";
      next.section = firstSection;
    }
    return next;
  });

  return (
    <section className="workspace-editor" aria-labelledby="editor-heading">
      <div className="workspace-section-heading">
        <div><span className="dashboard-eyebrow">CRÉATION MANUELLE</span>
          <h2 id="editor-heading">{content ? "Modifier le contenu" : "Créer un contenu"}</h2>
          <p>Rédigez ou collez votre contenu pédagogique, puis enregistrez-le.</p>
        </div>
        <button className="workspace-button secondary" type="button" onClick={onCancel}>Annuler</button>
      </div>
      <form onSubmit={event => {
        event.preventDefault();
        try { saveContent(draft); onSave(); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible."); }
      }}>
        <div className="workspace-form-grid">
          <label>Titre<input ref={titleInput} name="title" value={draft.title} onChange={update} required maxLength={180} placeholder="Ex. Introduction au Cloud Computing" /></label>
          <label>Type de contenu<select name="type" value={draft.type} onChange={update}>
            {Object.entries(contentTypes).map(([key, type]) => <option key={key} value={key}>{type.label}</option>)}
          </select></label>
          <label>Classe<select name="className" value={draft.className} onChange={update} required>{[...new Set(groupDefaults.map((item) => item.className))].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Section<select name="section" value={draft.section} onChange={update} required>{[...new Set(groupDefaults.filter((item) => item.className === draft.className).map((item) => item.section))].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Matière (facultatif)<input name="subject" value={draft.subject} onChange={update} maxLength={120} /></label>
          <label>Promotion (facultatif)<input name="promotion" value={draft.promotion} onChange={update} maxLength={120} /></label>
        </div>
        <label className="workspace-body-field">Contenu pédagogique<textarea name="body" value={draft.body} onChange={update} required rows={14} placeholder="Saisissez votre cours, vos questions ou vos consignes ici…" /></label>
        <div className="workspace-form-footer">
          <label>Statut<select name="status" value={draft.status} onChange={update}>
            <option value="draft">Brouillon</option><option value="valid">Validé</option>
          </select></label>
          <button className="workspace-button" type="submit">Enregistrer le contenu</button>
        </div>
        {error && <p className="workspace-error" role="alert">{error}</p>}
      </form>
    </section>
  );
}

export default function ContentWorkspace({ archived = false, groups = [], selectedGroup = null }) {
  const { contents, error: storageError } = useContents();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const heading = useRef(null);
  const previewHeading = useRef(null);
  useEffect(() => {
    if (panel?.mode === "view") previewHeading.current?.focus();
  }, [panel]);
  const visible = contents.filter(content => Boolean(content.archivedAt) === archived && (!selectedGroup || selectedGroup === "all" || (content.className === selectedGroup.className && content.section === selectedGroup.section)));
  const filtered = visible.filter(content =>
    (type === "all" || content.type === type) &&
    (status === "all" || content.status === status) &&
    [content.title, content.subject, content.theme, content.promotion].filter(Boolean).join(" ").toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr")));

  const closePanel = () => { setPanel(null); heading.current?.focus(); };
  const mutate = (action, message) => {
    try { action(); setNotice(message); setError(""); closePanel(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "L'opération a échoué."); }
  };

  return (
    <>
      <section className="workspace-header">
        <div>
          <span className="dashboard-eyebrow">{archived ? "CONTENUS SUPPRIMÉS" : "ESPACE ENSEIGNANT"}</span>
          <h1 ref={heading} tabIndex={-1}>{archived ? "Archives" : "Tableau de bord"}</h1>
          <p>{archived ? "Retrouvez les contenus supprimés. Restaurez-les pour les remettre dans votre tableau de bord." : "Créez, consultez et gérez tous vos contenus pédagogiques au même endroit."}</p>
        </div>
      {!archived && <button className="workspace-button" disabled={Boolean(storageError)} onClick={() => { setPanel({ mode: "edit", content: null }); setNotice(""); }}>+ Créer un contenu</button>}
      </section>

      <div className="workspace-stats" aria-label="Résumé des contenus">
        <div><span>{archived ? "Contenus archivés" : "Mes contenus"}</span><strong>{visible.length}</strong></div>
        {!archived && <>
          <div><span>Brouillons</span><strong>{visible.filter(item => item.status !== "valid").length}</strong></div>
          <div><span>Validés</span><strong>{visible.filter(item => item.status === "valid").length}</strong></div>
        </>}
      </div>

      {notice && <div className="workspace-notice" role="status">{notice}{!archived && notice.includes("archives") && <Link to="/archives">Voir les archives →</Link>}</div>}
      {(storageError || error) && <p className="workspace-error" role="alert">{storageError || error}</p>}

      {panel?.mode === "edit" && !archived && <ContentEditor key={panel.content?.id || "new"} content={panel.content} groups={groups} selectedGroup={selectedGroup === "all" ? null : selectedGroup} onCancel={closePanel} onSave={() => {
        setSearch(""); setType("all"); setStatus("all"); setNotice("Contenu enregistré dans votre tableau de bord."); setError(""); closePanel();
      }} />}

      {panel?.mode === "view" && <section className="workspace-preview" aria-labelledby="preview-heading">
        <div className="workspace-section-heading"><h2 id="preview-heading" ref={previewHeading} tabIndex={-1}>{panel.content.title}</h2><button className="workspace-button secondary" onClick={closePanel}>Fermer</button></div>
        <div className="workspace-preview-body">{contentText(panel.content) || "Aucun texte n'a encore été enregistré pour ce contenu."}</div>
      </section>}

      <section className="workspace-library" aria-labelledby="library-heading">
        <div className="workspace-section-heading"><h2 id="library-heading">{archived ? "Contenus archivés" : "Mes contenus"}</h2><span>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span></div>
        <div className="workspace-filters">
          <label>Rechercher<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Titre, matière, promotion…" /></label>
          <label>Type<select value={type} onChange={event => setType(event.target.value)}><option value="all">Tous les types</option>{Object.entries(contentTypes).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
          <label>Statut<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Tous les statuts</option><option value="draft">Brouillon</option><option value="valid">Validé</option></select></label>
        </div>
        {!filtered.length ? <div className="workspace-empty">
          <span aria-hidden="true">{archived ? "▧" : "▤"}</span>
          <h3>{visible.length ? "Aucun résultat" : archived ? "Aucun contenu archivé" : "Votre premier contenu commence ici"}</h3>
          <p>{visible.length ? "Essayez un autre titre ou réinitialisez les filtres." : archived ? "Les contenus supprimés du tableau de bord apparaîtront ici." : "Utilisez « Créer un contenu » pour rédiger votre premier support pédagogique."}</p>
          {visible.length > 0 && <button className="workspace-button secondary" onClick={() => { setSearch(""); setType("all"); setStatus("all"); }}>Réinitialiser les filtres</button>}
        </div> : <div className="workspace-cards">
          {filtered.map(content => <article className="workspace-card" key={content.id}>
            <div className="workspace-card-top"><span>{contentTypes[content.type]?.icon || "📄"} {contentTypes[content.type]?.label || "Contenu"}</span><span className={`workspace-badge ${content.status === "valid" ? "valid" : ""}`}>{content.status === "valid" ? "Validé" : "Brouillon"}</span></div>
            <h3>{content.title}</h3>
            <p>{content.className || "Classe non renseignée"} · {content.section || "Section non renseignée"}</p>
            <p>{content.subject || content.theme || "Sans matière"}</p>
            {content.promotion && <p>{content.promotion}</p>}
            <small>{archived ? "Archivé le " : "Créé le "}{displayDate(archived ? content.archivedAt : content.createdAt)}</small>
            <div className="workspace-card-actions">
              <button onClick={() => setPanel({ mode: "view", content })} aria-label={`Consulter ${content.title}`}>Consulter</button>
              {archived ? <button className="restore" onClick={() => mutate(() => restoreContent(content.id), "Contenu restauré dans votre tableau de bord.")} aria-label={`Restaurer ${content.title}`}>Restaurer</button> : <>
                <button onClick={() => setPanel({ mode: "edit", content })} aria-label={`Modifier ${content.title}`}>Modifier</button>
                <button className="delete" onClick={() => mutate(() => archiveContent(content.id), "Contenu déplacé dans les archives. Vous pouvez le restaurer à tout moment.")} aria-label={`Supprimer ${content.title}`}>Supprimer</button>
              </>}
            </div>
          </article>)}
        </div>}
      </section>
    </>
  );
}
