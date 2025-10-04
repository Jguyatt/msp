import React, { useState, useEffect } from 'react';
import { Plus, Mail, Shield, Eye, Edit, Trash2, Crown, User, Users } from 'lucide-react';
import { useUserSync } from '../../hooks/useUserSync';

function TeamManagement() {
  const { clerkUser, supabaseUser } = useUserSync();
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');

  // Load team data
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true);
        
        // Load team members
        const membersResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/team`, {
          headers: {
            'Authorization': `Bearer ${clerkUser?.id}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setTeamMembers(membersData.users || []);
        } else {
          console.error('Failed to load team members:', await membersResponse.text());
          // Set empty array if API fails
          setTeamMembers([]);
        }

        // Load invitations
        const invitesResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/team/invitations`, {
          headers: {
            'Authorization': `Bearer ${clerkUser?.id}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (invitesResponse.ok) {
          const invitesData = await invitesResponse.json();
          setPendingInvitations(invitesData.invitations || []);
        } else {
          console.error('Failed to load invitations:', await invitesResponse.text());
          // Set empty array if API fails
          setPendingInvitations([]);
        }
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (clerkUser) {
      loadTeamData();
    }
  }, [clerkUser]);

  const activeMembers = teamMembers.filter(member => member.status === 'active').length;
  const admins = teamMembers.filter(member => member.role === 'admin' || member.role === 'owner').length;
  const pendingInvites = pendingInvitations.filter(invite => invite.status === 'pending').length;

  const handleInviteMember = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail) {
      alert('Please enter email address');
      return;
    }

    try {
      setInviting(true);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/team/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clerkUser?.id}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });

      const result = await response.json();
      
      if (response.ok) {
        // Show the invitation link and password to the user
        const invitationLink = `${window.location.origin}/accept-invitation?token=${result.invitation.token}`;
        alert(`Invitation created! Please share this information with ${inviteEmail}:\n\n🔗 Invitation Link:\n${invitationLink}\n\n🔑 Invitation Password:\n${result.invitation.password}\n\n📧 Email: ${inviteEmail}\n\nThey'll need all three pieces of information to join your team.`);
        setInviteEmail('');
        setInviteRole('editor');
        setShowInviteModal(false);
        // Reload team data
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    // Prevent removing yourself
    if (memberId === supabaseUser?.id) {
      alert('You cannot remove yourself from the team.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/team/${memberId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${clerkUser?.id}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (response.ok) {
          alert(`${memberName} has been removed from the team`);
          // Reload team data
          window.location.reload();
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member. Please try again.');
      }
    }
  };

  const handleRemoveInvitation = async (invitationId, email) => {
    if (window.confirm(`Are you sure you want to remove the invitation for ${email}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/team/invitations/${invitationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${clerkUser?.id}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (response.ok) {
          alert(`Invitation for ${email} has been removed`);
          // Reload team data
          window.location.reload();
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error removing invitation:', error);
        alert('Failed to remove invitation. Please try again.');
      }
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
      case 'owner':
        return <Crown className="w-4 h-4 text-red-600" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'owner':
        return 'Owner';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading team data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Management</h2>
        <p className="text-gray-600">Manage your team and permissions.</p>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{activeMembers}</div>
              <div className="text-sm text-gray-600">Active Members</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{admins}</div>
              <div className="text-sm text-gray-600">Admins</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{pendingInvites}</div>
              <div className="text-sm text-gray-600">Pending Invites</div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">All Team Members</h3>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {teamMembers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">You're the only team member</h3>
              <p className="text-gray-600 mb-6">Invite team members to collaborate on contract management.</p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Invite Your First Team Member
              </button>
            </div>
          ) : (
            teamMembers.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {member.full_name ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : member.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {member.full_name || member.email}
                    </div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                    <div className="text-xs text-gray-400">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {getRoleIcon(member.role)}
                    <span className="ml-2 text-sm text-gray-600">{getRoleLabel(member.role)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Only show actions if it's not the current user */}
                    {member.id !== supabaseUser?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.full_name || member.email)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                    {/* Show indicator for current user */}
                    {member.id === supabaseUser?.id && (
                      <span className="text-gray-500 text-sm italic">
                        (You)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Invitations</h3>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => {
              const invitationLink = `${window.location.origin}/accept-invitation?token=${invitation.token}`;
              return (
                <div key={invitation.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{invitation.email}</h3>
                        <p className="text-xs text-gray-500">
                          {invitation.role} • Expires {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        Pending
                      </span>
                      <button
                        onClick={() => handleRemoveInvitation(invitation.id, invitation.email)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove invitation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Invitation Link</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={invitationLink}
                          readOnly
                          className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-600 font-mono"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(invitationLink);
                            alert('Link copied!');
                          }}
                          className="px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={invitation.password}
                          readOnly
                          className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-600 font-mono"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(invitation.password);
                            alert('Password copied!');
                          }}
                          className="px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Role Permissions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Crown className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="text-lg font-medium text-gray-900">Admin</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Full system access</li>
              <li>• Manage team members</li>
              <li>• Invite team members</li>
              <li>• Billing and settings</li>
              <li>• Delete organization</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Edit className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="text-lg font-medium text-gray-900">Editor</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• View contracts</li>
              <li>• Add contracts</li>
              <li>• Edit contracts</li>
              <li>• View reports</li>
              <li>• Basic settings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
              <form onSubmit={handleInviteMember}>
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Role:</strong> Editor - Can add/edit contracts and view reports
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="submit"
                    disabled={inviting}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      inviting
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-slate-700 text-white hover:bg-slate-800'
                    }`}
                  >
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
  );
}

export default TeamManagement;
