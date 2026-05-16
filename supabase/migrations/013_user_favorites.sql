-- Favoritos por comensal (user_id texto hasta auth real). FK a restaurants.
create table if not exists public.user_favorites (
  user_id text not null,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

create index if not exists idx_user_favorites_user_id on public.user_favorites (user_id);

comment on table public.user_favorites is 'Restaurantes favoritos por usuario piloto (user_id).';

alter table public.user_favorites enable row level security;

create policy "Service role only"
  on public.user_favorites for all using (false) with check (false);
