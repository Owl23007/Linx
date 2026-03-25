-- Drop tables if they exist
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS room_members;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS "groups";
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    status VARCHAR(50),
    last_seen_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create friendships table
CREATE TABLE friendships (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL,
    addressee_id BIGINT NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    remark VARCHAR(255)
);

-- Create groups table
CREATE TABLE "groups" (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    owner_id BIGINT NOT NULL,
    avatar_url VARCHAR(500),
    max_members INTEGER DEFAULT 500,
    type VARCHAR(50),
    status VARCHAR(50),
    require_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create rooms table
CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    room_code VARCHAR(32) NOT NULL UNIQUE,
    game_name VARCHAR(255),
    network_name VARCHAR(255) NOT NULL,
    network_secret VARCHAR(255) NOT NULL,
    relay_addresses TEXT NOT NULL,
    owner_id BIGINT NOT NULL,
    status VARCHAR(50),
    max_members INTEGER DEFAULT 8,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create room_members table
CREATE TABLE room_members (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50),
    virtual_ip VARCHAR(64),
    connection_mode VARCHAR(50),
    joined_at TIMESTAMP,
    last_active_at TIMESTAMP,
    CONSTRAINT fk_room_members_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
);

-- Create group_members table
CREATE TABLE group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50),
    nickname VARCHAR(255),
    joined_at TIMESTAMP,
    last_active_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    mute_until TIMESTAMP,
    CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES "groups" (id) ON DELETE CASCADE
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    sender_id BIGINT NOT NULL,
    sender_name VARCHAR(255),
    receiver_id BIGINT,
    group_id VARCHAR(255),
    content TEXT,
    timestamp TIMESTAMP,
    extra TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_groups_owner ON "groups"(owner_id);
CREATE INDEX idx_rooms_owner ON rooms(owner_id);
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_group ON chat_messages(group_id);
CREATE INDEX idx_chat_messages_message_id ON chat_messages(message_id);
