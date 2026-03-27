# Skills Hub

本地 Skills 管理页面，浏览、搜索、收藏、一键复制 slash 命令。

## 启动

```bash
cd F:\knowledge\skills-hub
npm install
node server.js
```

然后打开 http://localhost:3847

## 功能

- **浏览** 所有已安装的 Skills（自动从 `~/.claude/skills/` 读取）
- **标签筛选** 自动根据描述关键词打标签（写作、前端、内容铸造、联网、开发流程、知识处理、系统）
- **收藏** 收藏的 skills 会显示在页面顶部
- **搜索** 按名称和描述关键词过滤
- **一键复制** 点击「复制」按钮将 `/${skillName}` 复制到剪贴板
- **展开描述** 长描述默认折叠，点击展开查看完整内容

## 标签说明

| 标签 | 关键词示例 |
|------|-----------|
| 写作 | write, 写作, 文章, paper, words |
| 前端 | vue, react, ui, css, component, 组件 |
| 内容铸造 | ppt, slide, card, 图片, 海报, 生成 |
| 联网 | web, scrape, download, fetch, 联网 |
| 开发流程 | commit, review, test, git, mcp |
| 知识处理 | learn, research, travel, invest |
| 系统 | system, deploy, 部署, 运维 |
| 通用 | 以上均不匹配时 |

## 目录结构

```
skills-hub/
  server.js       # Node.js API 服务
  package.json
  public/
    index.html    # 页面结构
    style.css     # 暗色主题样式
    app.js        # 前端逻辑
```

## API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/skills` | GET | 返回所有 skills 列表 |
| `/api/favorites` | GET | 返回已收藏的 skills 名称列表 |
| `/api/favorites` | POST | 添加收藏 `{ name: "xxx" }` |
| `/api/favorites/:name` | DELETE | 取消收藏 |

## 数据存储

- Skills 来源：`~/.claude/skills/*/SKILL.md`
- 收藏列表：`~/.claude/skills-hub-favorites.json`
