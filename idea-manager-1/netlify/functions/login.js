// Netlify Function: kiểm tra mật khẩu chung phía server.
// Mật khẩu thật (APP_PASSWORD) chỉ tồn tại trong biến môi trường
// của Netlify, không bao giờ được đưa vào bundle frontend.
//
// Endpoint: /.netlify/functions/login
// Method: POST { password: string }
// Response: { ok: boolean, token?: string }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let password = ''
  try {
    const body = JSON.parse(event.body || '{}')
    password = body.password || ''
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid body' }) }
  }

  const appPassword = process.env.APP_PASSWORD

  if (!appPassword) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'APP_PASSWORD chưa được cấu hình trên server' }),
    }
  }

  if (password !== appPassword) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Sai mật khẩu' }) }
  }

  // Token đơn giản: không cần JWT phức tạp cho 2 người dùng nội bộ.
  // Token chỉ dùng để đánh dấu phiên đăng nhập hợp lệ trong trình duyệt.
  const token = Buffer.from(`${Date.now()}:${Math.random()}`).toString('base64')

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, token }),
  }
}
