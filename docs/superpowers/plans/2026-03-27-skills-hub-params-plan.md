# Skills Hub 参数展示功能实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development 逐任务实现此计划。

**目标：** 在 Skills Hub 列表页为有内置参数的 skill 增加参数展示层，支持查看参数说明和一键复制带参数的 slash 命令。

**架构：** 后端解析 SKILL.md 中的参数表格并注入到 API 响应，前端在技能卡片和详情弹窗中展示参数列表和复制按钮。

**技术栈：** Node.js（server.js）、Vanilla JS（app.js）、CSS（style.css）

---

## 文件结构

- **修改：** `server.js` — 新增 `parseParams()` 函数，解析 SKILL.md 中的参数表格
- **修改：** `app.js` — 卡片显示参数数量 badge，弹窗显示参数面板，点击复制
- **修改：** `style.css` — 新增参数相关样式
- **修改：** `public/index.html` — 弹窗结构增加参数面板容器

---

## 任务 1：后端参数解析（server.js）

**文件：** 修改 `server.js`

**步骤：**

1. 在 `parseFrontmatter` 函数后添加 `parseParams` 函数
2. 在 `scanSkills` 函数中调用 `parseParams`，将参数注入 skill 对象
3. 启动服务验证 API 输出：`curl http://localhost:3847/api/skills | node -e "..."`
4. Commit

---

## 任务 2：前端卡片层展示参数数量 badge

**文件：** 修改 `app.js` 和 `style.css`

**步骤：**

1. 修改 `makeCard` 函数，在卡片右下角 `.card-actions` 添加参数数量 badge
2. 在 `attachCardEvents` 中添加参数 badge 点击事件（打开弹窗并滚动到参数区域）
3. 添加 CSS 样式 `.params-badge`
4. 启动服务验证 badge 显示
5. Commit

---

## 任务 3：弹窗参数面板

**文件：** 修改 `index.html`、`app.js`、`style.css`

**步骤：**

1. 在 `index.html` 的 `.modal-actions` 之后添加参数面板容器 `.modal-param-panel`
2. 在 `app.js` 的 `openModal` 函数中填充参数面板 HTML
3. 添加参数面板和参数按钮的 CSS 样式
4. 启动服务验证弹窗参数面板显示和点击复制
5. Commit

---

## 任务 4：卡片列表页直接复制参数（可选增强）

**文件：** 修改 `app.js` 和 `style.css`

**步骤：**

1. 在 `makeCard` 函数的 `card-actions` 中添加快速参数按钮行
2. 在 `attachCardEvents` 中添加卡片参数按钮点击事件（复制命令）
3. 添加 CSS 样式 `.card-param-row` 和 `.card-param-btn`
4. Commit

---

## 验收标准

1. 访问 `http://localhost:3847`，有参数的 skill 卡片显示参数数量 badge（如 `6 参数`）
2. 点击 badge 或卡片打开弹窗，参数面板显示所有参数
3. 点击任意参数按钮，Toast 提示"已复制 /ljg-card -i"
4. 参数说明为中文
