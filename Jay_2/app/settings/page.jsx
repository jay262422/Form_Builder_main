"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import workspaceService from '../../services/workspaceService';

const MEMBER_ROLES = ['admin', 'editor', 'viewer'];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: '',
    timezone: 'UTC',
    title: '',
    company: '',
    phone: '',
    bio: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceData, setWorkspaceData] = useState(null);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' });
  const [acceptInviteToken, setAcceptInviteToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name || '',
      timezone: user.profile?.timezone || 'UTC',
      title: user.profile?.title || '',
      company: user.profile?.company || '',
      phone: user.profile?.phone || '',
      bio: user.profile?.bio || ''
    });
  }, [user]);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const data = await workspaceService.getMyWorkspace();
        setWorkspaceData(data.workspace || null);
        setWorkspaceName(data.workspace?.name || '');
      } catch (err) {
        setError(err.message || 'Failed to load workspace');
      }
    };

    if (user) {
      loadWorkspace();
    }
  }, [user]);

  const myWorkspaceRole = useMemo(() => user?.workspaceRole || 'viewer', [user]);
  const canManageWorkspace = myWorkspaceRole === 'owner' || myWorkspaceRole === 'admin';

  const clearFeedback = () => {
    setMessage('');
    setError('');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    clearFeedback();
    setIsSavingProfile(true);

    try {
      const response = await authService.updateProfile(profileForm.name, {
        notifications: user?.settings?.notifications || {}
      }, {
        timezone: profileForm.timezone,
        title: profileForm.title,
        company: profileForm.company,
        phone: profileForm.phone,
        bio: profileForm.bio
      });
      updateUser(response.data?.user || response.user || user);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const reloadWorkspace = async () => {
    const data = await workspaceService.getMyWorkspace();
    setWorkspaceData(data.workspace || null);
    setWorkspaceName(data.workspace?.name || '');
  };

  const handleWorkspaceUpdate = async (e) => {
    e.preventDefault();
    clearFeedback();
    setIsSavingWorkspace(true);
    try {
      await workspaceService.updateWorkspace(workspaceName);
      await reloadWorkspace();
      setMessage('Workspace updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update workspace');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    clearFeedback();
    setIsInviting(true);
    try {
      const data = await workspaceService.inviteMember(inviteForm.email, inviteForm.role);
      await reloadWorkspace();
      setInviteForm({ email: '', role: 'viewer' });
      if (data?.invite?.inviteToken) {
        setMessage(`Invite created. Token: ${data.invite.inviteToken}`);
      } else {
        setMessage('Invite sent successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    clearFeedback();
    try {
      await workspaceService.acceptInvite(acceptInviteToken.trim());
      setAcceptInviteToken('');
      await reloadWorkspace();
      const refreshed = await authService.getCurrentUser();
      updateUser(refreshed);
      setMessage('Invitation accepted. Workspace context updated.');
    } catch (err) {
      setError(err.message || 'Failed to accept invitation');
    }
  };

  const handleUpdateMemberRole = async (memberUserId, role) => {
    clearFeedback();
    try {
      await workspaceService.updateMemberRole(memberUserId, role);
      await reloadWorkspace();
      setMessage('Member role updated.');
    } catch (err) {
      setError(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    clearFeedback();
    try {
      await workspaceService.removeMember(memberUserId);
      await reloadWorkspace();
      setMessage('Member removed from workspace.');
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>

          {message && <div className="p-3 text-sm text-green-800 bg-green-100 rounded-md">{message}</div>}
          {error && <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">{error}</div>}

          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
            <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-700">
                Full Name
                <input
                  type="text"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700">
                Timezone
                <input
                  type="text"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={profileForm.timezone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
                  placeholder="e.g. Asia/Kolkata"
                />
              </label>
              <label className="text-sm text-gray-700">
                Job Title
                <input
                  type="text"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={profileForm.title}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700">
                Company
                <input
                  type="text"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={profileForm.company}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700 md:col-span-2">
                Phone
                <input
                  type="text"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700 md:col-span-2">
                Bio
                <textarea
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                />
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="text-sm text-gray-700">
                Current Password
                <input
                  type="password"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700">
                New Password
                <input
                  type="password"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700">
                Confirm Password
                <input
                  type="password"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </label>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Workspace</h2>
            <p className="text-sm text-gray-600 mb-4">Your role: <span className="font-medium">{myWorkspaceRole}</span></p>

            <form onSubmit={handleWorkspaceUpdate} className="flex items-end gap-3 mb-6">
              <label className="flex-1 text-sm text-gray-700">
                Workspace Name
                <input
                  type="text"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={!canManageWorkspace}
                />
              </label>
              <button
                type="submit"
                disabled={!canManageWorkspace || isSavingWorkspace}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                {isSavingWorkspace ? 'Saving...' : 'Save'}
              </button>
            </form>

            {canManageWorkspace && (
              <form onSubmit={handleInviteMember} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <label className="md:col-span-2 text-sm text-gray-700">
                  Invite by Email
                  <input
                    type="email"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Role
                  <select
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    {MEMBER_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isInviting ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              </form>
            )}

            <form onSubmit={handleAcceptInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              <label className="md:col-span-3 text-sm text-gray-700">
                Accept Invite Token
                <input
                  type="text"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={acceptInviteToken}
                  onChange={(e) => setAcceptInviteToken(e.target.value)}
                  placeholder="Paste invite token here"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Accept Invite
                </button>
              </div>
            </form>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2">Member</th>
                    <th className="text-left px-3 py-2">Role</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(workspaceData?.members || []).map((member, index) => (
                    <tr key={`${member.email}-${index}`} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{member.name || member.email}</div>
                        <div className="text-gray-500">{member.email}</div>
                      </td>
                      <td className="px-3 py-2">
                        {canManageWorkspace && member.status === 'active' && member.role !== 'owner' && member.userId ? (
                          <select
                            className="border rounded-md px-2 py-1"
                            value={member.role}
                            onChange={(e) => handleUpdateMemberRole(member.userId, e.target.value)}
                          >
                            {MEMBER_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="capitalize">{member.role}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 capitalize">{member.status}</td>
                      <td className="px-3 py-2 text-right">
                        {canManageWorkspace && member.status === 'active' && member.role !== 'owner' && member.userId && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
