alter table bradox_revenda.content
  add column if not exists featured_order integer not null default 0;

with ranked as (
  select
    id,
    row_number() over (
      partition by network_id
      order by published_at desc nulls last, created_at desc
    ) - 1 as next_order
  from bradox_revenda.content
  where is_featured = true
)
update bradox_revenda.content c
set featured_order = ranked.next_order
from ranked
where c.id = ranked.id;

create index if not exists idx_content_featured_order
  on bradox_revenda.content (network_id, is_featured desc, featured_order asc, published_at desc)
  where status <> 'archived';