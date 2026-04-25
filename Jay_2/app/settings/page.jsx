"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import workspaceService from '../../services/workspaceService';
import auditLogService from '../../services/auditLogService';

const MEMBER_ROLES = ['admin', 'editor', 'viewer'];
const fieldClassName = 'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100';
const sectionClassName = 'rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur';
const primaryButtonClassName = 'rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButtonClassName = 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60';
const successButtonClassName = 'rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60';
const dangerButtonClassName = 'rounded-2xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200';

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
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

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
  const workspaceLabel = workspaceData?.name || 'Personal workspace';

  const loadAuditLogs = async (page = 1) => {
    setAuditError('');
    setIsLoadingAuditLogs(true);
    try {
      const data = await auditLogService.getWorkspaceAuditLogs({
        page,
        limit: auditPagination.limit
      });
      setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
      setAuditPagination(prev => ({
        ...prev,
        ...(data.pagination || prev),
        page: data.pagination?.page || page
      }));
    } catch (err) {
      setAuditError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    if (!user || !canManageWorkspace) {
      setAuditLogs([]);
      setAuditError('');
      return;
    }

    loadAuditLogs(1);
  }, [user, canManageWorkspace]);

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

  const formatAuditMetadata = (metadata) => {
    if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
      return '-';
    }

    const compact = JSON.stringify(metadata);
    if (compact.length > 120) {
      return `${compact.slice(0, 117)}...`;
    }
    return compact;
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#fff7ed_48%,_#ffffff_100%)] py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-white/85 px-5 py-4 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">Settings</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{user?.name || user?.email || 'User'}</span>
                <span className="text-slate-300">|</span>
                <span>{workspaceLabel}</span>
                <span className="text-slate-300">|</span>
                <span className="capitalize">{myWorkspaceRole}</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className={secondaryButtonClassName}
            >
              Back to Dashboard
            </button>
          </div>

          {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div>}
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>}

          <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-3 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === 'profile' ? 'bg-slate-950 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('workspace')}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === 'workspace' ? 'bg-slate-950 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Workspace
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === 'security' ? 'bg-slate-950 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Security
              </button>
              {canManageWorkspace && (
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    activeTab === 'audit' ? 'bg-slate-950 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Audit
                </button>
              )}
            </div>
          </div>

          {activeTab === 'profile' && (
          <section className={sectionClassName}>
            <h2 className="mb-2 text-xl font-semibold text-slate-950">Profile</h2>
            <p className="mb-5 text-sm text-slate-600">Update the personal details shown across your workspace.</p>
            <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-slate-700">
                Full Name
                <input
                  type="text"
                  className={fieldClassName}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Timezone
                <input
                  type="text"
                  className={fieldClassName}
                  value={profileForm.timezone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
                  placeholder="e.g. Asia/Kolkata"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Job Title
                <input
                  type="text"
                  className={fieldClassName}
                  value={profileForm.title}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Company
                <input
                  type="text"
                  className={fieldClassName}
                  value={profileForm.company}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Phone
                <input
                  type="text"
                  className={fieldClassName}
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Bio
                <textarea
                  className={fieldClassName}
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                />
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className={primaryButtonClassName}
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </section>
          )}

          {activeTab === 'security' && (
          <section className={sectionClassName}>
            <h2 className="mb-2 text-xl font-semibold text-slate-950">Change Password</h2>
            <p className="mb-5 text-sm text-slate-600">Keep your account secure with a fresh password when needed.</p>
            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="text-sm font-medium text-slate-700">
                Current Password
                <input
                  type="password"
                  className={fieldClassName}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                New Password
                <input
                  type="password"
                  className={fieldClassName}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Confirm Password
                <input
                  type="password"
                  className={fieldClassName}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </label>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className={primaryButtonClassName}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>
          )}

          {activeTab === 'workspace' && (
          <section className={sectionClassName}>
            <h2 className="mb-2 text-xl font-semibold text-slate-950">Workspace</h2>
            <p className="mb-4 text-sm text-slate-600">Your role: <span className="font-semibold capitalize text-slate-900">{myWorkspaceRole}</span></p>

            <form onSubmit={handleWorkspaceUpdate} className="flex items-end gap-3 mb-6">
              <label className="flex-1 text-sm font-medium text-slate-700">
                Workspace Name
                <input
                  type="text"
                  className={fieldClassName}
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={!canManageWorkspace}
                />
              </label>
              <button
                type="submit"
                disabled={!canManageWorkspace || isSavingWorkspace}
                className={primaryButtonClassName}
              >
                {isSavingWorkspace ? 'Saving...' : 'Save'}
              </button>
            </form>

            {canManageWorkspace && (
              <form onSubmit={handleInviteMember} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <label className="md:col-span-2 text-sm font-medium text-slate-700">
                  Invite by Email
                  <input
                    type="email"
                    className={fieldClassName}
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Role
                  <select
                    className={fieldClassName}
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
                    className={`w-full ${successButtonClassName}`}
                  >
                    {isInviting ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              </form>
            )}

            <form onSubmit={handleAcceptInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              <label className="md:col-span-3 text-sm font-medium text-slate-700">
                Accept Invite Token
                <input
                  type="text"
                  className={fieldClassName}
                  value={acceptInviteToken}
                  onChange={(e) => setAcceptInviteToken(e.target.value)}
                  placeholder="Paste invite token here"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  className={`w-full ${primaryButtonClassName}`}
                >
                  Accept Invite
                </button>
              </div>
            </form>

            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
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
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
                            className={dangerButtonClassName}
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
          )}

          {activeTab === 'audit' && canManageWorkspace && (
            <section className={sectionClassName}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Audit Logs</h2>
                  <p className="mt-1 text-sm text-slate-600">Track workspace changes, actions, and access events.</p>
                </div>
                <button
                  onClick={() => loadAuditLogs(auditPagination.page || 1)}
                  className={secondaryButtonClassName}
                >
                  Refresh
                </button>
              </div>

              {auditError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  {auditError}
                </div>
              )}

              <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white">
                <table className="w-full text-sm min-w-[780px]">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left px-3 py-2">Time</th>
                      <th className="text-left px-3 py-2">Action</th>
                      <th className="text-left px-3 py-2">User</th>
                      <th className="text-left px-3 py-2">Entity</th>
                      <th className="text-left px-3 py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingAuditLogs ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-gray-500">Loading logs...</td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-gray-500">No logs yet.</td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id} className="border-t align-top">
                          <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900">{log.action}</td>
                          <td className="px-3 py-2">
                            <div className="text-gray-900">{log.userName || 'system'}</div>
                            <div className="text-gray-500">{log.userEmail || '-'}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-gray-900">{log.entityType || '-'}</div>
                            <div className="text-gray-500">{log.entityId || '-'}</div>
                          </td>
                          <td className="px-3 py-2 text-gray-700 break-all">
                            {formatAuditMetadata(log.metadata)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  {auditPagination.total > 0
                    ? `Showing page ${auditPagination.page} of ${auditPagination.totalPages} (${auditPagination.total} total)`
                    : 'No records'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadAuditLogs((auditPagination.page || 1) - 1)}
                    disabled={(auditPagination.page || 1) <= 1 || isLoadingAuditLogs}
                    className={`${secondaryButtonClassName} px-3 py-2`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadAuditLogs((auditPagination.page || 1) + 1)}
                    disabled={(auditPagination.page || 1) >= (auditPagination.totalPages || 1) || isLoadingAuditLogs}
                    className={`${secondaryButtonClassName} px-3 py-2`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
