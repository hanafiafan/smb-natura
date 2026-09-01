-- View-only role: same brand scoping as brand_admin (via user_brands), but every
-- mutating server action rejects it (see assertCanWrite in src/lib/session.ts).
alter type user_role add value 'viewer';
