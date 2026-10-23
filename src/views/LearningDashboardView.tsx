import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { UserPlusIcon, UserRoundCheckIcon } from '@animateicons/react/lucide';
import { supabase } from '../lib/supabase.ts';
import { PasswordField } from '../components/ui/PasswordField.tsx';

type CourseCard = { id: string; title: string; slug: string; cover_image_url: string | null; estimated_minutes: number; lesson_count: number; completed_count: number; resume_lesson_id: string | null; updated_at: string | null };
const fieldClass = 'w-full rounded-lg border border-[#343a46] bg-[#10141d] px-3 py-2 text-sm text-white outline-none focus:border-[#8083ff]';

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
    const [{ data: lessons, error: lessonError }, { data: resumes, error: resumeError }] = await Promise.all([
      supabase.from('course_lessons').select('id,course_id').in('course_id', ids).eq('published', true),
      supabase.from('course_resume').select('course_id,lesson_id,updated_at').eq('user_id', session.user.id).in('course_id', ids),
    ]);
    if (lessonError || resumeError) { setError(`Impossible de charger la progression : ${(lessonError || resumeError)?.message}`); setLoading(false); return; }
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
        resume_lesson_id: resumes?.find((resume) => resume.course_id === course.id)?.lesson_id || null,
        updated_at: resumes?.find((resume) => resume.course_id === course.id)?.updated_at || null,
      } as CourseCard;
    });
    setCourses(next); setLoading(false);
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

  if (!authReady) return <div role="status" className="mx-auto max-w-7xl px-4 py-16 text-sm text-[#c7c4d7]">Vérification de la session…</div>;

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
        ) : loading ? <div role="status" className="rounded-xl border border-[#262a33] bg-[#181c24] p-8 text-sm text-[#a9afbf]">Chargement de tes formations…</div> : courses.length === 0 ? <div className="rounded-xl border border-[#262a33] bg-[#181c24] p-8 text-center"><span className="material-symbols-outlined text-4xl text-[#c0c1ff]">school</span><h2 className="mt-3 text-lg font-bold text-white">Aucune formation dans ton espace pour le moment</h2><p className="mt-2 text-sm text-[#a9afbf]">Les formations accessibles apparaîtront ici dès que ton accès sera activé.</p><button type="button" onClick={() => onNavigate('catalogue-formations')} className="mt-5 rounded-lg bg-[#8083ff] px-4 py-2 text-sm font-semibold text-[#0d1020]">Découvrir le catalogue</button></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => { const progressPercent = course.lesson_count ? Math.round(course.completed_count / course.lesson_count * 100) : 0; return <article key={course.id} className="overflow-hidden rounded-xl border border-[#262a33] bg-[#181c24]"><div className="aspect-[16/8] bg-[#10141d]"><img src={course.cover_image_url || '/assets/images/logo.png'} alt="" className="h-full w-full object-cover" /></div><div className="space-y-4 p-4"><div><h2 className="font-bold text-white">{course.title}</h2><p className="mt-1 text-xs text-[#8f96a6]">{course.completed_count} / {course.lesson_count} leçons terminées</p></div><div><div className="mb-1 flex justify-between text-[11px] text-[#a9afbf]"><span>Progression</span><span>{progressPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#262a33]"><div className="h-full rounded-full bg-[#4cd7f6]" style={{ width: `${progressPercent}%` }} /></div></div><button type="button" onClick={() => onNavigate('lecteur', course.id)} className="min-h-10 w-full rounded-lg bg-[#8083ff] px-4 py-2 text-sm font-semibold text-[#0d1020]">{course.resume_lesson_id ? 'Reprendre la formation' : 'Commencer la formation'}</button></div></article>; })}</div>}
      </div>
    </div>
  );
}
