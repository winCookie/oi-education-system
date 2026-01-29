# OI 互动教学系统 (OI Interactive Teaching System)

[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/framework-NestJS%20%26%20React-blue.svg)](https://nestjs.com/)

**OI 互动教学系统** 是一款专为信息学奥赛（OI/ACM）培训设计的全栈式教学管理平台。系统集成了知识点可视化、博客社区、学情追踪以及自动化竞赛插件，旨在为机构、教师、学生和家长提供一站式的互动教学体验。

---

## 🚀 核心功能

### 1. 交互式教学与可视化
- **算法回溯与演示**：支持动态线段树演示、算法执行过程可视化追踪。
- **知识树系统**：结构化的知识点呈现，支持 Markdown 与 LaTeX 数学公式。
- **多媒体课件**：支持 HLS 流媒体视频播放，分片上传，教学视频无缝集成。

### 2. 博客社区与互动
- **内容管理**：完整的文章发布、编辑及草稿箱功能。
- **审核机制**：学生投稿 -> 教师/管理员审核 -> 全站发布。
- **互动体验**：点赞、收藏、评论及二级回复功能。
- **精细化展示**：区分官方公告、教师专栏与学生分享。

### 3. 学情分析与报告
- **掌握度看板**：实时追踪学生在不同知识组别（如：入门组、提高组）的掌握情况。
- **自动化报告**：支持教师为学生生成个性化学情报告，多维度评估学习效果。
- **家长端入口**：家长可绑定孩子账号，查看其实时练习进度与教师评价。

### 4. 特色插件 (新集成)
- **洛谷团队数据分析**：
    - 自动化抓取洛谷团队成员的练习数据。
    - 生成月度统计报表与进步学员排名。
    - 生成月度增长对比报告，辅助教学决策。
- **GESP 考位监控**：
    - 基于 Selenium 的实时考位探测。
    - 支持手动检查与循环自动检测（如每 30 分钟一次）。
    - 针对深圳等热门地区考位实时预警。

---

## 🛠 技术栈

- **前端**：React 19, Vite, Tailwind CSS, Lucide Icons, D3.js, React Markdown.
- **后端**：NestJS 11, TypeORM, PostgreSQL 15, Passport (JWT) 认证.
- **数据采集**：Python 3 (Selenium, Pandas, WebDriverManager).
- **部署**：Docker, Docker Compose, Nginx.

---

## 📦 快速开始

### 环境要求
- Node.js (v20+)
- Docker & Docker Compose
- Python 3 (如需本地运行插件)

### 一键启动 (推荐)
```bash
# 克隆项目
git clone https://github.com/winCookie/oi-education-system.git
cd oi-education-system

# 启动所有服务
docker-compose up -d --build
```

### 插件配置
系统中的特色插件（洛谷/GESP）需要配置相应的 Cookie 和信息：
1. 进入 `洛谷插件/` 或 `gesp_plugin/` 目录。
2. 将 `config.example.json` 复制为 `config.json`。
3. 按照说明填入您的 `__client_id`、`_uid` 或 `JSESSIONID`。
4. 在系统的 **[管理中心]** 或 **[其他]** 界面进行操作。

---

## 🔒 隐私与个人信息保护
- **敏感信息屏蔽**：`.gitignore` 已配置，所有的 `config.json`、日志文件和抓取的原始数据均不会提交到 Git。
- **数据加密**：用户密码采用 Argon2 强哈希存储。
- **权限隔离**：严格区分超级管理员、教师、学生和家长角色，确保敏感操作（如考位配置、全队数据分析）仅限内部人员使用。

---

## 📅 开发计划
- [x] 博客社区系统升级
- [x] 洛谷团队数据分析集成
- [x] GESP 考位实时监控
- [ ] 知识点分析（基于题目标签）
- [ ] 微信/飞书消息实时推送
- [ ] 在线测评 (OJ) 接口对接

---

## 📞 联系与反馈
如果您在使用过程中发现 Bug 或有功能建议，请通过系统内的 `/bug` 命令或直接提交 GitHub Issue。

**winCookie OI 互动教学系统** - *让 OI 学习更高效，更透明。*