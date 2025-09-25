const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const Notification = require('../models/Notification');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  async initializeTransporter() {
    try {
      // Configure based on email service provider
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

      // Create transporter
      this.transporter = nodemailer.createTransporter(emailConfig);

      // Verify connection configuration
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.verify();
        console.log('Email service initialized successfully');
      } else {
        console.warn('Email credentials not found. Email functionality will be disabled.');
      }
    } catch (error) {
      console.error('Email service initialization failed:', error.message);
      this.transporter = null;
    }
  }

  // Check if email service is available
  isAvailable() {
    return this.transporter !== null;
  }

  // Send basic email
  async sendEmail(to, subject, text, html = null, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Email service is not configured');
    }

    try {
      const mailOptions = {
        from: options.from || process.env.SMTP_FROM || process.env.SMTP_USER,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
        html: html || text,
        ...options,
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log('Email sent successfully:', {
        messageId: result.messageId,
        to: mailOptions.to,
        subject,
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Load email template
  async loadTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf8');

      // Replace variables in template
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, value);
      }

      return template;
    } catch (error) {
      console.warn(`Template ${templateName} not found, using fallback`);
      return this.getFallbackTemplate(templateName, variables);
    }
  }

  // Get fallback template when template file is not available
  getFallbackTemplate(templateName, variables = {}) {
    const baseStyle = `
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    `;

    switch (templateName) {
      case 'welcome':
        return `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>Welcome to Velaa!</h1>
            </div>
            <div class="content">
              <h2>Hello ${variables.name || 'User'}!</h2>
              <p>Welcome to Velaa Vehicle Management System. Your account has been created successfully.</p>
              <p>You can now start managing your vehicle inventory efficiently.</p>
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Velaa Vehicle Management System. All rights reserved.</p>
            </div>
          </div>
        `;

      case 'otp':
        return `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>Verification Code</h1>
            </div>
            <div class="content">
              <h2>Your OTP Code</h2>
              <p>Your verification code is: <strong style="font-size: 24px; color: #007bff;">${variables.otp}</strong></p>
              <p>This code will expire in ${variables.expiryMinutes || 10} minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Velaa Vehicle Management System. All rights reserved.</p>
            </div>
          </div>
        `;

      case 'password-reset':
        return `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>You requested to reset your password. Use the code below:</p>
              <p style="font-size: 24px; color: #007bff; font-weight: bold;">${variables.otp}</p>
              <p>This code will expire in ${variables.expiryMinutes || 10} minutes.</p>
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Velaa Vehicle Management System. All rights reserved.</p>
            </div>
          </div>
        `;

      case 'invoice':
        return `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>Invoice ${variables.invoiceNumber}</h1>
            </div>
            <div class="content">
              <h2>Dear ${variables.clientName},</h2>
              <p>Please find your invoice details below:</p>
              <p><strong>Invoice Number:</strong> ${variables.invoiceNumber}</p>
              <p><strong>Date:</strong> ${variables.invoiceDate}</p>
              <p><strong>Due Date:</strong> ${variables.dueDate}</p>
              <p><strong>Amount:</strong> ₹${variables.amount}</p>
              <p>Please make the payment by the due date to avoid any late fees.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Velaa Vehicle Management System. All rights reserved.</p>
            </div>
          </div>
        `;

      default:
        return `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>Velaa Notification</h1>
            </div>
            <div class="content">
              <h2>${variables.title || 'Notification'}</h2>
              <p>${variables.message || 'You have a new notification from Velaa Vehicle Management System.'}</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Velaa Vehicle Management System. All rights reserved.</p>
            </div>
          </div>
        `;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(to, userData) {
    try {
      const subject = 'Welcome to Velaa Vehicle Management System';
      const html = await this.loadTemplate('welcome', {
        name: userData.fullName || userData.firstName,
        email: userData.email,
        warehouseName: userData.warehouseName,
      });

      const result = await this.sendEmail(to, subject, '', html);

      // Create notification
      if (userData.userId) {
        await Notification.create({
          recipient: userData.userId,
          title: 'Welcome Email Sent',
          message: `Welcome email sent to ${to}`,
          type: 'success',
          category: 'user',
          delivery: {
            channels: ['email'],
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Welcome email sending failed:', error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  // Send OTP email
  async sendOTPEmail(to, otp, type = 'verification', userData = {}) {
    try {
      const subjects = {
        verification: 'Your Verification Code',
        login: 'Your Login Code',
        'password-reset': 'Password Reset Code',
        registration: 'Registration Verification Code',
      };

      const subject = subjects[type] || subjects.verification;
      const html = await this.loadTemplate('otp', {
        name: userData.name || 'User',
        otp,
        expiryMinutes: 10,
        type,
      });

      const result = await this.sendEmail(to, subject, '', html);

      return result;
    } catch (error) {
      console.error('OTP email sending failed:', error);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(to, otp, userData = {}) {
    try {
      const subject = 'Password Reset Request';
      const html = await this.loadTemplate('password-reset', {
        name: userData.name || 'User',
        otp,
        expiryMinutes: 10,
      });

      const result = await this.sendEmail(to, subject, '', html);

      return result;
    } catch (error) {
      console.error('Password reset email sending failed:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  // Send invoice email
  async sendInvoiceEmail(to, invoiceData, attachments = []) {
    try {
      const subject = `Invoice ${invoiceData.invoiceNumber} - Velaa`;
      const html = await this.loadTemplate('invoice', {
        clientName: invoiceData.clientName,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        amount: invoiceData.totalAmount,
        items: invoiceData.items || [],
      });

      const options = {};
      if (attachments && attachments.length > 0) {
        options.attachments = attachments;
      }

      const result = await this.sendEmail(to, subject, '', html, options);

      return result;
    } catch (error) {
      console.error('Invoice email sending failed:', error);
      throw new Error(`Failed to send invoice email: ${error.message}`);
    }
  }

  // Send notification email
  async sendNotificationEmail(to, title, message, userId = null) {
    try {
      const html = await this.loadTemplate('notification', {
        title,
        message,
      });

      const result = await this.sendEmail(to, title, message, html);

      // Create notification record
      if (userId) {
        await Notification.create({
          recipient: userId,
          title: 'Email Notification Sent',
          message: `Email notification sent to ${to}`,
          type: 'info',
          category: 'system',
          delivery: {
            channels: ['email'],
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Notification email sending failed:', error);
      throw new Error(`Failed to send notification email: ${error.message}`);
    }
  }

  // Send bulk emails
  async sendBulkEmails(recipients, subject, message, options = {}) {
    const results = [];
    const { 
      template = null,
      batchSize = 10,
      delay = 2000, // 2 seconds delay between batches
      personalizeMessage = false 
    } = options;

    // Process recipients in batches to avoid overwhelming the SMTP server
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const email = typeof recipient === 'string' ? recipient : recipient.email;
          const userData = typeof recipient === 'object' ? recipient : {};

          let emailContent = message;
          let emailSubject = subject;

          // Personalize message if requested
          if (personalizeMessage && userData.name) {
            emailContent = `Dear ${userData.name},\n\n${message}`;
            emailSubject = subject.replace('{{name}}', userData.name);
          }

          let html = emailContent;
          if (template) {
            html = await this.loadTemplate(template, {
              ...userData,
              message: emailContent,
              subject: emailSubject,
            });
          }

          const result = await this.sendEmail(email, emailSubject, emailContent, html);

          return {
            email,
            success: true,
            messageId: result.messageId,
          };
        } catch (error) {
          return {
            email: typeof recipient === 'string' ? recipient : recipient.email,
            success: false,
            error: error.message,
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => result.value || result.reason));

      // Add delay between batches (except for the last batch)
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`Bulk email completed: ${successCount} successful, ${failureCount} failed`);

    return {
      success: true,
      message: `Bulk email completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    };
  }

  // Send reminder emails
  async sendReminderEmail(to, reminderType, data, userData = {}) {
    try {
      let subject = '';
      let template = 'reminder';
      let templateData = { ...userData, ...data };

      switch (reminderType) {
        case 'payment_due':
          subject = `Payment Reminder - Invoice ${data.invoiceNumber}`;
          templateData.message = `Your payment of ₹${data.amount} for invoice ${data.invoiceNumber} is due on ${data.dueDate}. Please make the payment to avoid late fees.`;
          break;
        case 'document_expiry':
          subject = `Document Expiry Alert - ${data.documentType}`;
          templateData.message = `Your ${data.documentType} for vehicle ${data.vehicleNumber} will expire on ${data.expiryDate}. Please renew it soon.`;
          break;
        case 'maintenance_due':
          subject = `Maintenance Reminder - ${data.vehicleNumber}`;
          templateData.message = `Vehicle ${data.vehicleNumber} is due for ${data.maintenanceType} on ${data.dueDate}.`;
          break;
        default:
          subject = 'Reminder from Velaa';
          templateData.message = data.message || 'You have a reminder from Velaa Vehicle Management System.';
      }

      const html = await this.loadTemplate(template, templateData);
      const result = await this.sendEmail(to, subject, templateData.message, html);

      return result;
    } catch (error) {
      console.error('Reminder email sending failed:', error);
      throw new Error(`Failed to send reminder email: ${error.message}`);
    }
  }

  // Test email configuration
  async testEmailConfiguration() {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Email service is not configured',
      };
    }

    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'Email configuration is working correctly',
      };
    } catch (error) {
      return {
        success: false,
        message: `Email configuration test failed: ${error.message}`,
      };
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();

module.exports = emailService;
