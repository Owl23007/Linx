# Let's Talk - n2n P2P 聊天服务器 API 文档

## 概述

本API文档描述了基于n2n的P2P聊天异地组网软件的服务器端接口。主要提供Supernode服务器管理功能，支持创建、查询、更新、删除Supernode配置，以及检测Supernode连接状态等功能。

## 基本信息

- **API版本**: 1.0.0
- **基础URL**: `http://localhost:8080`
- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

所有API接口都使用统一的响应格式：

```json
{
    "code": 0,                    // 状态码，0表示成功，非0表示失败
    "message": "操作成功",         // 响应消息
    "data": {},                   // 响应数据，具体格式根据接口而定
    "timestamp": 1755790468957    // 时间戳
}
```

### 状态码说明

- `0`: 操作成功
- `1`: 通用错误
- 其他非零值: 特定错误码

## API 接口

### 1. 获取所有Supernode列表

获取系统中所有已配置的Supernode服务器列表。

**请求**
- **方法**: `GET`
- **路径**: `/api/supernode`
- **参数**: 无

**响应示例**
```json
{
    "code": 0,
    "message": "获取Supernode列表成功",
    "data": [
        {
            "id": "770a07ec-9945-4dff-ac9a-cd4c7783bf9f",
            "name": "默认Supernode 1",
            "host": "n2n1.ntop.org",
            "port": 7777,
            "status": "UNKNOWN",
            "latency": null,
            "location": "欧洲",
            "description": "系统默认Supernode服务器",
            "isDefault": true,
            "lastChecked": null,
            "createTime": "2025-08-21T15:34:09.941721358",
            "fullAddress": "n2n1.ntop.org:7777"
        }
    ],
    "timestamp": 1755790468957
}
```

### 2. 根据ID获取Supernode详情

根据指定ID获取单个Supernode服务器的详细信息。

**请求**
- **方法**: `GET`
- **路径**: `/api/supernode/{id}`
- **路径参数**:
  - `id` (string, 必需): Supernode的唯一标识符

**响应示例**
```json
{
    "code": 0,
    "message": "获取Supernode详情成功",
    "data": {
        "id": "770a07ec-9945-4dff-ac9a-cd4c7783bf9f",
        "name": "默认Supernode 1",
        "host": "n2n1.ntop.org",
        "port": 7777,
        "status": "ACTIVE",
        "latency": 85,
        "location": "欧洲",
        "description": "系统默认Supernode服务器",
        "isDefault": true,
        "lastChecked": "2025-08-21T15:34:44.335187090",
        "createTime": "2025-08-21T15:34:09.941721358",
        "fullAddress": "n2n1.ntop.org:7777"
    },
    "timestamp": 1755790468957
}
```

### 3. 创建新的Supernode

向系统中添加一个新的Supernode服务器。

**请求**
- **方法**: `POST`
- **路径**: `/api/supernode`
- **请求体**: JSON格式

**请求体结构**
```json
{
    "name": "测试Supernode",              // string, 必需, Supernode名称
    "host": "test.example.com",          // string, 必需, 服务器地址
    "port": 8888,                        // integer, 必需, 端口号(1-65535)
    "location": "亚洲",                  // string, 可选, 地理位置
    "description": "用于测试的Supernode", // string, 可选, 描述信息
    "isDefault": false                   // boolean, 可选, 是否为默认supernode
}
```

**响应示例**
```json
{
    "code": 0,
    "message": "创建Supernode成功",
    "data": {
        "id": "74cae7b5-b5c5-4ba8-9509-f6c2fa2f0da9",
        "name": "测试Supernode",
        "host": "test.example.com",
        "port": 8888,
        "status": "UNKNOWN",
        "latency": null,
        "location": "亚洲",
        "description": "用于测试的Supernode服务器",
        "isDefault": false,
        "lastChecked": null,
        "createTime": "2025-08-21T15:34:37.362735557",
        "fullAddress": "test.example.com:8888"
    },
    "timestamp": 1755790477362
}
```

