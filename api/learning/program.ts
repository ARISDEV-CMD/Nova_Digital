import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { getRequestSession } from '../_lib/app-session.ts';
import { canAccessCourse, UUID } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  const courseId = new URL(request.url).searchParams.get('courseId') || '';
  if (!UUID.test(courseId)) return jsonResponse({ error: 'Formation invalide.' }, 400);
  const session = await getRequestSession(request);
  const client = getServiceClient();
  const { data: course, error: courseError } = await client.from('courses')
    .select('id,title,slug,status,description_md,prerequisites_md,learning_outcomes,level,estimated_minutes,current_version_id,draft_version_id')
    .eq('id', courseId).maybeSingle();
  if (courseError) throw courseError;
  if (!course || (course.status !== 'published' && session?.user.role !== 'admin')) return jsonResponse({ error: 'Formation introuvable.' }, 404);
  const versionId = session?.user.role === 'admin' && course.draft_version_id ? course.draft_version_id : course.current_version_id;
  if (!versionId) return jsonResponse({ error: 'Programme indisponible.' }, 404);
  const { data: chapters, error: chapterError } = await client.from('course_chapters')
    .select('id,position,title,description').eq('course_id', courseId).eq('version_id', versionId).order('position');
  if (chapterError) throw chapterError;
  const chapterIds = (chapters || []).map((chapter) => chapter.id);
  const { data: lessons, error: lessonError } = chapterIds.length ? await client.from('course_lessons')
    .select('id,chapter_id,position,title,summary,lesson_type,duration_minutes,is_free_preview,preview_requires_login')
    .eq('course_id', courseId).in('chapter_id', chapterIds).eq('published', true).order('position') : { data: [], error: null };
  if (lessonError) throw lessonError;
  const courseAccess = await canAccessCourse(client, session?.user || null, courseId);
  const accessRows = (lessons || []).map((lesson) => {
    const access = session?.user.role === 'admin' && versionId === course.draft_version_id
      ? true
      : course.status === 'published' && versionId === course.current_version_id && ((lesson.is_free_preview && (!lesson.preview_requires_login || Boolean(session))) || courseAccess);
    return { ...lesson, accessible: Boolean(access) };
  });
  const userId = session?.user.id;
  const lessonIds = (lessons || []).map((lesson) => lesson.id);
  const [{ data: progress, error: progressError }, { data: resume, error: resumeError }] = userId ? await Promise.all([
    lessonIds.length ? client.from('lesson_progress').select('lesson_id,is_completed,last_position_seconds').eq('user_id', userId).in('lesson_id', lessonIds) : Promise.resolve({ data: [], error: null }),
    client.from('course_resume').select('lesson_id').eq('user_id', userId).eq('course_id', courseId).maybeSingle(),
  ]) : [{ data: [], error: null }, { data: null, error: null }];
  if (progressError || resumeError) throw progressError || resumeError;
  return jsonResponse({
    course: { id: course.id, title: course.title, slug: course.slug, status: course.status, description_md: course.description_md, prerequisites_md: course.prerequisites_md, learning_outcomes: course.learning_outcomes, level: course.level, estimated_minutes: course.estimated_minutes, current_version_id: course.current_version_id, draft_version_id: course.draft_version_id },
    chapters: chapters || [], lessons: accessRows, progress: progress || [], resume_lesson_id: resume?.lesson_id || null,
  });
});
