-- 数据库配置表
CREATE TABLE IF NOT EXISTS db_config (
  id INTEGER PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据库基础配置
INSERT OR IGNORE INTO db_config (config_key, config_value)
VALUES ('encryption_enabled', 'true');
INSERT OR IGNORE INTO db_config (config_key, config_value)
VALUES ('db_version', '2.0');
INSERT OR IGNORE INTO db_config (config_key, config_value)
VALUES ('require_auth', 'true');

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  background_url TEXT,
  status TEXT DEFAULT 'online',
  -- 用户级加密相关字段
  salt TEXT NOT NULL DEFAULT (hex(randomblob(32))),
  key_derivation_params TEXT NOT NULL DEFAULT '{"iterations":100000,"algorithm":"PBKDF2","keySize":32}',
  -- 账户安全
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME NULL,
  last_password_change DATETIME DEFAULT CURRENT_TIMESTAMP,
  password_expires_at DATETIME DEFAULT (datetime('now', '+90 days')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表（管理refresh token）
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  -- 会话安全增强
  device_fingerprint TEXT,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  revoke_reason TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 用户主密钥表
CREATE TABLE IF NOT EXISTS user_master_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  master_key_encrypted TEXT NOT NULL, -- 使用用户密码派生密钥加密
  key_version INTEGER DEFAULT 1,
  -- 密钥轮换支持
  previous_key_encrypted TEXT,
  rotation_schedule_days INTEGER DEFAULT 90,
  next_rotation_at DATETIME DEFAULT (datetime('now', '+90 days')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 消息表（支持加密）
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER,
  group_id INTEGER,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_path TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  -- 加密相关字段
  is_encrypted BOOLEAN DEFAULT TRUE,
  content_iv TEXT NOT NULL, -- 内容初始化向量
  key_version INTEGER DEFAULT 1,
  -- 消息完整性
  message_hash TEXT,
  -- 转发和引用
  reply_to_message_id INTEGER,
  forwarded_from_id INTEGER,
  -- 消息状态
  deleted_at DATETIME NULL,
  edited_at DATETIME NULL,
  FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_message_id) REFERENCES messages (id) ON DELETE SET NULL,
  FOREIGN KEY (forwarded_from_id) REFERENCES messages (id) ON DELETE SET NULL
);

-- 群组表（支持加密）
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  creator_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- 群组加密相关字段
  group_key_encrypted TEXT, -- 使用创建者主密钥加密的群组密钥
  group_key_iv TEXT,
  key_version INTEGER DEFAULT 1,
  FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 群组成员表（每个成员的群组密钥副本）
CREATE TABLE IF NOT EXISTS group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- 群组密钥副本（使用成员主密钥加密）
  group_key_encrypted TEXT,
  group_key_iv TEXT,
  key_version INTEGER DEFAULT 1,
  FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

-- 朋友关系表
CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL,
  addressee_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- 加密备注
  notes_encrypted TEXT,
  notes_iv TEXT,
  -- 好友分组
  friend_group TEXT DEFAULT 'default',
  -- 隐私设置
  allow_messages BOOLEAN DEFAULT TRUE,
  allow_calls BOOLEAN DEFAULT TRUE,
  blocked_at DATETIME NULL,
  FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (addressee_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE(requester_id, addressee_id)
);

-- 用户加密配置表（重新设计）
DROP TABLE IF EXISTS user_encryption;
CREATE TABLE IF NOT EXISTS user_encryption_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  encryption_enabled BOOLEAN DEFAULT TRUE,
  auto_encrypt_messages BOOLEAN DEFAULT TRUE,
  key_rotation_days INTEGER DEFAULT 90,
  backup_key_encrypted TEXT, -- 备份密钥
  config_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 加密用户数据表（优化）
DROP TABLE IF EXISTS encrypted_user_data;
CREATE TABLE IF NOT EXISTS user_private_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  data_type TEXT NOT NULL, -- 'profile', 'settings', 'contacts', 'notes'
  data_encrypted TEXT NOT NULL,
  data_iv TEXT NOT NULL,
  key_version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 文件加密元数据表
CREATE TABLE IF NOT EXISTS encrypted_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  original_filename TEXT NOT NULL,
  encrypted_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_key_encrypted TEXT NOT NULL, -- 使用用户主密钥加密的文件密钥
  file_key_iv TEXT NOT NULL,
  mime_type TEXT,
  checksum TEXT NOT NULL,
  key_version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- 应用设置表（保持原有结构）
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户访问控制表
CREATE TABLE IF NOT EXISTS user_access_control (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  resource_type TEXT NOT NULL, -- 'messages', 'files', 'groups', etc
  access_level TEXT DEFAULT 'read', -- 'read', 'write', 'admin'
  granted_by INTEGER,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users (id) ON DELETE SET NULL
);

-- 数据访问日志表
CREATE TABLE IF NOT EXISTS data_access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  record_id INTEGER,
  access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- 密钥轮换历史表
CREATE TABLE IF NOT EXISTS key_rotation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  old_key_version INTEGER NOT NULL,
  new_key_version INTEGER NOT NULL,
  rotation_reason TEXT, -- 'scheduled', 'compromised', 'manual'
  rotated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  rotated_by INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (rotated_by) REFERENCES users (id) ON DELETE SET NULL
);

