-- 用户表 (App级别) - 本地存储已登录的用户账号
create table if not exists user (
    user_id integer primary key autoincrement,
    server_url varchar(255) not null,
    username varchar(50) not null,
    nickname varchar(50) not null,
    avatar_url varchar(255),
    refresh_token varchar(255) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp,
    unique(server_url, username)
);
