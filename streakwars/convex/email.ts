import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInvitationEmail = internalAction({
  args: {
    toEmail: v.string(),
    fromUserName: v.string(),
    fromUserEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { toEmail, fromUserName, fromUserEmail } = args;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join habituate!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f8f8;
          }
          .container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 2rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 10px;
          }
          .tagline {
            color: #666;
            font-size: 1rem;
          }
          .content {
            margin-bottom: 30px;
          }
          .invitation-text {
            font-size: 1.1rem;
            margin-bottom: 20px;
            color: #333;
          }
          .cta-button {
            display: inline-block;
            background: #1a1a1a;
            color: white;
            padding: 16px 32px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
          }
          .cta-button:hover {
            background: #2a2a2a;
            transform: translateY(-2px);
          }
          .features {
            background: #f8f8f8;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          .feature {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          }
          .feature-icon {
            font-size: 1.2rem;
            margin-right: 12px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .social-proof {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            color: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin-top: 15px;
          }
          .stat {
            text-align: center;
          }
          .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            display: block;
          }
          .stat-label {
            font-size: 0.8rem;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">habituate</div>
            <div class="tagline">Turn bad habits into good ones</div>
          </div>
          
          <div class="content">
            <div class="invitation-text">
              <strong>${fromUserName}</strong> (${fromUserEmail}) has invited you to join <strong>habituate</strong> - the app that turns competition into motivation for building better habits!
            </div>
            
            <div style="text-align: center;">
              <a href="https://localhost:3003/signup?invite=${encodeURIComponent(toEmail)}" class="cta-button">
                Join habituate now! 🚀
              </a>
            </div>
            
            <div class="features">
              <h3 style="margin-top: 0; color: #1a1a1a;">What you'll get:</h3>
              <div class="feature">
                <span class="feature-icon">🎯</span>
                <span>Track daily habits with friends</span>
              </div>
              <div class="feature">
                <span class="feature-icon">🏆</span>
                <span>Compete in monthly challenges</span>
              </div>
              <div class="feature">
                <span class="feature-icon">💰</span>
                <span>Win real money prizes</span>
              </div>
              <div class="feature">
                <span class="feature-icon">🔥</span>
                <span>Build unbreakable streaks</span>
              </div>
            </div>
            
            <div class="social-proof">
              <div style="font-weight: 600; margin-bottom: 10px;">Join thousands building better habits</div>
              <div class="stats">
                <div class="stat">
                  <span class="stat-number">10K+</span>
                  <span class="stat-label">Active Users</span>
                </div>
                <div class="stat">
                  <span class="stat-number">50K+</span>
                  <span class="stat-label">Habits Tracked</span>
                </div>
                <div class="stat">
                  <span class="stat-number">$25K+</span>
                  <span class="stat-label">Prizes Won</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${fromUserName}. If you didn't expect this email, you can safely ignore it.</p>
            <p style="margin-top: 15px;">
              <a href="#" style="color: #666; text-decoration: none;">Unsubscribe</a> | 
              <a href="#" style="color: #666; text-decoration: none;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
      You're invited to join habituate!
      
      ${fromUserName} (${fromUserEmail}) has invited you to join habituate - the app that turns competition into motivation for building better habits!
      
      What you'll get:
      🎯 Track daily habits with friends
      🏆 Compete in monthly challenges  
      💰 Win real money prizes
      🔥 Build unbreakable streaks
      
      Join now: https://localhost:3003/signup?invite=${encodeURIComponent(toEmail)}
      
      This invitation was sent by ${fromUserName}. If you didn't expect this email, you can safely ignore it.
    `;

    const { data, error } = await resend.emails.send({
      from: 'Habituate <invites@habituate.arnavjhajharia.com>',
      to: [toEmail],
      subject: `${fromUserName} invited you to join habituate! 🚀`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.log('Email error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data);
    return { success: true, messageId: data?.id };
  },
});
