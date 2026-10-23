-- Let signed-out visitors query published course outlines. Existing RLS policies
-- restrict these reads to published courses, the current version, and published
-- lesson metadata; lesson content, quiz answers, resources, and progress stay private.
grant select on table
  public.courses,
  public.course_versions,
  public.course_chapters,
  public.course_lessons
  to anon, authenticated;
