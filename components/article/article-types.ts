// TODO: Replace with backend API response structure
// Ensure backend API supports the new fields: sourceMaterials, sourceCompetitors, generationPrompt
export type ArticleStatus = 'init' | 'draft' | 'published' | 'archived'

export type Article = {
  id: string
  title: string
  content: string
  summary?: string
  images: ArticleImage[]
  referenceLinks: ReferenceLink[]
  createdAt: string
  modifiedAt: string
  status: ArticleStatus
  tags: string[]
  category?: string
  // New fields for AI generation
  sourceMaterials?: string[]      // IDs of selected materials
  sourceCompetitors?: string[]     // IDs of competitor posts
  generationPrompt?: string        // User's AI prompt
}

export type ArticleImage = {
  id: string
  url: string
  alt: string
  caption?: string
}

export type ReferenceLink = {
  id: string
  url: string
  title: string
  description?: string
}

export type ArticleFormData = Omit<Article, 'id' | 'createdAt' | 'modifiedAt'>

// Mock data for demonstration
export const mockArticles: Article[] = [
  {
    id: "1",
    title: "AI技术在内容创作中的应用与发展趋势",
    content: "人工智能技术正在深刻改变内容创作的方式和效率。从自动化写作到智能编辑，AI工具为创作者提供了强大的支持。本文将深入探讨AI在内容创作领域的应用现状，分析主流AI创作工具的特点，并展望未来发展趋势。我们将重点关注自然语言处理、图像生成、视频制作等领域的AI应用，以及这些技术如何帮助创作者提高工作效率、改善内容质量。同时，我们也会讨论AI创作带来的挑战和伦理问题，为内容创作者提供全面的参考。",
    summary: "探讨AI技术在内容创作中的应用现状和发展趋势，分析主流工具和未来方向。",
    images: [
      { id: "img1", url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop", alt: "AI内容创作", caption: "AI辅助内容创作流程图" },
      { id: "img2", url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=300&fit=crop", alt: "机器学习", caption: "深度学习模型架构" },
      { id: "img3", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop", alt: "数据分析", caption: "内容数据分析可视化" }
    ],
    referenceLinks: [
      { id: "ref1", url: "https://openai.com/research", title: "OpenAI Research", description: "最新的AI研究进展和技术论文" },
      { id: "ref2", url: "https://arxiv.org/list/cs.CL/recent", title: "arXiv计算语言学", description: "自然语言处理领域的最新学术论文" },
      { id: "ref3", url: "https://developers.google.com/machine-learning", title: "Google ML开发者资源", description: "机器学习开发工具和教程" }
    ],
    createdAt: "2024-01-15 10:30:00",
    modifiedAt: "2024-01-16 15:45:00",
    status: "published",
    tags: ["AI", "内容创作", "技术趋势"],
    category: "技术文章"
  },
  {
    id: "2",
    title: "社交媒体营销策略：打造爆款内容的秘诀",
    content: "在当今数字化时代，社交媒体营销已成为品牌推广的核心策略。如何在海量内容中脱颖而出，打造真正吸引用户的爆款内容？本文将分享实用的社交媒体营销策略，包括内容策划、用户画像分析、发布时机选择、互动技巧等关键要素。我们将结合成功案例，详细解析抖音、小红书、微博等主流平台的内容创作技巧，帮助营销人员制定有效的社交媒体策略，提升品牌影响力和用户参与度。",
    summary: "分享社交媒体营销的实用策略，教你如何打造吸引用户的爆款内容。",
    images: [
      { id: "img4", url: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=400&h=300&fit=crop", alt: "社交媒体营销", caption: "社交媒体内容营销策略" },
      { id: "img5", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop", alt: "数据分析", caption: "营销数据分析报告" }
    ],
    referenceLinks: [
      { id: "ref4", url: "https://business.tiktok.com/", title: "TikTok商业中心", description: "TikTok营销工具和案例分析" },
      { id: "ref5", url: "https://marketing.adoroi.com", title: "数字营销学院", description: "数字营销知识和技能培训" }
    ],
    createdAt: "2024-01-14 09:15:00",
    modifiedAt: "2024-01-14 09:15:00",
    status: "published",
    tags: ["社交媒体", "营销策略", "内容创作"],
    category: "营销文章"
  },
  {
    id: "3",
    title: "个人品牌建设：从0到1打造专业影响力",
    content: "个人品牌在职业发展中扮演着越来越重要的角色。如何建立和维护个人品牌，提升在行业内的影响力？本文将从个人定位、内容输出、社交网络构建、口碑管理等方面，系统介绍个人品牌建设的策略和方法。通过实际案例，我们将展示不同领域的专业人士如何通过持续的价值输出和有效的社交策略，建立起独特的个人品牌，实现职业发展的突破。无论你是创业者、自由职业者还是职场人士，都能从中获得实用的建议。",
    summary: "系统介绍个人品牌建设的策略和方法，帮助提升职业影响力。",
    images: [
      { id: "img6", url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop", alt: "个人品牌", caption: "个人品牌建设路线图" }
    ],
    referenceLinks: [
      { id: "ref6", url: "https://linkedin.com/learning", title: "LinkedIn Learning", description: "职业技能和个人发展课程" }
    ],
    createdAt: "2024-01-13 16:20:00",
    modifiedAt: "2024-01-13 16:20:00",
    status: "draft",
    tags: ["个人品牌", "职业发展", "影响力"],
    category: "职业发展"
  },
  {
    id: "4",
    title: "短视频创作指南：从构思到发布的全流程解析",
    content: "短视频已成为最受欢迎的内容形式之一。如何创作出引人入胜的短视频内容？本文将详细介绍短视频创作的完整流程，从创意构思、脚本撰写、拍摄技巧到后期制作和发布策略。我们将分享实用的拍摄设备推荐、剪辑软件使用技巧、音乐选择要点，以及各大平台的内容推荐机制分析。无论你是短视频创作新手还是希望提升内容质量，都能找到有价值的指导。",
    summary: "详细介绍短视频创作的完整流程，从构思到发布的实用指南。",
    images: [
      { id: "img7", url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop", alt: "视频拍摄", caption: "专业视频拍摄设备" },
      { id: "img8", url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop", alt: "视频剪辑", caption: "视频剪辑工作流程" },
      { id: "img9", url: "https://images.unsplash.com/photo-1592659762303-90081d34b277?w=400&h=300&fit=crop", alt: "短视频平台", caption: "热门短视频平台对比" }
    ],
    referenceLinks: [
      { id: "ref7", url: "https://creator.douyin.com", title: "抖音创作平台", description: "抖音创作者工具和数据分析" },
      { id: "ref8", url: "https://studio.youtube.com", title: "YouTube创作工作室", description: "YouTube创作者资源和工具" }
    ],
    createdAt: "2024-01-12 11:45:00",
    modifiedAt: "2024-01-12 11:45:00",
    status: "published",
    tags: ["短视频", "内容创作", "视频制作"],
    category: "创作教程"
  },
  {
    id: "5",
    title: "内容创作者的时间管理技巧：提高效率的实用方法",
    content: "内容创作者经常面临多任务并行的挑战，如何有效管理时间，提高创作效率？本文将分享专门针对创作者的时间管理技巧，包括内容规划、批量创作、工具使用、精力管理等方面。我们将介绍实用的番茄工作法变种、内容日历制定方法、自动化工具推荐，以及如何克服创作瓶颈和拖延症。通过合理的时间管理，创作者可以在保证内容质量的同时，提高产出效率，实现更好的工作生活平衡。",
    summary: "分享专为内容创作者设计的时间管理技巧，帮助提高创作效率。",
    images: [
      { id: "img10", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", alt: "时间管理", caption: "创作者时间管理矩阵" },
      { id: "img11", url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop", alt: "工作计划", caption: "内容创作计划模板" }
    ],
    referenceLinks: [
      { id: "ref9", url: "https://todoist.com/productivity-methods", title: "Todoist效率方法", description: "各种生产力提升方法和工具介绍" }
    ],
    createdAt: "2024-01-11 14:30:00",
    modifiedAt: "2024-01-11 14:30:00",
    status: "draft",
    tags: ["时间管理", "效率提升", "创作技巧"],
    category: "效率工具"
  },
  {
    id: "6",
    title: "知识付费产品开发：从选题到变现的完整攻略",
    content: "知识付费已成为内容创作者重要的变现方式。如何开发受欢迎的知识付费产品？本文将系统介绍知识付费产品的开发流程，包括市场调研、选题策划、内容设计、产品制作、营销推广等关键环节。我们将分析在线课程、电子书、付费专栏、咨询服务等不同类型知识付费产品的特点，分享定价策略、用户获取、留存转化等实战经验。通过成功案例分析，帮助创作者找到适合自己的知识付费模式。",
    summary: "详细介绍知识付费产品的开发流程和变现策略，助力创作者商业成功。",
    images: [
      { id: "img12", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop", alt: "在线教育", caption: "知识付费产品形态" },
      { id: "img13", url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop", alt: "数据分析", caption: "知识付费行业数据报告" }
    ],
    referenceLinks: [
      { id: "ref10", url: "https://www.zhihu.com/explore", title: "知乎知识市场", description: "知识付费平台和案例分析" },
      { id: "ref11", url: "https://www.igetget.com", title: "得到App", description: "知识付费产品设计和运营经验" }
    ],
    createdAt: "2024-01-10 09:00:00",
    modifiedAt: "2024-01-10 09:00:00",
    status: "published",
    tags: ["知识付费", "产品开发", "商业变现"],
    category: "商业模式"
  },
  {
    id: "7",
    title: "直播带货技巧：提升转化率的关键要素",
    content: "直播带货已成为电商的重要形式，如何在激烈的竞争中脱颖而出？本文将分享直播带货的实用技巧，包括主播培养、话术设计、产品展示、互动技巧、流量获取等方面。我们将分析成功直播带货案例，总结提高转化率的关键要素，包括如何建立信任感、制造稀缺性、处理异议等。同时介绍直播设备选择、场景布置、技术准备等实操要点，帮助主播提升直播效果和销售业绩。",
    summary: "分享直播带货的实战技巧，帮助主播提高转化率和销售业绩。",
    images: [
      { id: "img14", url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop", alt: "直播设备", caption: "专业直播设备配置" },
      { id: "img15", url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop", alt: "直播场景", caption: "直播间布置方案" }
    ],
    referenceLinks: [
      { id: "ref12", url: "https://www.taobao.com", title: "淘宝直播", description: "淘宝直播平台和运营指南" },
      { id: "ref13", url: "https://live.kuaishou.com", title: "快手直播", description: "快手直播电商生态分析" }
    ],
    createdAt: "2024-01-09 13:15:00",
    modifiedAt: "2024-01-09 13:15:00",
    status: "draft",
    tags: ["直播带货", "电商技巧", "营销策略"],
    category: "电商运营"
  },
  {
    id: "8",
    title: "SEO优化实战：提升网站排名的系统性方法",
    content: "搜索引擎优化是获取自然流量的重要手段。如何系统性地进行SEO优化，提升网站排名？本文将从关键词研究、网站结构优化、内容优化、技术SEO、外链建设等方面，详细介绍SEO的最佳实践。我们将分享实用的SEO工具使用技巧，包括Google Analytics、Search Console、Ahrefs等工具的数据分析和优化建议。通过案例分析和实战经验，帮助网站运营者制定有效的SEO策略，提高搜索引擎排名和流量。",
    summary: "系统介绍SEO优化方法，包括关键词研究、内容优化、技术SEO等核心要点。",
    images: [
      { id: "img16", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop", alt: "SEO数据分析", caption: "SEO数据分析仪表板" }
    ],
    referenceLinks: [
      { id: "ref14", url: "https://developers.google.com/search", title: "Google搜索中心", description: "Google官方SEO指南和最佳实践" },
      { id: "ref15", url: "https://ahrefs.com/blog", title: "Ahrefs博客", description: "SEO和数字营销的专业见解" }
    ],
    createdAt: "2024-01-08 10:45:00",
    modifiedAt: "2024-01-08 10:45:00",
    status: "published",
    tags: ["SEO", "搜索引擎优化", "网站排名"],
    category: "技术优化"
  },
  {
    id: "9",
    title: "内容创作者的法律风险防范指南",
    content: "内容创作过程中存在各种法律风险，如何有效防范？本文将介绍创作者需要了解的法律知识，包括版权保护、肖像权、名誉权、广告法合规等方面。我们将分析常见侵权案例，讲解如何正确使用图片、音乐、视频等素材，避免法律纠纷。同时介绍内容合规要点，包括广告标识、虚假宣传、个人信息保护等注意事项。通过法律风险防范，创作者可以安心创作，避免不必要的法律麻烦。",
    summary: "介绍内容创作中的法律风险和防范措施，帮助创作者合规创作。",
    images: [
      { id: "img17", url: "https://images.unsplash.com/photo-1589829545856-d10d528e9868?w=400&h=300&fit=crop", alt: "法律文件", caption: "版权保护相关法律文件" }
    ],
    referenceLinks: [
      { id: "ref16", url: "https://www.copyright.gov", title: "美国版权局", description: "版权保护和注册相关信息" },
      { id: "ref17", url: "https://www.cac.gov.cn", title: "国家网信办", description: "中国互联网内容管理法规" }
    ],
    createdAt: "2024-01-07 16:20:00",
    modifiedAt: "2024-01-07 16:20:00",
    status: "archived",
    tags: ["法律风险", "版权保护", "内容合规"],
    category: "法律知识"
  },
  {
    id: "10",
    title: "元宇宙内容创作：新兴领域的机遇与挑战",
    content: "元宇宙作为新兴的数字领域，为内容创作者带来了新的机遇。如何在元宇宙环境中进行内容创作？本文将探讨元宇宙内容创作的特点和可能性，包括虚拟世界构建、3D内容制作、交互体验设计等方面。我们将分析当前主流元宇宙平台的内容生态，分享VR/AR内容创作工具和技巧，讨论元宇宙内容变现模式。虽然元宇宙仍处于发展初期，但提前布局这一领域的创作者将有机会抢占先机。",
    summary: "探讨元宇宙内容创作的机遇和挑战，介绍相关工具和平台。",
    images: [
      { id: "img18", url: "https://images.unsplash.com/photo-1644448357165-ca31b697933d?w=400&h=300&fit=crop", alt: "虚拟现实", caption: "元宇宙虚拟场景" },
      { id: "img19", url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop", alt: "3D建模", caption: "3D内容创作流程" }
    ],
    referenceLinks: [
      { id: "ref18", url: "https://www.meta.com", title: "Meta元宇宙", description: "Meta公司的元宇宙发展计划" },
      { id: "ref19", url: "https://unity.com", title: "Unity引擎", description: "3D内容开发和元宇宙创作平台" }
    ],
    createdAt: "2024-01-06 08:30:00",
    modifiedAt: "2024-01-06 08:30:00",
    status: "draft",
    tags: ["元宇宙", "VR内容", "3D创作"],
    category: "前沿技术"
  },
  {
    id: "11",
    title: "播客制作入门：从设备选择到节目运营",
    content: "播客作为音频内容的重要形式，正在快速发展。如何制作高质量的播客节目？本文将从设备选择、录音技巧、后期制作、节目策划等方面，详细介绍播客制作的完整流程。我们将推荐不同预算的录音设备配置，分享声音处理和降噪技巧，介绍常用的音频编辑软件。同时讨论播客内容规划、嘉宾邀请、听众互动等运营策略，帮助播客创作者建立稳定的节目体系和听众群体。",
    summary: "全面介绍播客制作流程，包括设备选择、录音技巧和节目运营方法。",
    images: [
      { id: "img20", url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop", alt: "录音设备", caption: "专业播客录音设备" },
      { id: "img21", url: "https://images.unsplash.com/photo-1590602847861-30972bbd7b6e?w=400&h=300&fit=crop", alt: "音频编辑", caption: "播客后期制作工作台" }
    ],
    referenceLinks: [
      { id: "ref20", url: "https://www.audacityteam.org", title: "Audacity", description: "免费开源音频编辑软件" },
      { id: "ref21", url: "https://podcasters.spotify.com", title: "Spotify播客", description: "播客托管和分发平台" }
    ],
    createdAt: "2024-01-05 12:10:00",
    modifiedAt: "2024-01-05 12:10:00",
    status: "published",
    tags: ["播客制作", "音频内容", "节目运营"],
    category: "音频创作"
  },
  {
    id: "12",
    title: "创作者经济：多元化收入模式探索",
    content: "创作者经济正在崛起，如何建立多元化的收入模式？本文将探讨创作者的各种变现方式，包括广告收入、付费内容、赞助合作、周边产品、线下活动等。我们将分析不同收入模式的特点和适用场景，分享成功案例和经验教训。同时讨论如何平衡内容质量和商业变现，如何建立可持续的商业模式，帮助创作者实现长期稳定的收入增长，摆脱对单一收入来源的依赖。",
    summary: "探讨创作者的多元化收入模式，分享变现策略和成功案例。",
    images: [
      { id: "img22", url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop", alt: "收入分析", caption: "创作者收入来源分析" },
      { id: "img23", url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop", alt: "商业模式", caption: "创作者商业模式画布" }
    ],
    referenceLinks: [
      { id: "ref22", url: "https://patreon.com", title: "Patreon", description: "创作者粉丝赞助平台" },
      { id: "ref23", url: "https://www.kickstarter.com", title: "Kickstarter", description: "创意项目众筹平台" }
    ],
    createdAt: "2024-01-04 15:35:00",
    modifiedAt: "2024-01-04 15:35:00",
    status: "published",
    tags: ["创作者经济", "收入模式", "商业变现"],
    category: "商业模式"
  }
]

// Helper functions
export const getStatusText = (status: ArticleStatus): string => {
  const statusMap: Record<ArticleStatus, string> = {
    init: '初始化',
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return statusMap[status]
}

export const getStatusVariant = (status: ArticleStatus): "default" | "secondary" | "destructive" | "outline" => {
  const variantMap: Record<ArticleStatus, "default" | "secondary" | "destructive" | "outline"> = {
    init: 'outline',      // Gray outline for init
    draft: 'secondary',   // Gray for draft
    published: 'default', // Blue for published
    archived: 'outline'   // Gray outline for archived
  }
  return variantMap[status]
}

// Article draft state for localStorage persistence
export interface ArticleDraft {
  article: Article | null           // 当前编辑的文章对象（Edit模式）
  isEditMode: boolean               // 是否为编辑模式
  lastSaved: string                 // ISO时间戳

  content: {
    html: string                    // HTML格式内容（主要）
    markdown: string                // Markdown格式
    text: string                    // 纯文本（用于字数统计）
  }

  metadata: {
    wordCount: number               // 字数统计
    hasUnsavedChanges: boolean      // 是否有未保存的更改
    version: string                 // 数据格式版本（用于未来迁移）
  }
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}