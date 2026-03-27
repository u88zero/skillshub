const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mime = require('mime');

const SKILLS_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'skills');
const FAVORITES_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'skills-hub-favorites.json');
const PORT = 3847;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Skills 缓存，30 秒 TTL
let skillsCache = { data: [], timestamp: 0 };
const CACHE_TTL = 30 * 1000;

// 标签关键词映射
const TAG_RULES = [
  { tag: '写作', keywords: ['write', '写作', '文章', '词语', '单词', 'paper', 'word', 'writes', 'epistle', 'card'] },
  { tag: '前端', keywords: ['vue', 'react', 'ui', 'html', 'css', 'frontend', 'component', '组件', 'shadcn', 'tailwind'] },
  { tag: '内容铸造', keywords: ['ppt', '幻灯片', '卡片', '图片', '视觉', 'slide', 'card', 'design', 'banner', '海报', '生成'] },
  { tag: '联网', keywords: ['联网', '抓取', '搜索', '下载', 'web', 'scrape', 'download', 'fetch', 'x-download'] },
  { tag: '开发流程', keywords: ['commit', 'review', 'test', 'debug', 'workflow', 'git', '代码审查', 'mcp', 'mcp-builder', 'git-workflow'] },
  { tag: '知识处理', keywords: ['learn', 'paper', 'rank', '知识', 'research', 'travel', 'invest', 'word-flow'] },
  { tag: '系统', keywords: ['system', '运维', 'deploy', '部署', 'executing', 'using-git'] },
];

