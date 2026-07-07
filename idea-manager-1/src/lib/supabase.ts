import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
// Ưu tiên key mới của Supabase. Vẫn hỗ trợ tên biến cũ để tránh lỗi khi nâng cấp.
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
) as string

if (!supabaseUrl || !supabasePublishableKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Thiếu biến môi trường VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'Hãy cấu hình biến môi trường dựa trên file .env.example.'
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabasePublishableKey ?? '')
