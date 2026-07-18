HUONG DAN CAP NHAT AI OPENAI CHO IDEA MANAGER

1) Chay SQL truoc:
- Supabase > SQL Editor > New query
- Mo file supabase/migrate_ai_reports.sql
- Copy toan bo noi dung, dan vao SQL Editor va Run

2) Them bien moi truong trong Netlify:
- Netlify > ideamanager > Project configuration > Environment variables
- Them:
  OPENAI_API_KEY = API key OpenAI cua ban
  OPENAI_MODEL = gpt-5-mini
  OPENAI_ENABLE_WEB_SEARCH = true
  OPENAI_REASONING_EFFORT = low

Giu nguyen cac bien Supabase:
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY

Tuyet doi KHONG dung ten VITE_OPENAI_API_KEY, vi nhu vay key se bi dua ra frontend.

3) Upload code len GitHub:
- Giai nen zip
- Chon cac file/folder ben trong, gom src, netlify, supabase, public, package.json, netlify.toml...
- GitHub > Add file > Upload files
- Keo file vao thu muc goc repo, khong keo ca thu muc cha
- Commit: Add OpenAI auto analysis

4) Deploy Netlify:
- Netlify > Deploys > Trigger deploy > Clear cache and deploy site
- Cho Published
- Hard refresh website: Mac Command + Shift + R, Windows Ctrl + Shift + R

5) Su dung:
- Trong bang idea hoac Idea da luu, bam nut Tu dong phan tich
- AI se tu nhan dien san pham tu ten idea/link/niche/ghi chu
- Report se gom 9 truong:
  Khach hang muc tieu
  Pain point
  Thi truong / mua vu
  USP
  Content angle
  Ads angle
  Gia / bundle / upsell
  Rui ro
  Next action
