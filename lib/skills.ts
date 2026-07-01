/**
 * Shared skills taxonomy — used by both talent profiles and startup/creator needs.
 * One source of truth so matching can work across both sides.
 */

export interface Skill {
  id: string;
  label: string;
}

export interface SkillCategory {
  id: string;
  label: string;
  icon: string;
  skills: Skill[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "roles",
    label: "Rollen & Positionen",
    icon: "👔",
    skills: [
      { id: "role_cofounder", label: "Co-Founder" },
      { id: "role_ceo", label: "CEO / Geschäftsführung" },
      { id: "role_cto", label: "CTO / Tech-Lead" },
      { id: "role_coo", label: "COO / Operations" },
      { id: "role_cmo", label: "CMO / Marketing-Lead" },
      { id: "role_cfo", label: "CFO / Finanzen" },
      { id: "role_product_manager", label: "Product Manager" },
      { id: "role_project_manager", label: "Projektmanager" },
      { id: "role_software_engineer", label: "Software-Entwickler" },
      { id: "role_frontend_dev", label: "Frontend-Entwickler" },
      { id: "role_backend_dev", label: "Backend-Entwickler" },
      { id: "role_mobile_dev", label: "Mobile-Entwickler" },
      { id: "role_data_scientist", label: "Data Scientist / ML" },
      { id: "role_ux_designer", label: "UX / UI Designer" },
      { id: "role_social_media_manager", label: "Social Media Manager" },
      { id: "role_content_creator", label: "Content Creator" },
      { id: "role_community_manager", label: "Community Manager" },
      { id: "role_growth_marketer", label: "Growth Marketer" },
      { id: "role_sales_manager", label: "Sales Manager / Vertrieb" },
      { id: "role_hr_manager", label: "HR-Manager / Recruiting" },
      { id: "role_copywriter", label: "Copywriter / Texter" },
    ],
  },
  {
    id: "video",
    label: "Video & Film",
    icon: "🎬",
    skills: [
      { id: "video_editing", label: "Video Editing / Schnitt" },
      { id: "color_grading", label: "Color Grading" },
      { id: "cinematography", label: "Kameraführung" },
      { id: "short_form", label: "Short-Form (Reels, Shorts, TikTok)" },
      { id: "long_form", label: "Long-Form (YouTube, Doku)" },
      { id: "vfx", label: "VFX / Visual Effects" },
      { id: "premiere", label: "Adobe Premiere" },
      { id: "davinci", label: "DaVinci Resolve" },
      { id: "finalcut", label: "Final Cut Pro" },
      { id: "after_effects", label: "After Effects" },
    ],
  },
  {
    id: "music_audio",
    label: "Musik & Audio",
    icon: "🎵",
    skills: [
      { id: "music_production", label: "Musikproduktion / Beatmaking" },
      { id: "mixing", label: "Mixing" },
      { id: "mastering", label: "Mastering" },
      { id: "sound_design", label: "Sound Design" },
      { id: "podcast_production", label: "Podcast-Produktion" },
      { id: "voice_over", label: "Voice-Over / Sprecher" },
      { id: "jingle", label: "Jingle / Intro-Musik" },
      { id: "ableton", label: "Ableton Live" },
      { id: "fl_studio", label: "FL Studio" },
      { id: "logic_pro", label: "Logic Pro" },
      { id: "guitar", label: "Gitarre" },
      { id: "piano", label: "Klavier / Keys" },
      { id: "drums", label: "Schlagzeug" },
      { id: "singing", label: "Gesang" },
    ],
  },
  {
    id: "design",
    label: "Design & Grafik",
    icon: "🎨",
    skills: [
      { id: "thumbnail_design", label: "Thumbnail Design" },
      { id: "logo_design", label: "Logo & Branding" },
      { id: "ui_ux", label: "UI/UX Design" },
      { id: "graphic_design", label: "Grafik Design" },
      { id: "figma", label: "Figma" },
      { id: "photoshop", label: "Adobe Photoshop" },
      { id: "illustrator", label: "Adobe Illustrator" },
      { id: "canva", label: "Canva" },
      { id: "motion_design", label: "Motion Design" },
      { id: "3d_design", label: "3D Design" },
      { id: "blender", label: "Blender" },
      { id: "brand_identity", label: "Brand Identity" },
    ],
  },
  {
    id: "art_illustration",
    label: "Kunst & Illustration",
    icon: "🖼️",
    skills: [
      { id: "digital_art", label: "Digital Art" },
      { id: "illustration", label: "Illustration" },
      { id: "character_design", label: "Character Design" },
      { id: "comic_manga", label: "Comic / Manga" },
      { id: "concept_art", label: "Concept Art" },
      { id: "pixel_art", label: "Pixel Art" },
      { id: "procreate", label: "Procreate" },
      { id: "traditional_art", label: "Traditionelle Kunst" },
      { id: "nft_art", label: "NFT / Generative Art" },
    ],
  },
  {
    id: "tech",
    label: "Technik & Development",
    icon: "💻",
    skills: [
      { id: "web_dev", label: "Web Development" },
      { id: "app_dev", label: "App Development" },
      { id: "frontend", label: "Frontend (React, Vue, …)" },
      { id: "backend", label: "Backend (Node, Python, …)" },
      { id: "fullstack", label: "Full-Stack" },
      { id: "mobile_ios", label: "iOS / Swift" },
      { id: "mobile_android", label: "Android / Kotlin" },
      { id: "devops", label: "DevOps / Cloud" },
      { id: "ai_ml", label: "AI / Machine Learning" },
      { id: "game_dev", label: "Game Development" },
      { id: "unity", label: "Unity" },
      { id: "unreal", label: "Unreal Engine" },
      { id: "blockchain", label: "Blockchain / Web3" },
      { id: "cybersecurity", label: "Cybersecurity" },
      { id: "data_science", label: "Data Science" },
      { id: "automation", label: "Automation / Scripting" },
    ],
  },
  {
    id: "streaming_gaming",
    label: "Streaming & Gaming",
    icon: "🎮",
    skills: [
      { id: "streaming_setup", label: "Stream Setup & Technik" },
      { id: "obs", label: "OBS / Streaming Software" },
      { id: "overlay_design", label: "Stream Overlay Design" },
      { id: "stream_moderation", label: "Chat / Moderation" },
      { id: "gaming_commentary", label: "Gaming Commentary" },
      { id: "esports_coaching", label: "Esports Coaching" },
      { id: "bot_setup", label: "Chatbot Setup (Nightbot, StreamElements)" },
      { id: "clips_highlights", label: "Clip & Highlight-Erstellung" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    icon: "📈",
    skills: [
      { id: "social_media", label: "Social Media Management" },
      { id: "seo", label: "SEO" },
      { id: "ads", label: "Paid Ads (Meta, Google, TikTok)" },
      { id: "email_marketing", label: "E-Mail Marketing" },
      { id: "content_strategy", label: "Content Strategie" },
      { id: "influencer_marketing", label: "Influencer Marketing" },
      { id: "community_building", label: "Community Building" },
      { id: "affiliate", label: "Affiliate Marketing" },
      { id: "growth_hacking", label: "Growth Hacking" },
      { id: "analytics", label: "Analytics & Tracking" },
      { id: "pr", label: "PR & Presse" },
    ],
  },
  {
    id: "content_writing",
    label: "Content & Text",
    icon: "✍️",
    skills: [
      { id: "copywriting", label: "Copywriting" },
      { id: "scriptwriting", label: "Skript / Drehbuch" },
      { id: "subtitles", label: "Untertitel / Captions" },
      { id: "translation", label: "Übersetzung" },
      { id: "blog_writing", label: "Blog & Artikel" },
      { id: "ghostwriting", label: "Ghostwriting" },
      { id: "storytelling", label: "Storytelling" },
      { id: "social_copy", label: "Social Media Texte" },
    ],
  },
  {
    id: "business",
    label: "Business & Finanzen",
    icon: "💼",
    skills: [
      { id: "business_strategy", label: "Business Strategie" },
      { id: "fundraising", label: "Fundraising / Investor Relations" },
      { id: "accounting", label: "Buchhaltung / Steuer" },
      { id: "legal", label: "Recht / Verträge" },
      { id: "product_management", label: "Product Management" },
      { id: "project_management", label: "Projektmanagement" },
      { id: "sales", label: "Sales / Vertrieb" },
      { id: "customer_success", label: "Customer Success" },
      { id: "operations", label: "Operations" },
      { id: "hr", label: "HR / Recruiting" },
    ],
  },
  {
    id: "photo",
    label: "Fotografie",
    icon: "📷",
    skills: [
      { id: "photography", label: "Fotografie" },
      { id: "photo_editing", label: "Bildbearbeitung" },
      { id: "product_photo", label: "Produktfotografie" },
      { id: "portrait", label: "Portrait-Fotografie" },
      { id: "event_photo", label: "Event-Fotografie" },
      { id: "lightroom", label: "Adobe Lightroom" },
    ],
  },
  {
    id: "performance",
    label: "Performance & Bühne",
    icon: "🎭",
    skills: [
      { id: "acting", label: "Schauspiel" },
      { id: "presenting", label: "Moderation / Presenter" },
      { id: "comedy", label: "Comedy / Stand-Up" },
      { id: "dance", label: "Tanz / Choreografie" },
      { id: "hosting", label: "Hosting / UGC" },
    ],
  },
];

// Flat list of all skills for quick lookup
export const ALL_SKILLS: Skill[] = SKILL_CATEGORIES.flatMap(c => c.skills);

export function getSkillLabel(id: string): string {
  return ALL_SKILLS.find(s => s.id === id)?.label ?? id;
}

export function getCategoryForSkill(skillId: string): SkillCategory | undefined {
  return SKILL_CATEGORIES.find(c => c.skills.some(s => s.id === skillId));
}
