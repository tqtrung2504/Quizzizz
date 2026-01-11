import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser, changeRole, disableUser, User } from './UserApi';

const emptyUser: Partial<User> = {
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  role: 'user',
  isDeleted: false
};

const ManageUser: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>(emptyUser);
  const [editingUid, setEditingUid] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách user:', err);
      alert('Lỗi khi tải danh sách user!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleOpenCreate = () => {
    setFormData(emptyUser);
    setEditingUid(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setFormData(user);
    setEditingUid(user.uid);
    setShowForm(true);
  };

  const handleDelete = async (uid: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    try {
      await deleteUser(uid);
      await loadUsers();
    } catch (err) {
      console.error('Lỗi khi xóa user:', err);
      alert('Lỗi khi xóa user!');
    }
  };

  const handleChangeRole = async (uid: string, role: string) => {
    try {
      await changeRole(uid, role);
      await loadUsers();
    } catch (err) {
      console.error('Lỗi khi đổi quyền:', err);
      alert('Lỗi khi đổi quyền!');
    }
  };

  const handleDisable = async (uid: string, isDeleted: boolean) => {
    try {
      await disableUser(uid, isDeleted);
      await loadUsers();
    } catch (err) {
      console.error('Lỗi khi vô hiệu hóa user:', err);
      alert('Lỗi khi vô hiệu hóa user!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUid) {
        await updateUser(editingUid, formData);
      } else {
        await createUser(formData);
      }
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      console.error('Lỗi khi lưu user:', err);
      alert('Lỗi khi lưu user!');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản trị tài khoản</h1>
      <button className="mb-4 px-4 py-2 bg-sky-600 text-white rounded" onClick={handleOpenCreate}>+ Thêm tài khoản</button>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th>Email</th>
              <th>Username</th>
              <th>Họ tên</th>
              <th>Quyền</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid} className={user.isDeleted ? 'bg-red-50' : ''}>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>{user.firstName} {user.lastName}</td>
                <td>
                  <select value={user.role} onChange={e => handleChangeRole(user.uid, e.target.value)} className="border rounded px-2 py-1">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button className={`px-2 py-1 rounded ${user.isDeleted ? 'bg-gray-400 text-white' : 'bg-green-500 text-white'}`} onClick={() => handleDisable(user.uid, !user.isDeleted)}>
                    {user.isDeleted ? 'Đã khóa' : 'Hoạt động'}
                  </button>
                </td>
                <td>
                  <button className="px-2 py-1 bg-yellow-500 text-white rounded mr-2" onClick={() => handleEdit(user)}>Sửa</button>
                  <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(user.uid)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={() => setShowForm(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">{editingUid ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" className="w-full border rounded px-3 py-2" placeholder="Email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} required />
              <input type="text" className="w-full border rounded px-3 py-2" placeholder="Username" value={formData.username} onChange={e => setFormData(f => ({ ...f, username: e.target.value }))} required />
              <input type="text" className="w-full border rounded px-3 py-2" placeholder="Họ" value={formData.firstName} onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))} />
              <input type="text" className="w-full border rounded px-3 py-2" placeholder="Tên" value={formData.lastName} onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))} />
              <select className="w-full border rounded px-3 py-2" value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser; 