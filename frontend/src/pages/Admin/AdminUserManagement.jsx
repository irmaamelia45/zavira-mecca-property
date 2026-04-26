import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash } from 'react-icons/fa';
import TableSlidePagination from '../../components/admin/TableSlidePagination';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { apiJson } from '../../lib/api';
import { authHeaders, getUserRole } from '../../lib/auth';
import useTableSlidePagination from '../../hooks/useTableSlidePagination';
import { formatPhoneForDisplay } from '../../lib/phone';

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

export default function AdminUserManagement() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentRole = getUserRole();
    const isSuperadmin = currentRole === 'superadmin';

    const [adminUsers, setAdminUsers] = useState([]);
    const [loadingAdminUsers, setLoadingAdminUsers] = useState(true);
    const [deletingAdminId, setDeletingAdminId] = useState(null);
    const [updatingAdminStatusId, setUpdatingAdminStatusId] = useState(null);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const {
        currentPage,
        totalPages,
        paginatedRows: paginatedAdminUsers,
        rangeStart,
        rangeEnd,
        canPrevious,
        canNext,
        goPrevious,
        goNext,
    } = useTableSlidePagination(adminUsers, {
        rowsPerPage: 10,
    });

    const fetchAdminUsers = async () => {
        if (!isSuperadmin) {
            setAdminUsers([]);
            setLoadingAdminUsers(false);
            return;
        }

        setLoadingAdminUsers(true);
        setError('');
        try {
            const data = await apiJson('/admin/users/admins', {
                headers: authHeaders(),
                defaultErrorMessage: 'Gagal memuat akun Admin Perumahan.',
            });
            setAdminUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Gagal memuat akun Admin Perumahan.');
        } finally {
            setLoadingAdminUsers(false);
        }
    };

    useEffect(() => {
        fetchAdminUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperadmin]);

    useEffect(() => {
        if (!location?.state?.successMessage) return;

        setSuccess(location.state.successMessage);
        navigate(location.pathname, { replace: true });
    }, [location, navigate]);

    const handleDeleteAdmin = async (user) => {
        if (!isSuperadmin) return;

        const confirmed = window.confirm(`Hapus akun Admin Perumahan "${user.nama}"?`);
        if (!confirmed) return;

        setDeletingAdminId(user.id);
        setError('');
        setSuccess('');

        try {
            const data = await apiJson(`/admin/users/admins/${user.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
                defaultErrorMessage: 'Gagal menghapus akun Admin Perumahan.',
            });

            setSuccess(data?.message || 'Akun Admin Perumahan berhasil dihapus.');
            setAdminUsers((prev) => prev.filter((item) => Number(item.id) !== Number(user.id)));
        } catch (err) {
            setError(err.message || 'Gagal menghapus akun Admin Perumahan.');
        } finally {
            setDeletingAdminId(null);
        }
    };

    const handleToggleAdminStatus = async (user) => {
        if (!isSuperadmin) return;

        const nextStatus = !user.is_active;
        const actionLabel = nextStatus ? 'aktifkan' : 'nonaktifkan';
        const confirmed = window.confirm(`${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} akun Admin Perumahan "${user.nama}"?`);
        if (!confirmed) return;

        setUpdatingAdminStatusId(user.id);
        setError('');
        setSuccess('');

        try {
            const data = await apiJson(`/admin/users/admins/${user.id}/status`, {
                method: 'PATCH',
                headers: authHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({
                    is_active: nextStatus,
                }),
                defaultErrorMessage: 'Gagal memperbarui status akun Admin Perumahan.',
            });

            const updatedUser = data?.user && typeof data.user === 'object' ? data.user : null;
            setSuccess(data?.message || `Akun Admin Perumahan berhasil di${actionLabel}kan.`);
            setAdminUsers((prev) =>
                prev.map((item) => {
                    if (Number(item.id) !== Number(user.id)) return item;
                    return updatedUser ? { ...item, ...updatedUser } : { ...item, is_active: nextStatus };
                })
            );
        } catch (err) {
            setError(err.message || 'Gagal memperbarui status akun Admin Perumahan.');
        } finally {
            setUpdatingAdminStatusId(null);
        }
    };

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-300 py-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="admin-page-title text-2xl font-bold text-gray-800">Kelola Akun Admin Perumahan</h1>
                    <p className="admin-page-subtitle text-sm text-gray-500 mt-1">
                        {isSuperadmin
                            ? 'Akun Admin Perumahan hanya bisa dibuat dan dikelola oleh Superadmin.'
                            : 'Hanya superadmin yang dapat mengakses fitur ini.'}
                    </p>
                </div>
                {isSuperadmin && (
                    <Button onClick={() => navigate('/admin/admin-users/add')} className="w-full sm:w-auto">
                        <FaPlus className="mr-2" />
                        Tambah Akun Admin
                    </Button>
                )}
            </div>

            {!isSuperadmin && (
                <Card className="border border-amber-200 shadow-sm bg-amber-50/60">
                    <CardContent className="p-6 space-y-2">
                        <h2 className="text-lg font-semibold text-amber-900">Fitur Terkunci</h2>
                        <p className="text-sm text-amber-800">
                            Hanya superadmin yang dapat mengakses fitur ini.
                        </p>
                    </CardContent>
                </Card>
            )}

            {isSuperadmin && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {isSuperadmin && success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            {isSuperadmin && (
                <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Daftar Akun Admin Perumahan</h2>
                        {loadingAdminUsers ? (
                            <p className="text-sm text-gray-500">Memuat akun Admin Perumahan...</p>
                        ) : adminUsers.length === 0 ? (
                            <p className="text-sm text-gray-500">Belum ada akun Admin Perumahan.</p>
                        ) : (
                            <div className="overflow-x-auto responsive-table-wrap">
                                <table className="admin-table min-w-full text-sm">
                                    <thead className="text-left text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="px-5 py-3.5 font-semibold">Nama</th>
                                            <th className="px-5 py-3.5 font-semibold">Email</th>
                                            <th className="px-5 py-3.5 font-semibold">No. HP</th>
                                            <th className="px-5 py-3.5 font-semibold">Status</th>
                                            <th className="px-5 py-3.5 font-semibold">Dibuat</th>
                                            <th className="px-5 py-3.5 font-semibold text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedAdminUsers.map((user) => (
                                            <tr key={user.id} className="border-b border-gray-100">
                                                <td className="px-5 py-4 text-gray-900 font-medium">{user.nama}</td>
                                                <td className="px-5 py-4 text-gray-700">{user.email}</td>
                                                <td className="px-5 py-4 text-gray-700">{formatPhoneForDisplay(user.no_hp) || '-'}</td>
                                                <td className="px-5 py-4">
                                                    <Badge variant={user.is_active ? 'success' : 'destructive'}>
                                                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 text-gray-700">{formatDate(user.created_at)}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleAdminStatus(user)}
                                                            disabled={updatingAdminStatusId === user.id || deletingAdminId === user.id}
                                                            className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                                                user.is_active
                                                                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                                            }`}
                                                        >
                                                            {updatingAdminStatusId === user.id
                                                                ? user.is_active ? 'Menonaktifkan...' : 'Mengaktifkan...'
                                                                : user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAdmin(user)}
                                                            disabled={deletingAdminId === user.id || updatingAdminStatusId === user.id}
                                                            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <FaTrash />
                                                            {deletingAdminId === user.id ? 'Menghapus...' : 'Hapus'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!loadingAdminUsers && adminUsers.length > 0 && (
                            <TableSlidePagination
                                rangeStart={rangeStart}
                                rangeEnd={rangeEnd}
                                totalItems={adminUsers.length}
                                totalPages={totalPages}
                                currentPage={currentPage}
                                itemLabel="akun admin"
                                canPrevious={canPrevious}
                                canNext={canNext}
                                onPrevious={goPrevious}
                                onNext={goNext}
                            />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
