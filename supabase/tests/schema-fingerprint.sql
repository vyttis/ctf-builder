-- Read-only fingerprint of the schema the repo migrations own: public tables,
-- columns, constraints, indexes, RLS, policies (public and storage.objects),
-- functions, triggers, views, enums, realtime publication and the grants of
-- anon, authenticated, service_role and PUBLIC. Extension objects and the
-- grantor of a privilege are left out, so a fresh replay of
-- supabase/migrations and the production database can be compared.
--
-- Only SELECTs: safe to run in the production SQL Editor.
-- Summary (default): one row per kind with a count and an md5.
-- Detail: set `fingerprint.detail` to a kind first, e.g.
--   select set_config('fingerprint.detail', 'function', false);
-- and the query returns that kind's objects with their md5.
with
ext as (
  select objid from pg_depend where deptype = 'e'
),
roles as (
  select oid, rolname from pg_roles where rolname in ('anon', 'authenticated', 'service_role')
  union all select 0, 'PUBLIC'
),
tab as (
  select c.oid, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity, c.relacl
  from pg_class c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind in ('r', 'p', 'v', 'm', 'S')
    and c.oid not in (select objid from ext)
),
fn as (
  select p.oid, p.oid::regprocedure::text as sig, p.prosecdef, p.provolatile, p.proconfig,
         p.prorettype::regtype::text as ret, l.lanname,
         regexp_replace(p.prosrc, '\s+', ' ', 'g') as src, p.proacl
  from pg_proc p join pg_language l on l.oid = p.prolang
  where p.pronamespace = 'public'::regnamespace
    and p.oid not in (select objid from ext)
),
x as (
  select 'table' as kind, relname as name,
         md5(relkind::text || '|' || relrowsecurity || '|' || relforcerowsecurity) as v
  from tab
  union all
  select 'column', t.relname || '.' || a.attname,
         md5(format_type(a.atttypid, a.atttypmod) || '|' || a.attnotnull || '|' || a.attgenerated::text || '|' ||
             a.attidentity::text || '|' || coalesce(regexp_replace(pg_get_expr(d.adbin, d.adrelid), '\s+', ' ', 'g'), ''))
  from tab t
  join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where t.relkind in ('r', 'p')
  union all
  select 'constraint', t.relname || '.' || c.conname,
         md5(regexp_replace(pg_get_constraintdef(c.oid), '\s+', ' ', 'g'))
  from pg_constraint c join tab t on t.oid = c.conrelid
  union all
  select 'index', indexname, md5(indexdef)
  from pg_indexes where schemaname = 'public'
    and indexname not in (select conname from pg_constraint where connamespace = 'public'::regnamespace)
  union all
  select 'policy', schemaname || '.' || tablename || '.' || policyname,
         md5(permissive || '|' || roles::text || '|' || cmd || '|' ||
             coalesce(regexp_replace(qual, '\s+', ' ', 'g'), '') || '|' ||
             coalesce(regexp_replace(with_check, '\s+', ' ', 'g'), ''))
  from pg_policies
  where schemaname = 'public' or (schemaname = 'storage' and tablename = 'objects')
  union all
  select 'function', sig,
         md5(prosecdef || '|' || provolatile::text || '|' || coalesce(array_to_string(array(select unnest(proconfig) order by 1), ','), '') ||
             '|' || ret || '|' || lanname || '|' || src)
  from fn
  union all
  select 'trigger', t.relname || '.' || g.tgname, md5(pg_get_triggerdef(g.oid))
  from pg_trigger g join tab t on t.oid = g.tgrelid
  where not g.tgisinternal
  union all
  select 'view', relname, md5(regexp_replace(pg_get_viewdef(oid), '\s+', ' ', 'g'))
  from tab where relkind in ('v', 'm')
  union all
  select 'enum', t.typname, md5(string_agg(e.enumlabel, ',' order by e.enumsortorder))
  from pg_type t join pg_enum e on e.enumtypid = t.oid
  where t.typnamespace = 'public'::regnamespace
  group by t.typname
  union all
  select 'realtime', tablename, md5('member')
  from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'
  union all
  select 'grant.table', t.relname || '.' || r.rolname,
         md5(string_agg(a.privilege_type, ',' order by a.privilege_type))
  from tab t cross join lateral aclexplode(t.relacl) a join roles r on r.oid = a.grantee
  group by t.relname, r.rolname
  union all
  select 'grant.column', t.relname || '.' || at.attname || '.' || r.rolname,
         md5(string_agg(a.privilege_type, ',' order by a.privilege_type))
  from tab t
  join pg_attribute at on at.attrelid = t.oid and at.attnum > 0 and not at.attisdropped and at.attacl is not null
  cross join lateral aclexplode(at.attacl) a join roles r on r.oid = a.grantee
  group by t.relname, at.attname, r.rolname
  union all
  select 'grant.function', f.sig || '.' || r.rolname, md5('EXECUTE')
  from fn f
  cross join lateral aclexplode(coalesce(f.proacl, acldefault('f', (select proowner from pg_proc where oid = f.oid)))) a
  join roles r on r.oid = a.grantee
)
select kind, count(*) as n, md5(string_agg(name || '=' || v, '/' order by name)) as fp, null as name
from x
where coalesce(current_setting('fingerprint.detail', true), '') = ''
group by kind
union all
select kind, null, v, name
from x
where kind = current_setting('fingerprint.detail', true)
order by 1, 4;
