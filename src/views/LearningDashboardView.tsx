import { useCallback, useEffect, useState } from 'react';
import type { AppSession } from '../lib/auth-client.ts';
import { getAppSession, requestJson, signOutApp } from '../lib/auth-client.ts';
import { LearningCardSkeleton, Skeleton, SkeletonStatus } from '../components/feedback/Skeleton.tsx';
import { EmailAuthPanel } from '../components/auth/EmailAuthPanel.tsx';

type Pace = { has_plan: boolean; status?: string; target_end_date?: string; last_activity_at?: string | null; days_since_last_activity?: number | null; weekly_minutes?: number; next_lesson?: { id: string; title: string; estimated_minutes: number } | null; week_goal?: { target_minutes: number; done_minutes: number }; catch_up?: { suggested_daily_minutes: number; recalculate_recommended: boolean }; access_ends_before_plan_end?: boolean };
type CourseCard = { id: string; title: string; slug: string; cover_image_url: string | null; estimated_minutes: number; lesson_count: number; completed_count: number; resume_lesson_id: string | null; updated_at: string | null; pace?: Pace };

function LearningDashboardSkeleton({ showHeader = false }: { showHeader?: boolean }) {
  return (
    <SkeletonStatus label="Chargement de ton espace formation" className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-6">
      {showHeader && <header className="space-y-3 border-b border-[#262a33] pb-5"><Skeleton className="h-3 w-52" /><Skeleton className="h-9 w-72 max-w-full" /><Skeleton className="h-4 w-96 max-w-full" /></header>}
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <LearningCardSkeleton key={index} />)}</div>
    </SkeletonStatus>
  );
}

const paceLabels: Record<string, string> = { ahead: 'En avance', on_track: 'Dans les temps', behind: 'En retard', far_behind: 'En retard important', paused: 'En pause', completed: 'Terminée' };

