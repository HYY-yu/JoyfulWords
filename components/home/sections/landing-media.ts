// 首页演示视频与海报托管在 Cloudflare R2（bucket: joyful-words → cdn.joyword.link）。
// 源文件由 ~/joyword-landing-videos 工程渲染后上传，不进 git 仓库。
export const LANDING_VIDEO_BASE = "https://cdn.joyword.link/home/video"
export const LANDING_POSTER_BASE = `${LANDING_VIDEO_BASE}/posters`
