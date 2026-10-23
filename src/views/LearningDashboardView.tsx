import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { UserPlusIcon, UserRoundCheckIcon } from '@animateicons/react/lucide';
import { supabase } from '../lib/supabase.ts';
import { PasswordField } from '../components/ui/PasswordField.tsx';
import { LearningCardSkeleton, Skeleton, SkeletonStatus } from '../components/feedback/Skeleton.tsx';

type Pace = { has_plan: boolean; status?: string; target_end_date?: string; last_activity_at?: string | null; days_since_last_activity?: number | null; weekly_minutes?: number; next_lesson?: { id: string; title: string; estimated_minutes: number } | null; week_goal?: { target_minutes: number; done_minutes: number }; catch_up?: { suggested_daily_minutes: number; recalculate_recommended: boolean }; access_ends_before_plan_end?: boolean; };
type CourseCard = { id: string; title: string; slug: string; cover_image_url: string | null; estimated_minutes: number; lesson_count: number; completed_count: number; resume_lesson_id: string | null; updated_at: string | null; pace?: Pace; chapters?: { id: string; title: string; position: number; total: number; done: number }[] };
const fieldClass = 'w-full rounded-lg border border-[#343a46] bg-[#10141d] px-3 py-2 text-sm text-white outline-none focus:border-[#8083ff]';

function LearningDashboardSkeleton({ showHeader = false }: { showHeader?: boolean }) {
  return (
    <SkeletonStatus label="Chargement de ton espace formation" className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-6">
      {showHeader && <header className="space-y-3 border-b border-[#262a33] pb-5"><Skeleton className="h-3 w-52" /><Skeleton className="h-9 w-72 max-w-full" /><Skeleton className="h-4 w-96 max-w-full" /></header>}
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <LearningCardSkeleton key={index} />)}</div>
    </SkeletonStatus>
  );
}

