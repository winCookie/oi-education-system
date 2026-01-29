# 洛谷团队学情分析系统 - 完整使用指南

## ✨ 系统简介

本系统专为信息学竞赛教学机构设计，能够:
- ✅ 自动获取洛谷团队所有成员的训练数据
- ✅ 生成月度训练统计报告（Excel 格式）
- ✅ 对比不同月份，分析学员进步情况
- ✅ 识别需要关注的学员
- ✅ 支持数据持久化，便于长期跟踪

## 📦 已实现的核心功能

### 1. 爬虫模块 (`luogu_crawler.py`)
- ✅ 基于 Cookie 的认证机制
- ✅ `_feInjection` 数据提取（洛谷页面数据）
- ✅ 团队成员列表获取 `get_team_members()`
- ✅ 用户详细练习数据 `get_detailed_practice()`
- ✅ 用户提交记录获取 `get_recent_records()`
- ✅ 隐藏数据处理（从提交记录反向推算）

### 2. 分析模块 (`analyze_luogu.py`)
- ✅ 批量获取团队成员数据
- ✅ Excel 格式存储（月度数据）
- ✅ 月度对比报告生成
- ✅ 进步学员排名
- ✅ 需要关注学员提示
- ✅ 命令行操作界面

### 3. 配置管理
- ✅ JSON 格式配置文件
- ✅ Cookie 管理
- ✅ 团队 ID 配置
- ✅ 重试和延迟设置

## 🚀 快速开始（3 步上手）

### 步骤 1: 安装依赖

```bash
cd /Users/codewin/PythonWorkspace/洛谷插件
pip3 install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 步骤 2: 配置 Cookie

#### 方法 1: 通过浏览器获取（推荐）

1. 打开 Chrome/Edge 浏览器
2. 访问并登录洛谷: https://www.luogu.com.cn
3. 按 `F12` 打开开发者工具
4. 切换到 `Application` 标签页
5. 左侧找到 `Storage` → `Cookies` → `https://www.luogu.com.cn`
6. 找到并复制以下两个 Cookie:
   - `__client_id`（很长的字符串）
   - `_uid`（你的用户 ID）

#### 方法 2: 通过控制台获取

在浏览器控制台（F12 → Console）输入:

```javascript
console.log('__client_id:', document.cookie.split('; ').find(row => row.startsWith('__client_id')))
console.log('_uid:', document.cookie.split('; ').find(row => row.startsWith('_uid')))
```

#### 填入配置文件

编辑 `config.json`:

```json
{
  "team_id": "55654",
  "cookies": {
    "__client_id": "这里填入你复制的__client_id值",
    "_uid": "这里填入你的用户ID"
  },
  "retry_delay": 2,
  "max_retries": 3
}
```

### 步骤 3: 开始使用

#### 3.1 测试连接

```bash
python3 test_crawler.py
```

如果看到 "✅ 成功获取团队数据"，说明配置正确！

#### 3.2 获取本月数据

```bash
python3 analyze_luogu.py --fetch
```

执行后会在 `data/` 目录生成 `monthly_stats_202601.xlsx`

#### 3.3 生成对比报告

首先确保有两个月的数据，然后:

```bash
python3 analyze_luogu.py --compare 202512 202601
```

报告会保存在 `reports/growth_report_202512_to_202601.xlsx`

## 📖 详细使用指南

### 命令行参数说明

```bash
# 查看帮助
python3 analyze_luogu.py --help

# 获取当前月数据
python3 analyze_luogu.py --fetch

# 获取指定月份数据
python3 analyze_luogu.py --fetch --month 202601

# 对比两个月份
python3 analyze_luogu.py --compare 202512 202601

# 使用自定义配置文件
python3 analyze_luogu.py --config my_config.json --fetch
```

### 数据文件说明

#### 月度统计文件 (`data/monthly_stats_YYYYMM.xlsx`)

| 列名 | 说明 | 示例 |
|------|------|------|
| uid | 用户 ID | 574822 |
| username | 洛谷用户名 | xiaoming |
| realname | 真实姓名 | 小明 |
| is_hidden | 是否隐藏练习数据 | False |
| rating | 等级分 | 1500 |
| difficulty1 | 入门题数 | 45 |
| difficulty2 | 普及-题数 | 32 |
| difficulty3 | 普及/提高-题数 | 28 |
| difficulty4 | 普及+/提高题数 | 15 |
| difficulty5 | 提高+/省选-题数 | 8 |
| difficulty6 | 省选/NOI-题数 | 3 |
| difficulty7 | NOI/NOI+/CTSC题数 | 1 |
| total | 总题数 | 132 |

#### 增长报告 (`reports/growth_report_YYYYMM_to_YYYYMM.xlsx`)

包含三组数据:
- `*_current`: 本月数据
- `*_previous`: 上月数据
- `*_growth`: 增量（本月 - 上月）

## 📊 实际使用流程

### 月度工作流程（推荐）

```
每月 1 日
  ↓
获取上月数据
python3 analyze_luogu.py --fetch --month 202512
  ↓
本月 1-30 日（学员持续训练）
  ↓
下月 1 日
  ↓
获取本月数据
python3 analyze_luogu.py --fetch --month 202601
  ↓
生成对比报告
python3 analyze_luogu.py --compare 202512 202601
  ↓
导出到飞书文档进行分析和分享
```

### 定期自动化（可选）

