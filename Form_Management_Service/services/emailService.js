const fs = require('fs');
const path = require('path');
const { appConfig } = require('../config/appConfig');

const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', 'email');

const loadTemplate = (templateName) => {
  const templatePath = path.join(TEMPLATE_DIR, `${templateName}.html`);
  return fs.readFileSync(templatePath, 'utf8');
};

const renderTemplate = (templateName, variables = {}) => {
  let html = loadTemplate(templateName);

  Object.entries(variables).forEach(([key, value]) => {
    const safeValue = value === null || value === undefined ? '' : String(value);
    html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), safeValue);
  });

  return html;
};

const buildPlainText = (html) => html
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const sendWithProvider = async ({ to, subject, html, text }) => {
  const provider = appConfig.email.provider;

  if (provider === 'console') {
    console.log('\n========== EMAIL (console provider — not sent) ==========');
    console.log(`To: ${to}`);
    console.log(`From: ${appConfig.email.fromName} <${appConfig.email.from}>`);
    console.log(`Subject: ${subject}`);
    console.log('--- HTML preview (first 500 chars) ---');
    console.log(html.slice(0, 500));
    console.log('=======================================================\n');
    return { provider: 'console', sent: false, queued: true };
  }

  if (provider === 'resend') {
    if (!appConfig.email.resendApiKey) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
    }
    // Provider hook — connect when ready
    throw new Error('Resend provider is configured but not connected yet. Set EMAIL_PROVIDER=console for now.');
  }

  if (provider === 'sendgrid') {
    if (!appConfig.email.sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY is required when EMAIL_PROVIDER=sendgrid');
    }
    throw new Error('SendGrid provider is configured but not connected yet. Set EMAIL_PROVIDER=console for now.');
  }

  if (provider === 'smtp') {
    if (!appConfig.email.smtp.host) {
      throw new Error('SMTP_HOST is required when EMAIL_PROVIDER=smtp');
    }
    throw new Error('SMTP provider is configured but not connected yet. Set EMAIL_PROVIDER=console for now.');
  }

  throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to || !subject || !html) {
    throw new Error('Email requires to, subject, and html');
  }

  return sendWithProvider({
    to,
    subject,
    html,
    text: text || buildPlainText(html)
  });
};

const sendVerificationEmail = async ({ to, name, token }) => {
  const verifyUrl = `${appConfig.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const html = renderTemplate('verifyEmail', {
    name: name || 'there',
    verifyUrl,
    appName: appConfig.email.fromName,
    supportEmail: appConfig.email.from
  });

  return sendEmail({
    to,
    subject: `Verify your ${appConfig.email.fromName} account`,
    html
  });
};

const sendPasswordResetEmail = async ({ to, name, token }) => {
  const resetUrl = `${appConfig.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const html = renderTemplate('resetPassword', {
    name: name || 'there',
    resetUrl,
    appName: appConfig.email.fromName,
    supportEmail: appConfig.email.from,
    expiryMinutes: '60'
  });

  return sendEmail({
    to,
    subject: `Reset your ${appConfig.email.fromName} password`,
    html
  });
};

const sendWelcomeEmail = async ({ to, name }) => {
  const dashboardUrl = `${appConfig.frontendUrl}/`;
  const html = renderTemplate('welcome', {
    name: name || 'there',
    dashboardUrl,
    appName: appConfig.email.fromName,
    supportEmail: appConfig.email.from
  });

  return sendEmail({
    to,
    subject: `Welcome to ${appConfig.email.fromName}`,
    html
  });
};

module.exports = {
  renderTemplate,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
