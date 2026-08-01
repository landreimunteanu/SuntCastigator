-- Seed rows for `settings`. Safe to re-run.
-- Values are tunables the app reads at runtime; change here, not in code.

insert into settings (key, value) values
  ('prize_tax_threshold_lei',      jsonb_build_object('value', 600)),
  ('prize_tax_rate',               jsonb_build_object('value', 0.10)),
  ('entry_rate_limit_per_ip_hour', jsonb_build_object('limit', 20))
on conflict (key) do nothing;