#### Linux/Mac 使用 crontab

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每月1日凌晨2点执行）
0 2 1 * * cd /Users/codewin/PythonWorkspace/学情分析系统 && /usr/local/bin/python3 analyze_luogu.py --fetch >> cron.log 2>&1
```

#### Windows 使用任务计划程序

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器：每月 1 日
4. 操作：启动程序
   - 程序：`python`
   - 参数：`analyze_luogu.py --fetch`
   - 起始于：`C:\...\学情分析系统\`

## 🔧 高级功能

### 1. 自定义数据分析

可以使用 pandas 直接分析 Excel 数据:

```python
import pandas as pd

# 读取月度数据
df = pd.read_excel('data/monthly_stats_202601.xlsx')

# 统计各难度平均题数
for i in range(1, 8):
    avg = df[f'difficulty{i}'].mean()
    print(f'难度 {i} 平均: {avg:.1f} 题')

# 找出总题数前 10 名
top10 = df.nlargest(10, 'total')[['username', 'total']]
print(top10)
```

### 2. 单独使用爬虫模块

```python
from luogu_crawler import LuoguCrawler

# 初始化（带 Cookie）
cookies = {
    '__client_id': 'your_client_id',
    '_uid': 'your_uid'
}
crawler = LuoguCrawler(cookies=cookies)

# 获取团队成员
members = crawler.get_team_members('55654')
print(f'团队人数: {len(members)}')

# 获取单个用户数据
user_data = crawler.get_detailed_practice('574822')
if user_data:
    print(f"用户: {user_data['username']}")
    print(f"总题数: {sum(user_data.get(f'difficulty{i}', 0) for i in range(1, 8))}")

# 获取提交记录
records = crawler.get_recent_records('574822', status='AC', limit=50)
print(f'最近 AC: {len(records)} 题')
```

## ⚠️ 重要注意事项

### 1. Cookie 安全

- ❌ 不要将 Cookie 分享给他人
- ❌ 不要将包含 Cookie 的 `config.json` 上传到 GitHub
- ✅ 建议将 `config.json` 添加到 `.gitignore`
- ✅ Cookie 过期后需要重新获取（通常 30 天）

### 2. 使用频率

- ✅ 建议每月获取 1 次数据
- ❌ 不要频繁请求（已设置 2 秒延迟）
- ✅ 大团队（>100 人）建议夜间执行

### 3. 数据准确性

- ⚠️ 数据可能有 1-2 小时延迟
- ⚠️ 用户隐藏数据时只能获取部分信息
- ✅ 以洛谷官网显示为准

### 4. 隐私保护

- ✅ 仅获取公开的训练统计
- ✅ 不涉及题解、代码等隐私内容
- ✅ 数据仅用于教学分析

## 🐛 故障排除

### 问题 1: ImportError: No module named 'pandas'

**解决:**
```bash
pip3 install pandas openpyxl -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题 2: 获取团队数据失败

**可能原因:**
1. Cookie 未配置或已过期
2. 不是团队所有者/管理员
3. 团队 ID 错误

**解决步骤:**
1. 重新获取 Cookie 并更新 `config.json`
2. 确认在浏览器中能访问团队页面
3. 检查 `luogu_analysis.log` 查看详细错误

### 问题 3: 部分用户数据为 0

**原因:** 用户设置了隐藏练习数据

**解决:** 系统会自动尝试从提交记录推算，但可能不完整

### 问题 4: 生成报告时提示文件不存在

**原因:** 缺少指定月份的数据

**解决:**
```bash
# 先获取两个月的数据
python3 analyze_luogu.py --fetch --month 202512
python3 analyze_luogu.py --fetch --month 202601

# 再生成报告
python3 analyze_luogu.py --compare 202512 202601
```

## 📈 数据分析技巧

### 1. 识别进步最快的学员

在生成的报告中，直接查看 `total_growth` 列（已按降序排序）

### 2. 发现需要关注的学员

- 本月 `total_growth = 0`：完全没有新增
- `total < 平均值`：整体进度较慢

### 3. 分析训练难度分布

```python
import pandas as pd

df = pd.read_excel('data/monthly_stats_202601.xlsx')

# 计算各难度占比
for i in range(1, 8):
    ratio = df[f'difficulty{i}'].sum() / df['total'].sum() * 100
    print(f'难度 {i}: {ratio:.1f}%')
```

### 4. 导出到飞书表格

1. 打开生成的 Excel 文件
2. 选择所有数据（Ctrl+A）
3. 复制（Ctrl+C）
4. 在飞书表格中粘贴（Ctrl+V）
5. 使用飞书的图表功能可视化

## 📝 后续开发计划

- [ ] 知识点分析（基于题目标签）
- [ ] 可视化图表生成（matplotlib）
- [ ] 训练曲线追踪（周/月）
- [ ] 多团队对比功能
- [ ] Web 可视化界面
- [ ] 微信通知推送

## 🔗 相关文件

- `luogu_crawler.py`: 爬虫核心
- `analyze_luogu.py`: 分析主程序
- `test_crawler.py`: 功能测试
- `config.json`: 配置文件
- `README_团队分析系统.md`: 快速指南
- `requirements.txt`: 依赖包列表

## 💡 技术架构

```
用户
 ↓
analyze_luogu.py (主程序)
 ↓
luogu_crawler.py (爬虫)
 ↓
洛谷 API/网页
 ↓
数据解析 (_feInjection)
 ↓
pandas + openpyxl
 ↓
Excel 报表
```

## 📞 获取帮助

如遇问题:
1. 查看 `luogu_analysis.log` 日志文件
2. 运行 `python3 test_crawler.py` 诊断
3. 检查本文档的"故障排除"章节

---

**洛谷团队学情分析系统 v1.0**  
适用于信息学奥赛培训机构的学员管理与数据分析

