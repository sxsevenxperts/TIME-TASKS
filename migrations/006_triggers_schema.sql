-- Triggers schema para automações (clima, resumos, etc)
CREATE TABLE IF NOT EXISTS time_tasks_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('weather', 'summary', 'reminder')),
  enabled BOOLEAN DEFAULT true,
  -- Condição: {"condition": "temp > 30", "city": "São Paulo", ...}
  condition JSONB NOT NULL DEFAULT '{}',
  -- Ação: {"action": "notify", "channel": "in_app", "message": "..."}
  action JSONB NOT NULL DEFAULT '{}',
  -- Schedule: "daily", "weekly", "manual", etc
  schedule TEXT DEFAULT 'daily',
  -- Próxima execução
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Row-level security
ALTER TABLE time_tasks_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own triggers" ON time_tasks_triggers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own triggers" ON time_tasks_triggers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own triggers" ON time_tasks_triggers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own triggers" ON time_tasks_triggers
  FOR DELETE USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_time_tasks_triggers_user_id ON time_tasks_triggers(user_id);
CREATE INDEX idx_time_tasks_triggers_enabled ON time_tasks_triggers(enabled);
CREATE INDEX idx_time_tasks_triggers_next_run ON time_tasks_triggers(next_run_at);

-- Notificações
CREATE TABLE IF NOT EXISTS time_tasks_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES time_tasks_triggers(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('trigger', 'reminder', 'verse', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT, -- emoji ou ícone
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

ALTER TABLE time_tasks_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own notifications" ON time_tasks_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON time_tasks_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON time_tasks_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON time_tasks_notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_time_tasks_notifications_user_id ON time_tasks_notifications(user_id);
CREATE INDEX idx_time_tasks_notifications_read ON time_tasks_notifications(read);
CREATE INDEX idx_time_tasks_notifications_created ON time_tasks_notifications(created_at);
