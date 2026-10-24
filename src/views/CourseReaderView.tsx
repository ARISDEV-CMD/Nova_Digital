import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSession } from '../lib/auth-client.ts';
import { getAppSession, requestJson, signOutApp } from '../lib/auth-client.ts';
import { Skeleton, SkeletonStatus } from '../components/feedback/Skeleton.tsx';
import { LessonContent } from '../components/learning/LessonContent.tsx';
import { EmailAuthPanel } from '../components/auth/EmailAuthPanel.tsx';

type Course = { id: string; title: string; slug: string; status: string; description_md: string; learning_outcomes: string[]; estimated_minutes: number };
type Chapter = { id: string; position: number; title: string; description: string };
type Lesson = { id: string; chapter_id: string; position: number; title: string; summary: string; lesson_type: string; duration_minutes: number; is_free_preview: boolean; preview_requires_login: boolean };
type LessonPayload = { lesson: Lesson & { locked: boolean }; content: { body_md?: string | null; video_storage_path?: string | null; project_instructions?: string | null } | null; quiz_questions: { id: string; prompt_md: string; options: unknown }[]; resources: { id: string; title: string; kind: string; requires_license: string | null }[]; progress: { is_completed: boolean; last_position_seconds: number } | null };
type QuizResult = { score: number; total: number; answers: { question_id: string; correct_option_ids: string[]; explanation_md: string | null }[] };
const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

function CourseReaderSkeleton() {
  return (
    <SkeletonStatus label="Chargement de la formation" className="min-h-[calc(100vh-5rem)] bg-[#0f131c] px-3 py-4 text-[#dfe2ee] sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-4 space-y-2 border-b border-[#262a33] pb-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-2/3 max-w-lg" />
        </header>
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside aria-hidden="true" className="space-y-3 rounded-xl border border-[#262a33] bg-[#181c24] p-3">
            <Skeleton className="mx-2 h-5 w-28" />
            {Array.from({ length: 4 }, (_, chapterIndex) => <section key={chapterIndex} className="space-y-2 rounded-lg border border-[#31353e] p-3"><Skeleton className="h-4 w-3/4" />{Array.from({ length: 3 }, (_, lessonIndex) => <Skeleton key={lessonIndex} className="h-11 w-full rounded-md" />)}</section>)}
          </aside>
          <main aria-hidden="true" className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-xl border border-[#262a33] bg-[#181c24]"><Skeleton className="aspect-video w-full rounded-none bg-black/60" /><div className="space-y-4 p-5 sm:p-7"><Skeleton className="h-4 w-36" /><Skeleton className="h-7 w-3/4" /><Skeleton className="h-4 w-full max-w-2xl" /><Skeleton className="h-36 w-full rounded-lg" /></div></div>
          </main>
        </div>
      </div>
    </SkeletonStatus>
  );
}

function optionsOf(value: unknown): { id: string; label: string }[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => typeof item === 'string'
    ? { id: String(index), label: item }
    : { id: String((item as any)?.id ?? index), label: String((item as any)?.label ?? (item as any)?.text ?? '') });
}

