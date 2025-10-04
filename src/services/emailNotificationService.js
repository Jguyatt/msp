/**
 * Email Notification Service for Contract Management
 * Handles sending various types of email notifications
 */

class EmailNotificationService {
  constructor() {
    this.baseUrl = 'http://localhost:3002/api';
  }

  /**
   * Send contract renewal reminder
   */
  async sendRenewalReminder(contract, userEmail, daysUntilRenewal) {
    const subject = `Contract Renewal Reminder: ${contract.contract_name || contract.title}`;
    const html = this.generateRenewalReminderHTML(contract, daysUntilRenewal);
    const text = this.generateRenewalReminderText(contract, daysUntilRenewal);

    return this.sendEmail(userEmail, subject, html, text);
  }

  /**
   * Send contract expiry warning
   */
  async sendExpiryWarning(contract, userEmail, daysUntilExpiry) {
    const subject = `⚠️ Contract Expiring Soon: ${contract.contract_name || contract.title}`;
    const html = this.generateExpiryWarningHTML(contract, daysUntilExpiry);
    const text = this.generateExpiryWarningText(contract, daysUntilExpiry);

    return this.sendEmail(userEmail, subject, html, text);
  }

  /**
   * Send test email
   */
  async sendTestEmail(userEmail) {
    const subject = 'Test Email from Renlu Contract Management';
    const html = `
      <h1>🎉 Email Test Successful!</h1>
      <p>This is a test email from the Renlu contract management system.</p>
      <p>Your email notifications are working correctly.</p>
      <hr>
      <p><small>Sent from Renlu Contract Management System</small></p>
    `;
    const text = `
Email Test Successful!

This is a test email from the Renlu contract management system.
Your email notifications are working correctly.

Sent from Renlu Contract Management System
    `;

    return this.sendEmail(userEmail, subject, html, text);
  }

