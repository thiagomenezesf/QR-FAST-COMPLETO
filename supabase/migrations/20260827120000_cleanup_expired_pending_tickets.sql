alter table public.tickets
  add column if not exists expires_at timestamptz;

update public.tickets
set expires_at = created_at + interval '1 hour'
where status = 'pending'
  and payment_status = 'pending'
  and expires_at is null;

create index if not exists tickets_pending_expiration_idx
  on public.tickets (expires_at)
  where status = 'pending' and payment_status = 'pending';

create extension if not exists pg_cron with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'delete-expired-pending-tickets') then
    perform cron.unschedule('delete-expired-pending-tickets');
  end if;

  perform cron.schedule(
    'delete-expired-pending-tickets',
    '*/10 * * * *',
    $job$delete from public.tickets
      where status = 'pending'
        and payment_status = 'pending'
        and expires_at is not null
        and expires_at <= now();$job$
  );
end;
$$;
