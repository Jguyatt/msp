import React, { useState, useEffect } from 'react';
import { Bell, Clock, Mail, Smartphone, Settings, AlertCircle } from 'lucide-react';

function ReminderSettings({ contract, onSave }) {
  const [reminderIntervals, setReminderIntervals] = useState([90, 60, 30]);
  const [notificationMethods, setNotificationMethods] = useState({
    email: true,
    inApp: true,
    sms: false
  });
  const [emailTemplate, setEmailTemplate] = useState('Subject: Contract Renewal Reminder\n\nDear {{recipient_name}},\n\nThis is a reminder that your contract with {{vendor_name}} will expire on {{end_date}}.\n\nWe recommend reviewing this contract before it expires to ensure continuity of services.\n\nPlease let us know if you have any questions.\n\nBest regards,\nTechFlow Solutions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchReminderSettings = async () => {
      if (!contract?.id) return;

      try {
        const response = await fetch(`http://localhost:3001/api/reminder-settings/${contract.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setReminderIntervals(data.settings.intervals || [90, 60, 30]);
            setNotificationMethods(data.settings.notifications || { email: true, inApp: true, sms: false });
            setEmailTemplate(data.settings.emailTemplate || emailTemplate);
          }
        }
      } catch (err) {
        console.error('Error fetching reminder settings:', err);
      }
    };

    fetchReminderSettings();
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

  const handleSave = async () => {
    if (!contract?.id) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const settings = {
        contractId: contract.id,
        intervals: reminderIntervals,
        notifications: notificationMethods,
        emailTemplate
      };

      const response = await fetch(`http://localhost:3001/api/reminder-settings/${contract.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save reminder settings');
      }

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
        <h4 className="font-medium text-gray-900 mb-3">Reminder Intervals</h4>
        <p className="text-sm text-gray-600 mb-4">
          Choose how many days before contract expiry to send reminders
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[120, 90, 60, 45, 30, 21, 14, 7, 3, 1].map((days) => (
            <label key={days} className="flex items-center">
              <input
                type="checkbox"
                checked={reminderIntervals.includes(days)}
                onChange={() => handleIntervalToggle(days)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{days} days</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notification Methods */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Notification Methods</h4>
        <p className="text-sm text-gray-600 mb-4">
          Choose how you want to receive reminders
        </p>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notificationMethods.email}
              onChange={() => handleNotificationToggle('email')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="ml-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">Email Notifications</span>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notificationMethods.inApp}
              onChange={() => handleNotificationToggle('inApp')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="ml-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">In-App Notifications</span>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notificationMethods.sms}
              onChange={() => handleNotificationToggle('sms')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="ml-3 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">SMS Alerts (Premium)</span>
            </div>
          </label>
        </div>
      </div>

      {/* Email Template */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Email Template</h4>
        <p className="text-sm text-gray-600 mb-4">
          Customize the email template for contract renewal reminders
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Available variables:</span>
            <code className="bg-gray-100 px-1 rounded">{'{{recipient_name}}'}</code>
            <code className="bg-gray-100 px-1 rounded">{'{{vendor_name}}'}</code>
            <code className="bg-gray-100 px-1 rounded">{'{{end_date}}'}</code>
            <code className="bg-gray-100 px-1 rounded">{'{{contract_name}}'}</code>
          </div>
          <textarea
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
            placeholder="Enter your email template..."
          />
        </div>
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