export function LearningDashboardView({ onNavigate }: { onNavigate: (view: string, productId?: string) => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [courses, setCourses] = useState<CourseCard[]>([]);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); setLoading(false); setError('Supabase n’est pas configuré.'); return; }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) { setSession(data.session); setAuthReady(true); } });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);

  const loadCourses = useCallback(async () => {
    if (!supabase || !authReady) return;
    const client = supabase;
    if (!session) { setCourses([]); setLoading(false); return; }
    setLoading(true); setError('');
    const now = Date.now();
    const { data: entitlements, error: entitlementsError } = await supabase.from('learning_entitlements')
      .select('scope,course_id,starts_at,ends_at,revoked_at').eq('user_id', session.user.id);
    if (entitlementsError) { setError(`Impossible de charger tes accès : ${entitlementsError.message}`); setLoading(false); return; }
    const valid = (entitlements || []).filter((entitlement) => !entitlement.revoked_at && new Date(entitlement.starts_at).getTime() <= now && (!entitlement.ends_at || new Date(entitlement.ends_at).getTime() > now));
    const allCourses = valid.some((entitlement) => entitlement.scope === 'all_courses');
    const courseIds = [...new Set(valid.map((entitlement) => entitlement.course_id).filter(Boolean))] as string[];
    const courseQuery = supabase.from('courses').select('id,title,slug,cover_image_url,estimated_minutes').eq('status', 'published').order('title');
    const { data: courseRows, error: courseError } = allCourses ? await courseQuery : courseIds.length ? await courseQuery.in('id', courseIds) : { data: [], error: null };
    if (courseError) { setError(`Impossible de charger les formations : ${courseError.message}`); setLoading(false); return; }
    const ids = (courseRows || []).map((course) => course.id);
    if (!ids.length) { setCourses([]); setLoading(false); return; }
    const [{ data: lessons, error: lessonError }, { data: resumes, error: resumeError }, { data: chapters, error: chapterError }] = await Promise.all([
      client.from('course_lessons').select('id,course_id,chapter_id').in('course_id', ids).eq('published', true),
      client.from('course_resume').select('course_id,lesson_id,updated_at').eq('user_id', session.user.id).in('course_id', ids),
      client.from('course_chapters').select('id,course_id,title,position').in('course_id', ids).order('position'),
    ]);
    if (lessonError || resumeError || chapterError) { setError(`Impossible de charger la progression : ${(lessonError || resumeError || chapterError)?.message}`); setLoading(false); return; }
    const lessonIds = (lessons || []).map((lesson) => lesson.id);
    const { data: progress, error: progressError } = lessonIds.length
      ? await supabase.from('lesson_progress').select('lesson_id,is_completed').eq('user_id', session.user.id).in('lesson_id', lessonIds)
      : { data: [], error: null };
    if (progressError) { setError(`Impossible de charger la progression : ${progressError.message}`); setLoading(false); return; }
    const next = (courseRows || []).map((course) => {
      const courseLessons = (lessons || []).filter((lesson) => lesson.course_id === course.id);
      return {
        ...course, lesson_count: courseLessons.length,
        completed_count: (progress || []).filter((row) => row.is_completed && courseLessons.some((lesson) => lesson.id === row.lesson_id)).length,
        chapters: (chapters || []).filter((chapter) => chapter.course_id === course.id).map((chapter) => {
          const chapterLessons = courseLessons.filter((lesson) => lesson.chapter_id === chapter.id);
          return { id: chapter.id, title: chapter.title, position: chapter.position, total: chapterLessons.length, done: (progress || []).filter((row) => row.is_completed && chapterLessons.some((lesson) => lesson.id === row.lesson_id)).length };
        }),
        resume_lesson_id: resumes?.find((resume) => resume.course_id === course.id)?.lesson_id || null,
        updated_at: resumes?.find((resume) => resume.course_id === course.id)?.updated_at || null,
      } as CourseCard;
    });
    const paced = await Promise.all(next.map(async (course) => {
      const { data } = await client.rpc('course_learning_pace', { p_course: course.id });
      return { ...course, pace: data as Pace | undefined };
    }));
    setCourses(paced); setLoading(false);
  }, [authReady, session]);

  useEffect(() => { void loadCourses(); }, [loadCourses]);

  const authenticate = async (event: React.FormEvent) => {
    event.preventDefault(); if (!supabase) return;
    setBusy(true); setError(''); setNotice('');
    const result = registerMode
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) {
      const message = result.error.message.toLowerCase();
      setError(registerMode && (message.includes('already registered') || message.includes('already exists'))
        ? 'Un compte existe déjà avec cette adresse. Connecte-toi ou réinitialise ton mot de passe.'
        : result.error.message);
    } else if (registerMode && !result.data.session) {
      setError('La session n’a pas pu être créée. Vérifie que la confirmation des courriels est désactivée dans Supabase.');
    } else {
      setSession(result.data.session);
      setNotice(registerMode ? 'Compte créé et connexion effectuée.' : 'Connexion réussie.');
    }
    setBusy(false);
  };

  const createPlan = async (courseId: string) => {
    if (!supabase) return;
    const hoursInput = window.prompt('Combien d’heures par semaine souhaites-tu étudier ? (0,5 à 40)', '3');
    if (hoursInput == null) return;
    const weeklyMinutes = Math.round(Number(hoursInput.replace(',', '.')) * 60);
    if (!Number.isFinite(weeklyMinutes) || weeklyMinutes < 30 || weeklyMinutes > 2400) { setError('Choisis un objectif compris entre 30 minutes et 40 heures par semaine.'); return; }
    const daysInput = window.prompt('Quels jours préfères-tu ? Entre 1 et 7 séparés par des virgules (1=lundi, 7=dimanche).', '1,3,5');
    if (daysInput == null) return;
    const preferredDays = [...new Set(daysInput.split(',').map((day) => Number(day.trim())))].sort((a, b) => a - b);
    if (!preferredDays.length || preferredDays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) { setError('Indique au moins un jour valide entre 1 et 7.'); return; }
    setError('');
    const { error: planError } = await supabase.rpc('save_study_plan', { p_course: courseId, p_weekly_minutes: weeklyMinutes, p_preferred_days: preferredDays });
    if (planError) setError(`Impossible de créer ton plan : ${planError.message}`);
    else await loadCourses();
  };

  const togglePause = async (courseId: string, paused: boolean) => {
    if (!supabase) return;
    const { error: pauseError } = await supabase.rpc('set_study_plan_paused', { p_course: courseId, p_paused: !paused });
    if (pauseError) setError(`Impossible de modifier le plan : ${pauseError.message}`);
    else await loadCourses();
  };

  const paceLabel: Record<string, string> = { ahead: 'En avance', on_track: 'Dans les temps', behind: 'En retard', far_behind: 'En retard important', paused: 'En pause', completed: 'Terminé' };

  if (!authReady) return <LearningDashboardSkeleton showHeader />;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#0f131c] text-[#dfe2ee]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#262a33] pb-5"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#4cd7f6]">Nova Digital · Apprentissage</p><h1 className="mt-2 text-3xl font-extrabold text-white">Mon espace formation</h1><p className="mt-2 text-sm text-[#a9afbf]">Retrouve tes formations et reprends là où tu t’es arrêté.</p></div>{session && <button type="button" onClick={() => void supabase?.auth.signOut()} className="rounded-lg bg-[#262a33] px-4 py-2 text-sm text-white hover:bg-[#343a46]">Se déconnecter</button>}</header>
        {error && <div role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {notice && <div role="status" className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
        {!session ? (
          <div className="mx-auto max-w-xl rounded-xl border border-[#262a33] bg-[#181c24] p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => setRegisterMode(false)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${!registerMode ? 'bg-[#262a33] text-white' : 'text-[#8f96a6]'}`}>
                <UserRoundCheckIcon size={18} duration={0.75} color="currentColor" />Connexion
              </button>
              <button type="button" onClick={() => setRegisterMode(true)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${registerMode ? 'bg-[#262a33] text-white' : 'text-[#8f96a6]'}`}>
                <UserPlusIcon size={18} duration={0.75} color="currentColor" />Créer un compte
              </button>
            </div>
            <form onSubmit={authenticate} className="space-y-4">
              <label className="block space-y-1.5 text-sm text-[#c7c4d7]">Adresse courriel<input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <PasswordField label="Mot de passe" className={fieldClass} minLength={8} autoComplete={registerMode ? 'new-password' : 'current-password'} value={password} onChange={setPassword} />
              <button disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#8083ff] px-4 py-2 text-sm font-bold text-[#0d1020] disabled:opacity-50">
                {registerMode ? <UserPlusIcon size={19} duration={0.75} color="currentColor" /> : <UserRoundCheckIcon size={19} duration={0.75} color="currentColor" />}
                {busy ? 'Patiente…' : registerMode ? 'Créer mon compte' : 'Se connecter'}
              </button>
            </form>
            <p className="mt-4 text-xs leading-5 text-[#8f96a6]">Après connexion, les formations auxquelles tu as accès apparaîtront ici avec leur progression.</p>
          </div>
        ) : loading ? <LearningDashboardSkeleton /> : courses.length === 0 ? <div className="rounded-xl border border-[#262a33] bg-[#181c24] p-8 text-center"><span className="material-symbols-outlined text-4xl text-[#c0c1ff]">school</span><h2 className="mt-3 text-lg font-bold text-white">Aucune formation dans ton espace pour le moment</h2><p className="mt-2 text-sm text-[#a9afbf]">Les formations accessibles apparaîtront ici dès que ton accès sera activé.</p><button type="button" onClick={() => onNavigate('catalogue-formations')} className="mt-5 rounded-lg bg-[#8083ff] px-4 py-2 text-sm font-semibold text-[#0d1020]">Découvrir le catalogue</button></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => { const progressPercent = course.lesson_count ? Math.round(course.completed_count / course.lesson_count * 100) : 0; const pace = course.pace; return <article key={course.id} className="overflow-hidden rounded-xl border border-[#262a33] bg-[#181c24]"><div className="aspect-[16/8] bg-[#10141d]"><img src={course.cover_image_url || '/assets/images/logo.png'} alt="" className="h-full w-full object-cover" /></div><div className="space-y-4 p-4"><div><h2 className="font-bold text-white">{course.title}</h2><p className="mt-1 text-xs text-[#8f96a6]">{course.completed_count} / {course.lesson_count} leçons terminées</p></div><div><div className="mb-1 flex justify-between text-[11px] text-[#a9afbf]"><span>Progression</span><span>{progressPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#262a33]"><div className="h-full rounded-full bg-[#4cd7f6]" style={{ width: `${progressPercent}%` }} /></div></div>{course.chapters?.length ? <details className="rounded-lg border border-[#31353e] bg-[#10141d] px-3 py-2"><summary className="cursor-pointer text-xs font-semibold text-[#c0c1ff]">Progression par chapitre</summary><ol className="mt-2 space-y-2">{course.chapters.map((chapter) => <li key={chapter.id} className="flex justify-between gap-2 text-xs text-[#a9afbf]"><span className="truncate">{chapter.position}. {chapter.title}</span><span className="shrink-0">{chapter.done}/{chapter.total} leçons</span></li>)}</ol></details> : null}{pace?.has_plan ? <section className="space-y-2 rounded-lg border border-[#31353e] bg-[#10141d] p-3" aria-label="Mon rythme"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-white">Mon rythme · {paceLabel[pace.status || ''] || pace.status}</h3><span className="text-[11px] text-[#a9afbf]">Fin estimée : {pace.target_end_date}</span></div><p className="text-xs text-[#a9afbf]">Cette semaine : {pace.week_goal?.done_minutes || 0} / {pace.week_goal?.target_minutes || 0} min · {pace.days_since_last_activity == null ? 'Aucune activité enregistrée' : pace.days_since_last_activity === 0 ? 'Activité aujourd’hui' : `Dernière activité il y a ${pace.days_since_last_activity} j`}</p>{pace.catch_up?.recalculate_recommended && <p className="text-xs text-[#c7c4d7]">Pour rattraper, environ {pace.catch_up.suggested_daily_minutes} min par jour sont suggérées. Tu peux ajuster ton rythme à tout moment.</p>}{pace.access_ends_before_plan_end && <p className="text-xs text-amber-200">Ton accès peut se terminer avant la date prévue du plan.</p>}<div className="flex gap-4"><button type="button" onClick={() => void createPlan(course.id)} className="text-xs font-semibold text-[#c0c1ff]">Modifier mon plan</button><button type="button" onClick={() => void togglePause(course.id, pace.status === 'paused')} className="text-xs font-semibold text-[#c0c1ff]">{pace.status === 'paused' ? 'Reprendre mon plan' : 'Mettre en pause'}</button></div></section> : <button type="button" onClick={() => void createPlan(course.id)} className="w-full rounded-lg border border-[#5557a8]/60 bg-[#8083ff]/10 px-3 py-2 text-left text-xs font-semibold text-[#c0c1ff]">Créer un plan d’étude</button>}<button type="button" onClick={() => onNavigate('lecteur', course.id)} className="min-h-10 w-full rounded-lg bg-[#8083ff] px-4 py-2 text-sm font-semibold text-[#0d1020]">{course.resume_lesson_id ? 'Reprendre la formation' : 'Commencer la formation'}</button></div></article>; })}</div>}
      </div>
    </div>
  );
}
