# Linx Chat System API

这是Linx项目的聊天系统后端实现，包含用户好友管理和群聊功能，使用WebSocket实现实时通信。

## 功能特性

### 核心功能
- 用户管理（注册、登录、信息更新）
- 好友系统（发送好友请求、接受/拒绝、好友列表）
- 群组聊天（创建群组、加入/离开群组、群成员管理）
- 实时消息传输（私聊、群聊）
- WebSocket实时通信

### 技术栈
- Spring Boot 3.5.3
- Spring Data JPA
- H2 数据库
- WebSocket + STOMP
- JWT（预留接口）
- Swagger/OpenAPI 3

## 快速开始

### 启动服务
```bash
cd server
mvn spring-boot:run
```

服务启动后：
- API服务：http://localhost:8080
- Swagger文档：http://localhost:8080/swagger-ui/index.html
- H2控制台：http://localhost:8080/h2-console
- WebSocket端点：ws://localhost:8080/ws

### H2数据库连接信息
- JDBC URL: `jdbc:h2:mem:linxdb`
- 用户名: `sa`
- 密码: （空）

## API说明

### 认证方式
目前API使用简单的Header认证方式：
```
User-Id: {userId}
```

### 主要接口

#### 用户管理
- `GET /api/user/me` - 获取当前用户信息
- `PUT /api/user/me` - 更新用户信息
- `POST /api/user/status` - 更新用户状态
- `GET /api/user/search` - 搜索用户

#### 好友管理
- `POST /api/friendship/request` - 发送好友请求
- `POST /api/friendship/respond` - 响应好友请求
- `GET /api/friendship/friends` - 获取好友列表
- `GET /api/friendship/requests/received` - 获取收到的好友请求
- `DELETE /api/friendship/friends/{friendId}` - 删除好友

#### 群组管理
- `POST /api/group` - 创建群组
- `GET /api/group/{groupId}` - 获取群组信息
- `POST /api/group/{groupId}/join` - 加入群组
- `POST /api/group/{groupId}/leave` - 离开群组
- `GET /api/group/my-groups` - 获取我的群组
- `GET /api/group/{groupId}/members` - 获取群组成员

#### 消息管理
- `GET /api/message/private/{targetUserId}` - 获取私聊消息
- `GET /api/message/group/{groupId}` - 获取群聊消息
- `GET /api/message/unread` - 获取未读消息
- `POST /api/message/{messageId}/read` - 标记消息已读

## WebSocket使用

### 连接
```javascript
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
    console.log('Connected: ' + frame);
});
```

### 发送私聊消息
```javascript
stompClient.send("/app/chat.private", {}, JSON.stringify({
    'content': '消息内容',
    'chatType': 'PRIVATE',
    'receiverId': 2,
    'type': 'TEXT'
}));
```

### 发送群聊消息
```javascript
stompClient.send("/app/chat.group", {}, JSON.stringify({
    'content': '群聊消息',
    'chatType': 'GROUP',
    'groupId': 1,
    'type': 'TEXT'
}));
```

### 订阅消息
```javascript
// 订阅私聊消息
stompClient.subscribe('/user/queue/messages', function(message) {
    const msg = JSON.parse(message.body);
    console.log('收到私聊消息:', msg);
});

// 订阅群聊消息
stompClient.subscribe('/topic/group/1', function(message) {
    const msg = JSON.parse(message.body);
    console.log('收到群聊消息:', msg);
});

// 订阅输入状态
stompClient.subscribe('/user/queue/typing', function(message) {
    const notification = JSON.parse(message.body);
    console.log('用户正在输入:', notification);
});
```

## 数据模型

### User（用户）
- id: 用户ID
- username: 用户名（唯一）
- email: 邮箱（唯一）
- nickname: 昵称
- status: 状态（ONLINE/OFFLINE/BUSY）

### Friendship（好友关系）
- id: 关系ID
- fromUser: 发起用户
- toUser: 目标用户
- status: 状态（PENDING/ACCEPTED/REJECTED/BLOCKED）
- requestTime: 请求时间
- responseTime: 响应时间

### Group（群组）
- id: 群组ID
- name: 群组名称
- description: 描述
- type: 类型（NORMAL/PRIVATE/TEMPORARY）
- maxMembers: 最大成员数
- owner: 群主
- status: 状态（ACTIVE/INACTIVE/DISBANDED）

### Message（消息）
- id: 消息ID
- content: 消息内容
- type: 类型（TEXT/IMAGE/FILE/VOICE/VIDEO/SYSTEM）
- sender: 发送者
- receiver: 接收者（私聊）
- group: 群组（群聊）
- chatType: 聊天类型（PRIVATE/GROUP）
- sendTime: 发送时间
- isRead: 是否已读

## 扩展说明

### JWT认证集成
代码预留了JWT认证接口，可以集成外部认证服务：
1. 在WebSocket控制器中从Principal解析用户信息
2. 在REST控制器中添加JWT验证拦截器
3. 实现用户注册登录接口

### n2n集成
本系统可以与现有的n2n Supernode管理功能结合：
1. 用户通过n2n建立虚拟局域网
2. 在虚拟网络中进行聊天通信
3. 群组可以对应n2n社区

### 性能优化
- 消息分页加载
- 离线消息推送
- 消息缓存
- 连接池优化

## 开发说明

### 项目结构
```
server/src/main/java/top/contins/linx/
├── config/          # 配置类
├── controller/      # 控制器
├── model/           # 数据模型
│   ├── entity/      # JPA实体
│   ├── dto/         # 数据传输对象
│   └── vo/          # 视图对象
├── repository/      # 数据访问层
└── service/         # 业务逻辑层
```

### 代码规范
- 使用Spring Boot最佳实践
- 事务管理（@Transactional）
- 异常处理
- 参数验证
- API文档（Swagger）

这是一个完整的聊天系统后端实现，支持好友管理和群聊功能，可以作为Linx项目的重要组成部分。