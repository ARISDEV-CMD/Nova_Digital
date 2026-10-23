import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase.ts';

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

export function CourseCurriculumEditor({ course, onClose }: { course: Course; session: Session; onClose: () => void }) {
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
    if (!supabase) return;
    setLoading(true);
    setError('');
    const [chapterResult, lessonResult] = await Promise.all([
      supabase.from('course_chapters').select('id,course_id,version_id,position,title,description').eq('version_id', draftVersionId || '00000000-0000-0000-0000-000000000000').order('position'),
      supabase.from('course_lessons').select('id,chapter_id,course_id,position,title,lesson_type,duration_minutes,summary,is_free_preview,preview_requires_login,published').eq('course_id', course.id).order('position'),
    ]);
    if (chapterResult.error || lessonResult.error) {
      setError(`Impossible de charger le programme : ${(chapterResult.error || lessonResult.error)?.message}`);
      setLoading(false);
      return;
    }
    const nextChapters = (chapterResult.data || []) as Chapter[];
    const chapterIds = new Set(nextChapters.map((chapter) => chapter.id));
    const nextLessons = ((lessonResult.data || []) as Lesson[]).filter((lesson) => chapterIds.has(lesson.chapter_id));
    setChapters(nextChapters);
    setLessons(nextLessons);
    if (!selectedChapterId || !nextChapters.some((chapter) => chapter.id === selectedChapterId)) {
    setSelectedChapterId(nextChapters[0]?.id || '');
    }
    if (nextLessons.length) {
      const ids = nextLessons.map((lesson) => lesson.id);
      const [contentResult, quizResult] = await Promise.all([
        supabase.from('course_lesson_contents').select('lesson_id,body_md,video_storage_path,project_instructions').in('lesson_id', ids),
        supabase.from('quiz_questions').select('id,lesson_id,position,prompt_md,options,quiz_answer_keys(correct_option_ids,explanation_md)').in('lesson_id', ids).order('position'),
      ]);
      if (contentResult.error || quizResult.error) setError(`Impossible de charger le contenu des leçons : ${(contentResult.error || quizResult.error)?.message}`);
      else {
        setContents(Object.fromEntries((contentResult.data || []).map((row) => [row.lesson_id, row as Content])));
        const questionsByLesson: Record<string, QuizQuestion[]> = {};
        for (const row of (quizResult.data || []) as QuizQuestion[]) (questionsByLesson[row.lesson_id] ||= []).push(row);
        setQuizQuestions(questionsByLesson);
      }
    } else { setContents({}); setQuizQuestions({}); }
    setLoading(false);
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
    if (!supabase) return;
    setSaving(true); setError(''); setNotice('');
    const { data, error: forkError } = await supabase.rpc('admin_fork_course_version', { p_course: course.id });
    if (forkError) setError(`Impossible de créer la version de travail : ${forkError.message}`);
    else { setDraftVersionId(data as string); setSelectedChapterId(''); setSelectedLessonId(''); setNotice('Version de travail créée. Les changements ne touchent pas encore la version publiée.'); }
    setSaving(false);
  };

  const saveMetadata = async () => {
    if (!supabase) return;
    const outcomes = metadata.learning_outcomes.split('\n').map((item) => item.trim()).filter(Boolean);
    if (outcomes.length === 0) { setError('Ajoute au moins un objectif pédagogique.'); return; }
    setSaving(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('courses').update({
      short_description: metadata.short_description.trim(), description: metadata.description.trim(), description_md: metadata.description.trim(),
      learning_outcomes: outcomes, level: metadata.level, estimated_minutes: Number(metadata.estimated_minutes) || 0,
      cover_image_url: metadata.cover_image_url.trim() || null, content_source: metadata.content_source.trim() || null,
      reviewed_at: metadata.reviewed ? (course.reviewed_at || new Date().toISOString()) : null,
      rights_verified_at: metadata.rights_verified ? (course.rights_verified_at || new Date().toISOString()) : null,
    }).eq('id', course.id);
    if (saveError) setError(`Métadonnées non enregistrées : ${saveError.message}`);
    else setNotice('Métadonnées éditoriales enregistrées.');
    setSaving(false);
  };

  const publishCourse = async () => {
    if (!supabase || !window.confirm('Publier cette version ? Les leçons publiées et gratuites serviront d’aperçu.')) return;
    setSaving(true); setError(''); setNotice('');
    const { error: publishError } = await supabase.rpc('admin_publish_course', { p_course: course.id });
    if (publishError) setError(`Publication refusée : ${publishError.message}`);
    else { setDraftVersionId(null); setNotice('Formation publiée. Le lecteur peut maintenant la proposer aux apprenants.'); }
    setSaving(false);
  };

  const addChapter = async () => {
    if (!supabase || !draftVersionId || !newChapterTitle.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const { data, error: insertError } = await supabase.from('course_chapters').insert({
      course_id: course.id, version_id: draftVersionId, position: chapters.length + 1,
      title: newChapterTitle.trim(), description: '',
    }).select('id,course_id,version_id,position,title,description').single();
    if (insertError) setError(`Le chapitre n’a pas été créé : ${insertError.message}`);
    else { setNewChapterTitle(''); setNotice('Chapitre créé.'); setChapters((current) => [...current, data as Chapter]); setSelectedChapterId(data.id); setSelectedLessonId(''); }
    setSaving(false);
  };

  const saveChapter = async (chapter: Chapter) => {
    if (!supabase) return;
    setSaving(true); setError(''); setNotice('');
    const { error: updateError } = await supabase.from('course_chapters').update({ title: chapter.title, description: chapter.description }).eq('id', chapter.id);
    if (updateError) setError(`Chapitre non enregistré : ${updateError.message}`); else setNotice('Chapitre enregistré.');
    setSaving(false);
  };

  const deleteChapter = async (chapter: Chapter) => {
    if (!supabase || !window.confirm(`Supprimer « ${chapter.title} » et toutes ses leçons ?`)) return;
    const { error: deleteError } = await supabase.from('course_chapters').delete().eq('id', chapter.id);
    if (deleteError) setError(`Chapitre non supprimé : ${deleteError.message}`);
    else { setSelectedLessonId(''); setNotice('Chapitre supprimé.'); await load(); }
  };

  const movePosition = async (items: { id: string; position: number }[], index: number, direction: -1 | 1, table: 'course_chapters' | 'course_lessons') => {
    if (!supabase) return;
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= items.length) return;
    const current = items[index]; const other = items[otherIndex]; const temp = items.length + 100;
    setSaving(true); setError('');
    for (const [id, position] of [[current.id, temp], [other.id, current.position], [current.id, other.position]] as [string, number][]) {
      const { error: updateError } = await supabase.from(table).update({ position }).eq('id', id);
      if (updateError) { setError(`Impossible de changer l’ordre : ${updateError.message}`); break; }
    }
    await load(); setSaving(false);
  };

  const addLesson = async () => {
    if (!supabase || !selectedChapterId) return;
    setSaving(true); setError(''); setNotice('');
    const { data, error: insertError } = await supabase.from('course_lessons').insert({
      course_id: course.id, chapter_id: selectedChapterId, position: chapterLessons.length + 1,
      title: 'Nouvelle leçon', lesson_type: 'video', duration_minutes: 0, summary: '',
      is_free_preview: false, preview_requires_login: false, published: false,
    }).select('id,chapter_id,course_id,position,title,lesson_type,duration_minutes,summary,is_free_preview,preview_requires_login,published').single();
    if (insertError) setError(`Leçon non créée : ${insertError.message}`);
    else {
      const { error: contentError } = await supabase.from('course_lesson_contents').upsert({ lesson_id: data.id }, { onConflict: 'lesson_id' });
      if (contentError) { setError(`Leçon créée, mais son contenu ne peut pas être initialisé : ${contentError.message}`); setSaving(false); return; }
      setLessons((current) => [...current, data as Lesson]); setSelectedLessonId(data.id); setNotice('Leçon créée. Complète son contenu puis enregistre-la.');
    }
    setSaving(false);
  };

  const uploadVideo = async (file?: File) => {
    if (!supabase || !file || !selectedLesson) return;
    if (!file.type.startsWith('video/')) { setError('Choisis un fichier vidéo.'); return; }
    setUploading(true); setError(''); setNotice('');
    const safeName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, '-');
    const path = `courses/${course.id}/${selectedLesson.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('course-content').upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) setError(`Vidéo non envoyée : ${uploadError.message}`);
    else { setVideoPath(path); setNotice('Vidéo envoyée dans le stockage privé. Enregistre la leçon pour l’associer.'); }
    setUploading(false);
  };

  const saveQuiz = async (lessonId: string) => {
    if (!supabase) return;
    let quiz: { prompt_md: string; options: unknown; correct_option_ids: unknown; explanation_md?: string }[];
    try {
      quiz = JSON.parse(quizJson);
      if (!Array.isArray(quiz) || quiz.some((question) => typeof question.prompt_md !== 'string' || !Array.isArray(question.options) || question.options.length < 2 || !Array.isArray(question.correct_option_ids))) throw new Error();
    } catch { throw new Error('Le quiz doit être un tableau JSON de questions avec prompt_md, options (au moins deux choix) et correct_option_ids.'); }
    const existing = quizQuestions[lessonId] || [];
    const insertedIds: string[] = [];
    for (const [index, question] of quiz.entries()) {
      const { data, error: questionError } = await supabase.from('quiz_questions').upsert({
        lesson_id: lessonId, position: index + 1, prompt_md: question.prompt_md, options: question.options,
      }, { onConflict: 'lesson_id,position' }).select('id').single();
      if (questionError) throw questionError;
      insertedIds.push(data.id);
      const { error: answerError } = await supabase.from('quiz_answer_keys').upsert({
        question_id: data.id, correct_option_ids: question.correct_option_ids, explanation_md: question.explanation_md || null,
      }, { onConflict: 'question_id' });
      if (answerError) throw answerError;
    }
    const obsoleteIds = existing.map((question: any) => question.id).filter((id) => !insertedIds.includes(id));
    if (obsoleteIds.length) {
      const { error: deleteError } = await supabase.from('quiz_questions').delete().in('id', obsoleteIds);
      if (deleteError) throw deleteError;
    }
  };

  const saveLesson = async () => {
    if (!supabase || !selectedLesson || !draft.title?.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const { error: lessonError } = await supabase.from('course_lessons').update({
      title: draft.title.trim(), lesson_type: draft.lesson_type, duration_minutes: Math.max(0, Number(draft.duration_minutes) || 0),
      summary: draft.summary || '', is_free_preview: Boolean(draft.is_free_preview),
      preview_requires_login: Boolean(draft.preview_requires_login), published: Boolean(draft.published),
    }).eq('id', selectedLesson.id);
    if (lessonError) { setError(`Leçon non enregistrée : ${lessonError.message}`); setSaving(false); return; }
    const { error: contentError } = await supabase.from('course_lesson_contents').upsert({
      lesson_id: selectedLesson.id, body_md: bodyMd || null,
      video_storage_path: videoPath || null, project_instructions: projectInstructions || null,
    }, { onConflict: 'lesson_id' });
    if (contentError) { setError(`Métadonnées enregistrées, mais contenu non enregistré : ${contentError.message}`); setSaving(false); return; }
    try { if (draft.lesson_type === 'quiz') await saveQuiz(selectedLesson.id); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Quiz non enregistré.'); setSaving(false); return; }
    setNotice('Leçon et contenu enregistrés.');
    await load();
    setSaving(false);
  };

  const deleteLesson = async (lesson: Lesson) => {
    if (!supabase || !window.confirm(`Supprimer la leçon « ${lesson.title} » ?`)) return;
    const { error: deleteError } = await supabase.from('course_lessons').delete().eq('id', lesson.id);
    if (deleteError) setError(`Leçon non supprimée : ${deleteError.message}`);
    else { setSelectedLessonId(''); setNotice('Leçon supprimée.'); await load(); }
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
