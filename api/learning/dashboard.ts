import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { requireUser } from '../_lib/app-session.ts';
import { canAccessCourse } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

export default createApiHandler(async (request) => {
  const { user } = await requireUser(request);
  const client = getServiceClient();
  const { data: catalog, error: catalogError } = await client.from('courses')
    .select('id,title,slug,cover_image_url,estimated_minutes,current_version_id').eq('status', 'published').order('title');
  if (catalogError) throw catalogError;
  const coursesWithAccess = await Promise.all((catalog || []).map(async (course) => ({ course, allowed: await canAccessCourse(client, user, course.id) })));
  const allowedCourses = coursesWithAccess.filter(({ allowed }) => allowed).map(({ course }) => course);
  if (!allowedCourses.length) return jsonResponse({ courses: [] });
  const ids = allowedCourses.map((course) => course.id);
  const { data: chapters, error: chapterError } = await client.from('course_chapters')
    .select('id,course_id,version_id,title,position').in('course_id', ids).order('position');
  if (chapterError) throw chapterError;
  const currentChapters = (chapters || []).filter((chapter) => allowedCourses.some((course) => course.id === chapter.course_id && course.current_version_id === chapter.version_id));
  const chapterIds = currentChapters.map((chapter) => chapter.id);
  const [{ data: lessons, error: lessonError }, { data: resumes, error: resumeError }, { data: progress, error: progressError }] = await Promise.all([
    chapterIds.length ? client.from('course_lessons').select('id,course_id,chapter_id').in('chapter_id', chapterIds).eq('published', true) : Promise.resolve({ data: [], error: null }),
    client.from('course_resume').select('course_id,lesson_id,updated_at').eq('user_id', user.id).in('course_id', ids),
    client.from('lesson_progress').select('lesson_id,is_completed').eq('user_id', user.id),
  ]);
  if (lessonError || resumeError || progressError) throw lessonError || resumeError || progressError;
  const completedIds = new Set((progress || []).filter((row) => row.is_completed).map((row) => row.lesson_id));
  const rows = await Promise.all(allowedCourses.map(async (course) => {
    const courseLessons = (lessons || []).filter((lesson) => lesson.course_id === course.id && currentChapters.some((chapter) => chapter.id === lesson.chapter_id && chapter.course_id === course.id));
    const paceResult = await client.rpc('app_course_learning_pace', { p_user: user.id, p_course: course.id });
    if (paceResult.error) throw paceResult.error;
    const resume = (resumes || []).find((row) => row.course_id === course.id);
    return {
      ...course,
      lesson_count: courseLessons.length,
      completed_count: courseLessons.filter((lesson) => completedIds.has(lesson.id)).length,
      chapters: currentChapters.filter((chapter) => chapter.course_id === course.id).map((chapter) => {
        const chapterLessons = courseLessons.filter((lesson) => lesson.chapter_id === chapter.id);
        return { id: chapter.id, title: chapter.title, position: chapter.position, total: chapterLessons.length, done: chapterLessons.filter((lesson) => completedIds.has(lesson.id)).length };
      }),
      resume_lesson_id: resume?.lesson_id || null,
      updated_at: resume?.updated_at || null,
      pace: paceResult.data,
    };
  }));
  return jsonResponse({ courses: rows });
});

