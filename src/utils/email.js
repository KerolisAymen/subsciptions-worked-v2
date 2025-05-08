const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME || 'default@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password',
  },
});

/**
 * Send verification email to a user
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.name - Recipient name
 * @param {string} options.verificationUrl - Verification link
 */
exports.sendVerificationEmail = async ({ email, subject, name, verificationUrl }) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Trip Expenses App'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USERNAME}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #0d6efd;">Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Thank you for signing up! Please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't sign up, you can ignore this email.</p>
        <p>Best regards,<br/>Trip Expenses Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending verification email:', err);
    throw err;
  }
};

/**
 * Send password reset email to a user
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.resetUrl - Password reset link
 */
exports.sendResetPasswordEmail = async ({ email, name, resetUrl }) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Trip Expenses App'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #0d6efd;">Password Reset</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can ignore this email - your password will remain unchanged.</p>
        <p>Best regards,<br/>Trip Expenses Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending password reset email:', err);
    throw err;
  }
};
