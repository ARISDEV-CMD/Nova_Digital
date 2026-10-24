import type { ServerSupabaseClient } from './supabase-admin.ts';
import { getServiceClient } from './supabase-admin.ts';
import type { RequestSession } from './app-session.ts';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function canAccessCourse(client: ServerSupabaseClient, user: RequestSession['user'] | null, courseId: string) {
  if (user?.role === 'admin' || user?.role === 'editor') return true;
  if (!user) return false;
  const { data, error } = await client.from('learning_entitlements')
    .select('scope,course_id,starts_at,ends_at,revoked_at,source_order_id')
    .eq('user_id', user.id).is('revoked_at', null);
  if (error) throw error;
  const now = Date.now();
  const relevant = (data || []).filter((row) => new Date(row.starts_at).getTime() <= now && (!row.ends_at || new Date(row.ends_at).getTime() > now) && (row.scope === 'all_courses' || (row.scope === 'course' && row.course_id === courseId)));
  for (const entitlement of relevant) {
    if (!entitlement.source_order_id) return true;
    const { data: order, error: orderError } = await client.from('learning_orders').select('status').eq('id', entitlement.source_order_id).maybeSingle();
    if (orderError) throw orderError;
    if (order?.status !== 'refunded') return true;
  }
  return false;
}

export async function getAccessibleLesson(client: ServerSupabaseClient, user: RequestSession['user'] | null, lessonId: string) {
  const { data: lesson, error } = await client.from('course_lessons')
    .select('id,course_id,chapter_id,title,summary,lesson_type,duration_minutes,is_free_preview,preview_requires_login,published')
    .eq('id', lessonId).maybeSingle();
  if (error) throw error;
  if (!lesson) return { lesson: null, allowed: false };

  const { data: chapter, error: chapterError } = await client.from('course_chapters')
    .select('version_id').eq('id', lesson.chapter_id).maybeSingle();
  if (chapterError) throw chapterError;
  const { data: course, error: courseError } = await client.from('courses')
    .select('id,status,current_version_id,draft_version_id').eq('id', lesson.course_id).maybeSingle();
  if (courseError) throw courseError;
  if (!course || !chapter) return { lesson, allowed: false };

  const currentPublished = course.status === 'published' && course.current_version_id === chapter.version_id && lesson.published;
  const adminDraft = user?.role === 'admin' && course.draft_version_id === chapter.version_id;
  const courseAccess = await canAccessCourse(client, user, course.id);
  const previewAccess = lesson.is_free_preview && (!lesson.preview_requires_login || Boolean(user));
  return { lesson, allowed: (currentPublished && (previewAccess || courseAccess)) || Boolean(adminDraft) };
}

export async function getLessonPayload(client: ServerSupabaseClient, user: RequestSession['user'] | null, lessonId: string) {
  const { lesson, allowed } = await getAccessibleLesson(client, user, lessonId);
  if (!lesson) return null;
  const metadata = {
    id: lesson.id, course_id: lesson.course_id, chapter_id: lesson.chapter_id,
    title: lesson.title, summary: lesson.summary, type: lesson.lesson_type,
    duration_minutes: lesson.duration_minutes, is_free_preview: lesson.is_free_preview, locked: !allowed,
  };
  if (!allowed) return { lesson: metadata, content: null, quiz_questions: [], resources: [], progress: null };

  const [contentResult, questionsResult, resourcesResult, progressResult] = await Promise.all([
    client.from('course_lesson_contents').select('body_md,video_storage_path,project_instructions').eq('lesson_id', lessonId).maybeSingle(),
    client.from('quiz_questions').select('id,position,prompt_md,options').eq('lesson_id', lessonId).order('position'),
    client.from('course_resources').select('id,title,kind,requires_license,position').eq('lesson_id', lessonId).order('position'),
    user ? client.from('lesson_progress').select('is_completed,last_position_seconds').eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const error = contentResult.error || questionsResult.error || resourcesResult.error || progressResult.error;
  if (error) throw error;
  return { lesson: metadata, content: contentResult.data, quiz_questions: questionsResult.data || [], resources: resourcesResult.data || [], progress: progressResult.data };
}

export async function requireCourseUser(userId: string, courseId: string): Promise<{ client: ServerSupabaseClient; user: RequestSession['user']; allowed: boolean }> {
  const client = getServiceClient();
  const { data: profile, error } = await client.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (error) throw error;
  const user = { id: userId, role: profile?.role || 'customer' } as RequestSession['user'];
  return { client, user, allowed: await canAccessCourse(client, user, courseId) };
}
