begin;
select plan(8);

select has_table('public', 'learning_events', 'activity journal exists');
select has_table('public', 'study_plans', 'study plans exist');
select has_table('public', 'study_plan_pauses', 'study plan pauses exist');
select has_table('public', 'learning_experience_settings', 'threshold configuration exists');
select has_function('public', 'record_learning_events', array['jsonb'], 'event batch RPC exists');
select has_function('public', 'save_study_plan', array['uuid','integer','integer[]','date'], 'study plan RPC exists');
select has_function('public', 'course_learning_pace', array['uuid'], 'pace calculation RPC exists');
select has_function('public', 'course_public_stats', array['uuid'], 'public stats RPC exists');

select * from finish();
rollback;
