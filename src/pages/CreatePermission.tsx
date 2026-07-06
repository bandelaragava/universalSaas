/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';

interface Permission {
  id: number;
  module: string;
  action: string;
  permissionKey: string;
  description: string;
  active: boolean;
}

export default function CreatePermission() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [action, setAction] = useState('');
  const [module, setModule] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      const response = await rolesApi.get<Permission[]>('/permissions');
      setPermissions(response.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch permissions');
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleCreatePermission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const payload = {
      action,
      module,
      description,
    };

    try {
      await rolesApi.post('/permissions', payload);
      setMessage('Permission Created Successfully!');
      setAction('');
      setModule('');
      setDescription('');
      fetchPermissions(); // Refresh list
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to create permission');
    }
  };

  const handleToggleStatus = async (perm: Permission) => {
    setMessage(null);
    setError(null);
    try {
      if (perm.active) {
        await rolesApi.put(`/permissions/${perm.id}/disable`);
        setMessage(`Permission '${perm.permissionKey}' disabled successfully!`);
      } else {
        await rolesApi.put(`/permissions/${perm.id}/enable`);
        setMessage(`Permission '${perm.permissionKey}' enabled successfully!`);
      }
      fetchPermissions();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50 tracking-tight">Create Permission Node</h2>
          <p className="text-slate-400 text-sm mt-1">Register new modular permissions and manage key parameters.</p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-455 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
          <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-3">
            Register Permission
          </h3>

          <form onSubmit={handleCreatePermission} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Module <span className="text-rose-550">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AFFILIATE"
                className="w-full bg-background border border-slate-850 text-slate-200 text-sm rounded-lg px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={module}
                onChange={(e) => setModule(e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Action <span className="text-rose-550">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. LINK"
                className="w-full bg-background border border-slate-850 text-slate-200 text-sm rounded-lg px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={action}
                onChange={(e) => setAction(e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Description <span className="text-rose-550">*</span>
              </label>
              <textarea
                required
                placeholder="Permission description"
                className="w-full bg-slate-955 border border-slate-850 text-slate-200 text-sm rounded-lg px-3.5 py-2 min-h-[90px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full font-semibold py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/10 text-sm transition-all active:scale-95"
            >
              Create Permission
            </button>
          </form>
        </div>

        {/* Right Column: Permissions List */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200">Permissions Registry</h3>
            <button
              onClick={fetchPermissions}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded px-2.5 py-1 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">ID</th>
                  <th className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Key</th>
                  <th className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Module</th>
                  <th className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Action</th>
                  <th className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">
                      No permissions registered yet.
                    </td>
                  </tr>
                ) : (
                  permissions.map((perm) => (
                    <tr
                      key={perm.id}
                      className={`border-b border-slate-800/60 text-slate-300 hover:bg-slate-950/20 transition-colors ${
                        !perm.active ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{perm.id}</td>
                      <td className="py-2.5 px-3">
                        <strong className="text-slate-200">{perm.permissionKey}</strong>
                      </td>
                      <td className="py-2.5 px-3">
                        <code className="bg-background text-slate-450 px-1.5 py-0.5 rounded text-xs border border-slate-800">
                          {perm.module}
                        </code>
                      </td>
                      <td className="py-2.5 px-3">
                        <code className="bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded text-xs border border-cyan-900/30">
                          {perm.action}
                        </code>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                            perm.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                          }`}
                        >
                          {perm.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(perm)}
                          className={`font-semibold text-xs border rounded px-2.5 py-1.5 transition-colors ${
                            perm.active
                              ? 'bg-slate-850 hover:bg-slate-800 text-rose-455 border-slate-750'
                              : 'bg-slate-850 hover:bg-slate-800 text-emerald-400 border-slate-750'
                          }`}
                        >
                          {perm.active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}




