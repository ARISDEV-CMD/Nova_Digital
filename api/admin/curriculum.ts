import { createApiHandler, jsonResponse } from '../_lib/http.ts';
import { requireAdmin } from '../_lib/app-session.ts';
import { UUID } from '../_lib/learning.ts';
import { getServiceClient } from '../_lib/supabase-admin.ts';

const selectCourse = 'id,code,title,current_version_id,draft_version_id,status,short_description,description,learning_outcomes,level,estimated_minutes,cover_image_url,content_source,reviewed_at,rights_verified_at';
const lessonColumns = 'id,chapter_id,course_id,position,title,lesson_type,duration_minutes,summary,is_free_preview,preview_requires_login,published';

export default createApiHandler(async (request) => {
  const { user } = await requireAdmin(request);
  const client = getServiceClient();
  const params = new URL(request.url).searchParams;
  const courseId = params.get('courseId') || '';
  if (request.method === 'GET') {
    if (!UUID.test(courseId)) return jsonResponse({ error: 'Formation invalide.' }, 400);
    const { data: course, error: courseError } = await client.from('courses').select(selectCourse).eq('id', courseId).maybeSingle();
    if (courseError) throw courseError;
    if (!course) return jsonResponse({ error: 'Formation introuvable.' }, 404);
    const versionId = params.get('versionId');
    const editableVersion = course.draft_version_id || (course.status !== 'published' ? course.current_version_id : null);
    if (!versionId || versionId !== editableVersion) return jsonResponse({ chapters: [], lessons: [], contents: [], quizQuestions: [] });
    const { data: chapters, error: chapterError } = await client.from('course_chapters').select('id,course_id,version_id,position,title,description').eq('version_id', versionId).order('position');
    if (chapterError) throw chapterError;
    const chapterIds = (chapters || []).map((chapter) => chapter.id);
    const { data: lessons, error: lessonError } = chapterIds.length ? await client.from('course_lessons').select(lessonColumns).in('chapter_id', chapterIds).order('position') : { data: [], error: null };
    if (lessonError) throw lessonError;
    const lessonIds = (lessons || []).map((lesson) => lesson.id);
    const [{ data: contents, error: contentError }, { data: quizQuestions, error: quizError }] = lessonIds.length ? await Promise.all([
      client.from('course_lesson_contents').select('lesson_id,body_md,video_storage_path,project_instructions').in('lesson_id', lessonIds),
      client.from('quiz_questions').select('id,lesson_id,position,prompt_md,options,quiz_answer_keys(correct_option_ids,explanation_md)').in('lesson_id', lessonIds).order('position'),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    if (contentError || quizError) throw contentError || quizError;
    return jsonResponse({ course, chapters: chapters || [], lessons: lessons || [], contents: contents || [], quizQuestions: quizQuestions || [] });
  }
  if (request.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  const body = await request.json().catch(() => null) as Record<string, any> | null;
  if (!body || typeof body.action !== 'string') return jsonResponse({ error: 'Action invalide.' }, 400);
  if (!UUID.test(body.courseId)) return jsonResponse({ error: 'Formation invalide.' }, 400);
  const { data: course, error: courseError } = await client.from('courses').select(selectCourse).eq('id', body.courseId).maybeSingle();
  if (courseError) throw courseError;
  if (!course) return jsonResponse({ error: 'Formation introuvable.' }, 404);
  const versionId = body.versionId || course.draft_version_id || (course.status !== 'published' ? course.current_version_id : null);
  const assertEditableVersion = () => {
    const expected = course.draft_version_id || (course.status !== 'published' ? course.current_version_id : null);
    if (!versionId || versionId !== expected) throw new Response('Version de travail invalide.', { status: 403 });
  };
  const getEditableLesson = async (lessonId: unknown) => {
    assertEditableVersion();
    if (typeof lessonId !== 'string' || !UUID.test(lessonId)) return null;
    const { data: lesson, error } = await client.from('course_lessons').select('id,course_id,chapter_id').eq('id', lessonId).eq('course_id', course.id).maybeSingle();
    if (error) throw error;
    if (!lesson) return null;
    const { data: chapter, error: chapterError } = await client.from('course_chapters').select('version_id').eq('id', lesson.chapter_id).maybeSingle();
    if (chapterError) throw chapterError;
    return chapter?.version_id === versionId ? lesson : null;
  };
  const reload = async () => {
    const { data, error } = await client.from('courses').select(selectCourse).eq('id', course.id).single();
    if (error) throw error;
    return data;
  };
  if (body.action === 'uploadVideo') {
    if (typeof body.fileName !== 'string' || !body.fileName || body.fileName.length > 240) return jsonResponse({ error: 'Fichier invalide.' }, 400);
    const lesson = await getEditableLesson(body.lessonId);
    if (!lesson) return jsonResponse({ error: 'Leçon introuvable dans la version de travail.' }, 404);
    const path = `courses/${course.id}/${lesson.id}/${crypto.randomUUID()}-${body.fileName.replace(/[^\p{L}\p{N}._-]+/gu, '-')}`;
    const { data, error } = await client.storage.from('course-content').createSignedUploadUrl(path);
    if (error) throw error;
    return jsonResponse({ path, token: data.token });
  }
  switch (body.action) {
    case 'forkVersion': {
      const { data, error } = await client.rpc('app_admin_fork_course_version', { p_user: user.id, p_course: course.id });
      if (error) throw error;
      return jsonResponse({ versionId: data });
    }
    case 'saveMetadata': {
      const values = body.metadata;
      if (!values || !Array.isArray(values.learning_outcomes) || values.learning_outcomes.length === 0 || !['beginner', 'intermediate', 'advanced', 'all_levels'].includes(values.level)) return jsonResponse({ error: 'Fiche éditoriale invalide.' }, 400);
      const { error } = await client.from('courses').update({ short_description: String(values.short_description || '').trim(), description: String(values.description || '').trim(), description_md: String(values.description || '').trim(), learning_outcomes: values.learning_outcomes.map((item: unknown) => String(item).trim()).filter(Boolean), level: values.level, estimated_minutes: Math.max(0, Number(values.estimated_minutes) || 0), cover_image_url: values.cover_image_url || null, content_source: values.content_source || null, reviewed_at: values.reviewed ? (course.reviewed_at || new Date().toISOString()) : null, rights_verified_at: values.rights_verified ? (course.rights_verified_at || new Date().toISOString()) : null }).eq('id', course.id);
      if (error) throw error;
      return jsonResponse({ saved: true });
    }
    case 'publishCourse': {
      const { error } = await client.rpc('app_admin_publish_course', { p_user: user.id, p_course: course.id });
      if (error) throw error;
      return jsonResponse({ course: await reload() });
    }
    case 'addChapter': {
      assertEditableVersion();
      if (typeof body.title !== 'string' || !body.title.trim()) return jsonResponse({ error: 'Titre de chapitre requis.' }, 400);
      const { count, error: countError } = await client.from('course_chapters').select('id', { count: 'exact', head: true }).eq('version_id', versionId);
      if (countError) throw countError;
      const { data, error } = await client.from('course_chapters').insert({ course_id: course.id, version_id: versionId, position: (count || 0) + 1, title: body.title.trim(), description: '' }).select('id,course_id,version_id,position,title,description').single();
      if (error) throw error;
      return jsonResponse({ chapter: data });
    }
    case 'saveChapter': {
      assertEditableVersion();
      if (!UUID.test(body.chapterId)) return jsonResponse({ error: 'Chapitre invalide.' }, 400);
      const { data, error } = await client.from('course_chapters').update({ title: String(body.title || '').trim(), description: String(body.description || '') }).eq('id', body.chapterId).eq('version_id', versionId).select('id').maybeSingle();
      if (error) throw error;
      if (!data) return jsonResponse({ error: 'Chapitre introuvable.' }, 404);
      return jsonResponse({ saved: true });
    }
    case 'deleteChapter': {
      assertEditableVersion();
      if (typeof body.chapterId !== 'string' || !UUID.test(body.chapterId)) return jsonResponse({ error: 'Chapitre invalide.' }, 400);
      const { error } = await client.from('course_chapters').delete().eq('id', body.chapterId).eq('version_id', versionId);
      if (error) throw error;
      return jsonResponse({ saved: true });
    }
    case 'movePosition': {
      assertEditableVersion();
      if (body.table !== 'chapters' && body.table !== 'lessons') return jsonResponse({ error: 'Type de déplacement invalide.' }, 400);
      if (!Array.isArray(body.moves) || body.moves.length !== 3 || body.moves.some((item: any) => !UUID.test(item.id) || !Number.isInteger(item.position))) return jsonResponse({ error: 'Ordre invalide.' }, 400);
      for (const item of body.moves) {
        let query = client.from(body.table === 'chapters' ? 'course_chapters' : 'course_lessons').update({ position: item.position }).eq('id', item.id);
        query = body.table === 'chapters' ? query.eq('version_id', versionId) : query.eq('course_id', course.id);
        const { error } = await query;
        if (error) throw error;
      }
      return jsonResponse({ saved: true });
    }
    case 'addLesson': {
      assertEditableVersion();
      const { data: chapter, error: chapterError } = await client.from('course_chapters').select('id').eq('id', body.chapterId).eq('version_id', versionId).maybeSingle();
      if (chapterError) throw chapterError;
      if (!chapter) return jsonResponse({ error: 'Chapitre introuvable.' }, 404);
      const { count, error: countError } = await client.from('course_lessons').select('id', { count: 'exact', head: true }).eq('chapter_id', chapter.id);
      if (countError) throw countError;
      const { data, error } = await client.from('course_lessons').insert({ course_id: course.id, chapter_id: chapter.id, position: (count || 0) + 1, title: 'Nouvelle leçon', lesson_type: 'video', duration_minutes: 0, summary: '', is_free_preview: false, preview_requires_login: false, published: false }).select(lessonColumns).single();
      if (error) throw error;
      const { error: contentError } = await client.from('course_lesson_contents').upsert({ lesson_id: data.id }, { onConflict: 'lesson_id' });
      if (contentError) throw contentError;
      return jsonResponse({ lesson: data });
    }
    case 'saveLesson': {
      if (!UUID.test(body.lessonId) || !body.lesson || typeof body.lesson.title !== 'string' || !body.lesson.title.trim()) return jsonResponse({ error: 'Leçon invalide.' }, 400);
      if (!['video', 'text', 'quiz', 'project', 'exercise'].includes(body.lesson.lesson_type) || typeof body.lesson.is_free_preview !== 'boolean' || typeof body.lesson.preview_requires_login !== 'boolean' || typeof body.lesson.published !== 'boolean') return jsonResponse({ error: 'Paramètres de leçon invalides.' }, 400);
      const lesson = await getEditableLesson(body.lessonId);
      if (!lesson) return jsonResponse({ error: 'Leçon introuvable dans la version de travail.' }, 404);
      if (body.lesson.lesson_type === 'quiz' && (!Array.isArray(body.quiz) || body.quiz.length < 1 || body.quiz.length > 100 || body.quiz.some((question: any) => typeof question?.prompt_md !== 'string' || !Array.isArray(question.options) || question.options.length < 2 || !Array.isArray(question.correct_option_ids) || question.correct_option_ids.some((id: unknown) => typeof id !== 'string')))) return jsonResponse({ error: 'Quiz invalide.' }, 400);
      if (body.videoPath && (typeof body.videoPath !== 'string' || !body.videoPath.startsWith(`courses/${course.id}/${lesson.id}/`))) return jsonResponse({ error: 'Chemin vidéo invalide.' }, 400);
      const { data: lessonRow, error: lessonError } = await client.from('course_lessons').update({ title: body.lesson.title.trim(), lesson_type: body.lesson.lesson_type, duration_minutes: Math.max(0, Number(body.lesson.duration_minutes) || 0), summary: String(body.lesson.summary || ''), is_free_preview: Boolean(body.lesson.is_free_preview), preview_requires_login: Boolean(body.lesson.preview_requires_login), published: Boolean(body.lesson.published) }).eq('id', body.lessonId).eq('course_id', course.id).select('id').maybeSingle();
      if (lessonError) throw lessonError;
      if (!lessonRow) return jsonResponse({ error: 'Leçon introuvable.' }, 404);
      const { error: contentError } = await client.from('course_lesson_contents').upsert({ lesson_id: body.lessonId, body_md: body.bodyMd || null, video_storage_path: body.videoPath || null, project_instructions: body.projectInstructions || null }, { onConflict: 'lesson_id' });
      if (contentError) throw contentError;
      if (body.lesson.lesson_type === 'quiz') {
        const insertedIds: string[] = [];
        for (const [index, question] of body.quiz.entries()) {
          const { data, error } = await client.from('quiz_questions').upsert({ lesson_id: body.lessonId, position: index + 1, prompt_md: question.prompt_md, options: question.options }, { onConflict: 'lesson_id,position' }).select('id').single();
          if (error) throw error;
          insertedIds.push(data.id);
          const { error: answerError } = await client.from('quiz_answer_keys').upsert({ question_id: data.id, correct_option_ids: question.correct_option_ids, explanation_md: question.explanation_md || null }, { onConflict: 'question_id' });
          if (answerError) throw answerError;
        }
        const { data: oldQuestions, error: oldError } = await client.from('quiz_questions').select('id').eq('lesson_id', body.lessonId);
        if (oldError) throw oldError;
        const obsoleteIds = (oldQuestions || []).map((row) => row.id).filter((id) => !insertedIds.includes(id));
        if (obsoleteIds.length) {
          const { error } = await client.from('quiz_questions').delete().in('id', obsoleteIds);
          if (error) throw error;
        }
      }
      return jsonResponse({ saved: true });
    }
    case 'deleteLesson': {
      const lesson = await getEditableLesson(body.lessonId);
      if (!lesson) return jsonResponse({ error: 'Leçon introuvable dans la version de travail.' }, 404);
      const { error } = await client.from('course_lessons').delete().eq('id', lesson.id).eq('course_id', course.id);
      if (error) throw error;
      return jsonResponse({ saved: true });
    }
    default: return jsonResponse({ error: 'Action inconnue.' }, 400);
  }
});