  /**
   * Send email using the server API
   */
  async sendEmail(to, subject, html, text) {
    try {
      const response = await fetch(`${this.baseUrl}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          text
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML for renewal reminder email with action buttons
   */
  generateRenewalReminderHTML(contract, daysUntilRenewal) {
    const contractName = contract.contract_name || contract.title || 'Unknown Contract';
    const vendor = contract.vendor || 'Unknown Vendor';
    const value = contract.value ? `$${contract.value.toLocaleString()}` : 'N/A';
    const renewalDate = contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A';
    const category = contract.category || 'Contract';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract About to Renew</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .contract-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .urgent-notice { background: #fef3c7; border: 2px solid #f59e0b; color: #92400e; padding: 20px; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .action-section { background: #eff6ff; padding: 25px; border-radius: 8px; margin: 25px 0; }
          .action-buttons { display: flex; gap: 10px; margin: 20px 0; flex-wrap: wrap; }
          .button { display: inline-block; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; flex: 1; min-width: 150px; }
          .button-renew { background: #10b981; color: white; }
          .button-renegotiate { background: #3b82f6; color: white; }
          .button-cancel { background: #ef4444; color: white; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔔 Contract About to Renew</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${daysUntilRenewal} Days Until Renewal</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            
            <div class="urgent-notice">
              <strong>⚠️ This contract is about to renew — do you want to renegotiate, cancel, or renew?</strong>
            </div>
            
            <div class="contract-info">
              <h3 style="margin-top: 0; color: #1f2937;">${contractName}</h3>
              <div class="info-row"><span>Vendor:</span><strong>${vendor}</strong></div>
              <div class="info-row"><span>Category:</span><strong>${category}</strong></div>
              <div class="info-row"><span>Contract Value:</span><strong>${value}</strong></div>
              <div class="info-row"><span>Renewal Date:</span><strong>${renewalDate}</strong></div>
              <div class="info-row" style="border-bottom: none;"><span>Days Remaining:</span><strong style="color: ${daysUntilRenewal <= 30 ? '#ef4444' : '#3b82f6'};">${daysUntilRenewal} days</strong></div>
            </div>

            <div class="action-section">
              <h3 style="margin-top: 0; color: #1f2937;">What would you like to do?</h3>
              <p style="color: #6b7280; margin-bottom: 20px;">Choose one of the following actions:</p>
              
              <div class="action-buttons">
                <a href="https://localhost:3000/app/contracts?action=renew&id=${contract.id}" class="button button-renew">
                  ✓ Renew Contract
                </a>
                <a href="https://localhost:3000/app/contracts?action=renegotiate&id=${contract.id}" class="button button-renegotiate">
                  💬 Renegotiate Terms
                </a>
                <a href="https://localhost:3000/app/contracts?action=cancel&id=${contract.id}" class="button button-cancel">
                  ✕ Cancel Contract
                </a>
              </div>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This is an automated reminder sent ${daysUntilRenewal} days before your contract renewal. 
              You will receive additional reminders at key milestones.
            </p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Renlu Contract Management</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text version for renewal reminder email
   */
  generateRenewalReminderText(contract, daysUntilRenewal) {
    const contractName = contract.contract_name || contract.title || 'Unknown Contract';
    const vendor = contract.vendor || 'Unknown Vendor';
    const value = contract.value ? `$${contract.value.toLocaleString()}` : 'N/A';
    const renewalDate = contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A';
    const category = contract.category || 'Contract';

    return `
🔔 CONTRACT ABOUT TO RENEW - ACTION REQUIRED

Hello,

⚠️ This contract is about to renew — do you want to renegotiate, cancel, or renew?

CONTRACT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract:        ${contractName}
Vendor:          ${vendor}
Category:        ${category}
Value:           ${value}
Renewal Date:    ${renewalDate}
Days Remaining:  ${daysUntilRenewal} days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHOOSE YOUR ACTION:

1. ✓ RENEW CONTRACT
   Keep the same terms and continue the agreement
   → https://localhost:3000/app/contracts?action=renew&id=${contract.id}

2. 💬 RENEGOTIATE TERMS
   Request better pricing or modify contract terms
   → https://localhost:3000/app/contracts?action=renegotiate&id=${contract.id}

3. ✕ CANCEL CONTRACT
   End the agreement and find an alternative
   → https://localhost:3000/app/contracts?action=cancel&id=${contract.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated reminder sent ${daysUntilRenewal} days before renewal.
You will receive additional reminders at 90, 60, and 30 days before expiry.

Best regards,
Renlu Contract Management System
    `;
  }

  /**
   * Generate HTML for expiry warning email
   */
  generateExpiryWarningHTML(contract, daysUntilExpiry) {
    const contractName = contract.contract_name || contract.title || 'Unknown Contract';
    const vendor = contract.vendor || 'Unknown Vendor';
    const value = contract.value ? `$${contract.value.toLocaleString()}` : 'N/A';
    const expiryDate = contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract Expiry Warning</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .contract-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #e74c3c; }
          .urgent { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Contract Expiry Warning</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>This is an urgent warning that you have a contract expiring soon:</p>
            
            <div class="contract-info">
              <h3>${contractName}</h3>
              <p><strong>Vendor:</strong> ${vendor}</p>
              <p><strong>Value:</strong> ${value}</p>
              <p><strong>Expiry Date:</strong> ${expiryDate}</p>
              <p><strong>Days Until Expiry:</strong> ${daysUntilExpiry} days</p>
            </div>

            <div class="urgent">
              <strong>🚨 URGENT ACTION REQUIRED:</strong> This contract will expire in ${daysUntilExpiry} days. 
              You need to take immediate action to renew or renegotiate.
            </div>

            <p>Please contact the vendor immediately to discuss renewal terms or find an alternative solution.</p>
            
            <a href="https://your-app.com/contracts/${contract.id}" class="button">View Contract Details</a>
            
            <p>Best regards,<br>Renlu Contract Management</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text version for expiry warning email
   */
  generateExpiryWarningText(contract, daysUntilExpiry) {
    const contractName = contract.contract_name || contract.title || 'Unknown Contract';
    const vendor = contract.vendor || 'Unknown Vendor';
    const value = contract.value ? `$${contract.value.toLocaleString()}` : 'N/A';
    const expiryDate = contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A';

    return `
⚠️ Contract Expiry Warning

Hello,

This is an urgent warning that you have a contract expiring soon:

Contract: ${contractName}
Vendor: ${vendor}
Value: ${value}
Expiry Date: ${expiryDate}
Days Until Expiry: ${daysUntilExpiry} days

🚨 URGENT ACTION REQUIRED: This contract will expire in ${daysUntilExpiry} days. 
You need to take immediate action to renew or renegotiate.

Please contact the vendor immediately to discuss renewal terms or find an alternative solution.

View contract details: https://your-app.com/contracts/${contract.id}

Best regards,
Renlu Contract Management
    `;
  }
}

const emailNotificationService = new EmailNotificationService();
export default emailNotificationService;
