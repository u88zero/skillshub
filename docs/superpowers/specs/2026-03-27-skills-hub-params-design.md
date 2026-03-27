# Skills Hub 参数展示功能设计

## 概述

在 Skills Hub 列表页中，为有内置约束的 skill 增加参数展示层。用户查看 skill 时可直接看到所有可用参数及其中文说明，点击任意参数即可复制对应的完整 slash 命令。

## 参数来源

解析所有 `~/.claude/skills/*/SKILL.md` 文件，从 `## 参数` 或 `## Options` 章节提取参数定义。

## 参数格式分类

发现两种格式：

| 格式 | 示例 | 适用 |
|------|------|------|
| **单横线** | `-l` `-i` `--art` | 命令级参数，直接作为 slash 命令的一部分 |
| **双横线+值** | `--art manga` | 脚本级参数，需传值 |

两种格式均支持在 slash 命令中使用。

## 参数解析规则

从 SKILL.md 中识别 `## 参数` 或 `## Options` 章节，支持以下表格格式：

```markdown
## 参数

| 参数 | 说明 |
|------|------|
| `-l`（默认） | 长图模式 |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--art` | Art style | ligne-claire |
```

解析时提取第一列为参数名，第二列（Description/说明）为参数说明。

## 全部技能参数列表

### 1. ljg-card（内容铸造）

将内容铸成可见的 PNG 形态，六种模具可选。

| 参数 | 说明 |
|------|------|
| `-l`（默认） | 长图，1080 x auto，单张阅读卡 |
| `-i` | 信息图，内容驱动的自适应视觉布局 |
| `-m` | 多卡，1080 x 1440，自动切分为多张阅读卡片 |
| `-v` | 视觉笔记，手绘风格 sketchnote |
| `-c` | 漫画，日式黑白漫画风格 |
| `-w` | 白板，马克笔风格，结构化框图+箭头 |

---

### 2. ljg-paper-flow（论文流）

一条命令完成：读论文 → 生成解读 → 铸成卡片。支持多篇并行。

| 参数 | 说明 |
|------|------|
| 无参数 | 对话中已提供的论文链接/文件 |
| `-c` | 卡片模具改用多卡模式（默认 `-l` 长图） |
| `-i` | 卡片模具改用信息图模式 |

---

### 3. ljg-travel（旅行研究）

深度文化旅行研究，为博物馆和古建筑生成结构化知识文档+便携卡片。

| 参数 | 说明 |
|------|------|
| 城市名 | 必填，目标城市 |
| `-f <主题>` | 聚焦主题，可选，如：`-f 唐代` `-f 石窟` |
| `-q` | 快速模式，跳过内容提炼，只做研究+文档 |

---

### 4. ljg-word-flow（词卡）

深度单词解析 + 信息图卡片，一条命令完成。

（无独立参数，调用时传入英文单词）

---

### 5. baoyu-comic（知识漫画）

支持多种画风与基调组合的知识漫画生成器。

| 参数 | 说明 |
|------|------|
| `--art` | 画风：ligne-claire(清线)、manga(日漫)、realistic(写实)、ink-brush(水墨)、chalk(粉笔) |
| `--tone` | 基调：neutral(中性)、warm(温馨)、dramatic(戏剧)、romantic(浪漫)、energetic(活力)、vintage(复古)、action(动作) |
| `--layout` | 面板：standard(标准)、cinematic(电影感)、dense(高密度)、splash(大页)、mixed(混合格式)、webtoon(条漫) |
| `--aspect` | 画幅比例：3:4(竖版/默认)、4:3(横版)、16:9(宽银幕) |
| `--lang` | 输出语言：auto(自动)、zh(中文)、en(英语)、ja(日语)等 |
| `--storyboard-only` | 仅生成故事板，跳过提示词和图片 |
| `--prompts-only` | 生成故事板+提示词，跳过图片 |
| `--images-only` | 基于现有提示词目录生成图片 |
| `--regenerate <N>` | 仅重新生成指定页，如：`3` 或 `2,5,8` |
| `--style ohmsha` | 预设：日漫+中性风格，视觉隐喻，无头像对话 |
| `--style wuxia` | 预设：水墨+动作风格，武侠视觉效果 |
| `--style shoujo` | 预设：日漫+浪漫风格，装饰元素 |

---

### 6. baoyu-compress-image（图片压缩）

压缩图片为 WebP/PNG/JPEG，支持质量控制和批量处理。

| 参数 | 短 | 说明 | 默认 |
|------|-----|------|------|
| `--output <path>` | `-o` | 输出路径 | 原路径，新扩展名 |
| `--format <fmt>` | `-f` | 格式：webp、png、jpeg | webp |
| `--quality <0-100>` | `-q` | 质量 | 80 |
| `--keep` | `-k` | 保留原文件 | false |
| `--recursive` | `-r` | 递归处理子目录 | false |
| `--json` | | JSON 输出格式 | false |

---

### 7. baoyu-image-gen（图片生成）

AI 图片生成，支持 Google/OpenAI/OpenRouter/DashScope/即梦/Seedream 等多 provider。

| 参数 | 说明 |
|------|------|
| `--prompt <text>` 或 `-p` | 提示词文本 |
| `--promptfiles <files>` | 从文件读取提示词（拼接） |
| `--image <path>` | 输出图片路径（单图模式必需） |
| `--batchfile <path>` | JSON 批处理文件 |
| `--jobs <count>` | 并行工作线程数（默认自动，最大10） |
| `--provider <name>` | 强制 provider：google、openai、openrouter、dashscope、jimeng、seedream、replicate |
| `--model <id>` 或 `-m` | 模型 ID |
| `--ar <ratio>` | 宽高比：16:9、1:1、4:3 等 |
| `--size <WxH>` | 尺寸：如 1024x1024 |
| `--quality <normal\|2k>` | 质量预设 | 2k |
| `--imageSize <1K\|2K\|4K>` | 图片尺寸（Google/OpenRouter） |
| `--ref <files>` | 参考图片 |
| `--n <count>` | 生成图片数量 |
| `--json` | JSON 输出格式 |

---

### 8. baoyu-cover-image（封面图片）

文章封面图片生成，支持 5 维度自定义：类型、配色、渲染风格、文字、基调。

| 参数 | 说明 |
|------|------|
| `--type <name>` | 类型：hero(主视觉)、conceptual(概念)、typography(字体排版)、metaphor(隐喻)、scene(场景)、minimal(极简) |
| `--palette <name>` | 配色：warm(温暖)、elegant(雅致)、cool(冷调)、dark(暗色)、earth(大地)、vivid(鲜艳)、pastel(粉彩)、mono(单色)、retro(复古)、duotone(双色) |
| `--rendering <name>` | 渲染风格：flat-vector(扁平矢量)、hand-drawn(手绘)、painterly(油画)、digital(数码)、pixel(像素)、chalk(粉笔)、screen-print(丝网印刷) |
| `--style <name>` | 预设组合（见 Style Presets） |
| `--text <level>` | 文字层级：none(无)、title-only(仅标题)、title-subtitle(标题+副标题)、text-rich(富文本) |
| `--mood <level>` | 基调：subtle(柔和)、balanced(均衡)、bold(强烈) |
| `--font <name>` | 字体：clean(无衬线)、handwritten(手写)、serif(衬线)、display(展示) |
| `--aspect <ratio>` | 画幅：16:9(默认)、2.35:1、4:3、3:2、1:1、3:4 |
| `--lang <code>` | 标题语言：en、zh、ja 等 |
| `--no-title` | 无标题文字（等同于 `--text none`） |
| `--quick` | 快速模式，跳过确认，使用自动选择 |
| `--ref <files>` | 参考图片 |

---

### 9. baoyu-infographic（信息图）

专业信息图生成器，21 种布局 × 20 种视觉风格自由组合。

| 参数 | 说明 |
|------|------|
| `--layout <name>` | 布局（共21种）：linear-progression(时间线)、binary-comparison(二选一对比)、comparison-matrix(多维对比)、hierarchical-layers(层级递进)、tree-branching(树状分支)、hub-spoke(中心辐射)、structural-breakdown(结构拆解)、bento-grid(便当网格/默认)、iceberg(冰山模型)、bridge(问题-方案)、funnel(漏斗)、isometric-map(等轴测图)、dashboard(仪表盘)、periodic-table(元素周期表)、comic-strip(漫画条)、story-mountain(故事山)、jigsaw(拼图)、venn-diagram(韦恩图)、winding-roadmap(蜿蜒路线)、circular-flow(循环流)、dense-modules(高密度模块) |
| `--style <name>` | 视觉风格（共20种）：craft-handmade(手工感/默认)、claymation(黏土定格)、kawaii(日系可爱)、storybook-watercolor(绘本水彩)、chalkboard(黑板)、cyberpunk-neon(赛博朋克霓虹)、bold-graphic(美式漫画)、aged-academia(复古学院)、corporate-memphis(孟菲斯风)、technical-schematic(技术蓝图)、origami(折纸)、pixel-art(像素画)、ui-wireframe(线框图)、subway-map(地铁路线图)、ikea-manual(IKEA说明书)、knolling(Knolling 摆拍)、lego-brick(乐高积木)、pop-laboratory(流行实验室)、morandi-journal(莫兰迪手绘)、retro-pop-grid(复古流行网格) |
| `--aspect <name>` | 画幅：landscape(横版/16:9)、portrait(竖版/9:16)、square(方形/1:1)，或自定义比例如 3:4 |
| `--lang <code>` | 输出语言：en、zh、ja 等 |

---

### 10. baoyu-youtube-transcript（YouTube 字幕）

下载 YouTube 视频字幕/ transcript，支持多语言、翻译、章节和说话人识别。

| 参数 | 说明 | 默认 |
|------|------|------|
| `<url-or-id>` | YouTube URL 或视频 ID（支持多个） | 必需 |
| `--languages <codes>` | 语言代码，逗号分隔，优先级顺序 | en |
| `--format <fmt>` | 输出格式：text(文本)、srt(SRT字幕) | text |
| `--translate <code>` | 翻译为目标语言代码 | 无 |
| `--list` | 仅列出可用字幕，不下载 | |
| `--timestamps` | 每段加时间戳 `[HH:MM:SS → HH:MM:SS]` | 开启 |
| `--no-timestamps` | 禁用时间戳 | |
| `--chapters` | 从视频描述生成章节分段 | |
| `--speakers` | 含说话人识别的原始 transcript | |
| `--exclude-generated` | 跳过自动生成的字幕 | |
| `--exclude-manually-created` | 跳过手动创建的字幕 | |
| `--refresh` | 强制重新获取，忽略缓存 | |
| `-o, --output <path>` | 保存到指定文件路径 | 自动生成 |
| `--output-dir <dir>` | 基础输出目录 | youtube-transcript |

---

### 11. baoyu-markdown-to-html（Markdown 转 HTML）

将 Markdown 转换为微信/公众号兼容的 HTML，支持多种主题和样式定制。

| 参数 | 短 | 说明 | 默认 |
|------|-----|------|------|
| `--theme <name>` | 主题：default(默认)、grace(优雅)、simple(简洁)、modern(现代) | default |
| `--color <name\|hex>` | 主色：预设名或十六进制值 | 主题默认 |
| `--font-family <name>` | 字体：sans(无衬线)、serif(衬线)、serif-cjk(中日韩)、mono(等宽) | 主题默认 |
| `--font-size <N>` | 字号：14px、15px、16px、17px、18px | 16px |
| `--title <title>` | 覆盖 frontmatter 中的标题 | |
| `--cite` | 将外链转为底部引用，附加「引用链接」章节 | false |
| `--keep-title` | 保留内容中的第一个标题 | false |
| `--quotes` | `-q` | 将 ASCII 引号替换为全角引号 `"..."` | false |
| `--spacing` | `-s` | 添加中日韩/英文间隔 | true |
| `--emphasis` | `-e` | 修复中日韩标点强调问题 | true |

---

### 12. baoyu-translate（翻译）

多模式翻译，支持 Quick/Normal/Refined 三种模式，对应不同场景。

| 参数 | 说明 | 默认 |
|------|------|------|
| `--to <lang>` | 目标语言，如：zh-CN、en、ja | zh-CN |
| `--mode <mode>` | 模式：quick(快速，仅翻译)、normal(普通，分析→翻译)、refined(精修，分析→翻译→审校→润色) | normal |
| `--audience <type>` | 目标读者：general(通用)、technical(技术)、academic(学术)、casual(随意) | general |
| `--style <style>` | 翻译风格：storytelling(叙事)、academic(学术)、business(商务)、creative(创意) | storytelling |

---

### 13. baoyu-url-to-markdown（网址转 Markdown）

抓取任意 URL 并转换为 Markdown，支持媒体下载和多种捕获模式。

| 参数 | 说明 | 默认 |
|------|------|------|
| `<url>` | 要抓取的 URL | 必需 |
| `-o <path>` | 输出文件路径（必须是文件路径，非目录） | 自动生成 |
| `--output-dir <dir>` | 基础输出目录，自动生成 `{dir}/{domain}/{slug}.md` | ./url-to-markdown/ |
| `--wait` | 等待用户信号后再捕获（用于登录页、懒加载、付费墙） | |
| `--timeout <ms>` | 页面加载超时 | 30000 |
| `--download-media` | 下载图片/视频到本地 imgs/ 和 videos/，并改写相对路径 | |

---

### 14. baoyu-xhs-images（小红书图片）

小红书信息图系列生成器，11 种视觉风格 × 8 种布局自由组合。

| 参数 | 说明 |
|------|------|
| `--style <name>` | 视觉风格：cute(可爱)、fresh(清新)、warm(温暖)、bold(大胆)、minimal(极简)、retro(复古)、pop(流行)、notion(Notion风)、chalkboard(黑板)、study-notes(学习笔记)、screen-print(丝网印刷) |
| `--layout <name>` | 信息布局：sparse(稀疏)、balanced(均衡)、dense(高密度)、list(列表)、comparison(对比)、flow(流程)、mindmap(思维导图)、quadrant(象限) |
| `--preset <name>` | 风格+布局组合预设（如 knowledge-card、poster 等） |

---

### 15. baoyu-slide-deck（幻灯片演示）

从文档或大纲生成专业 PPT，支持搜索插入相关图片和幻灯片转场效果。

| 参数 | 说明 |
|------|------|
| `--style <name>` | 视觉风格：预设名、custom 或自定义风格名 |
| `--audience <type>` | 目标受众：beginners(初学者)、intermediate(中级)、experts(专家)、executives(高管)、general(大众) |
| `--lang <code>` | 输出语言：en、zh、ja 等 |
| `--slides <number>` | 目标幻灯片数量（推荐 8-25，最大 30） |
| `--outline-only` | 仅生成大纲，跳过图片生成 |
| `--prompts-only` | 生成大纲+提示词，跳过图片 |
| `--images-only` | 基于现有提示词目录生成图片 |
| `--regenerate <N>` | 重新生成指定幻灯片：如 `3` 或 `2,5,8` |

---

### 16. baoyu-post-to-weibo（发布到微博）

通过浏览器自动化发布到微博，支持文字、图片、视频和头条文章。

**微博文字**

| 参数 | 说明 |
|------|------|
| `<text>` | 帖子内容（位置参数） |
| `--image <path>` | 图片文件（可重复） |
| `--video <path>` | 视频文件（可重复） |
| `--profile <dir>` | 自定义 Chrome profile |

**头条文章**

| 参数 | 说明 |
|------|------|
| `<markdown>` | Markdown 文件（位置参数） |
| `--cover <path>` | 封面图片 |
| `--title <text>` | 覆盖标题（最长32字符） |
| `--summary <text>` | 覆盖摘要（最长44字符） |
| `--profile <dir>` | 自定义 Chrome profile |

---

### 17. baoyu-post-to-x（发布到 X/Twitter）

通过浏览器自动化发布到 X，支持文字、图片、视频、引言推文和 X 文章。

**文字推文**

| 参数 | 说明 |
|------|------|
| `<text>` | 帖子内容（位置参数） |
| `--image <path>` | 图片文件（最多4张） |
| `--profile <dir>` | 自定义 Chrome profile |

**视频推文**

| 参数 | 说明 |
|------|------|
| `<text>` | 帖子内容（位置参数） |
| `--video <path>` | 视频文件（MP4、MOV、WebM） |
| `--profile <dir>` | 自定义 Chrome profile |

**引言推文**

| 参数 | 说明 |
|------|------|
| `<tweet-url>` | 要引用的推文 URL（位置参数） |
| `<comment>` | 评论文字（位置参数，可选） |
| `--profile <dir>` | 自定义 Chrome profile |

**X 文章**

| 参数 | 说明 |
|------|------|
| `<markdown>` | Markdown 文件（位置参数） |
| `--cover <path>` | 封面图片 |
| `--title <text>` | 覆盖标题 |
| `--profile <dir>` | 自定义 Chrome profile |

---

### 18. baoyu-post-to-wechat（发布到微信公众号）

通过浏览器自动化发布到微信公众号。

| 参数 | 说明 |
|------|------|
| `<markdown>` | Markdown 文件（位置参数） |
| `--cover <path>` | 封面图片 |
| `--title <text>` | 覆盖标题（最长64字符） |
| `--profile <dir>` | 自定义 Chrome profile |

---

### 19. baoyu-format-markdown（格式化 Markdown）

格式化 Markdown 文件，修复引号、间距、标点等问题。

| 参数 | 短 | 说明 | 默认 |
|------|-----|------|------|
| `--quotes` | `-q` | 将 ASCII 引号替换为全角引号 `"..."` | false |
| `--no-quotes` | | 不替换引号 | |
| `--spacing` | `-s` | 添加中日韩/英文间隔 | true |
| `--no-spacing` | | 不添加间隔 | |
| `--emphasis` | `-e` | 修复中日韩标点问题 | true |
| `--no-emphasis` | | 不修复标点问题 | |

---

### 20. ui-ux-pro-max（UI/UX 设计）

UI/UX 设计助手，提供多领域的设计建议和最佳实践。

| 参数 | 说明 |
|------|------|
| `--domain product` | 产品类型模式，如：`--domain product "entertainment social"` |
| `--domain style` | 更多风格选项，如：`--domain style "glassmorphism dark"` |
| `--domain color` | 配色方案，如：`--domain color "entertainment vibrant"` |
| `--domain typography` | 字体搭配，如：`--domain typography "playful modern"` |
| `--domain chart` | 图表建议，如：`--domain chart "real-time dashboard"` |
| `--domain ux` | UX 最佳实践，如：`--domain ux "animation accessibility"` |
| `--domain google-fonts` | Google Fonts，如：`--domain google-fonts "sans serif popular variable"` |
| `--domain landing` | 着陆页结构，如：`--domain landing "hero social-proof"` |
| `--domain react` | React Native 性能，如：`--domain react "rerender memo list"` |
| `--domain web` | Web 无障碍，如：`--domain web "accessibilityLabel touch safe-areas"` |
| `--domain prompt` | AI 提示词/CSS 关键词，如：`--domain prompt "minimalism"` |

---

### 21. baoyu-infographic（信息图）

（注：与第9项 baoyu-infographic 相同）

---

## 界面设计

### 列表页

有参数的 skill，卡片右下角显示参数数量 badge（如 `6 参数`）。

### 展开面板

点击卡片或 badge 展开参数面板：

```
ljg-card
内容铸造：将内容铸成可见的 PNG 形态，六种模具...

  参数：
  · -l（默认） — 长图，1080 x auto，单张阅读卡
  · -i — 信息图，内容驱动的自适应视觉布局
  · -m — 多卡，1080 x 1440，自动切分为多张
  · -v — 视觉笔记，手绘风格 sketchnote
  · -c — 漫画，日式黑白漫画风格
  · -w — 白板，马克笔风格

[  -l  ] [  -i  ] [  -m  ] [  -v  ] [  -c  ] [  -w  ]
```

### 无参数的 Skill

无参数的 skill 保持现有展示，不显示参数区域。

### 复制行为

点击任意参数按钮，复制格式为 `/{skill-name} 参数`，Toast 提示"已复制 `/{skill-name} -i`"。

## 技术实现

### 后端改动（server.js）

解析 SKILL.md 时增加参数提取逻辑：

1. 读取文件内容
2. 查找 `## 参数` 或 `## Options` 章节
3. 解析后续的 Markdown 表格
4. 提取参数名（第一列）和说明（第二列）
5. 存入 `/api/skills` 响应中

### 前端改动（app.js）

1. Skill 卡片增加"展开参数"按钮或 badge
2. 点击展开显示参数面板
3. 参数按钮点击后复制命令到剪贴板
4. Toast 提示复制结果

## 优先级

| 优先级 | Skill |
|--------|-------|
| 高 | ljg-card, ljg-paper-flow, ljg-travel, baoyu-comic, baoyu-xhs-images |
| 中 | baoyu-infographic, baoyu-cover-image, baoyu-youtube-transcript, baoyu-image-gen, baoyu-slide-deck |
| 低 | 其他有参数的 skill |
