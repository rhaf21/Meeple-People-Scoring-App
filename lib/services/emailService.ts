import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Get or create Resend client instance
 */
function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send an email using Resend with retry logic
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    console.error('Resend client not initialized');
    return false;
  }

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to send email (attempt ${attempt}/${maxRetries})...`);

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Farty Meople <noreply@fartymeople.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      console.log('Email sent successfully:', data);
      return true;
    } catch (error: any) {
      console.error(`Email attempt ${attempt} failed:`, {
        message: error.message,
        to: options.to,
        subject: options.subject,
      });

      if (attempt === maxRetries) {
        console.error('Failed to send email after all retries');
        return false;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return false;
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email: string, otp: string, playerName: string): Promise<boolean> {
  const subject = 'Your OTP for Farty Meople Scoring App';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎲 Farty Meople</h1>
          <p>Board Game Scoring App</p>
        </div>
        <div class="content">
          <h2>Hello ${playerName}!</h2>
          <p>You requested to claim your player profile. Use the OTP below to verify your email address:</p>

          <div class="otp-box">
            <div class="otp">${otp}</div>
          </div>

          <p><strong>This OTP is valid for 10 minutes.</strong></p>

          <p>If you didn't request this, you can safely ignore this email.</p>

          <p>Happy gaming! 🎮</p>
        </div>
        <div class="footer">
          <p>Farty Meople Scoring App - Track your board game victories!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${playerName}!

You requested to claim your player profile on Farty Meople Scoring App.

Your OTP is: ${otp}

This OTP is valid for 10 minutes.

If you didn't request this, you can safely ignore this email.

Happy gaming!
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Send welcome email after successful profile claim
 */
export async function sendWelcomeEmail(email: string, playerName: string): Promise<boolean> {
  const subject = 'Welcome to Farty Meople!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Farty Meople!</h1>
        </div>
        <div class="content">
          <h2>Hello ${playerName}!</h2>
          <p>Your profile has been successfully claimed! You now have full control over your player profile.</p>

          <h3>What you can do now:</h3>

          <div class="feature">
            <strong>📝 Customize Your Profile</strong><br>
            Add a bio, set your play style, and list your favorite games.
          </div>

          <div class="feature">
            <strong>📊 Track Your Stats</strong><br>
            View detailed statistics about your gaming performance.
          </div>

          <div class="feature">
            <strong>📅 Manage Availability</strong><br>
            Set your availability and never miss a game night!
          </div>

          <div class="feature">
            <strong>🎮 Join Game Nights</strong><br>
            RSVP to upcoming game sessions with your gaming group.
          </div>

          <p>Start exploring and may the dice be ever in your favor! 🎲</p>
        </div>
        <div class="footer">
          <p>Farty Meople Scoring App</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
