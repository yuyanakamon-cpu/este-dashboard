-- cast_auth テーブルに sns_credentials カラムを追加
-- Supabase SQL Editor で実行してください
ALTER TABLE cast_auth
  ADD COLUMN IF NOT EXISTS sns_credentials jsonb DEFAULT '{}';

-- インデックス（キャストIDで高速検索）
CREATE INDEX IF NOT EXISTS idx_cast_auth_cast_id ON cast_auth(cast_id);
