-- Safe, auditable admin content editing and versioned seed protection.
CREATE TABLE IF NOT EXISTS admin_edit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_telegram_id BIGINT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id BIGINT NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_edit_logs_created_at
    ON admin_edit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_edit_logs_entity
    ON admin_edit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS seed_versions (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_by BIGINT;
