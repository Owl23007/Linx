-- 用户级别数据库初始化脚本
-- 每个用户都会有独立的数据库文件，使用基于用户ID派生的DEK加密

-- 用户个人设置表
create table if not exists user_settings (
    id integer primary key autoincrement,
    setting_key varchar(100) not null unique,
    setting_value text,
    is_sensitive boolean default false, -- 敏感数据标识
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);

-- 用户数据表
create table if not exists user_data (
    id integer primary key autoincrement,
    data_type varchar(50) not null, -- 数据类型 (notes, files, messages, etc.)
    title varchar(255),
    content text, -- 加密存储的内容
    metadata text, -- 元数据 (使用JSON字符串存储)
    tags varchar(500), -- 标签
    is_encrypted boolean default true, -- 内容是否加密
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);

-- 为用户数据表创建索引
create index if not exists idx_user_data_type on user_data(data_type);
create index if not exists idx_user_data_created_at on user_data(created_at);

-- 用户文件索引表
create table if not exists user_files (
    id integer primary key autoincrement,
    file_name varchar(255) not null,
    file_path varchar(500) not null,
    file_size bigint,
    file_hash varchar(64), -- 文件哈希值
    mime_type varchar(100),
    is_encrypted boolean default true,
    encryption_method varchar(50) default 'aes-256-gcm',
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);

-- 为用户文件表创建索引
create index if not exists idx_user_files_name on user_files(file_name);
create index if not exists idx_user_files_hash on user_files(file_hash);

-- 用户操作日志表
create table if not exists user_logs (
    id integer primary key autoincrement,
    action varchar(100) not null,
    resource_type varchar(50),
    resource_id varchar(100),
    details text, -- 详情 (使用JSON字符串存储)
    ip_address varchar(45),
    user_agent text,
    created_at timestamp default current_timestamp
);

-- 为用户日志表创建索引
create index if not exists idx_user_logs_action on user_logs(action);
create index if not exists idx_user_logs_created_at on user_logs(created_at);

-- 用户会话历史表
create table if not exists user_session_history (
    id integer primary key autoincrement,
    session_id varchar(100),
    login_time timestamp,
    logout_time timestamp,
    device_info varchar(255),
    ip_address varchar(45),
    status varchar(20) default 'active', -- 'active', 'expired', 'revoked'
    created_at timestamp default current_timestamp
);

-- 数据库元信息表
create table if not exists db_meta (
    id integer primary key autoincrement,
    meta_key varchar(100) not null unique,
    meta_value text,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);

-- 插入数据库版本信息
insert or ignore into db_meta (meta_key, meta_value) values
('db_version', '1.0.0'),
('created_at', datetime('now')),
('encryption_enabled', 'true'),
('encryption_algorithm', 'aes-256-gcm');