// 英文技能中文描述映射
const CHINESE_DESCS = {
  // impeccable 套件
  'audit': '质量检查（可访问性、性能、响应式）',
  'critique': 'UX评审（层次、清晰度、情感共鸣）',
  'normalize': '对齐设计系统标准',
  'polish': '交付前的最终清理',
  'distill': '剥离至核心本质',
  'harden': '错误处理、i18n、边界情况',
  'optimize': '性能优化',
  'clarify': '改善不清晰的 UX 文案',
  'typeset': '修复字体、层级、大小',
  'colorize': '引入战略性色彩',
  'bolder': '放大平淡的设计',
  'quieter': '压低过于激进的设计',
  'delight': '添加惊喜时刻',
  'arrange': '修复布局、间距、视觉节奏',
  'animate': '添加有意义的动效',
  'overdrive': '添加技术性炫酷效果',
  'extract': '提取为可复用组件',
  'adapt': '适配不同设备和场景',
  'onboard': '设计新手引导流程',
  'teach-impeccable': '收集设计上下文并保存到配置',
  // bmad 套件
  'bmad-orchestrator': '编排 BMAD 工作流，结构化 AI 驱动开发',
  'builder': '创建自定义智能体、工作流和模板，扩展 BMAD 功能',
  'business-analyst': '产品发现与需求分析专家，调研利益相关者、分析市场',
  'creative-intelligence': '促进头脑风暴、研究与创意生成',
  'developer': '实现用户故事，编写测试代码，遵循最佳实践',
  'product-manager': '产品需求与规划专家，创建 PRD 和技术规格',
  'scrum-master': '敏捷冲刺规划与工作流专家，拆解史诗为用户故事',
  'system-architect': '系统架构设计，选择技术栈，定义组件与接口',
  'ux-designer': '用户体验设计，创建线框图，定义用户流程，确保可访问性',
  // document-skills
  'ckm:banner-design': '社交媒体、广告、网站横幅、创意素材设计，多种 AI 视觉艺术方向',
  'ckm:brand': '品牌声音、视觉识别、Messaging 框架、资产管理、品牌一致性',
  'ckm:design': '综合设计技能：品牌识别、设计令牌、UI 样式、Logo 生成、PPT 演示、文案图片',
  'ckm:design-system': '令牌架构、组件规范、幻灯片生成，三层令牌体系（Primitive→Semantic→Component）',
  'frontend-design': '创建独特、生产级的前端界面，高设计质量',
  'ljg-word': '英语单词深度掌握工具，拆解核心语义与认知',
  'ljg-learn': '深度概念解析器，从 8 个维度解构任意概念',
  'ljg-invest': '投资分析，判断项目是否为「秩序创造机器」',
  'ljg-paper': '论文阅读工具，将论文思想转化为个人可用的知识',
  'ljg-paper-flow': '论文工作流：读论文 + 生成卡片，一气呵成',
  'ljg-rank': '降秩分析，找出领域背后真正支撑的独立力',
  'ljg-epistle': '书信博客主题，私人书信设计隐喻',
  'ljg-travel': '深度旅行研究，博物馆与古建筑探索',
  'ljg-card': '内容铸造，将内容转化为 PNG 视觉卡片',
  'ljg-plain': '认知原子，用 12 岁小孩都能懂的方式重写任何内容',
  'ljg-word-flow': '词汇流：深度单词分析 + 信息图卡片',
  'ljg-skill-map': '技能地图，扫描所有已安装技能并可视化概览',
  'ljg-x-download': '下载 X（Twitter）帖子中的图片和视频',
  'ljg-writes': '写作引擎，带着观点出发，在写的过程中把它想透',
  'md2wechat': '将 Markdown 转换为微信公众号 HTML，支持主题与 AI 去味',
  'prompt-master': '为任何 AI 工具生成优化提示词',
  'skill-manager': 'Claude Code 全套技能管理系统',
  'ckm:slides': '用 Chart.js 创建战略性 HTML 演示文稿，支持设计令牌和响应式布局',
  'slides-from-script': '将讲稿文本转换为乔布斯风格的可播放幻灯片',
  'ckm:ui-styling': '用 shadcn/ui（Radix UI + Tailwind）创建精美可访问界面，支持深色模式和自定义主题',
  'ui-ux-pro-max': '网页与移动端 UI/UX 设计智能，支持 50+ 风格、161 调色板',
  'using-ant-design-vue': 'Vue 3 企业级 UI 组件库，76 个组件速查',
  'web-access': '所有联网操作（搜索、网页抓取、登录后操作、网络交互）',
  'ppt-maker': '从文档或大纲创建专业 PPT，搜索并插入内容',
  'scrapling': '使用 scrapling 进行网页抓取和数据提取',
  'claude-code-best-practice': 'Claude Code 全套最佳实践，84 条 Tips & Tricks',
  'claude-api': '使用 Claude API 或 Anthropic SDK 构建应用',
  'mcp-builder': 'MCP 服务器构建方法论，系统化构建生产级 MCP 工具',
  'brainstorming': '在任何创造性工作之前使用，探索意图、需求和设计',
  'chinese-code-review': '中文代码审查规范，保持专业严谨的反馈',
  'chinese-commit-conventions': '中文 Git 提交规范，适配国内团队',
  'chinese-documentation': '中文技术文档写作规范，排版术语结构一步到位',
  'chinese-git-workflow': '国内 Git 平台工作流规范（Gitee、Coding、极狐）',
  'dispensing-parallel-agents': '面对 2 个以上独立任务时分派并行智能体',
  'executing-plans': '执行书面实现计划，设有审查检查点',
  'finishing-a-development-branch': '开发分支收尾，合并、PR 或清理',
  'receiving-code-review': '收到代码审查反馈后实施建议之前使用',
  'requesting-code-review': '完成任务后验证成果是否符合要求',
  'subagent-driven-development': '当前会话中执行多任务实现计划',
  'systematic-debugging': '遇到 bug 或异常行为时系统化调试',
  'test-driven-development': '实现功能或修复 bug 前先写测试（TDD）',
  'using-git-worktrees': '创建隔离 git worktree 进行功能开发',
  'using-superpowers': '开始对话时确立如何查找和使用技能',
  'verification-before-completion': '宣称工作完成前必须运行验证',
  'workflow-runner': '在 Claude Code 中直接运行 agency-orchestrator YAML 工作流',
  'writing-plans': '多步骤任务在动手前先写实现计划',
  'writing-skills': '创建、编辑或验证技能时使用',
  // baoyu 系列
  'baoyu-compress-image': '将图片压缩为 WebP（默认）或 PNG，自动选择最佳工具。用户要求"压缩图片"、"优化图片"、"转为 webp"或减小图片文件体积时使用',
  'baoyu-cover-image': '生成文章封面图，涵盖 5 个维度（类型、配色、渲染、文字、氛围），内置 10 套配色方案和 7 种渲染风格。支持电影感（2.35:1）、宽屏（16:9）和方形（1:1）比例。用户要求"生成封面图"、"创建文章封面"或"制作封面"时使用',
  'baoyu-danger-gemini-web': '通过逆向工程的 Gemini Web API 生成图片和文字，支持文字生成、图文生成、参考图片（视觉输入）和多轮对话。当其他技能需要图片生成后端，或用户请求"用 Gemini 生成图片"、"Gemini 文字生成"或需要视觉能力 AI 时使用',
  'baoyu-danger-x-to-markdown': '将 X（Twitter）帖子和文章转换为带 YAML front matter 的 Markdown，使用逆向 API（需用户同意）。用户提到"X 转 markdown"、"tweet 转 markdown"、"保存推文"或提供 x.com/twitter.com 链接时使用',
  'baoyu-format-markdown': '格式化纯文本或 Markdown 文件，自动添加 frontmatter、标题、摘要、层级标题、加粗、列表、代码块，输出到 {filename}-formatted.md。用户要求"格式化 markdown"、"美化文章"、"添加格式"或改善文章排版时使用',
  'baoyu-image-gen': 'AI 图片生成，集成 OpenAI、Google、OpenRouter、DashScope、Jimeng、Seedream、Replicate 接口。支持文生图、参考图、多种比例和批量生成。用户要求"生成图片"、"创作图片"或"画图"时使用',
  'baoyu-post-to-x': '将内容和文章发布到 X（Twitter），支持图文/视频推文和 X Articles 长文。使用真实 Chrome + CDP 绕过反自动化。用户要求"发到 X"、"发推"、"发布到 Twitter"或"分享到 X"时使用',
  'baoyu-slide-deck': '从内容生成专业幻灯片图片，自动创建大纲和风格说明后逐页生成图片。用户要求"创建幻灯片"、"制作演示"、"生成 deck"或"PPT"时使用',
  'baoyu-url-to-markdown': '使用 Chrome CDP 抓取任意 URL 并转换为 Markdown，同时保存渲染后的 HTML 快照，增强型 Defuddle 管道更好地处理 web components 和 YouTube 字幕提取，支持自动捕获和用户信号两种模式。用户想要"保存网页为 markdown"时使用',
  'baoyu-article-illustrator': '分析文章结构，找出需要视觉辅助的位置，生成配套插图。用户要求"生成插图"、"文章配图"或"给文章加插画"时使用',
  'baoyu-comic': '知识漫画创作工具，支持多种艺术风格和基调，创作原创教育漫画。用户要求"创作漫画"、"生成知识漫画"或"制作 comic"时使用',
  'baoyu-infographic': '生成专业信息图，提供 21 种布局类型和 20 种视觉风格。用户要求"生成信息图"、"制作图表"或"创建 infographic"时使用',
  'baoyu-markdown-to-html': '将 Markdown 转换为带样式的 HTML，兼容微信公众号主题，支持代码高亮。用户要求"markdown 转 HTML"、"转换微信文章"或"导出 HTML"时使用',
  'baoyu-post-to-wechat': '通过 API 或 Chrome CDP 将内容发布到微信公众号，支持文章图文和视频。用户要求"发到微信公众号"、"发布微信"或"推送微信文章"时使用',
  'baoyu-post-to-weibo': '将内容和文章发布到微博，支持图文/视频微博和微博文章（长文）。用户要求"发到微博"、"发布微博"或"发新浪微博"时使用',
  'baoyu-translate': '翻译文章和文档，支持三种模式：快速（直接翻译）、标准（保留格式）、深度（理解语境后翻译）。用户要求"翻译文章"、"翻译文档"或"翻译内容"时使用',
  'baoyu-xhs-images': '生成小红书风格的信息图系列，提供 11 种视觉风格和 8 种版式。用户要求"生成小红书图"、"制作小红书配图"或"xhs 图片"时使用',
  'baoyu-youtube-transcript': '下载 YouTube 视频字幕/文字稿和封面图，支持按视频 URL 或 ID 获取。用户要求"下载 YouTube 字幕"、"获取 YouTube 文字稿"或"yt 字幕"时使用',
  // 更多技能
  'android-native-dev': 'Android 原生应用开发指南，覆盖 Material Design 3、Kotlin/Compose 开发、项目配置、可访问性和构建排障。使用前请阅读本指南。',
  'flutter-dev': 'Flutter 跨平台开发指南，覆盖 Widget 模式、状态管理、平台通道和性能优化。支持 Flutter 3.x 和 Dart 3。',
  'frontend-dev': '前端工作室技能，整合 UI 设计、开发、优化全流程。支持 React、Vue、Svelte 等主流框架。',
  'fullstack-dev': '全栈开发实践技能，前后端架构设计和集成指南。涵盖 API 设计、数据库选型、认证安全和部署策略。',
  'gif-sticker-maker': 'GIF 贴纸制作工具，将照片（人物、宠物、物体、Logo）转换为 4 帧动画 GIF。',
  'ios-application-dev': 'iOS 应用开发指南，覆盖 UIKit、SnapKit 和 SwiftUI 开发模式。包含布局、数据管理、网络请求和 App Store 提交流程。',
  'minimax-docx': '专业 DOCX 文档创建、编辑和格式化工具，使用 MiniMax 技术栈。',
  'minimax-multimodal-toolkit': 'MiniMax 多模态模型技能，支持图片理解、视觉问答、文档分析和内容生成。',
  'minimax-pdf': 'PDF 处理技能，视觉质量和设计身份优先。支持创建、编辑和优化 PDF 文档。',
  'minimax-xlsx': '专业 Excel 电子表格处理技能，支持创建、读取、分析、编辑和验证 .xlsx、.xlsm、.csv、.tsv 文件。涵盖财务建模、数据透视表和公式计算。',
  'pptx-generator': '生成、编辑和读取 PowerPoint 演示文稿。使用 PptxGenJS 从零创建（封面、目录、内容、分隔页、总结页），或通过 XML 工作流编辑现有 PPTX。',
  'premium-hero-prompting': 'AI 落地页生成提示词技能，用于创建高级动画落地页、深色 Apple 风格网站或液体玻璃效果。也用于生成 React + Tailwind 落地页，包含 Hero 区、视频背景或滚动动画。',
  'react-native-dev': 'React Native 和 Expo 开发指南，覆盖组件模式、样式、性能优化和原生模块集成。',
  'shader-dev': 'GLSL 着色器技术综合指南，创建惊艳视觉效果——光线步进、SDF 建模、流体模拟、粒子系统、程序化生成、光照、后处理等。',
  'minimax-skills:flutter-dev': 'Flutter 跨平台开发指南，覆盖 Widget 模式、状态管理、平台通道和性能优化。',
  'minimax-skills:android-native-dev': 'Android 原生应用开发指南，覆盖 Material Design 3、Kotlin/Compose 开发。',
  'minimax-skills:frontend-dev': '前端工作室技能，整合设计、开发、优化全流程。',
  'minimax-skills:fullstack-dev': '全栈开发实践，前后端架构设计和集成指南。',
  'minimax-skills:ios-application-dev': 'iOS 应用开发指南，覆盖 UIKit、SnapKit 和 SwiftUI。',
  'minimax-skills:gif-sticker-maker': 'GIF 贴纸制作工具，将照片转换为 4 帧动画 GIF。',
  'minimax-skills:minimax-multimodal-toolkit': 'MiniMax 多模态模型技能，支持图片理解和视觉问答。',
  'minimax-skills:minimax-pdf': 'PDF 处理技能，支持创建、编辑和优化 PDF。',
  'minimax-skills:minimax-docx': 'DOCX 文档创建和编辑工具。',
  'minimax-skills:minimax-xlsx': 'Excel 电子表格处理技能，支持创建、读取和编辑 .xlsx 文件。',
  'minimax-skills:pptx-generator': 'PowerPoint 演示文稿生成和编辑工具。',
  'minimax-skills:shader-dev': 'GLSL 着色器技术指南，创建视觉效果。',
  'minimax-skills:react-native-dev': 'React Native 和 Expo 开发指南。',
};