### 4. 更新Supernode信息

更新指定ID的Supernode服务器信息。

**请求**
- **方法**: `PUT`
- **路径**: `/api/supernode/{id}`
- **路径参数**:
  - `id` (string, 必需): Supernode的唯一标识符
- **请求体**: JSON格式

**请求体结构**
```json
{
    "name": "更新后的名称",               // string, 可选, Supernode名称
    "host": "updated.example.com",       // string, 可选, 服务器地址
    "port": 9999,                        // integer, 可选, 端口号(1-65535)
    "location": "新地区",                // string, 可选, 地理位置
    "description": "更新后的描述",       // string, 可选, 描述信息
    "isDefault": true                    // boolean, 可选, 是否为默认supernode
}
```

**响应示例**
```json
{
    "code": 0,
    "message": "更新Supernode成功",
    "data": {
        "id": "74cae7b5-b5c5-4ba8-9509-f6c2fa2f0da9",
        "name": "更新后的名称",
        "host": "updated.example.com",
        "port": 9999,
        "status": "UNKNOWN",
        "latency": null,
        "location": "新地区",
        "description": "更新后的描述",
        "isDefault": true,
        "lastChecked": null,
        "createTime": "2025-08-21T15:34:37.362735557",
        "fullAddress": "updated.example.com:9999"
    },
    "timestamp": 1755790477362
}
```

### 5. 删除Supernode

从系统中删除指定ID的Supernode服务器。

**请求**
- **方法**: `DELETE`
- **路径**: `/api/supernode/{id}`
- **路径参数**:
  - `id` (string, 必需): Supernode的唯一标识符

**响应示例**
```json
{
    "code": 0,
    "message": "删除Supernode成功",
    "data": "删除成功",
    "timestamp": 1755790477362
}
```

### 6. 检测Supernode状态

检测指定Supernode服务器的连接状态和网络延迟。

**请求**
- **方法**: `POST`
- **路径**: `/api/supernode/{id}/check`
- **路径参数**:
  - `id` (string, 必需): Supernode的唯一标识符

**响应示例**
```json
{
    "code": 0,
    "message": "检测Supernode状态成功",
    "data": {
        "id": "74cae7b5-b5c5-4ba8-9509-f6c2fa2f0da9",
        "name": "测试Supernode",
        "host": "test.example.com",
        "port": 8888,
        "status": "ACTIVE",               // ACTIVE, INACTIVE, TIMEOUT, UNKNOWN
        "latency": 115,                   // 网络延迟(毫秒)
        "location": "亚洲",
        "description": "用于测试的Supernode服务器",
        "isDefault": false,
        "lastChecked": "2025-08-21T15:34:44.335187090",
        "createTime": "2025-08-21T15:34:37.362735557",
        "fullAddress": "test.example.com:8888"
    },
    "timestamp": 1755790484335
}
```

### 7. 获取活跃的Supernode列表

获取当前状态为活跃(ACTIVE)的Supernode服务器列表，按延迟排序。

**请求**
- **方法**: `GET`
- **路径**: `/api/supernode/active`
- **参数**: 无

**响应示例**
```json
{
    "code": 0,
    "message": "获取活跃Supernode列表成功",
    "data": [
        {
            "id": "770a07ec-9945-4dff-ac9a-cd4c7783bf9f",
            "name": "默认Supernode 1",
            "host": "n2n1.ntop.org",
            "port": 7777,
            "status": "ACTIVE",
            "latency": 85,
            "location": "欧洲",
            "description": "系统默认Supernode服务器",
            "isDefault": true,
            "lastChecked": "2025-08-21T15:34:44.335187090",
            "createTime": "2025-08-21T15:34:09.941721358",
            "fullAddress": "n2n1.ntop.org:7777"
        }
    ],
    "timestamp": 1755790491280
}
```

