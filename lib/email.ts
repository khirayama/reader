import { Resend } from 'resend';

// Resendインスタンスの作成
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * パスワードリセットメールを送信する
 * @param email 送信先メールアドレス
 * @param token リセットトークン
 */
export const sendPasswordResetEmail = async (
  email: string, 
  token: string
) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: 'パスワードリセットのご案内',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; font-size: 24px;">パスワードリセットのご案内</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            パスワードリセットのリクエストを受け付けました。以下のリンクをクリックして新しいパスワードを設定してください。
          </p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            パスワードをリセットする
          </a>
          <p style="color: #555; font-size: 14px; line-height: 1.5;">
            このリンクは1時間後に無効になります。リンクをクリックしてもうまく機能しない場合は、再度パスワードリセットをリクエストしてください。
          </p>
          <p style="color: #555; font-size: 14px; line-height: 1.5;">
            このメールにお心当たりがない場合は、無視していただいて構いません。
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
    } else {
      console.log('Password reset email sent successfully:', data);
    }
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
};