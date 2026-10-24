import { useCallback, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase.ts';
import { requestJson } from '../lib/auth-client.ts';

type LessonType = 'video' | 'text' | 'quiz' | 'project' | 'exercise';
type Chapter = { id: string; course_id: string; version_id: string; position: number; title: string; description: string };
type Lesson = {
  id: string; chapter_id: string; course_id: string; position: number; title: string;
  lesson_type: LessonType; duration_minutes: number; summary: string;
  is_free_preview: boolean; preview_requires_login: boolean; published: boolean;
};
type Course = {
  id: string; code: string; title: string; current_version_id: string | null; draft_version_id: string | null;
  status: string; short_description: string; description: string; learning_outcomes: string[];
  level: string; estimated_minutes: number; cover_image_url: string | null; content_source: string | null;
  reviewed_at: string | null; rights_verified_at: string | null;
};
type Content = { lesson_id: string; body_md: string | null; video_storage_path: string | null; project_instructions: string | null };
type QuizQuestion = { id: string; lesson_id: string; position: number; prompt_md: string; options: unknown; quiz_answer_keys?: { correct_option_ids: unknown; explanation_md: string | null }[] };

const lessonTypes: { value: LessonType; label: string }[] = [
  { value: 'video', label: 'Vidéo' }, { value: 'text', label: 'Texte' },
  { value: 'quiz', label: 'Quiz' }, { value: 'project', label: 'Projet' }, { value: 'exercise', label: 'Exercice' },
];
const fieldClass = 'w-full rounded-lg border border-[#343a46] bg-[#10141d] px-3 py-2 text-sm text-white outline-none focus:border-[#8083ff]';
const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
const starterQuiz = [{ prompt_md: 'Votre question', options: [{ id: 'a', label: 'Réponse A' }, { id: 'b', label: 'Réponse B' }], correct_option_ids: ['a'], explanation_md: '' }];

export function CourseCurriculumEditor({ course, onClose }: { course: Course; onClose: () => void }) {
  const [draftVersionId, setDraftVersionId] = useState(course.draft_version_id || (course.status !== 'published' ? course.current_version_id : null));
  const [metadata, setMetadata] = useState({
    short_description: course.short_description || '', description: course.description || '',
    learning_outcomes: (course.learning_outcomes || []).join('\n'), level: course.level || 'beginner',
    estimated_minutes: course.estimated_minutes || 0, cover_image_url: course.cover_image_url || '',
    content_source: course.content_source || '', reviewed: Boolean(course.reviewed_at), rights_verified: Boolean(course.rights_verified_at),
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [contents, setContents] = useState<Record<string, Content>>({});
  const [quizQuestions, setQuizQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [draft, setDraft] = useState<Partial<Lesson>>({});
  const [bodyMd, setBodyMd] = useState('');
  const [projectInstructions, setProjectInstructions] = useState('');
  const [videoPath, setVideoPath] = useState('');
  const [quizJson, setQuizJson] = useState(JSON.stringify(starterQuiz, null, 2));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ courseId: course.id, versionId: draftVersionId || '' });
      const result = await requestJson<{ chapters: Chapter[]; lessons: Lesson[]; contents: Content[]; quizQuestions: QuizQuestion[] }>(`/api/admin/curriculum?${params}`);
      const nextChapters = result.chapters;
      const chapterIds = new Set(nextChapters.map((chapter) => chapter.id));
      const nextLessons = result.lessons.filter((lesson) => chapterIds.has(lesson.chapter_id));
      setChapters(nextChapters);
      setLessons(nextLessons);
      if (!selectedChapterId || !nextChapters.some((chapter) => chapter.id === selectedChapterId)) setSelectedChapterId(nextChapters[0]?.id || '');
      setContents(Object.fromEntries(result.contents.map((row) => [row.lesson_id, row])));
      const questionsByLesson: Record<string, QuizQuestion[]> = {};
      for (const row of result.quizQuestions) (questionsByLesson[row.lesson_id] ||= []).push(row);
      setQuizQuestions(questionsByLesson);
    } catch (loadError) {
      setError(`Impossible de charger le programme : ${loadError instanceof Error ? loadError.message : 'erreur inconnue'}`);
    } finally { setLoading(false); }
  }, [course.id, draftVersionId]);

  useEffect(() => { void load(); }, [load]);

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || null;
  const chapterLessons = useMemo(() => lessons.filter((lesson) => lesson.chapter_id === selectedChapterId), [lessons, selectedChapterId]);

  useEffect(() => {
    if (!selectedLesson) { setDraft({}); return; }
    const content = contents[selectedLesson.id];
    setDraft({ ...selectedLesson });
    setBodyMd(content?.body_md || '');
    setProjectInstructions(content?.project_instructions || '');
    setVideoPath(content?.video_storage_path || '');
    const questions = quizQuestions[selectedLesson.id] || [];
    setQuizJson(questions.length ? JSON.stringify(questions.map((question) => ({
      prompt_md: question.prompt_md,
      options: question.options,
      correct_option_ids: question.quiz_answer_keys?.[0]?.correct_option_ids || [],
      explanation_md: question.quiz_answer_keys?.[0]?.explanation_md || '',
    })), null, 2) : JSON.stringify(starterQuiz, null, 2));
  }, [selectedLessonId, contents, quizQuestions]);

  const createWorkingVersion = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await requestJson<{ versionId: string }>('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'forkVersion', courseId: course.id }) });
      setDraftVersionId(result.versionId); setSelectedChapterId(''); setSelectedLessonId(''); setNotice('Version de travail cr??e. Les changements ne touchent pas encore la version publi?e.');
    } catch (reason) { setError(`Impossible de cr?er la version de travail : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
    setSaving(false);
  };

  const saveMetadata = async () => {
    const outcomes = metadata.learning_outcomes.split('\n').map((item) => item.trim()).filter(Boolean);
    if (outcomes.length === 0) { setError('Ajoute au moins un objectif p?dagogique.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      await requestJson('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'saveMetadata', courseId: course.id, metadata: { ...metadata, learning_outcomes: outcomes } }) });
      setNotice('M?tadonn?es ?ditoriales enregistr?es.');
    } catch (reason) { setError(`M?tadonn?es non enregistr?es : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
    setSaving(false);
  };

  const publishCourse = async () => {
    if (!window.confirm('Publier cette version ? Les le?ons publi?es et gratuites serviront d?aper?u.')) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await requestJson('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'publishCourse', courseId: course.id }) });
      setDraftVersionId(null); setNotice('Formation publi?e. Le lecteur peut maintenant la proposer aux apprenants.');
    } catch (reason) { setError(`Publication refus?e : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
    setSaving(false);
  };

  const addChapter = async () => {
    if (!draftVersionId || !newChapterTitle.trim()) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await requestJson<{ chapter: Chapter }>('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'addChapter', courseId: course.id, versionId: draftVersionId, title: newChapterTitle.trim() }) });
      setNewChapterTitle(''); setNotice('Chapitre cr??.'); setChapters((current) => [...current, result.chapter]); setSelectedChapterId(result.chapter.id); setSelectedLessonId('');
    } catch (reason) { setError(`Le chapitre n?a pas ?t? cr?? : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
    setSaving(false);
  };

  const saveChapter = async (chapter: Chapter) => {
    setSaving(true); setError(''); setNotice('');
    try {
      await requestJson('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'saveChapter', courseId: course.id, chapterId: chapter.id, title: chapter.title, description: chapter.description }) });
      setNotice('Chapitre enregistr?.');
    } catch (reason) { setError(`Chapitre non enregistr? : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
    setSaving(false);
  };

  const deleteChapter = async (chapter: Chapter) => {
    if (!window.confirm(`Supprimer ? ${chapter.title} ? et toutes ses le?ons ?`)) return;
    try {
      await requestJson('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'deleteChapter', courseId: course.id, chapterId: chapter.id }) });
      setSelectedLessonId(''); setNotice('Chapitre supprim?.'); await load();
    } catch (reason) { setError(`Chapitre non supprim? : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
  };

  const movePosition = async (items: { id: string; position: number }[], index: number, direction: -1 | 1, table: 'course_chapters' | 'course_lessons') => {
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= items.length) return;
    const current = items[index]; const other = items[otherIndex]; const temp = items.length + 100;
    const moves = [{ id: current.id, position: temp }, { id: other.id, position: current.position }, { id: current.id, position: other.position }];
    setSaving(true); setError('');
    try {
      await requestJson('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'movePosition', courseId: course.id, table: table === 'course_chapters' ? 'chapters' : 'lessons', moves }) });
    } catch (reason) { setError(`Impossible de changer l?ordre : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
    await load(); setSaving(false);
  };

  const addLesson = async () => {
    if (!selectedChapterId) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await requestJson<{ lesson: Lesson }>('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'addLesson', courseId: course.id, versionId: draftVersionId, chapterId: selectedChapterId }) });
      setLessons((current) => [...current, result.lesson]); setSelectedLessonId(result.lesson.id); setNotice('Le?on cr??e. Compl?te son contenu puis enregistre-la.');
    } catch (reason) { setError(`Le?on non cr??e : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
    setSaving(false);
  };

  const uploadVideo = async (file?: File) => {
    if (!file || !selectedLesson) return;
    if (!file.type.startsWith('video/')) { setError('Choisis un fichier vid?o.'); return; }
    if (!isSupabaseConfigured || !supabase) { setError('Le stockage vidéo n’est pas configuré.'); return; }
    setUploading(true); setError(''); setNotice('');
    try {
      const { path, token } = await requestJson<{ path: string; token: string }>('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'uploadVideo', courseId: course.id, versionId: draftVersionId, lessonId: selectedLesson.id, fileName: file.name }) });
      const { error: uploadError } = await supabase.storage.from('course-content').uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      setVideoPath(path); setNotice('Vidéo envoyée dans le stockage privé. Enregistre la leçon pour l’associer.');
    } catch (reason) { setError(`Vidéo non envoyée : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
    setUploading(false);
  };

  const parseQuiz = () => {
    let quiz: { prompt_md: string; options: unknown; correct_option_ids: unknown; explanation_md?: string }[];
    try {
      quiz = JSON.parse(quizJson);
      if (!Array.isArray(quiz) || quiz.some((question) => typeof question.prompt_md !== 'string' || !Array.isArray(question.options) || question.options.length < 2 || !Array.isArray(question.correct_option_ids))) throw new Error();
    } catch { throw new Error('Le quiz doit ?tre un tableau JSON de questions avec prompt_md, options (au moins deux choix) et correct_option_ids.'); }
    return quiz;
  };

  const saveLesson = async () => {
    if (!selectedLesson || !draft.title?.trim()) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const quiz = draft.lesson_type === 'quiz' ? parseQuiz() : undefined;
      await requestJson('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({
        action: 'saveLesson', courseId: course.id, versionId: draftVersionId, lessonId: selectedLesson.id,
        lesson: { title: draft.title.trim(), lesson_type: draft.lesson_type, duration_minutes: Math.max(0, Number(draft.duration_minutes) || 0), summary: draft.summary || '', is_free_preview: Boolean(draft.is_free_preview), preview_requires_login: Boolean(draft.preview_requires_login), published: Boolean(draft.published) },
        bodyMd, videoPath, projectInstructions, quiz,
      }) });
      setNotice('Leçon et contenu enregistrés.');
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Leçon non enregistrée.'); }
    setSaving(false);
  };

  const deleteLesson = async (lesson: Lesson) => {
    if (!window.confirm(`Supprimer la leçon "${lesson.title}" ?`)) return;
    try {
      await requestJson('/api/admin/curriculum', { method: 'POST', body: JSON.stringify({ action: 'deleteLesson', courseId: course.id, lessonId: lesson.id, versionId: draftVersionId }) });
      setSelectedLessonId(''); setNotice('Leçon supprimée.'); await load();
    } catch (reason) { setError(`Leçon non supprimée : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 text-[#dfe2ee]">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#262a33] pb-5">
        <div><button type="button" onClick={onClose} className="mb-3 inline-flex items-center gap-2 text-sm text-[#4cd7f6] hover:text-white"><span className="material-symbols-outlined text-base">arrow_back</span>Retour aux formations</button><p className="font-mono text-xs text-[#4cd7f6]">{course.code}</p><h1 className="mt-1 text-2xl font-bold text-white">Programme · {course.title}</h1><p className="mt-2 text-sm text-[#a9afbf]">Version de travail. Les modifications restent en brouillon jusqu’à publication.</p></div>
        <span className="rounded-lg border border-[#31353e] bg-[#181c24] px-3 py-2 text-xs text-[#c0c1ff]">{chapters.length} chapitres · {lessons.length} leçons</span>
      </header>
      {error && <div role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
      {!draftVersionId ? <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 p-4"><p className="text-sm text-amber-100">Cette formation est publiée. Crée une version de travail pour modifier son programme sans changer la version visible aux apprenants.</p><button type="button" disabled={saving} onClick={() => void createWorkingVersion()} className={`${buttonClass} bg-[#8083ff] text-[#0d1020]`}>Créer une version de travail</button></section> : <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#5557a8] bg-[#8083ff]/5 p-4"><p className="text-sm text-[#c0c1ff]">Version de travail active · la version publiée reste inchangée.</p><button type="button" disabled={saving || loading} onClick={() => void publishCourse()} className={`${buttonClass} bg-emerald-400 text-[#0d1020]`}>Publier la version</button></div>}
      <section className="space-y-4 rounded-xl border border-[#262a33] bg-[#181c24] p-4">
        <div><h2 className="font-semibold text-white">Fiche éditoriale et publication</h2><p className="mt-1 text-xs text-[#8f96a6]">La publication exige une offre tarifée, une couverture, les droits vérifiés, des objectifs et au moins une leçon gratuite publiée.</p></div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs text-[#a9afbf]">Niveau<select className={fieldClass} value={metadata.level} onChange={(event) => setMetadata((current) => ({ ...current, level: event.target.value }))}><option value="beginner">Débutant</option><option value="intermediate">Intermédiaire</option><option value="advanced">Avancé</option><option value="all_levels">Tous niveaux</option></select></label>
          <label className="space-y-1 text-xs text-[#a9afbf]">Durée estimée (minutes)<input className={fieldClass} type="number" min="1" value={metadata.estimated_minutes} onChange={(event) => setMetadata((current) => ({ ...current, estimated_minutes: Number(event.target.value) }))} /></label>
          <label className="space-y-1 text-xs text-[#a9afbf] md:col-span-2">Description courte<input className={fieldClass} value={metadata.short_description} onChange={(event) => setMetadata((current) => ({ ...current, short_description: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-[#a9afbf] md:col-span-2">Description complète<textarea className={fieldClass} rows={3} value={metadata.description} onChange={(event) => setMetadata((current) => ({ ...current, description: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-[#a9afbf] md:col-span-2">Objectifs pédagogiques (un par ligne)<textarea className={fieldClass} rows={3} value={metadata.learning_outcomes} onChange={(event) => setMetadata((current) => ({ ...current, learning_outcomes: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-[#a9afbf] md:col-span-2">URL de couverture<input className={fieldClass} type="url" value={metadata.cover_image_url} onChange={(event) => setMetadata((current) => ({ ...current, cover_image_url: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-[#a9afbf] md:col-span-2">Origine du contenu / licence<select className={fieldClass} value={metadata.content_source} onChange={(event) => setMetadata((current) => ({ ...current, content_source: event.target.value }))}><option value="">À préciser</option><option value="original">Contenu original</option><option value="licensed">Contenu sous licence</option><option value="open_license">Licence libre</option></select></label>
        </div>
        <div className="flex flex-wrap gap-5 text-xs text-[#c7c4d7]"><label className="flex items-center gap-2"><input type="checkbox" checked={metadata.reviewed} onChange={(event) => setMetadata((current) => ({ ...current, reviewed: event.target.checked }))} className="accent-[#8083ff]" />Contenu relu</label><label className="flex items-center gap-2"><input type="checkbox" checked={metadata.rights_verified} onChange={(event) => setMetadata((current) => ({ ...current, rights_verified: event.target.checked }))} className="accent-[#8083ff]" />Droits de distribution vérifiés</label><button type="button" disabled={saving} onClick={() => void saveMetadata()} className={`${buttonClass} bg-[#262a33]`}>Enregistrer la fiche</button></div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
        <section className="space-y-4 rounded-xl border border-[#262a33] bg-[#181c24] p-4">
          <h2 className="font-semibold text-white">Chapitres</h2>
          <div className="flex gap-2"><input className={fieldClass} value={newChapterTitle} onChange={(event) => setNewChapterTitle(event.target.value)} placeholder="Titre du nouveau chapitre" aria-label="Titre du nouveau chapitre" /><button type="button" onClick={() => void addChapter()} disabled={saving || !newChapterTitle.trim() || !course.current_version_id} className={`${buttonClass} bg-[#8083ff] text-[#0d1020]`} aria-label="Ajouter un chapitre"><span className="material-symbols-outlined">add</span></button></div>
          {!course.current_version_id && <p className="text-xs text-amber-200">Cette formation n’a pas de version de travail.</p>}
          {loading ? <p className="text-sm text-[#a9afbf]">Chargement du programme…</p> : chapters.length === 0 ? <p className="rounded-lg border border-dashed border-[#343a46] p-4 text-sm text-[#8f96a6]">Aucun chapitre. Ajoute le premier chapitre pour commencer le programme.</p> : <div className="space-y-3">{chapters.map((chapter, index) => <article key={chapter.id} className={`rounded-lg border p-3 ${selectedChapterId === chapter.id ? 'border-[#8083ff]/60 bg-[#8083ff]/5' : 'border-[#31353e] bg-[#10141d]'}`}>
            <button type="button" onClick={() => { setSelectedChapterId(chapter.id); setSelectedLessonId(''); }} className="w-full text-left"><span className="text-[11px] uppercase tracking-wide text-[#8f96a6]">Chapitre {chapter.position}</span><span className="mt-1 block font-semibold text-white">{chapter.title}</span><span className="mt-1 block text-xs text-[#8f96a6]">{lessons.filter((lesson) => lesson.chapter_id === chapter.id).length} leçons</span></button>
            {selectedChapterId === chapter.id && <div className="mt-3 space-y-2 border-t border-[#31353e] pt-3"><label className="block space-y-1 text-xs text-[#a9afbf]">Titre<input className={fieldClass} value={chapter.title} onChange={(event) => setChapters((current) => current.map((item) => item.id === chapter.id ? { ...item, title: event.target.value } : item))} /></label><label className="block space-y-1 text-xs text-[#a9afbf]">Description<textarea className={fieldClass} rows={2} value={chapter.description} onChange={(event) => setChapters((current) => current.map((item) => item.id === chapter.id ? { ...item, description: event.target.value } : item))} /></label><div className="flex flex-wrap gap-2"><button type="button" disabled={saving || index === 0} onClick={() => void movePosition(chapters, index, -1, 'course_chapters')} className={`${buttonClass} bg-[#262a33]`} aria-label="Monter le chapitre">↑</button><button type="button" disabled={saving || index === chapters.length - 1} onClick={() => void movePosition(chapters, index, 1, 'course_chapters')} className={`${buttonClass} bg-[#262a33]`} aria-label="Descendre le chapitre">↓</button><button type="button" disabled={saving} onClick={() => void saveChapter(chapter)} className={`${buttonClass} bg-[#262a33]`}>Enregistrer</button><button type="button" disabled={saving} onClick={() => void deleteChapter(chapter)} className={`${buttonClass} bg-red-400/10 text-red-200`}>Supprimer</button></div></div>}
          </article>)}</div>}
        </section>

        <section className="min-w-0 space-y-4 rounded-xl border border-[#262a33] bg-[#181c24] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-white">Leçons</h2><p className="mt-1 text-xs text-[#8f96a6]">{chapters.find((chapter) => chapter.id === selectedChapterId)?.title || 'Sélectionne un chapitre'}</p></div><button type="button" onClick={() => void addLesson()} disabled={saving || !selectedChapterId} className={`${buttonClass} bg-[#8083ff] text-[#0d1020]`}><span className="material-symbols-outlined text-base">add</span>Ajouter une leçon</button></div>
          {!selectedChapterId ? <p className="rounded-lg border border-dashed border-[#343a46] p-6 text-sm text-[#8f96a6]">Crée ou sélectionne un chapitre.</p> : <div className="grid gap-4 lg:grid-cols-[minmax(190px,0.7fr)_minmax(0,1.3fr)]">
            <div className="space-y-2">{chapterLessons.map((lesson, index) => <div key={lesson.id} className={`flex items-center gap-1 rounded-lg border p-2 ${selectedLessonId === lesson.id ? 'border-[#8083ff]/60 bg-[#8083ff]/5' : 'border-[#31353e] bg-[#10141d]'}`}><button type="button" onClick={() => setSelectedLessonId(lesson.id)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium text-white">{lesson.position}. {lesson.title}</span><span className="text-[11px] text-[#8f96a6]">{lessonTypes.find((type) => type.value === lesson.lesson_type)?.label || lesson.lesson_type} · {lesson.duration_minutes} min</span></button><button type="button" disabled={saving || index === 0} onClick={() => void movePosition(chapterLessons, index, -1, 'course_lessons')} className="rounded p-1 text-[#a9afbf] hover:bg-[#262a33] disabled:opacity-30" aria-label="Monter la leçon">↑</button><button type="button" disabled={saving || index === chapterLessons.length - 1} onClick={() => void movePosition(chapterLessons, index, 1, 'course_lessons')} className="rounded p-1 text-[#a9afbf] hover:bg-[#262a33] disabled:opacity-30" aria-label="Descendre la leçon">↓</button></div>)}{chapterLessons.length === 0 && <p className="rounded-lg border border-dashed border-[#343a46] p-4 text-xs text-[#8f96a6]">Aucune leçon dans ce chapitre.</p>}</div>
            {selectedLesson ? <div className="min-w-0 space-y-4 rounded-lg border border-[#31353e] bg-[#10141d] p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-white">Modifier la leçon</h3><button type="button" onClick={() => void deleteLesson(selectedLesson)} className="text-xs text-red-300 hover:text-red-200">Supprimer</button></div>
              <label className="block space-y-1 text-xs text-[#a9afbf]">Titre<input className={fieldClass} value={draft.title || ''} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
              <div className="grid gap-3 sm:grid-cols-2"><label className="block space-y-1 text-xs text-[#a9afbf]">Type<select className={fieldClass} value={draft.lesson_type || 'video'} onChange={(event) => setDraft((current) => ({ ...current, lesson_type: event.target.value as LessonType }))}>{lessonTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label><label className="block space-y-1 text-xs text-[#a9afbf]">Durée (minutes)<input className={fieldClass} type="number" min="0" value={draft.duration_minutes ?? 0} onChange={(event) => setDraft((current) => ({ ...current, duration_minutes: Number(event.target.value) }))} /></label></div>
              <label className="block space-y-1 text-xs text-[#a9afbf]">Résumé<textarea className={fieldClass} rows={2} value={draft.summary || ''} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} /></label>
              {(draft.lesson_type === 'text' || draft.lesson_type === 'project' || draft.lesson_type === 'exercise') && <label className="block space-y-1 text-xs text-[#a9afbf]">Contenu texte / consignes<textarea className={fieldClass} rows={7} value={bodyMd} onChange={(event) => setBodyMd(event.target.value)} placeholder="Tu peux saisir du Markdown." /></label>}
              {draft.lesson_type === 'project' && <label className="block space-y-1 text-xs text-[#a9afbf]">Instructions du projet<textarea className={fieldClass} rows={4} value={projectInstructions} onChange={(event) => setProjectInstructions(event.target.value)} /></label>}
              {draft.lesson_type === 'video' && <div className="space-y-2"><label className="block space-y-1 text-xs text-[#a9afbf]">Fichier vidéo privé<input type="file" accept="video/*" disabled={uploading} onChange={(event) => void uploadVideo(event.target.files?.[0])} className="block w-full text-xs text-[#a9afbf] file:mr-3 file:rounded-lg file:border-0 file:bg-[#262a33] file:px-3 file:py-2 file:text-white" /></label><label className="block space-y-1 text-xs text-[#a9afbf]">Chemin Storage<input className={fieldClass} value={videoPath} onChange={(event) => setVideoPath(event.target.value)} placeholder="courses/.../video.mp4" /></label>{uploading && <p role="status" className="text-xs text-[#4cd7f6]">Envoi de la vidéo…</p>}</div>}
              {draft.lesson_type === 'quiz' && <label className="block space-y-1 text-xs text-[#a9afbf]">Questions du quiz (JSON)<textarea className={`${fieldClass} font-mono text-xs`} rows={12} value={quizJson} onChange={(event) => setQuizJson(event.target.value)} /><span className="block leading-5">Chaque question contient <code>prompt_md</code>, <code>options</code> (au moins deux choix), <code>correct_option_ids</code> et <code>explanation_md</code>. Les bonnes réponses restent privées.</span></label>}
              <div className="flex flex-wrap gap-4 border-t border-[#262a33] pt-3 text-xs text-[#c7c4d7]"><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.is_free_preview)} onChange={(event) => setDraft((current) => ({ ...current, is_free_preview: event.target.checked }))} className="accent-[#8083ff]" />Leçon gratuite en aperçu</label>{draft.is_free_preview && <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.preview_requires_login)} onChange={(event) => setDraft((current) => ({ ...current, preview_requires_login: event.target.checked }))} className="accent-[#8083ff]" />Connexion requise pour l’aperçu</label>}<label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.published)} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} className="accent-[#8083ff]" />Leçon visible dans le programme publié</label></div>
              <button type="button" onClick={() => void saveLesson()} disabled={saving || uploading || !draft.title?.trim()} className={`${buttonClass} w-full bg-[#8083ff] text-[#0d1020]`}><span className="material-symbols-outlined text-base">save</span>{saving ? 'Enregistrement…' : 'Enregistrer la leçon'}</button>
            </div> : <p className="rounded-lg border border-dashed border-[#343a46] p-6 text-sm text-[#8f96a6]">Sélectionne une leçon ou ajoute-en une pour modifier son contenu.</p>}
          </div>}
        </section>
      </div>
    </div>
  );
}
