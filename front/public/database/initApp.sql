-- 用户表
create table if not exists user (
    id int primary key auto_increment, -- 自增主键
    server_url varchar(255) not null,
    username varchar(50) not null unique,
    nickname varchar(50) not null,
    instance_id varchar(100) not null, -- 实例ID
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);
