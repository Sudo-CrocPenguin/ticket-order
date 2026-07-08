create or replace function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_profile_id = auth.uid()
    or exists (
      select 1
      from public.company_memberships viewer
      join public.company_memberships target
        on target.company_id = viewer.company_id
       and target.user_id = p_profile_id
       and target.is_active = true
      where viewer.user_id = auth.uid()
        and viewer.is_active = true
        and viewer.role = 'admin'
    );
$$;

drop policy if exists company_memberships_select_company on public.company_memberships;
create policy company_memberships_select_company
on public.company_memberships
for select
to authenticated
using (user_id = auth.uid() or public.is_company_admin(company_id));