export function LearningDashboardView({ onNavigate }: { onNavigate: (view: string, productId?: string) => void }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<CourseCard[]>([]);

  useEffect(() => {
    let mounted = true;
    getAppSession()
      .then((value) => { if (mounted) setSession(value); })
      .catch((reason) => { if (mounted) setError(reason instanceof Error ? reason.message : 'Session indisponible.'); })
      .finally(() => { if (mounted) setAuthReady(true); });
    return () => { mounted = false; };
  }, []);

  const loadCourses = useCallback(async () => {
    if (!authReady) return;
    if (!session) { setCourses([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const result = await requestJson<{ courses: CourseCard[] }>('/api/learning/dashboard');
      setCourses(result.courses);
    } catch (reason) {
      setError(`Impossible de charger tes formations : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`);
    } finally { setLoading(false); }
  }, [authReady, session]);

  useEffect(() => { void loadCourses(); }, [loadCourses]);

  const createPlan = async (courseId: string) => {
    const hoursInput = window.prompt('Combien d’heures par semaine souhaites-tu étudier ? (0,5 à 40)', '3');
    if (hoursInput == null) return;
    const weeklyMinutes = Math.round(Number(hoursInput.replace(',', '.')) * 60);
    if (!Number.isFinite(weeklyMinutes) || weeklyMinutes < 30 || weeklyMinutes > 2400) { setError('Choisis un objectif compris entre 30 minutes et 40 heures par semaine.'); return; }
    const daysInput = window.prompt('Quels jours préfères-tu ? Entre 1 et 7 séparés par des virgules (1=lundi, 7=dimanche).', '1,3,5');
    if (daysInput == null) return;
    const preferredDays = [...new Set(daysInput.split(',').map((day) => Number(day.trim())))].sort((a, b) => a - b);
    if (!preferredDays.length || preferredDays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) { setError('Indique au moins un jour valide entre 1 et 7.'); return; }
    try {
      await requestJson('/api/learning/plan', { method: 'POST', body: JSON.stringify({ action: 'create', courseId, weeklyMinutes, preferredDays }) });
      await loadCourses();
    } catch (reason) { setError(`Impossible de créer ton plan : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
  };

  const togglePause = async (courseId: string, paused: boolean) => {
    try {
      await requestJson('/api/learning/plan', { method: 'POST', body: JSON.stringify({ action: 'pause', courseId, paused: !paused }) });
      await loadCourses();
    } catch (reason) { setError(`Impossible de modifier le plan : ${reason instanceof Error ? reason.message : 'erreur inconnue'}`); }
  };

  const callbackUrl = new URL('/', window.location.origin);
  callbackUrl.searchParams.set('auth_view', 'mon-espace-client');
  if (!authReady) return <LearningDashboardSkeleton showHeader />;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#0f131c] text-[#dfe2ee]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#262a33] pb-5">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-[#4cd7f6]">Nova Digital · Apprentissage</p><h1 className="mt-2 text-3xl font-extrabold text-white">Mon espace formation</h1><p className="mt-2 text-sm text-[#a9afbf]">Retrouve tes formations et reprends là où tu t’es arrêté.</p></div>
          {session && <button type="button" onClick={() => void signOutApp()} className="rounded-lg bg-[#262a33] px-4 py-2 text-sm text-white hover:bg-[#343a46]">Se déconnecter</button>}
        </header>
        {error && <div role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {!session ? (
          <div className="mx-auto max-w-xl rounded-xl border border-[#262a33] bg-[#181c24] p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white">Connecte-toi pour retrouver tes formations</h2>
            <p className="mb-5 mt-2 text-sm text-[#a9afbf]">Connecte-toi avec ton adresse e-mail ou ton compte Google pour retrouver tes accès et ta progression.</p>
            <EmailAuthPanel onError={setError} callbackUrl={callbackUrl.toString()} />
          </div>
        ) : loading ? <LearningDashboardSkeleton /> : courses.length === 0 ? (
          <div className="rounded-xl border border-[#262a33] bg-[#181c24] p-8 text-center"><span className="material-symbols-outlined text-4xl text-[#c0c1ff]">school</span><h2 className="mt-3 text-lg font-bold text-white">Aucune formation dans ton espace pour le moment</h2><p className="mt-2 text-sm text-[#a9afbf]">Les formations accessibles apparaîtront ici dès que ton accès sera activé.</p><button type="button" onClick={() => onNavigate('catalogue-formations')} className="mt-5 rounded-lg bg-[#8083ff] px-4 py-2 text-sm font-semibold text-[#0d1020]">Découvrir le catalogue</button></div>
        ) : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const progressPercent = course.lesson_count ? Math.round(course.completed_count / course.lesson_count * 100) : 0;
            const pace = course.pace;
            return <article key={course.id} className="overflow-hidden rounded-xl border border-[#262a33] bg-[#181c24]">
              <div className="aspect-[16/8] bg-[#10141d]"><img src={course.cover_image_url || '/assets/images/logo.png'} alt="" className="h-full w-full object-cover" /></div>
              <div className="space-y-4 p-4">
                <div><h2 className="font-bold text-white">{course.title}</h2><p className="mt-1 text-xs text-[#8f96a6]">{course.completed_count} / {course.lesson_count} leçons terminées</p></div>
                <div><div className="mb-1 flex justify-between text-[11px] text-[#a9afbf]"><span>Progression</span><span>{progressPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#262a33]"><div className="h-full rounded-full bg-[#4cd7f6]" style={{ width: `${progressPercent}%` }} /></div></div>
                {pace?.has_plan ? <section className="space-y-2 rounded-lg border border-[#31353e] bg-[#10141d] p-3" aria-label="Mon rythme"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-white">Mon rythme · {paceLabels[pace.status || ''] || pace.status}</h3><span className="text-[11px] text-[#a9afbf]">Fin estimée : {pace.target_end_date}</span></div><p className="text-xs text-[#a9afbf]">Cette semaine : {pace.week_goal?.done_minutes || 0} / {pace.week_goal?.target_minutes || 0} min · {pace.days_since_last_activity == null ? 'Aucune activité enregistrée' : pace.days_since_last_activity === 0 ? 'Activité aujourd’hui' : `Dernière activité il y a ${pace.days_since_last_activity} j`}</p>{pace.catch_up?.recalculate_recommended && <p className="text-xs text-[#c7c4d7]">Pour rattraper, environ {pace.catch_up.suggested_daily_minutes} min par jour sont suggérées. Tu peux ajuster ton rythme à tout moment.</p>}{pace.access_ends_before_plan_end && <p className="text-xs text-amber-200">Ton accès peut se terminer avant la date prévue du plan.</p>}<div className="flex gap-4"><button type="button" onClick={() => void createPlan(course.id)} className="text-xs font-semibold text-[#c0c1ff]">Modifier mon plan</button><button type="button" onClick={() => void togglePause(course.id, pace.status === 'paused')} className="text-xs font-semibold text-[#c0c1ff]">{pace.status === 'paused' ? 'Reprendre mon plan' : 'Mettre en pause'}</button></div></section> : <button type="button" onClick={() => void createPlan(course.id)} className="w-full rounded-lg border border-[#5557a8]/60 bg-[#8083ff]/10 px-3 py-2 text-left text-xs font-semibold text-[#c0c1ff]">Créer un plan d’étude</button>}
                <button type="button" onClick={() => onNavigate('lecteur', course.id)} className="min-h-10 w-full rounded-lg bg-[#8083ff] px-4 py-2 text-sm font-semibold text-[#0d1020]">{course.resume_lesson_id ? 'Reprendre la formation' : 'Commencer la formation'}</button>
              </div>
            </article>;
          })}
        </div>}
      </div>
    </div>
  );
}
