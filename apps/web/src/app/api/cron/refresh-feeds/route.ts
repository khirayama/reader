import { type NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  // Vercel Cron Jobからのリクエストかを検証
  const authHeader = headers().get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 管理者用の認証トークンを使用してAPIサーバーにリクエスト
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const adminToken = process.env.ADMIN_API_TOKEN

    if (!adminToken) {
      throw new Error('Admin API token not configured')
    }

    // 全ユーザーのフィードを更新するエンドポイントを呼び出す
    const response = await fetch(`${apiUrl}/api/admin/refresh-all-feeds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh feeds: ${error}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Feed refresh initiated',
      timestamp: new Date().toISOString(),
      result,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Failed to refresh feeds',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
