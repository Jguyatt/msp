import React, { useState } from 'react';
import { Plus, Mail, Shield, Eye, Edit, Trash2, Crown, User } from 'lucide-react';

function TeamPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  // Mock team members data
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john@company.com',
      role: 'admin',
      status: 'active',
      lastActive: '2024-01-15',
      avatar: null
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'editor',
      status: 'active',
      lastActive: '2024-01-14',
      avatar: null
    },
    {
      id: 3,
      name: 'Mike Wilson',
      email: 'mike@company.com',
      role: 'viewer',
      status: 'pending',
      lastActive: null,
      avatar: null
    }
  ]);

  const roles = [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Full access to all features and settings',
      icon: Crown,
      color: 'text-red-600'
    },
    {
      value: 'editor',
      label: 'Editor',
      description: 'Can view, add, edit contracts and send reminders',
      icon: Edit,
      color: 'text-blue-600'
    },
    {
      value: 'viewer',
      label: 'Viewer',
      description: 'Read-only access to contracts and reports',
      icon: Eye,
      color: 'text-gray-600'
    }
  ];

  const handleInvite = (e) => {
    e.preventDefault();
    if (inviteEmail && inviteRole) {
      const newMember = {
        id: Date.now(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'pending',
        lastActive: null,
        avatar: null
      };
      setTeamMembers([...teamMembers, newMember]);
      setInviteEmail('');
      setInviteRole('viewer');
      setShowInviteModal(false);
    }
  };

  const handleRemoveMember = (memberId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
    }
  };

  const handleRoleChange = (memberId, newRole) => {
    setTeamMembers(teamMembers.map(member => 
      member.id === memberId ? { ...member, role: newRole } : member
    ));
  };

  const getRoleIcon = (role) => {
    const roleConfig = roles.find(r => r.value === role);
    const IconComponent = roleConfig?.icon || User;
    return <IconComponent className={`h-4 w-4 ${roleConfig?.color || 'text-gray-600'}`} />;
  };

  const getRoleLabel = (role) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.label || 'Unknown';
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
              <p className="mt-2 text-gray-600">
                Manage team members and their access permissions
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Role Permissions Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.value} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <role.icon className={`h-5 w-5 ${role.color}`} />
                  <h4 className="font-medium text-gray-900">{role.label}</h4>
                </div>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {teamMembers.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      {member.role === 'admin' && (
                        <Crown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    {member.lastActive && (
                      <p className="text-xs text-gray-500">
                        Last active: {new Date(member.lastActive).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Role Selector */}
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={member.role === 'admin' && member.email === 'john@company.com'} // Don't let user change their own admin role
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>

                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {member.status}
                  </span>

                  {/* Remove Button */}
                  {member.email !== 'john@company.com' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowInviteModal(false)}></div>
              
              <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-blue-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Invite Team Member
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Send an invitation to join your team and manage contract renewals.
                      </p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleInvite} className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="colleague@company.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {roles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label} - {role.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Send Invitation
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamPage;