-- 删除旧的ALTER TABLE语句，因为我们已经在CREATE TABLE中包含了is_encrypted字段

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_is_encrypted ON messages(is_encrypted);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_friendships_requester_id ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee_id ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

CREATE INDEX IF NOT EXISTS idx_user_master_keys_user_id ON user_master_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_encryption_config_user_id ON user_encryption_config(user_id);
CREATE INDEX IF NOT EXISTS idx_user_private_data_user_id ON user_private_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_private_data_type ON user_private_data(data_type);
CREATE INDEX IF NOT EXISTS idx_encrypted_files_user_id ON encrypted_files(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 创建触发器用于自动清理过期会话
CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
AFTER INSERT ON user_sessions
WHEN NEW.expires_at < datetime('now')
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < datetime('now')
  AND is_active = FALSE;
END;

-- 创建触发器用于审计重要操作
CREATE TRIGGER IF NOT EXISTS audit_user_login
AFTER INSERT ON user_sessions
BEGIN
  INSERT INTO audit_logs (user_id, session_id, action, resource_type, success, timestamp)
  VALUES (NEW.user_id, NEW.session_id, 'LOGIN', 'SESSION', TRUE, datetime('now'));
END;

CREATE TRIGGER IF NOT EXISTS audit_user_logout
AFTER UPDATE OF is_active ON user_sessions
WHEN OLD.is_active = TRUE AND NEW.is_active = FALSE
BEGIN
  INSERT INTO audit_logs (user_id, session_id, action, resource_type, success, timestamp)
  VALUES (NEW.user_id, NEW.session_id, 'LOGOUT', 'SESSION', TRUE, datetime('now'));
END;

CREATE TRIGGER IF NOT EXISTS audit_message_send
AFTER INSERT ON messages
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, success, timestamp)
  VALUES (NEW.sender_id, 'SEND_MESSAGE', 'MESSAGE', NEW.id, TRUE, datetime('now'));
END;

-- 创建视图用于安全查询（确保用户只能访问自己的数据）
CREATE VIEW IF NOT EXISTS user_accessible_messages AS
SELECT m.*
FROM messages m
WHERE m.sender_id = ?
   OR m.receiver_id = ?
   OR m.group_id IN (
     SELECT gm.group_id
     FROM group_members gm
     WHERE gm.user_id = ?
   );

-- 用户数据完整性检查触发器
CREATE TRIGGER IF NOT EXISTS check_user_data_access
BEFORE INSERT ON user_private_data
BEGIN
  SELECT CASE
    WHEN NEW.user_id IS NULL THEN
      RAISE(ABORT, 'User ID cannot be null')
  END;
END;

-- 会话安全检查触发器
CREATE TRIGGER IF NOT EXISTS validate_session_security
BEFORE INSERT ON user_sessions
BEGIN
  SELECT CASE
    WHEN NEW.expires_at <= datetime('now') THEN
      RAISE(ABORT, 'Session cannot expire in the past')
    WHEN length(NEW.refresh_token_hash) < 64 THEN
      RAISE(ABORT, 'Refresh token hash too short')
    WHEN (SELECT COUNT(*) FROM user_sessions WHERE user_id = NEW.user_id AND is_active = TRUE) >= 10 THEN
      RAISE(ABORT, 'Too many active sessions for user')
  END;
END;

-- 密钥轮换检查触发器
CREATE TRIGGER IF NOT EXISTS check_key_rotation
AFTER UPDATE ON user_master_keys
WHEN NEW.key_version != OLD.key_version
BEGIN
  INSERT INTO key_rotation_history (user_id, old_key_version, new_key_version, rotation_reason)
  VALUES (NEW.user_id, OLD.key_version, NEW.key_version, 'manual');
END;

-- 数据访问日志触发器
CREATE TRIGGER IF NOT EXISTS log_message_access
AFTER SELECT ON messages
FOR EACH ROW
BEGIN
  INSERT INTO data_access_logs (user_id, table_name, operation, record_id)
  VALUES (NULL, 'messages', 'SELECT', NEW.id);
END;

-- 用户账户锁定触发器
CREATE TRIGGER IF NOT EXISTS handle_failed_login
AFTER UPDATE OF failed_login_attempts ON users
WHEN NEW.failed_login_attempts >= 5 AND OLD.failed_login_attempts < 5
BEGIN
  UPDATE users
  SET locked_until = datetime('now', '+30 minutes')
  WHERE id = NEW.id;
END;

-- 自动解锁账户触发器
CREATE TRIGGER IF NOT EXISTS auto_unlock_account
BEFORE UPDATE ON users
WHEN NEW.locked_until IS NOT NULL AND NEW.locked_until < datetime('now')
BEGIN
  UPDATE users
  SET locked_until = NULL, failed_login_attempts = 0
  WHERE id = NEW.id;
END;

-- 清理过期数据触发器
CREATE TRIGGER IF NOT EXISTS cleanup_expired_data
AFTER INSERT ON audit_logs
WHEN datetime('now', 'weekday 0', '-7 days') > datetime('now', '-30 days')
BEGIN
  -- 清理30天前的审计日志
  DELETE FROM audit_logs WHERE timestamp < datetime('now', '-30 days');

  -- 清理过期的会话
  DELETE FROM user_sessions
  WHERE expires_at < datetime('now') AND is_active = FALSE;

  -- 清理过期的访问日志
  DELETE FROM data_access_logs WHERE access_time < datetime('now', '-7 days');
END;
