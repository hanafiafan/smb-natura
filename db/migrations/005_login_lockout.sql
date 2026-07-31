-- Brute-force protection: lock an account out for a while after too many bad passwords.
-- Policy itself (threshold/duration) lives in src/lib/login-lockout.ts, not in the schema.

alter table users add column failed_attempts int not null default 0;
alter table users add column locked_until timestamptz;
