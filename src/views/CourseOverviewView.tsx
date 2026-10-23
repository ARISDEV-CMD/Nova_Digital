import { useEffect, useState } from 'react';
import type { Product } from '../utils/shop-logic.ts';
import { supabase } from '../lib/supabase.ts';

type Chapter = { id: string; position: number; title: string; description: string };
type Lesson = { id: string; chapter_id: string; position: number; title: string; summary: string; lesson_type: string; duration_minutes: number; is_free_preview: boolean };
type CourseDetails = { description_md: string; learning_outcomes: string[]; estimated_minutes: number; level: string; prerequisites_md: string; current_version_id: string | null; draft_version_id: string | null };
const categoryCodes = new Set(['ai_automation', 'web_development', 'design_visual', 'digital_marketing', 'video_content', 'productivity', 'data_bi', 'cybersecurity', 'entrepreneurship', 'career']);

export function isLearningProduct(product: Product): boolean { return categoryCodes.has(product.category); }

export function CourseOverviewView({ product, canPreviewDrafts = false, onNavigate }: { product: Product; canPreviewDrafts?: boolean; onNavigate: (view: string, productId?: string) => void }) {
  const [details, setDetails] = useState<CourseDetails | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(product.courseStatus === 'published' || canPreviewDrafts);
  const [error, setError] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [publicStats, setPublicStats] = useState<{ visible: boolean; learners_count?: number; active_last_7_days?: number } | null>(null);

  useEffect(() => {
    if (!supabase || (product.courseStatus !== 'published' && !canPreviewDrafts)) return;
    const client = supabase;
    let active = true;
    const load = async () => {
      const [{ data: course, error: courseError }, { data: chapterRows, error: chapterError }, { data: lessonRows, error: lessonError }] = await Promise.all([
        client.from('courses').select('description_md,learning_outcomes,estimated_minutes,level,prerequisites_md').eq('id', product.id).maybeSingle(),
        client.from('course_chapters').select('id,position,title,description').eq('course_id', product.id).order('position'),
        client.from('course_lessons').select('id,chapter_id,position,title,summary,lesson_type,duration_minutes,is_free_preview').eq('course_id', product.id).eq('published', true).order('position'),
      ]);
      if (!active) return;
      if (courseError || chapterError || lessonError) setError(`Le programme n’a pas pu être chargé : ${(courseError || chapterError || lessonError)?.message}`);
      else { setDetails(course as CourseDetails); setChapters((chapterRows || []) as Chapter[]); setLessons((lessonRows || []) as Lesson[]); }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [canPreviewDrafts, product.courseStatus, product.id]);

  useEffect(() => {
    if (!supabase || product.courseStatus !== 'published') return;
    let active = true;
    void supabase.rpc('course_public_stats', { p_course: product.id }).then(({ data }) => {
      if (active && data) setPublicStats(data as typeof publicStats);
    });
    return () => { active = false; };
  }, [product.courseStatus, product.id]);

  const firstPreview = lessons.find((lesson) => lesson.is_free_preview);
  const totalMinutes = details?.estimated_minutes || 0;
  const effortMinutes = totalMinutes || lessons.reduce((total, lesson) => total + (lesson.lesson_type === 'video' ? Math.ceil(lesson.duration_minutes * 1.5) : lesson.duration_minutes || (lesson.lesson_type === 'quiz' ? 10 : lesson.lesson_type === 'exercise' ? 30 : 60)), 0);
  const estimatedWeeks = effortMinutes ? Math.ceil(effortMinutes / (weeklyHours * 60)) : 0;
  const durationLabel = totalMinutes ? `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60 ? `${totalMinutes % 60} min` : ''}` : product.formatLabel;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#0f131c] text-[#dfe2ee]">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-7 lg:px-6">
        <nav aria-label="Fil d’Ariane" className="flex items-center gap-2 text-xs text-[#8f96a6]"><button type="button" onClick={() => onNavigate('catalogue-formations')} className="hover:text-white">Formations</button><span>›</span><span className="text-white">{product.title}</span></nav>
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:items-center">
          <div className="space-y-5"><span className="inline-flex rounded-full border border-[#5557a8] bg-[#8083ff]/10 px-3 py-1 text-xs font-semibold text-[#c0c1ff]">{product.categoryLabel}</span><h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">{product.title}</h1><p className="max-w-3xl text-base leading-7 text-[#c7c4d7]">{product.description || product.subtitle || 'Le programme et les contenus de cette formation sont en cours de préparation.'}</p><div className="flex flex-wrap gap-3 text-xs text-[#a9afbf]"><span className="rounded-lg border border-[#31353e] bg-[#181c24] px-3 py-2">{details?.level || product.formatLabel}</span><span className="rounded-lg border border-[#31353e] bg-[#181c24] px-3 py-2">{durationLabel}</span><span className="rounded-lg border border-[#31353e] bg-[#181c24] px-3 py-2">{lessons.length} leçons publiées</span></div>
            {publicStats?.visible && <p className="text-sm text-[#a9afbf]">{publicStats.learners_count} apprenants · {publicStats.active_last_7_days} actifs cette semaine</p>}
            {product.courseStatus === 'published' ? <button type="button" onClick={() => onNavigate('lecteur', product.id)} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#8083ff] px-5 py-3 text-sm font-bold text-[#0d1020] hover:brightness-110"><span className="material-symbols-outlined">play_circle</span>{firstPreview ? 'Commencer l’aperçu gratuit' : 'Ouvrir le lecteur'}</button> : <p className="inline-flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-100"><span className="material-symbols-outlined">hourglass_top</span>Formation en préparation — le programme sera disponible à sa publication.</p>}
          </div>
          <div className="overflow-hidden rounded-xl border border-[#31353e] bg-[#181c24]"><div className="aspect-[16/10] bg-[#10141d]"><img src={product.image} alt="" className="h-full w-full object-cover" /></div><div className="space-y-3 p-5"><div className="text-xs uppercase tracking-wide text-[#8f96a6]">Tarif</div>{product.priceEur > 0 ? <div className="text-3xl font-bold text-white">{new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(product.priceEur)}</div> : <div className="text-sm font-semibold text-[#c0c1ff]">Prix à définir</div>}<p className="text-xs leading-5 text-[#8f96a6]">Accès aux leçons selon l’offre et ton abonnement actif.</p></div></div>
        </section>
        {product.courseStatus === 'published' && effortMinutes > 0 && <section aria-labelledby="pace-calculator-title" className="rounded-xl border border-[#262a33] bg-[#181c24] p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#4cd7f6]">Estimation personnalisée</p><h2 id="pace-calculator-title" className="mt-1 text-lg font-bold text-white">À ton rythme</h2><label htmlFor="weekly-study-hours" className="mt-3 block text-sm text-[#c7c4d7]">Combien d’heures par semaine peux-tu étudier ?</label><input id="weekly-study-hours" type="range" min="1" max="15" step="1" value={weeklyHours} onChange={(event) => setWeeklyHours(Number(event.target.value))} className="mt-3 w-full accent-[#8083ff]" /><div className="flex justify-between text-xs text-[#8f96a6]"><span>1 h</span><span>{weeklyHours} h / semaine</span><span>15 h</span></div></div><p className="rounded-lg border border-[#31353e] bg-[#10141d] px-4 py-3 text-sm text-[#dfe2ee]">Avec {weeklyHours} h par semaine, tu termines en environ <strong className="text-white">{estimatedWeeks} {estimatedWeeks > 1 ? 'semaines' : 'semaine'}</strong>.</p></div><p className="mt-3 text-xs text-[#8f96a6]">Cette estimation est indicative et basée sur environ {Math.round(effortMinutes / 60)} heures de travail.</p></section>}
        {error && <div role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {details?.learning_outcomes?.length ? <section className="rounded-xl border border-[#262a33] bg-[#181c24] p-5 sm:p-7"><h2 className="text-xl font-bold text-white">À la fin de cette formation, tu sauras</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{details.learning_outcomes.map((outcome,index)=><li key={`${index}-${outcome}`} className="flex gap-2 text-sm leading-6 text-[#c7c4d7]"><span className="material-symbols-outlined mt-0.5 text-base text-[#4cd7f6]">check_circle</span>{outcome}</li>)}</ul>{details.prerequisites_md && <div className="mt-6 border-t border-[#31353e] pt-4"><h3 className="text-sm font-semibold text-white">Prérequis</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#a9afbf]">{details.prerequisites_md}</p></div>}</section> : null}
        <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#4cd7f6]">Programme de la formation</p><h2 className="mt-1 text-2xl font-bold text-white">Chapitres et leçons</h2></div><span className="text-sm text-[#8f96a6]">{chapters.length} chapitres · {lessons.length} leçons</span></div>
          {loading ? <div role="status" className="rounded-xl border border-[#262a33] bg-[#181c24] p-6 text-sm text-[#a9afbf]">Chargement du programme…</div> : product.courseStatus !== 'published' ? <div className="rounded-xl border border-dashed border-[#343a46] bg-[#181c24] p-6 text-sm leading-6 text-[#a9afbf]">Le programme détaillé sera visible après publication de la formation.</div> : chapters.map((chapter) => <article key={chapter.id} className="overflow-hidden rounded-xl border border-[#262a33] bg-[#181c24]"><header className="border-b border-[#31353e] px-4 py-4 sm:px-5"><h3 className="font-semibold text-white">Chapitre {chapter.position} · {chapter.title}</h3>{chapter.description && <p className="mt-1 text-sm text-[#8f96a6]">{chapter.description}</p>}</header><div className="divide-y divide-[#262a33]">{lessons.filter((lesson) => lesson.chapter_id === chapter.id).map((lesson) => <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 sm:px-5"><span className="material-symbols-outlined text-[#8f96a6]">{lesson.is_free_preview ? 'play_circle' : 'lock'}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-white">{lesson.title}</p>{lesson.summary && <p className="mt-0.5 text-xs text-[#8f96a6]">{lesson.summary}</p>}</div><span className="shrink-0 text-xs text-[#8f96a6]">{lesson.duration_minutes} min</span>{lesson.is_free_preview && <span className="hidden shrink-0 rounded-full bg-[#4cd7f6]/10 px-2 py-1 text-[10px] text-[#4cd7f6] sm:inline">Aperçu gratuit</span>}</div>)}</div></article>)}
          {product.courseStatus === 'published' && !chapters.length && !loading && <div className="rounded-xl border border-dashed border-[#343a46] bg-[#181c24] p-6 text-sm text-[#a9afbf]">Le programme détaillé est en préparation.</div>}
        </section>
      </div>
    </div>
  );
}
