import React, { useState, useEffect } from 'react';
import { Bell, Clock, Mail, Smartphone, Settings, AlertCircle } from 'lucide-react';

function ReminderSettings({ contract, onSave }) {
  const [reminderIntervals, setReminderIntervals] = useState([90, 60, 30]);
  const [notificationMethods, setNotificationMethods] = useState({
    email: true,
    inApp: false,
    sms: false
  });
  const [emailTemplate, setEmailTemplate] = useState('Subject: Contract Renewal Reminder\n\nDear {{recipient_name}},\n\nThis is a reminder that your contract with {{vendor_name}} will expire on {{end_date}}.\n\nWe recommend reviewing this contract before it expires to ensure continuity of services.\n\nPlease let us know if you have any questions.\n\nBest regards,\nTechFlow Solutions');
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);

  useEffect(() => {
    // Initialize with default settings - no API call needed
    console.log('ReminderSettings initialized for contract:', contract?.id);
  }, [contract?.id]);

  const handleIntervalToggle = (days) => {
    if (reminderIntervals.includes(days)) {
      setReminderIntervals(reminderIntervals.filter(d => d !== days));
    } else {
      setReminderIntervals([...reminderIntervals, days].sort((a, b) => b - a));
    }
  };

  const handleNotificationToggle = (method) => {
    setNotificationMethods(prev => ({
      ...prev,
      [method]: !prev[method]
    }));
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    setError(null);
    setTestEmailSent(false);

    try {
      const response = await fetch('http://localhost:3002/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'guyattj39@gmail.com'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      setTestEmailSent(true);
      setTimeout(() => setTestEmailSent(false), 5000);
    } catch (err) {
      console.error('Error sending test email:', err);
      setError('Failed to send test email. Please check your email configuration.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSave = async () => {
    if (!contract?.id) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const settings = {
        contract_id: contract.id,
        reminder_intervals: reminderIntervals,
        email_enabled: notificationMethods.email,
        in_app_enabled: notificationMethods.inApp,
        sms_enabled: notificationMethods.sms,
        email_template: emailTemplate
      };

      console.log('Saving reminder settings:', settings);
      
      // Save to server API
      const response = await fetch('http://localhost:3002/api/reminder-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save reminder settings');
      }

      const result = await response.json();
      console.log('Reminder settings saved:', result);
      
      setSaved(true);
      if (onSave) {
        onSave(settings);
      }
      
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving reminder settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Reminder Settings</h3>
      </div>

      {/* Contract Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Contract</div>
        <div className="font-medium text-gray-900">{contract.contract_name || contract.contractName}</div>
        <div className="text-sm text-gray-500">{contract.vendor}</div>
        <div className="text-sm text-gray-500">Expires: {contract.end_date || contract.endDate}</div>
      </div>

      {/* Reminder Intervals */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Reminder Schedule</h4>
        <p className="text-sm text-gray-600 mb-4">
          Choose when to send email reminders before contract expiry
        </p>
        <div className="space-y-3">
          {[
            { days: 90, label: "90 days before", description: "Early notice for planning" },
            { days: 60, label: "60 days before", description: "Mid-term reminder" },
            { days: 30, label: "30 days before", description: "Important deadline approaching" },
            { days: 14, label: "14 days before", description: "Final notice" },
            { days: 7, label: "7 days before", description: "Urgent - action needed" }
          ].map((item) => (
            <div key={item.days} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center">
                <button
                  onClick={() => handleIntervalToggle(item.days)}
                  className={`w-5 h-5 rounded-full border-2 mr-3 transition-colors ${
                    reminderIntervals.includes(item.days)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {reminderIntervals.includes(item.days) && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </button>
                <div>
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {reminderIntervals.includes(item.days) ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Email Notifications</h4>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          You'll receive email reminders for this contract at the selected intervals above.
        </p>
        <div className="text-sm text-blue-700 bg-blue-100 px-3 py-2 rounded-md mb-4">
          <strong>Email:</strong> guyattj39@gmail.com
        </div>
        
        {/* Test Email Button */}
        <button
          onClick={handleSendTestEmail}
          disabled={sendingTest}
          className="w-full px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          <Mail className="h-4 w-4" />
          {sendingTest ? 'Sending Test Email...' : 'Send Test Email'}
        </button>
        
        {testEmailSent && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium mb-1">✅ Test email sent!</p>
            <p className="text-xs text-green-700">
              Check your inbox at <strong>guyattj39@gmail.com</strong>
            </p>
            <p className="text-xs text-green-600 mt-1">
              📁 Don't see it? Check your <strong>Spam</strong>, <strong>Junk</strong>, and <strong>Promotions</strong> folders
            </p>
          </div>
        )}
      </div>


      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Settings className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">Settings saved successfully!</span>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          <Settings className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default ReminderSettings;