### 8. 获取默认Supernode列表

获取系统预设的默认Supernode服务器列表。

**请求**
- **方法**: `GET`
- **路径**: `/api/supernode/default`
- **参数**: 无

**响应示例**
```json
{
    "code": 0,
    "message": "获取默认Supernode列表成功",
    "data": [
        {
            "id": "770a07ec-9945-4dff-ac9a-cd4c7783bf9f",
            "name": "默认Supernode 1",
            "host": "n2n1.ntop.org",
            "port": 7777,
            "status": "UNKNOWN",
            "latency": null,
            "location": "欧洲",
            "description": "系统默认Supernode服务器",
            "isDefault": true,
            "lastChecked": null,
            "createTime": "2025-08-21T15:34:09.941721358",
            "fullAddress": "n2n1.ntop.org:7777"
        },
        {
            "id": "06bd877a-212a-445d-b24f-45b3d1a8c70d",
            "name": "默认Supernode 2",
            "host": "n2n2.ntop.org",
            "port": 7777,
            "status": "UNKNOWN",
            "latency": null,
            "location": "北美",
            "description": "系统默认Supernode服务器",
            "isDefault": true,
            "lastChecked": null,
            "createTime": "2025-08-21T15:34:09.942095607",
            "fullAddress": "n2n2.ntop.org:7777"
        },
        {
            "id": "71b3e404-7dfc-44fc-9a2d-015f39f8c598",
            "name": "本地Supernode",
            "host": "localhost",
            "port": 7777,
            "status": "UNKNOWN",
            "latency": null,
            "location": "本地",
            "description": "系统默认Supernode服务器",
            "isDefault": true,
            "lastChecked": null,
            "createTime": "2025-08-21T15:34:09.942182780",
            "fullAddress": "localhost:7777"
        }
    ],
    "timestamp": 1755790491280
}
```

## 数据模型

### SupernodeVO

Supernode响应对象，包含完整的Supernode信息。

| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | string | 唯一标识符 |
| name | string | Supernode名称 |
| host | string | 服务器地址 |
| port | integer | 端口号(1-65535) |
| status | string | 连接状态(ACTIVE/INACTIVE/TIMEOUT/UNKNOWN) |
| latency | integer | 网络延迟(毫秒)，null表示未检测 |
| location | string | 地理位置 |
| description | string | 描述信息 |
| isDefault | boolean | 是否为默认supernode |
| lastChecked | string | 最后检测时间(ISO 8601格式) |
| createTime | string | 创建时间(ISO 8601格式) |
| fullAddress | string | 完整地址(host:port) |

### CreateSupernodeRequest

创建Supernode请求对象。

| 字段名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| name | string | 是 | Supernode名称，不能为空 |
| host | string | 是 | 服务器地址，不能为空 |
| port | integer | 是 | 端口号，范围1-65535 |
| location | string | 否 | 地理位置 |
| description | string | 否 | 描述信息 |
| isDefault | boolean | 否 | 是否为默认supernode，默认false |

### UpdateSupernodeRequest

更新Supernode请求对象。

| 字段名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| name | string | 否 | Supernode名称 |
| host | string | 否 | 服务器地址 |
| port | integer | 否 | 端口号，范围1-65535 |
| location | string | 否 | 地理位置 |
| description | string | 否 | 描述信息 |
| isDefault | boolean | 否 | 是否为默认supernode |

## 错误处理

### 常见错误响应

**参数验证错误**
```json
{
    "code": 1,
    "message": "创建Supernode失败: Supernode名称不能为空",
    "data": null,
    "timestamp": 1755790477362
}
```

**资源不存在**
```json
{
    "code": 1,
    "message": "Supernode不存在",
    "data": null,
    "timestamp": 1755790477362
}
```

**重复资源**
```json
{
    "code": 1,
    "message": "创建Supernode失败: 该地址的Supernode已存在: test.example.com:8888",
    "data": null,
    "timestamp": 1755790477362
}
```

