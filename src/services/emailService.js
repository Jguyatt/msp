/**
 * Email Service for Contract Reminders and Notifications
 * Uses server API which handles Mailgun integration
 */

class EmailService {
  constructor() {
    this.baseUrl = 'http://localhost:3002/api';
  }

  /**
   * Send contract renewal reminder email
   */
  async sendRenewalReminder(contract, userEmail, daysUntilRenewal) {
    const subject = `Contract Renewal Reminder: ${contract.title}`;
    const html = this.generateRenewalReminderHTML(contract, daysUntilRenewal);
    const text = this.generateRenewalReminderText(contract, daysUntilRenewal);

    return this.sendEmail(userEmail, subject, html, text);
  }

  /**
   * Send contract expiry warning email
   */
  async sendExpiryWarning(contract, userEmail, daysUntilExpiry) {
    const subject = `⚠️ Contract Expiring Soon: ${contract.title}`;
    const html = this.generateExpiryWarningHTML(contract, daysUntilExpiry);
    const text = this.generateExpiryWarningText(contract, daysUntilExpiry);

    return this.sendEmail(userEmail, subject, html, text);
  }

  /**
   * Send contract analysis report email
   */
  async sendAnalysisReport(userEmail, analysisData) {
    const subject = 'Contract Analysis Report';
    const html = this.generateAnalysisReportHTML(analysisData);
    const text = this.generateAnalysisReportText(analysisData);

    return this.sendEmail(userEmail, subject, html, text);
  }

  /**
   * Send email using server API (which uses Mailgun)
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
      console.log('Email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to) {
    try {
      const response = await fetch(`${this.baseUrl}/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test email');
      }

      const result = await response.json();
      console.log('Test email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML for renewal reminder email
   */
  generateRenewalReminderHTML(contract, daysUntilRenewal) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract Renewal Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .contract-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #667eea; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Contract Renewal Reminder</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>This is a reminder that you have a contract renewal coming up:</p>
            
            <div class="contract-info">
              <h3>${contract.title}</h3>
              <p><strong>Vendor:</strong> ${contract.vendor}</p>
              <p><strong>Value:</strong> $${contract.value?.toLocaleString() || 'N/A'}</p>
              <p><strong>Renewal Date:</strong> ${new Date(contract.renewal_date).toLocaleDateString()}</p>
              <p><strong>Days Until Renewal:</strong> ${daysUntilRenewal} days</p>
            </div>

            ${daysUntilRenewal <= 7 ? 
              '<div class="warning"><strong>⚠️ Urgent:</strong> This contract renews in less than a week!</div>' : 
              ''
            }

            <p>Please review the contract terms and take necessary action before the renewal date.</p>
            
            <a href="https://your-app.com/contracts/${contract.id}" class="button">View Contract Details</a>
            
            <p>Best regards,<br>Renlu Contract Management</p>
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
    return `
Contract Renewal Reminder

Hello,

This is a reminder that you have a contract renewal coming up:

Contract: ${contract.title}
Vendor: ${contract.vendor}
Value: $${contract.value?.toLocaleString() || 'N/A'}
Renewal Date: ${new Date(contract.renewal_date).toLocaleDateString()}
Days Until Renewal: ${daysUntilRenewal} days

${daysUntilRenewal <= 7 ? '⚠️ URGENT: This contract renews in less than a week!' : ''}

Please review the contract terms and take necessary action before the renewal date.

View contract details: https://your-app.com/contracts/${contract.id}

Best regards,
Renlu Contract Management
    `;
  }

  /**
   * Generate HTML for expiry warning email
   */
  generateExpiryWarningHTML(contract, daysUntilExpiry) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract Expiry Warning</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
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
              <h3>${contract.title}</h3>
              <p><strong>Vendor:</strong> ${contract.vendor}</p>
              <p><strong>Value:</strong> $${contract.value?.toLocaleString() || 'N/A'}</p>
              <p><strong>Expiry Date:</strong> ${new Date(contract.end_date).toLocaleDateString()}</p>
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
    return `
⚠️ Contract Expiry Warning

Hello,

This is an urgent warning that you have a contract expiring soon:

Contract: ${contract.title}
Vendor: ${contract.vendor}
Value: $${contract.value?.toLocaleString() || 'N/A'}
Expiry Date: ${new Date(contract.end_date).toLocaleDateString()}
Days Until Expiry: ${daysUntilExpiry} days

🚨 URGENT ACTION REQUIRED: This contract will expire in ${daysUntilExpiry} days. 
You need to take immediate action to renew or renegotiate.

Please contact the vendor immediately to discuss renewal terms or find an alternative solution.

View contract details: https://your-app.com/contracts/${contract.id}

Best regards,
Renlu Contract Management
    `;
  }

  /**
   * Generate HTML for analysis report email
   */
  generateAnalysisReportHTML(analysisData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .metric { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #667eea; }
          .highlight { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Contract Analysis Report</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Here's your monthly contract analysis report:</p>
            
            <div class="metric">
              <h3>📈 Key Metrics</h3>
              <p><strong>Total Contract Value:</strong> $${analysisData.totalValue?.toLocaleString() || 'N/A'}</p>
              <p><strong>Contracts Expiring This Month:</strong> ${analysisData.expiringThisMonth || 0}</p>
              <p><strong>Potential Savings Identified:</strong> $${analysisData.potentialSavings?.toLocaleString() || 'N/A'}</p>
            </div>

            <div class="highlight">
              <h3>🎯 Top Recommendations</h3>
              ${analysisData.recommendations?.map(rec => `<p>• ${rec}</p>`).join('') || '<p>No specific recommendations at this time.</p>'}
            </div>

            <p>Log in to your dashboard for detailed analysis and insights.</p>
            
            <a href="https://your-app.com/analytics" class="button">View Full Report</a>
            
            <p>Best regards,<br>Renlu Contract Management</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text version for analysis report email
   */
  generateAnalysisReportText(analysisData) {
    return `
Contract Analysis Report

Hello,

Here's your monthly contract analysis report:

📈 Key Metrics:
- Total Contract Value: $${analysisData.totalValue?.toLocaleString() || 'N/A'}
- Contracts Expiring This Month: ${analysisData.expiringThisMonth || 0}
- Potential Savings Identified: $${analysisData.potentialSavings?.toLocaleString() || 'N/A'}

🎯 Top Recommendations:
${analysisData.recommendations?.map(rec => `• ${rec}`).join('\n') || 'No specific recommendations at this time.'}

Log in to your dashboard for detailed analysis and insights.

View full report: https://your-app.com/analytics

Best regards,
Renlu Contract Management
    `;
  }
}

const emailService = new EmailService();
export default emailService;
