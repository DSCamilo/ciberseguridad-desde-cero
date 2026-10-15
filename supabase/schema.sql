-- Esquema para sincronizar el progreso de las rutas.
-- Ejecutalo una vez en Supabase: SQL Editor -> New query -> pegar -> Run.

create table if not exists public.progreso (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  ruta       text        not null check (ruta in ('ruta-ciberseguridad', 'threat-intelligence')),
  progreso   jsonb       not null default '{}'::jsonb,
  notas      jsonb       not null default '{}'::jsonb,
  config     jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, ruta)
);

-- Cada persona solo ve y modifica sus propias filas.
alter table public.progreso enable row level security;

create policy "leer lo propio"      on public.progreso for select using (auth.uid() = user_id);
create policy "insertar lo propio"  on public.progreso for insert with check (auth.uid() = user_id);
create policy "actualizar lo propio" on public.progreso for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "borrar lo propio"    on public.progreso for delete using (auth.uid() = user_id);

-- Permisos de la tabla para usuarios con sesion iniciada.
-- Hacen falta porque el proyecto no expone tablas nuevas automaticamente.
-- Sin sesion (rol anon) no hay acceso a nada.
grant select, insert, update, delete on public.progreso to authenticated;

-- updated_at lo fija el servidor en cada insert o update. El sitio lo usa para
-- saber si hay cambios nuevos desde otro dispositivo.
create or replace function public.progreso_set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists progreso_updated_at on public.progreso;
create trigger progreso_updated_at
  before insert or update on public.progreso
  for each row execute function public.progreso_set_updated_at();