// HTML 转义，防止 <input> 等参数名被解析为 HTML 标签
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 参数描述中文映射
const CHINESE_PARAMS = {
  'baoyu-comic': {
    '--art': '艺术风格',
    '--tone': '基调/氛围',
    '--layout': '分镜布局',
    '--aspect': '页面比例',
    '--lang': '输出语言',
    '--storyboard-only': '仅生成故事板',
    '--prompts-only': '生成故事板+提示词',
    '--images-only': '从已有提示词生成图片',
    '--regenerate N': '重新生成指定页面',
  },
  'baoyu-compress-image': {
    '<input>': '输入文件或目录',
    '--output': '输出路径',
    '--format': '输出格式（webp/png/jpeg）',
    '--quality': '质量 0-100',
    '--keep': '保留原文件',
    '--recursive': '递归处理子目录',
    '--json': 'JSON 输出',
  },
  'baoyu-cover-image': {
    '--type <name>': '封面类型',
    '--palette <name>': '配色方案',
    '--rendering <name>': '渲染风格',
    '--style <name>': '艺术风格',
    '--text <level>': '文字排版',
    '--mood <level>': '基调强度',
    '--font <name>': '字体风格',
    '--aspect <ratio>': '图片比例',
    '--lang <code>': '标题语言',
    '--no-title': '无文字模式',
    '--quick': '跳过确认',
    '--ref <files...>': '参考图（风格/构图）',
  },
  'baoyu-danger-gemini-web': {
    '--prompt, -p': '提示词文本',
    '--promptfiles <files...>': '从文件读取提示词（拼接）',
    '--model, -m': '模型选择',
    '--image [path]': '生成图片',
    '--reference, --ref': '参考图（视觉输入）',
    '--sessionId': '多轮会话 ID',
    '--list-sessions': '列出已保存会话',
    '--json': 'JSON 输出',
    '--login': '刷新 Cookie',
    '--cookie-path': '自定义 Cookie 文件',
    '--profile-dir': 'Chrome 配置目录',
  },
  'baoyu-danger-x-to-markdown': {
    '<url>': 'Tweet 或文章 URL',
    '-o <path>': '输出路径',
    '--json': 'JSON 输出',
    '--download-media': '下载图片/视频素材',
    '--login': '仅刷新 Cookie',
  },
  'baoyu-image-gen': {
    '--prompt <text>, -p': '提示词文本',
    '--promptfiles <files...>': '从文件读取提示词（拼接）',
    '--image <path>': '输出图片路径',
    '--batchfile <path>': 'JSON 批量文件',
    '--jobs <count>': '批量模式工作线程数',
    '--provider google': '强制指定 Provider',
    '--model <id>, -m': '模型 ID',
    '--ar <ratio>': '宽高比（如 16:9）',
    '--size <WxH>': '图片尺寸（如 1024x1024）',
    '--quality normal': '质量预设',
    '--imageSize 1K': '图片尺寸',
    '--ref <files...>': '参考图片',
    '--n <count>': '图片数量',
    '--json': 'JSON 输出',
  },
  'baoyu-infographic': {
    '--layout': '布局类型（21种）',
    '--style': '视觉风格（20种）',
    '--aspect': '尺寸规格',
    '--lang': '输出语言',
  },
  'baoyu-slide-deck': {
    '--style <name>': '视觉风格',
    '--audience <type>': '目标受众',
    '--lang <code>': '输出语言',
    '--slides <number>': '目标幻灯片数量',
    '--outline-only': '仅生成大纲',
    '--prompts-only': '生成大纲+提示词',
    '--images-only': '从已有大纲生成图片',
    '--regenerate <N>': '重新生成指定幻灯片',
    'Content': '内容',
    '< 1000 words': '字数 < 1000',
    '1000-3000 words': '字数 1000-3000',
    '3000-5000 words': '字数 3000-5000',
    '> 5000 words': '字数 > 5000',
  },
  'baoyu-url-to-markdown': {
    '<url>': '待抓取的 URL',
    '-o <path>': '输出文件路径',
    '--output-dir <dir>': '基础输出目录',
    '--wait': '等待用户信号',
    '--timeout <ms>': '页面加载超时（毫秒）',
    '--download-media': '下载图片/视频素材',
  },
  'baoyu-xhs-images': {
    '--style <name>': '视觉风格（11种）',
    '--layout <name>': '版式类型（8种）',
    '--preset <name>': '风格+版式快捷方式',
  },
  'baoyu-youtube-transcript': {
    '<url-or-id>': 'YouTube 视频 URL 或 ID',
    '--languages <codes>': '语言代码列表',
    '--format <fmt>': '输出格式',
    '-o, --output <path>': '输出文件路径',
    '--output-dir <dir>': '输出目录',
    '--timestamps': '包含时间戳',
    '--transcript <type>': '字幕类型',
    '--platform': '平台标识',
  },
  'ljg-card': {
    '-l': '单张阅读卡，内容自动撑高',
    '-i': '内容驱动的自适应视觉布局',
    '-m': '自动切分为多张阅读卡片',
    '-v': '手绘风格 sketchnote',
    '-c': '日式黑白漫画风格',
    '-w': '白板马克笔风格',
  },
  'ljg-paper-flow': {
    '--input': '对话中已提供的论文链接/文件',
    '--card': '卡片模具改用多卡模式',
    '--infograph': '卡片模具改用信息图模式',
  },
  'ljg-travel': {
    '--city': '城市名',
    '--filter': '筛选条件（如 -f 唐代）',
  },
};

