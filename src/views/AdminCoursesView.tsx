import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase.ts';
import { CourseCurriculumEditor } from './CourseCurriculumEditor.tsx';

type Currency = 'XAF' | 'EUR';
type Course = {
  id: string;
  code: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  current_version_id: string | null;
  draft_version_id: string | null;
  description: string;
  short_description: string;
  description_md: string;
  prerequisites_md: string;
  learning_outcomes: string[];
  level: string;
  estimated_minutes: number;
  cover_image_url: string | null;
  content_source: string | null;
  reviewed_at: string | null;
  rights_verified_at: string | null;
};
type OfferPrice = { currency: Currency; amount_minor: number | string; compare_at_minor: number | string | null };
type CourseOffer = { id: string; course_id: string; slug: string; name: string; active: boolean; offer_prices: OfferPrice[] };
type CourseRow = Course & { offer: CourseOffer | null };

const categoryLabels: Record<string, string> = {
  ai_automation: 'IA & automatisation',
  web_development: 'Développement web',
  design_visual: 'Design & UI/UX',
  digital_marketing: 'Marketing digital',
  video_content: 'Vidéo & création de contenu',
  productivity: 'Bureautique & productivité',
  data_bi: 'Data & Business Intelligence',
  cybersecurity: 'Cybersécurité',
  entrepreneurship: 'Entrepreneuriat & finance',
  career: 'Carrière numérique',
};

const inputClass = 'w-full rounded-lg border border-[#343a46] bg-[#10141d] px-3 py-2 text-sm text-white outline-none transition focus:border-[#8083ff]';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

function toMinorUnits(value: string, currency: Currency): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const validFormat = currency === 'XAF' ? /^\d+$/.test(trimmed) : /^\d+(?:[.,]\d{1,2})?$/.test(trimmed);
  if (!validFormat) throw new Error(currency === 'XAF' ? 'Le prix XAF doit être un nombre entier.' : 'Le prix EUR doit avoir au plus deux décimales.');
  const amount = currency === 'XAF'
    ? Number(trimmed)
    : Math.round(Number(trimmed.replace(',', '.')) * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Le prix doit être un montant positif valide.');
  return amount;
}

function fromMinorUnits(amount: number | string, currency: Currency): string {
  const numeric = Number(amount);
  return currency === 'XAF' ? String(numeric) : (numeric / 100).toFixed(2);
}

function formatPrice(amount: number | string, currency: Currency): string {
  const numeric = Number(amount);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency, maximumFractionDigits: currency === 'XAF' ? 0 : 2,
  }).format(currency === 'XAF' ? numeric : numeric / 100);
}

