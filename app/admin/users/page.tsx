'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Trash2, Shield, User, ArrowLeft } from 'lucide-react';
import RoleGuard from '@/app/components/RoleGuard';
import api from '@/app/api/axios';
import toast from 'react-hot-toast';

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        try {
            // Assuming GET /users exists and works for admin
            const res = await api.get('/users?limit=100');
            // If /users is not implemented, we might need to implement it or use what we have
            // Assuming backend has getUser controller. 
            // Checking implementation_plan, Step 123 said "User management table (View/Delete users)".
            // Backend route /users might ensure all users.

            setUsers(res.data.data?.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback or Toast
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await api.delete(`/users/${userId}`);
            toast.success('User deleted');
            setUsers(users.filter(u => u._id !== userId));
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <RoleGuard allowedRoles={['admin']}>
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">User Management</h1>
                        <p className="text-gray-500">View and manage registered users</p>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="input pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-4 font-medium text-gray-500">User</th>
                                    <th className="p-4 font-medium text-gray-500">Role</th>
                                    <th className="p-4 font-medium text-gray-500">Face Reg</th>
                                    <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-8 text-center">Loading users...</td></tr>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <tr key={user._id} className="hover:bg-gray-50 group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={20} className="text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`
                           px-2 py-1 rounded text-xs font-medium capitalize
                           ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'organizer' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'}
                         `}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {user.faceId ? (
                                                    <span className="text-green-600 flex items-center gap-1 text-sm"><Shield size={14} /> Registered</span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Pending</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No users found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