const IMPECCABLE_NAMES = new Set([
  'audit','critique','normalize','polish','distill','harden','optimize',
  'clarify','typeset','colorize','bolder','quieter','delight','arrange',
  'animate','overdrive','extract','adapt','onboard','teach-impeccable',
]);

function getTags(description, name) {
  if (IMPECCABLE_NAMES.has(name)) return ['设计'];
  const lower = (description || '').toLowerCase();
  const matched = [];
  for (const rule of TAG_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        if (!matched.includes(rule.tag)) matched.push(rule.tag);
        break;
      }
    }
  }
  return matched.length ? matched : ['通用'];
}

function parseFrontmatter(content) {
  const result = { name: '', version: '', description: '', invocable: false };
  if (!content) return result;

  // 可能有双重/多重 frontmatter，找 description 有实际内容的那个块
  const allMatches = [...content.matchAll(/^---\r?\n([\s\S]*?)\r?\n---/gm)];
  let fm = '';
  if (allMatches.length > 0) {
    // 优先找 description 非空的块
    for (const m of allMatches) {
      const block = m[1];
      const dm = block.match(/^description:\s*(.+?)(?=\r?\n\w+:\s|$)/m);
      if (dm && dm[1].trim().length > 0) {
        fm = block;
        break;
      }
    }
    // 否则用最后一个块
    if (!fm) fm = allMatches[allMatches.length - 1][1];
  }

  if (!fm) return result;

  const nameMatch = fm.match(/^name:\s*["']?([^"'\n]+)["']?/m);
  if (nameMatch) result.name = nameMatch[1].trim();

  const versionMatch = fm.match(/^version:\s*["']?([^"'\n]+)["']?/m);
  if (versionMatch) result.version = versionMatch[1].trim();

  // description 解析：取 description: 行之后的内容（到下一字段或 end 前）
  const descLineMatch = fm.match(/^description:\s*(.+?)(?=\r?\n\w+:\s|$)/m);
  if (descLineMatch) {
    let desc = descLineMatch[1].trim();
    // 去掉首尾引号
    desc = desc.replace(/^["']|["']$/g, '').trim();
    // 去掉多行标记 > 或 |
    desc = desc.replace(/^[>|]\s*/, '').trim();
    result.description = desc;
  }

  const invocMatch = fm.match(/^user_invocable:\s*(true|false)/m);
  if (invocMatch) result.invocable = invocMatch[1] === 'true';

  // 如果 frontmatter description 仍为空，从正文第一行提取
  if (!result.description) {
    const afterFm = content.replace(/^---[\s\S]*?---\r?\n/, '');
    const firstLine = afterFm.trim().split('\n')[0].trim();
    // 去掉 Markdown 标题符号
    const clean = firstLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    if (clean) result.description = clean;
  }

  return result;
}

function parseParams(content) {
  if (!content) return [];
  // 匹配 ## 参数 或 ## Options 章节（大小写不敏感）
  // 使用 \n## 而非 $ 来避免 multiline 模式下 $ 误匹配行尾
  const sectionMatch = content.match(/^##\s*(参数|Options)\s*\n([\s\S]*?)(?=\n##\s)/m);
  if (!sectionMatch) return [];
  const tableSection = sectionMatch[2];
  // 解析 Markdown 表格行
  const lines = tableSection.split('\n');
  const params = [];
  for (const line of lines) {
    // 提取所有单元格（去掉首尾空单元格）
    const cells = line.split('|').slice(1, -1).map(c => c.trim().replace(/\*\*/g, '').replace(/`/g, '').replace(/\\+$/, '').replace(/"+$/, ''));
    if (cells.length < 2) continue;
    const name = cells[0];
    const desc = cells[cells.length - 1]; // description 在最后一列
    if (!name || !desc) continue;
    if (name === '参数' || name === 'Option' || name === '---') continue;
    // 过滤分隔行（如 |------|------|）
    if (/^-+$/.test(name)) continue;
    params.push({ name, description: desc });
  }
  return params;
}

function scanSkills() {
  const now = Date.now();
  if (skillsCache.data.length && (now - skillsCache.timestamp) < CACHE_TTL) {
    return skillsCache.data;
  }

  const skills = [];
  if (!fs.existsSync(SKILLS_DIR)) {
    skillsCache = { data: [], timestamp: now };
    return skills;
  }

  const dirs = fs.readdirSync(SKILLS_DIR);
  for (const dir of dirs) {
    const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;

    let content;
    try {
      content = fs.readFileSync(skillPath, 'utf8');
    } catch {
      continue;
    }

    const fm = parseFrontmatter(content);
    const name = fm.name || dir;
    // impeccable 子技能优先用中文描述
    if (CHINESE_DESCS[name]) fm.description = CHINESE_DESCS[name];
    const shortDesc = (fm.description || '').split(/[.。]/)[0].substring(0, 80).trim();

    const params = parseParams(content);
    // 应用中文参数描述（无论是否在 CHINESE_PARAMS 中，统一查表翻译）
    const paramMap = CHINESE_PARAMS[name] || {};
    for (const p of params) {
      if (paramMap[p.name]) p.description = paramMap[p.name];
      p.name = escapeHtml(p.name);
    }
    skills.push({
      name,
      displayName: name,
      version: fm.version || '-',
      description: fm.description,
      shortDesc,
      invocable: fm.invocable,
      tags: getTags(fm.description, name),
      path: skillPath,
      params,
    });
  }

  skillsCache = { data: skills, timestamp: now };
  return skills;
}

function getFavorites() {
  if (!fs.existsSync(FAVORITES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2), 'utf8');
}

function handleApi(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // GET /api/skills
  if (pathname === '/api/skills' && req.method === 'GET') {
    const skills = scanSkills();
    res.end(JSON.stringify(skills));
    return;
  }

  // GET /api/favorites
  if (pathname === '/api/favorites' && req.method === 'GET') {
    res.end(JSON.stringify(getFavorites()));
    return;
  }

  // POST /api/favorites
  if (pathname === '/api/favorites' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name } = JSON.parse(body);
        const favorites = getFavorites();
        if (!favorites.includes(name)) {
          favorites.push(name);
          saveFavorites(favorites);
        }
        res.end(JSON.stringify({ success: true, favorites }));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'invalid request' }));
      }
    });
    return;
  }

  // DELETE /api/favorites/:name
  const deleteMatch = pathname.match(/^\/api\/favorites\/(.+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    const nameToRemove = decodeURIComponent(deleteMatch[1]);
    const favorites = getFavorites().filter(n => n !== nameToRemove);
    saveFavorites(favorites);
    res.end(JSON.stringify({ success: true, favorites }));
    return;
  }

  // GET /api/skills/:name — 返回单个技能完整信息（含 raw SKILL.md）
  const skillMatch = pathname.match(/^\/api\/skills\/(.+)$/);
  if (skillMatch && req.method === 'GET') {
    const skillName = decodeURIComponent(skillMatch[1]);
    const skills = scanSkills();
    const skill = skills.find(s => s.name === skillName);
    if (!skill) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'skill not found' }));
      return;
    }
    let rawContent = '';
    try {
      rawContent = fs.readFileSync(skill.path, 'utf8');
    } catch {}
    res.end(JSON.stringify({ ...skill, rawContent }));
    return;
  }

  // POST /api/skills/refresh — 强制刷新缓存
  if (pathname === '/api/skills/refresh' && req.method === 'POST') {
    skillsCache = { data: [], timestamp: 0 };
    const skills = scanSkills();
    res.end(JSON.stringify({ success: true, count: skills.length }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
}

function handleStatic(req, res) {
  const parsed = url.parse(req.url);
  let pathname = parsed.pathname;

  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join(PUBLIC_DIR, pathname);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  const mimeType = mime.getType(filePath) || 'text/plain';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'no-cache');
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  if (parsed.pathname.startsWith('/api/')) {
    handleApi(req, res);
  } else {
    handleStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`Skills Hub running at http://localhost:${PORT}`);
});