## n2n 集成说明

### 什么是 n2n

n2n是一个开源的P2P VPN软件，它允许用户创建分散的虚拟网络。在n2n网络中：

- **Edge节点**: 实际的用户设备，运行n2n客户端
- **Supernode**: 中继服务器，帮助Edge节点发现彼此并建立连接
- **Community**: 虚拟网络社区，相同community的Edge节点可以相互通信

### Supernode的作用

1. **节点发现**: 帮助Edge节点找到其他节点
2. **NAT穿透**: 协助节点穿透NAT设备建立直接连接
3. **中继通信**: 当直接连接无法建立时提供数据中继服务
4. **网络拓扑**: 维护网络拓扑信息

### 与本API的集成

本API提供的Supernode管理功能可以用于：

1. **配置管理**: 集中管理可用的Supernode服务器列表
2. **状态监控**: 实时监控Supernode的连接状态和性能
3. **负载均衡**: 根据延迟和状态选择最优的Supernode
4. **故障转移**: 自动切换到可用的Supernode服务器

### 使用建议

1. **多Supernode部署**: 部署多个Supernode以提供冗余和负载分散
2. **地理分布**: 在不同地理位置部署Supernode以优化网络性能
3. **定期检测**: 定期检测Supernode状态以确保服务可用性
4. **配置备份**: 保持默认Supernode配置作为备用方案

## 访问Swagger文档

服务器启动后，可以通过以下URL访问交互式API文档：

- **Swagger UI**: http://localhost:8080/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

## 示例代码

### JavaScript/TypeScript

```typescript
// 获取所有Supernode
async function getAllSupernodes() {
    const response = await fetch('http://localhost:8080/api/supernode');
    const result = await response.json();
    return result.data;
}

// 创建新Supernode
async function createSupernode(supernodeData) {
    const response = await fetch('http://localhost:8080/api/supernode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(supernodeData)
    });
    const result = await response.json();
    return result.data;
}

// 检测Supernode状态
async function checkSupernodeStatus(id) {
    const response = await fetch(`http://localhost:8080/api/supernode/${id}/check`, {
        method: 'POST'
    });
    const result = await response.json();
    return result.data;
}
```

### Java

```java
// 使用Spring RestTemplate
@Service
public class SupernodeApiClient {
    
    @Autowired
    private RestTemplate restTemplate;
    
    private static final String BASE_URL = "http://localhost:8080/api/supernode";
    
    public List<SupernodeVO> getAllSupernodes() {
        ApiResponse<List<SupernodeVO>> response = restTemplate.getForObject(
            BASE_URL, 
            new ParameterizedTypeReference<ApiResponse<List<SupernodeVO>>>() {}
        );
        return response.getData();
    }
    
    public SupernodeVO createSupernode(CreateSupernodeRequest request) {
        ApiResponse<SupernodeVO> response = restTemplate.postForObject(
            BASE_URL, 
            request, 
            new ParameterizedTypeReference<ApiResponse<SupernodeVO>>() {}
        );
        return response.getData();
    }
}
```

### cURL

```bash
# 获取所有Supernode
curl -X GET "http://localhost:8080/api/supernode"

# 创建新Supernode
curl -X POST "http://localhost:8080/api/supernode" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Supernode",
    "host": "my.supernode.com",
    "port": 7777,
    "location": "Asia",
    "description": "My custom supernode"
  }'

# 检测Supernode状态
curl -X POST "http://localhost:8080/api/supernode/{id}/check"

# 获取活跃Supernode
curl -X GET "http://localhost:8080/api/supernode/active"
```

## 更新日志

### v1.0.0 (2025-08-21)
- 初始版本发布
- 实现Supernode CRUD操作
- 添加状态检测功能
- 提供默认和活跃Supernode查询
- 集成Swagger文档
- 完整的单元测试覆盖