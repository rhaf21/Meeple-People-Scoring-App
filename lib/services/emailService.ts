import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.error('Email service not configured');
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Meeple People'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email: string, otp: string, playerName: string): Promise<boolean> {
  const subject = 'Your OTP for Meeple People Scoring App';
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
          <h1>🎲 Meeple People</h1>
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
          <p>Meeple People Scoring App - Track your board game victories!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${playerName}!

You requested to claim your player profile on Meeple People Scoring App.

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
  const subject = 'Welcome to Meeple People!';
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
          <h1>🎉 Welcome to Meeple People!</h1>
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
          <p>Meeple People Scoring App</p>
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
