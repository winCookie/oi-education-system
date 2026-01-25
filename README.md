# OI 互动教学系统

这是一个专为信息学奥赛（OI）设计的交互式教学系统。

## 核心功能
- **知识树导航**: 分为入门组和提高组，支持关键字搜索。
- **线段树可视化**: 动态生成线段树，支持区间查询节点的交互式标记练习。
- **算法过程溯源**: 提供进度条控制的算法执行回溯，结合代码高亮和文字说明。
- **权限管理**: 老师可创建学生账号，学生登录后可查看知识点和例题。

## 技术栈
- **前端**: React, Tailwind CSS, D3.js, Lucide Icons
- **后端**: NestJS, TypeORM, PostgreSQL, Argon2 (安全哈希), JWT
- **部署**: Docker, Nginx

## 快速启动 (本地开发)

### 1. 启动数据库 (需安装 Docker)
```bash
docker-compose up db -d
```

### 2. 后端启动
```bash
cd backend
npm install
npm run start:dev
```
首次启动后，可运行 `npm run seed` 创建初始老师账号 (`teacher01` / `password123`)。

### 3. 前端启动
```bash
cd frontend
npm install
npm run dev
```

## 中国地区服务器部署指南

### 1. 域名与备案
- 购买阿里云/腾讯云域名。
- 登录云厂商控制台提交 **ICP 备案**（预计 2-3 周）。
- 备案期间可使用服务器公网 IP 进行内部测试。

### 2. 服务器环境准备
- 安装 Docker 和 Docker Compose。
- 配置安全组开放 `80`, `443` (HTTPS), `22` (SSH) 端口。

### 3. 一键部署
```bash
docker-compose up -d --build
```

### 4. 安全建议
- 生产环境务必修改 `.env` 中的 `JWT_SECRET` 和数据库密码。
- 使用 `Nginx` 配合 `Certbot` 开启 HTTPS。
- 配置云厂商的 WAF 过滤恶意攻击。
