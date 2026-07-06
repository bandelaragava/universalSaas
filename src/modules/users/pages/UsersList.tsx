import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers } from "../services/userService";
import AppTable from '../components/AppTable';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import AppButton from '../components/AppButton';
import ConfirmDialog from '../components/ConfirmDialog';
import type { User } from '../types/user';

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDelete, setShowDelete] = useState<{ open: boolean; id?: string }>({ open: false });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ q: search, page, limit: pageSize });
      setUsers(res.data);
      setTotal(res.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const columns = [
    { header: 'Avatar', accessor: (row: User) => <img src={row.avatarUrl} alt="avatar" className="h-8 w-8 rounded-full" /> },
    { header: 'Employee ID', accessor: (row: User) => row.employeeId },
    { header: 'Name', accessor: (row: User) => `${row.firstName} ${row.lastName}` },
    { header: 'Email', accessor: (row: User) => row.email },
    { header: 'Phone', accessor: (row: User) => row.phone },
    { header: 'Role', accessor: (row: User) => row.role },
    { header: 'Department', accessor: (row: User) => row.department },
    { header: 'Status', accessor: (row: User) => <span className={`px-2 py-1 rounded text-xs ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{row.isActive ? 'Active' : 'Inactive'}</span> },
    { header: 'Last Login', accessor: (row: User) => row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never' },
    {
      header: 'Actions',
      accessor: (row: User) => (
        <div className="flex space-x-2">
          <AppButton variant="secondary" size="sm" onClick={() => navigate(`/users/${row.id}/edit`)}>Edit</AppButton>
          <AppButton variant="danger" size="sm" onClick={() => setShowDelete({ open: true, id: row.id })}>Delete</AppButton>
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!showDelete.id) return;
    try {
      // call delete API (omitted for brevity)
      // await deleteUser(showDelete.id);
      setShowDelete({ open: false });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <AppButton variant="primary" onClick={() => navigate('/users/create')}>Add User</AppButton>
      </div>
      <SearchBar placeholder="Search users..." onSearch={setSearch} />
      <AppTable columns={columns} data={users} loading={loading} error={error} />
      <Pagination currentPage={page} totalItems={total} pageSize={pageSize} onPageChange={setPage} />
      <ConfirmDialog
        open={showDelete.open}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete({ open: false })}
      />
    </div>
  );
};

export default UsersList;