export function CourseReaderView({ courseId, onNavigate }: { courseId: string; onNavigate: (view: string, productId?: string) => void }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [access, setAccess] = useState<Record<string, boolean>>({});
  const [activeLessonId, setActiveLessonId] = useState('');
  const [payload, setPayload] = useState<LessonPayload | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizBusy, setQuizBusy] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastProgressSave = useRef(0);
  const eventQueue = useRef<Record<string, unknown>[]>([]);
  const recentActivityAt = useRef(Date.now());
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const queueEvent = (event_type: string, lesson_id?: string, active_seconds?: number, metadata?: Record<string, unknown>) => {
    if (!sessionRef.current) return;
    eventQueue.current.push({ course_id: courseId, lesson_id, event_type, active_seconds, metadata: metadata || {} });
  };

  const flushEvents = useCallback(async () => {
    if (!eventQueue.current.length) return;
    const batch = eventQueue.current.splice(0, 50);
    try { await requestJson('/api/learning/events', { method: 'POST', body: JSON.stringify({ events: batch }) }); }
    catch { eventQueue.current.unshift(...batch); }
  }, []);

  useEffect(() => {
    const markActivity = () => { recentActivityAt.current = Date.now(); };
    window.addEventListener('pointerdown', markActivity, { passive: true });
    window.addEventListener('keydown', markActivity);
    window.addEventListener('scroll', markActivity, { passive: true });
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (document.visibilityState === 'visible' && Date.now() - recentActivityAt.current < 120000 && video && !video.paused && session && activeLessonId) {
        queueEvent('session_heartbeat', activeLessonId, 30);
      }
      void flushEvents();
    }, 30000);
    const onVisibility = () => { if (document.visibilityState === 'hidden') void flushEvents(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pointerdown', markActivity);
      window.removeEventListener('keydown', markActivity);
      window.removeEventListener('scroll', markActivity);
      document.removeEventListener('visibilitychange', onVisibility);
      void flushEvents();
    };
  }, [activeLessonId, flushEvents, session]);

  useEffect(() => {
    let mounted = true;
    getAppSession().then((value) => { if (mounted) { setSession(value); setAuthReady(true); } })
      .catch((reason) => { if (mounted) { setError(reason instanceof Error ? reason.message : 'Session indisponible.'); setAuthReady(true); } });
    return () => { mounted = false; };
  }, []);

  const loadProgram = useCallback(async () => {
    if (!authReady) return;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ courseId });
      const result = await requestJson<{ course: Course; chapters: Chapter[]; lessons: (Lesson & { accessible: boolean })[]; progress: { lesson_id: string; is_completed: boolean; last_position_seconds: number }[]; resume_lesson_id: string | null }>(`/api/learning/program?${params}`);
      setCourse(result.course);
      setChapters(result.chapters);
      setLessons(result.lessons);
      setAccess(Object.fromEntries(result.lessons.map((lesson) => [lesson.id, lesson.accessible])));
      setCompleted(Object.fromEntries(result.progress.map((row) => [row.lesson_id, row.is_completed])));
      const firstAccessible = result.lessons.find((lesson) => lesson.accessible);
      const initialId = result.resume_lesson_id && result.lessons.some((lesson) => lesson.id === result.resume_lesson_id)
        ? result.resume_lesson_id : (firstAccessible?.id || result.lessons[0]?.id || '');
      setActiveLessonId((current) => current || initialId);
    } catch (reason) {
      setCourse(null); setChapters([]); setLessons([]); setAccess({});
      setError(reason instanceof Error && reason.message ? reason.message : 'Cette formation est en pr\u00e9paration ou son programme n\u2019est pas encore publi\u00e9.');
    } finally { setLoading(false); }
  }, [authReady, courseId, session]);

  useEffect(() => { void loadProgram(); }, [loadProgram]);

  const loadLesson = useCallback(async (lessonId: string) => {
    if (!lessonId) return;
    setActiveLessonId(lessonId); setLessonLoading(true); setError(''); setNotice(''); setQuizResult(null); setAnswers({}); setVideoUrl('');
    try {
      const nextPayload = await requestJson<LessonPayload>('/api/learning/lesson', { method: 'POST', body: JSON.stringify({ lessonId }) });
      setPayload(nextPayload);
      if (!nextPayload.lesson.locked) {
        queueEvent('lesson_opened', lessonId);
        void flushEvents();
      }
      if (!nextPayload.lesson.locked && nextPayload.content?.video_storage_path) {
        const video = await requestJson<{ url: string }>('/api/learning/video', { method: 'POST', body: JSON.stringify({ lessonId }) });
        setVideoUrl(video.url);
      }
    } catch (reason) {
      setPayload(null); setError(reason instanceof Error ? reason.message : 'Impossible de charger cette le\u00e7on.');
    } finally { setLessonLoading(false); }
  }, [flushEvents]);

  useEffect(() => { if (!loading && activeLessonId) void loadLesson(activeLessonId); }, [activeLessonId, loadLesson, loading]);

  useEffect(() => {
    const video = videoRef.current;
    const position = payload?.progress?.last_position_seconds || 0;
    if (video && position > 0) video.currentTime = position;
  }, [payload, videoUrl]);

  const saveProgress = async (isCompleted: boolean, seconds: number) => {
    if (!session || !activeLessonId) return;
    try {
      await requestJson('/api/learning/progress', { method: 'POST', body: JSON.stringify({ lessonId: activeLessonId, position: Math.floor(seconds), completed: isCompleted }) });
      if (isCompleted) { queueEvent('lesson_completed', activeLessonId); void flushEvents(); setCompleted((current) => ({ ...current, [activeLessonId]: true })); setNotice('Le\u00e7on termin\u00e9e. Ta progression est enregistr\u00e9e.'); }
    } catch (reason) { setError(`Progression non enregistr\u00e9e : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
  };

  const submitQuiz = async () => {
    if (!activeLessonId || !payload) return;
    setQuizBusy(true); setError('');
    queueEvent('quiz_submitted', activeLessonId);
    void flushEvents();
    try {
      const result = await requestJson<QuizResult>('/api/learning/quiz', { method: 'POST', body: JSON.stringify({ lessonId: activeLessonId, answers: payload.quiz_questions.map((question) => ({ question_id: question.id, selected_option_ids: answers[question.id] || [] })) }) });
      setQuizResult(result);
      if (result.score === result.total) await saveProgress(true, 0);
    } catch (reason) { setError(`Correction impossible : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
    setQuizBusy(false);
  };





  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeLessonId);
  const activeLesson = lessons[activeIndex];
  const prevLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  if (!authReady || loading) return <CourseReaderSkeleton />;
  if (!course) return <div className="mx-auto max-w-3xl px-4 py-16"><button type="button" onClick={() => onNavigate('catalogue')} className="mb-5 text-sm text-[#4cd7f6]">← Retour au catalogue</button><div className="rounded-xl border border-[#262a33] bg-[#181c24] p-6"><h1 className="text-xl font-bold text-white">Formation indisponible</h1><p className="mt-2 text-sm text-[#a9afbf]">{error || 'Le programme n’est pas encore publié.'}</p></div></div>;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#0f131c] text-[#dfe2ee]">
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 lg:px-8">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#262a33] pb-4"><div><button type="button" onClick={() => onNavigate('produit', course.id)} className="mb-1 text-xs text-[#4cd7f6] hover:text-white">← Fiche de formation</button><h1 className="text-lg font-bold text-white sm:text-xl">{course.title}</h1></div><div className="flex items-center gap-3">{session ? <><span className="hidden text-xs text-[#a9afbf] sm:inline">{session.user.email}</span><button type="button" onClick={() => void signOutApp()} className={`${buttonClass} bg-[#262a33] text-white`}>Déconnexion</button></> : <span className="rounded-full border border-[#31353e] px-3 py-1 text-xs text-[#c7c4d7]">Aperçus gratuits</span>}</div></header>
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {notice && <div role="status" className="mb-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="max-h-[calc(100dvh-9rem)] space-y-3 overflow-y-auto rounded-xl border border-[#262a33] bg-[#181c24] p-3 xl:sticky xl:top-20">
            <div className="flex items-center justify-between px-2 py-1"><h2 className="font-semibold text-white">Programme</h2><span className="text-xs text-[#8f96a6]">{lessons.length} leçons</span></div>
            {chapters.map((chapter) => <section key={chapter.id} className="overflow-hidden rounded-lg border border-[#31353e]"><h3 className="bg-[#10141d] px-3 py-2 text-xs font-semibold text-[#c0c1ff]">{chapter.position}. {chapter.title}</h3><div className="divide-y divide-[#262a33]">{lessons.filter((lesson) => lesson.chapter_id === chapter.id).map((lesson) => { const locked = !access[lesson.id]; return <button type="button" key={lesson.id} onClick={() => void loadLesson(lesson.id)} className={`flex w-full items-start gap-2 px-3 py-3 text-left transition hover:bg-[#262a33]/60 ${activeLessonId === lesson.id ? 'bg-[#8083ff]/10' : ''}`}><span className="material-symbols-outlined mt-0.5 text-base text-[#8f96a6]">{completed[lesson.id] ? 'check_circle' : locked ? 'lock' : lesson.lesson_type === 'video' ? 'play_circle' : lesson.lesson_type === 'quiz' ? 'quiz' : 'description'}</span><span className="min-w-0 flex-1"><span className="block text-xs font-medium text-white">{lesson.title}</span><span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#8f96a6]">{lesson.duration_minutes} min{lesson.is_free_preview && <span className="text-[#4cd7f6]">Aperçu gratuit</span>}</span></span></button>; })}</div></section>)}
            {!chapters.length && <p className="p-4 text-sm text-[#8f96a6]">Aucun chapitre publié.</p>}
          </aside>

          <main className="min-w-0 space-y-4">
            <section className="overflow-hidden rounded-xl border border-[#262a33] bg-[#181c24]">
              {lessonLoading ? <SkeletonStatus label="Chargement de la leçon" className="space-y-4 p-5 sm:p-7"><Skeleton className="aspect-video w-full rounded-lg bg-black/60" /><Skeleton className="h-4 w-40" /><Skeleton className="h-7 w-3/4" /><div className="space-y-2 pt-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div></SkeletonStatus> : payload?.lesson.locked ? <div className="mx-auto max-w-lg p-8 text-center sm:p-12"><span className="material-symbols-outlined text-4xl text-[#c0c1ff]">lock</span><h2 className="mt-3 text-xl font-bold text-white">Cette leçon est verrouillée</h2><p className="mt-2 text-sm leading-6 text-[#a9afbf]">Connecte-toi avec le compte qui possède l’accès à cette formation. Tu peux aussi commencer par les leçons gratuites.</p>{!session && <div className="mt-6 rounded-xl border border-[#31353e] bg-[#10141d] p-4 text-left"><p className="mb-3 text-xs text-[#a9afbf]">Connecte-toi avec ton e-mail et ton mot de passe ou avec Google pour vérifier tes accès et reprendre ta progression.</p><EmailAuthPanel onError={setError} callbackUrl={new URL(`/?auth_view=lecteur&auth_course=${encodeURIComponent(courseId)}`, window.location.origin).toString()} /></div>}</div> : payload && activeLesson ? <>
                {activeLesson.lesson_type === 'video' && videoUrl ? <video ref={videoRef} key={videoUrl} controls playsInline className="aspect-video w-full bg-black" src={videoUrl} onPlay={() => queueEvent('video_play', activeLesson.id)} onPause={() => queueEvent('video_pause', activeLesson.id)} onTimeUpdate={(event) => { const seconds = Math.floor(event.currentTarget.currentTime); if (session && seconds - lastProgressSave.current >= 20) { lastProgressSave.current = seconds; queueEvent('video_progress', activeLesson.id, undefined, { position_seconds: seconds }); void saveProgress(false, seconds); } }} onEnded={(event) => void saveProgress(true, event.currentTarget.currentTime)} onLoadedMetadata={(event) => { const position = payload.progress?.last_position_seconds || 0; if (position) event.currentTarget.currentTime = position; }} /> : activeLesson.lesson_type === 'video' ? <div className="grid aspect-video place-items-center bg-black/60 p-8 text-center text-sm text-[#a9afbf]">La vidéo de cette leçon n’est pas encore disponible.</div> : null}
                <div className="space-y-4 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-[#4cd7f6]">{activeLesson.lesson_type} · {activeLesson.duration_minutes} min</p><h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{activeLesson.title}</h2>{activeLesson.summary && <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a9afbf]">{activeLesson.summary}</p>}</div>{session && <button type="button" onClick={() => void saveProgress(true, videoRef.current?.currentTime || 0)} className={`${buttonClass} bg-[#262a33] text-white`}><span className="material-symbols-outlined text-base">check</span>Marquer comme terminée</button>}</div>
                  {payload.content?.body_md && <article className="rounded-lg border border-[#31353e] bg-[#10141d] p-4 sm:p-6"><LessonContent content={payload.content.body_md} /></article>}
                  {payload.content?.project_instructions && <article className="whitespace-pre-wrap rounded-lg border border-[#5557a8]/40 bg-[#8083ff]/5 p-4 text-sm leading-7 text-[#dfe2ee]"><h3 className="mb-2 font-semibold text-white">Consignes du projet</h3>{payload.content.project_instructions}</article>}
                  {activeLesson.lesson_type === 'quiz' && payload.quiz_questions.length > 0 && <div className="space-y-4">{payload.quiz_questions.map((question, index) => <fieldset key={question.id} className="rounded-lg border border-[#31353e] bg-[#10141d] p-4"><legend className="px-1 text-sm font-semibold text-white">{index + 1}. {question.prompt_md}</legend><div className="mt-2 space-y-2">{optionsOf(question.options).map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#c7c4d7] hover:bg-[#262a33]"><input type="checkbox" checked={(answers[question.id] || []).includes(option.id)} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.checked ? [...(current[question.id] || []), option.id] : (current[question.id] || []).filter((id) => id !== option.id) }))} className="accent-[#8083ff]" />{option.label}</label>)}</div>{quizResult && <p className="mt-3 text-xs text-[#4cd7f6]">{quizResult.answers.find((answer) => answer.question_id === question.id)?.explanation_md}</p>}</fieldset>)}<button type="button" disabled={quizBusy} onClick={() => void submitQuiz()} className={`${buttonClass} bg-[#8083ff] text-[#0d1020]`}>{quizBusy ? 'Correction…' : 'Soumettre le quiz'}</button>{quizResult && <p role="status" className="text-sm font-semibold text-white">Résultat : {quizResult.score} / {quizResult.total}</p>}</div>}
                  {payload.resources.length > 0 && <div className="space-y-2"><h3 className="font-semibold text-white">Ressources</h3>{payload.resources.map((resource) => <button key={resource.id} type="button" onClick={async () => { try { const data = await requestJson<{ url: string }>('/api/learning/resource', { method: 'POST', body: JSON.stringify({ resourceId: resource.id }) }); window.open(data.url, '_blank', 'noopener,noreferrer'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Ressource indisponible.'); } }} className="flex w-full items-center gap-2 rounded-lg border border-[#31353e] bg-[#10141d] px-3 py-2 text-left text-sm text-[#c0c1ff]"><span className="material-symbols-outlined text-base">download</span>{resource.title}</button>)}</div>}
                  {completed[activeLesson.id] && <p className="text-xs text-emerald-300">Progression enregistrée · Leçon terminée</p>}
                </div>
              </> : <div className="p-10 text-center text-sm text-[#a9afbf]">Sélectionne une leçon dans le programme.</div>}
            </section>
            {payload && !payload.lesson.locked && <nav aria-label="Navigation des leçons" className="flex items-center justify-between gap-3"><button type="button" disabled={!prevLesson} onClick={() => prevLesson && void loadLesson(prevLesson.id)} className={`${buttonClass} bg-[#262a33] text-white`}>← Leçon précédente</button><button type="button" disabled={!nextLesson} onClick={() => nextLesson && void loadLesson(nextLesson.id)} className={`${buttonClass} bg-[#8083ff] text-[#0d1020]`}>Leçon suivante →</button></nav>}
          </main>
        </div>
      </div>
    </div>
  );
}
