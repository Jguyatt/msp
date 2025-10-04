import React from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, UploadCloud, Calendar, Users, Bell } from 'lucide-react';
import { useTour } from '../../services/tourService';

function OnboardingChecklist() {
  const { tourState, updateChecklistItem, getChecklistProgress } = useTour();
  const [expanded, setExpanded] = React.useState(true);

  const checklistItems = [
    {
      id: 'uploadSample',
      label: 'Upload your first contract',
      description: 'Add a real contract to get started with AI-powered insights and analysis.',
      icon: UploadCloud,
      actionLabel: 'Upload Contract',
      action: () => {
        console.log('Navigating to upload contract');
        updateChecklistItem('uploadSample', true);
        window.location.href = '/app/contracts';
      },
      isCompleted: tourState.checklist.uploadSample,
    },
    {
      id: 'addRenewal',
      label: 'Add a renewal date',
      description: 'Ensure you never miss an important contract renewal.',
      icon: Calendar,
      actionLabel: 'Add Renewal',
      action: () => {
        console.log('Navigating to add renewal date');
        updateChecklistItem('addRenewal', true);
        window.location.href = '/app/contracts';
      },
      isCompleted: tourState.checklist.addRenewal,
    },
    {
      id: 'inviteTeammate',
      label: 'Invite a teammate',
      description: 'Collaborate with your team on contract management.',
      icon: Users,
      actionLabel: 'Invite Teammate',
      action: () => {
        console.log('Navigating to invite teammate');
        updateChecklistItem('inviteTeammate', true);
        window.location.href = '/app/team';
      },
      isCompleted: tourState.checklist.inviteTeammate,
    },
    {
      id: 'enableReminders',
      label: 'Enable reminders',
      description: 'Get timely notifications for upcoming contract actions.',
      icon: Bell,
      actionLabel: 'Enable Reminders',
      action: () => {
        console.log('Navigating to settings for reminders');
        updateChecklistItem('enableReminders', true);
        window.location.href = '/app/settings';
      },
      isCompleted: tourState.checklist.enableReminders,
    },
  ];

  const progress = getChecklistProgress();
  const allCompleted = progress === 100;

  if (allCompleted) {
    return (
      <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm p-6 rounded-2xl border border-green-200/30 shadow-lg text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-800 mb-2">Quick Setup Complete!</h3>
        <p className="text-green-700">You're all set to manage your contracts like a pro. 🎉</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/40 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Quick Setup</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label={expanded ? "Collapse checklist" : "Expand checklist"}
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-slate-600 mb-6">{progress}% Complete</p>

      {expanded && (
        <ul className="space-y-4">
          {checklistItems.map((item) => (
            <li key={item.id} className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3 mt-1">
                  {item.isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {item.label}
                  </p>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
              {!item.isCompleted && (
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={item.action}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    {item.actionLabel}
                  </button>
                  <button
                    onClick={() => updateChecklistItem(item.id, true)}
                    className="ml-2 p-1 text-sm text-slate-500 hover:text-slate-700"
                    aria-label={`Mark ${item.label} as done`}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

export default OnboardingChecklist;