export const AdminCoursesView: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [search, setSearch] = useState('');
  const [prices, setPrices] = useState<Record<string, { XAF: string; EUR: string }>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const loadCatalog = useCallback(async (activeSession: Session) => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    setNotice('');
    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role').eq('id', activeSession.user.id).maybeSingle();
    if (profileError) {
      setError(`Impossible de vérifier le rôle administrateur : ${profileError.message}`);
      setIsAdmin(false);
      setRows([]);
      setLoading(false);
      return;
    }
    if (profile?.role !== 'admin') {
      setIsAdmin(false);
      setRows([]);
      setLoading(false);
      return;
    }
    setIsAdmin(true);

    const [{ data: courses, error: coursesError }, { data: offers, error: offersError }] = await Promise.all([
      supabase.from('courses').select('id,code,slug,title,category,status,current_version_id,draft_version_id,description,short_description,description_md,prerequisites_md,learning_outcomes,level,estimated_minutes,cover_image_url,content_source,reviewed_at,rights_verified_at').order('code'),
      supabase.from('offers').select('id,course_id,slug,name,active,offer_prices(currency,amount_minor,compare_at_minor)').eq('kind', 'course'),
    ]);
    if (coursesError || offersError) {
      setError(`Impossible de charger le catalogue : ${(coursesError || offersError)?.message}`);
      setRows([]);
      setLoading(false);
      return;
    }

    const typedCourses = (courses || []) as Course[];
    const typedOffers = (offers || []) as CourseOffer[];
    const nextRows = typedCourses.map((course) => ({
      ...course,
      offer: typedOffers.find((offer) => offer.course_id === course.id) || null,
    }));
    setRows(nextRows);
    setPrices(Object.fromEntries(nextRows.map((row) => {
      const xaf = row.offer?.offer_prices.find((price) => price.currency === 'XAF');
      const eur = row.offer?.offer_prices.find((price) => price.currency === 'EUR');
      return [row.id, { XAF: xaf ? fromMinorUnits(xaf.amount_minor, 'XAF') : '', EUR: eur ? fromMinorUnits(eur.amount_minor, 'EUR') : '' }];
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
      if (data.session) void loadCatalog(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAdmin(false);
      setRows([]);
      setError('');
      if (nextSession) queueMicrotask(() => void loadCatalog(nextSession));
      else setLoading(false);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [loadCatalog]);

  const visibleRows = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('fr');
    if (!normalized) return rows;
    return rows.filter((row) => `${row.code} ${row.title} ${row.category}`.toLocaleLowerCase('fr').includes(normalized));
  }, [rows, search]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setPassword('');
  };

  const handleSavePrice = async (course: CourseRow) => {
    if (!supabase) return;
    setSavingId(course.id);
    setError('');
    setNotice('');
    try {
      const values = prices[course.id] || { XAF: '', EUR: '' };
      const xaf = toMinorUnits(values.XAF, 'XAF');
      const eur = toMinorUnits(values.EUR, 'EUR');
      if (!course.offer && xaf === null && eur === null) throw new Error('Saisis au moins un prix pour créer l’offre.');

      let offerId = course.offer?.id;
      if (offerId) {
        const { error: updateError } = await supabase.from('offers').update({ name: course.title }).eq('id', offerId);
        if (updateError) throw updateError;
      } else {
        const { data: created, error: createError } = await supabase.from('offers').insert({
          kind: 'course', slug: `formation-${course.slug}`, name: course.title, course_id: course.id, active: false,
        }).select('id').single();
        if (createError) throw createError;
        offerId = created.id;
      }

      if (course.offer?.active && xaf === null && eur === null) {
        const { error: deactivateError } = await supabase.from('offers').update({ active: false }).eq('id', offerId);
        if (deactivateError) throw deactivateError;
      }

      for (const [currency, amount] of [['XAF', xaf], ['EUR', eur]] as const) {
        if (amount === null) {
          if (course.offer) {
            const { error: deleteError } = await supabase.from('offer_prices').delete().eq('offer_id', offerId).eq('currency', currency);
            if (deleteError) throw deleteError;
          }
          continue;
        }
        const { error: priceError } = await supabase.from('offer_prices').upsert(
          { offer_id: offerId, currency, amount_minor: amount, compare_at_minor: null },
          { onConflict: 'offer_id,currency' },
        );
        if (priceError) throw priceError;
      }
      setNotice(`Prix enregistrés pour ${course.code}. L’offre reste inactive tant que la formation n’est pas publiée.`);
      if (session) await loadCatalog(session);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement impossible.');
    } finally {
      setSavingId(null);
    }
  };

  if (!isSupabaseConfigured || !supabase) {
    return <StatusPanel title="Supabase n’est pas configuré" message="Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans le fichier .env, puis redémarre le serveur Vite." />;
  }

  if (!authReady) return <StatusPanel title="Connexion à Supabase…" message="Vérification de la session en cours." />;

  if (!session) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <Header count={0} />
        <form onSubmit={handleLogin} className="mt-6 space-y-4 rounded-xl border border-[#262a33] bg-[#181c24] p-6">
          <h2 className="text-lg font-semibold text-white">Connexion administrateur</h2>
          <p className="text-sm text-[#a9afbf]">Connecte-toi avec le compte Supabase dont le profil a le rôle administrateur.</p>
          <label className="block space-y-1.5 text-sm text-[#c7c4d7]">Adresse e-mail
            <input className={inputClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block space-y-1.5 text-sm text-[#c7c4d7]">Mot de passe
            <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <Alert message={error} />}
          <button className={`${buttonClass} w-full bg-[#8083ff] text-[#0d1020] hover:brightness-110`} disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    );
  }

  if (!isAdmin && !loading) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <Header count={0} />
        <div className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/5 p-6">
          <h2 className="font-semibold text-white">Accès administrateur requis</h2>
          <p className="mt-2 text-sm text-[#a9afbf]">La session {session.user.email} ne possède pas le rôle admin dans `profiles`.</p>
          <button type="button" onClick={handleSignOut} className={`${buttonClass} mt-4 bg-[#262a33] text-white hover:bg-[#343a46]`}>Se déconnecter</button>
        </div>
      </div>
    );
  }

  if (selectedCourse && session) {
    return <CourseCurriculumEditor course={selectedCourse} session={session} onClose={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="w-full space-y-6 text-[#dfe2ee]">
      <Header count={rows.length} />
      <section className="flex flex-col gap-3 rounded-xl border border-[#262a33] bg-[#181c24] p-4 md:flex-row md:items-center md:justify-between">
        <input className={`${inputClass} md:max-w-md`} type="search" placeholder="Rechercher par code, titre ou catégorie…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#a9afbf]">
          <span>{rows.length} formation{rows.length === 1 ? '' : 's'}</span>
          <span className="rounded-full border border-[#5557a8] bg-[#8083ff]/10 px-2.5 py-1 font-semibold text-[#c0c1ff]">Les offres sont enregistrées inactives</span>
          <button type="button" onClick={() => session && void loadCatalog(session)} className={`${buttonClass} bg-[#262a33] text-white hover:bg-[#343a46]`} disabled={loading}>
            <span className="material-symbols-outlined text-base">refresh</span> Actualiser
          </button>
          <button type="button" onClick={handleSignOut} className={`${buttonClass} bg-[#262a33] text-white hover:bg-[#343a46]`}>Déconnexion</button>
        </div>
      </section>

      {error && <Alert message={error} />}
      {notice && <div role="status" className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
      {loading ? <StatusPanel title="Chargement du catalogue…" message="Lecture des formations et de leurs offres dans Supabase." /> : null}
      {!loading && rows.length === 0 && !error ? <StatusPanel title="Aucune formation trouvée" message="Le catalogue apparaîtra après l’application des migrations et du seed Supabase." /> : null}

      <div className="space-y-3">
        {visibleRows.map((course) => {
          const values = prices[course.id] || { XAF: '', EUR: '' };
          return (
            <article key={course.id} className="grid gap-4 rounded-xl border border-[#262a33] bg-[#181c24] p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#4cd7f6]">{course.code}</span>
                  <span className="rounded-md bg-[#262a33] px-2 py-0.5 text-[11px] text-[#c7c4d7]">{categoryLabels[course.category] || course.category}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${course.status === 'published' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}>{course.status === 'published' ? 'Publié' : 'Brouillon'}</span>
                </div>
                <h2 className="mt-2 font-semibold text-white">{course.title}</h2>
                <button type="button" onClick={() => setSelectedCourse(course)} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#5557a8] bg-[#8083ff]/10 px-3 py-2 text-xs font-semibold text-[#c0c1ff] transition hover:bg-[#8083ff]/20">
                  <span className="material-symbols-outlined text-base">menu_book</span>Gérer chapitres et leçons
                </button>
                <p className="mt-1 truncate text-xs text-[#8f96a6]">/{course.slug}{course.offer ? ` · Offre ${course.offer.active ? 'active' : 'inactive'}` : ' · Aucune offre tarifée'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['XAF', 'EUR'] as const).map((currency) => (
                  <label key={currency} className="block space-y-1.5 text-xs font-semibold text-[#c7c4d7]">
                    Prix {currency}
                    <div className="relative">
                      <input className={`${inputClass} pr-12`} type="number" min="0" step={currency === 'XAF' ? '1' : '0.01'} inputMode="decimal" placeholder="Non défini" value={values[currency]} onChange={(event) => setPrices((current) => ({ ...current, [course.id]: { ...(current[course.id] || { XAF: '', EUR: '' }), [currency]: event.target.value } }))} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8f96a6]">{currency}</span>
                    </div>
                    {course.offer?.offer_prices.find((price) => price.currency === currency) && <span className="block font-normal text-[#8f96a6]">Enregistré : {formatPrice(course.offer.offer_prices.find((price) => price.currency === currency)!.amount_minor, currency)}</span>}
                  </label>
                ))}
              </div>

              <button type="button" onClick={() => void handleSavePrice(course)} disabled={savingId === course.id || loading} className={`${buttonClass} bg-[#8083ff] text-[#0d1020] hover:brightness-110`}>
                <span className="material-symbols-outlined text-base">save</span>{savingId === course.id ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </article>
          );
        })}
      </div>
      {visibleRows.length === 0 && rows.length > 0 && <p className="py-8 text-center text-sm text-[#8f96a6]">Aucune formation ne correspond à cette recherche.</p>}
    </div>
  );
};

const Header: React.FC<{ count: number }> = ({ count }) => (
  <header className="flex flex-col gap-3 border-b border-[#262a33] pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs text-[#8f96a6]"><span>Admin</span><span>›</span><span className="text-[#4cd7f6]">Formations & tarifs</span></div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Catalogue des formations</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#a9afbf]">Gère les prix XAF et EUR des offres de formation. Les formations restent en brouillon et les offres inactives tant que leur contenu n’est pas prêt.</p>
    </div>
    <span className="shrink-0 rounded-lg border border-[#31353e] bg-[#181c24] px-3 py-2 font-mono text-xs text-[#c0c1ff]">{count} formations</span>
  </header>
);

const StatusPanel: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="rounded-xl border border-[#262a33] bg-[#181c24] p-6 text-center">
    <h2 className="font-semibold text-white">{title}</h2><p className="mt-2 text-sm text-[#a9afbf]">{message}</p>
  </div>
);

const Alert: React.FC<{ message: string }> = ({ message }) => (
  <div role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{message}</div>
);
