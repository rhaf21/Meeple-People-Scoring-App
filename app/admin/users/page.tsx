'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import RoleBadge from '@/components/RoleBadge';

interface UserData {
  _id: string;
  name: string;
  email?: string;
  role: 'admin' | 'user' | 'guest';
  profileClaimed: boolean;
  createdAt: string;
}

export default function UsersManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const playersRes = await fetch('/api/players', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const allPlayers = await playersRes.json();
      const claimedPlayers = allPlayers.filter((p: UserData) => p.profileClaimed);
      setUsers(claimedPlayers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: 'admin' | 'user') {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setUpdating(userId);
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update local state
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        alert(`Role updated to ${newRole} successfully!`);
      } else {
        alert(data.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    } finally {
      setUpdating(null);
    }
  }

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 dark:text-gray-100">
          User Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage user roles and permissions for claimed profiles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {users.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Administrators
          </h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {adminCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Regular Users
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {userCount}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {user.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge role={user.role} showUser={true} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {user.role === 'admin' ? (
                      <button
                        onClick={() => handleRoleChange(user._id, 'user')}
                        disabled={updating === user._id}
                        className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 font-semibold"
                      >
                        {updating === user._id ? 'Updating...' : 'Demote to User'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(user._id, 'admin')}
                        disabled={updating === user._id}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 font-semibold"
                      >
                        {updating === user._id ? 'Updating...' : 'Promote to Admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-700 dark:text-gray-300">
              {searchTerm ? 'No users found matching your search.' : 'No claimed users yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg text-gray-900 dark:text-gray-100">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {user.email || 'N/A'}
                  </p>
                </div>
                <RoleBadge role={user.role} showUser={true} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </div>
                <div>
                  {user.role === 'admin' ? (
                    <button
                      onClick={() => handleRoleChange(user._id, 'user')}
                      disabled={updating === user._id}
                      className="text-sm text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 font-semibold px-3 py-1 rounded border border-orange-300 dark:border-orange-700"
                    >
                      {updating === user._id ? 'Updating...' : 'Demote'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(user._id, 'admin')}
                      disabled={updating === user._id}
                      className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 font-semibold px-3 py-1 rounded border border-green-300 dark:border-green-700"
                    >
                      {updating === user._id ? 'Updating...' : 'Promote'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-700 dark:text-gray-300">
              {searchTerm ? 'No users found matching your search.' : 'No claimed users yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
