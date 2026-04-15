import React, { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaFileAlt, FaPlus, FaSave, FaTimes, FaTrash } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { authHeaders } from '../../lib/auth';
import { fetchJsonWithFallback } from '../../utils/promo';

const jenisOptions = [
    { value: 'informasi', label: 'Informasi' },
    { value: 'syarat', label: 'Syarat' },
    { value: 'alur', label: 'Alur' }
];

const emptyForm = {
    judul: '',
    jenis_konten: 'informasi',
    konten: ''
};

export default function KprManagement() {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const jenisLabelMap = useMemo(
        () => jenisOptions.reduce((acc, item) => ({ ...acc, [item.value]: item.label }), {}),
        []
    );

    const fetchItems = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await fetchJsonWithFallback('/api/kpr-contents');
            setItems(data);
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat memuat data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleOpenForm = () => {
        setIsFormOpen(true);
        setEditingId(null);
        setFormData(emptyForm);
    };

    const handleEdit = (item) => {
        setIsFormOpen(true);
        setEditingId(item.id_kpr_info);
        setFormData({
            judul: item.judul || '',
            jenis_konten: item.jenis_konten || 'informasi',
            konten: item.konten || ''
        });
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData(emptyForm);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const isEdit = Boolean(editingId);
            await fetchJsonWithFallback(
                isEdit ? `/api/kpr-contents/${editingId}` : '/api/kpr-contents',
                {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    ...authHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            await fetchItems();
            setIsFormOpen(false);
            setEditingId(null);
            setFormData(emptyForm);
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus konten ini?')) {
            return;
        }

        setError('');
        try {
            await fetchJsonWithFallback(`/api/kpr-contents/${itemId}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            await fetchItems();
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat menghapus data.');
        }
    };

    const formatContent = (text) => {
        if (!text) {
            return '-';
        }
        const trimmed = text.trim();
        return trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed;
    };

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="admin-page-title text-2xl font-bold text-gray-900">Dashboard Admin - Kelola Informasi KPR</h1>
                    <p className="admin-page-subtitle text-gray-500 text-sm">Tambah, edit, dan hapus konten KPR untuk ditampilkan ke user.</p>
                </div>
                <Button onClick={handleOpenForm} className="w-full sm:w-auto">
                    <FaPlus className="mr-2" /> Tambah Informasi KPR
                </Button>
            </div>

            {isFormOpen && (
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="flex items-center gap-3 text-primary-700">
                                <FaFileAlt />
                                <h2 className="text-lg font-semibold">
                                    {editingId ? 'Edit Informasi KPR' : 'Tambah Informasi KPR'}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Judul</label>
                                    <Input
                                        value={formData.judul}
                                        onChange={handleChange('judul')}
                                        placeholder="Contoh: Pengertian KPR"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Jenis Konten</label>
                                    <select
                                        value={formData.jenis_konten}
                                        onChange={handleChange('jenis_konten')}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {jenisOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Konten</label>
                                <textarea
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[180px]"
                                    value={formData.konten}
                                    onChange={handleChange('konten')}
                                    placeholder="Tulis konten lengkap di sini..."
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Gunakan format paragraf atau penomoran. Konten akan tampil sesuai di halaman KPR.
                                </p>
                            </div>

                            {error && <p className="text-sm text-red-600">{error}</p>}

                            <div className="flex flex-wrap gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    <FaTimes className="mr-1" /> Batal
                                </Button>
                                <Button type="submit" isLoading={isSubmitting}>
                                    <FaSave className="mr-1" /> {editingId ? 'Simpan Perubahan' : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="border-gray-200 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-800">Daftar Konten KPR</h2>
                        <span className="text-xs text-gray-400">
                            {isLoading ? 'Memuat...' : `${items.length} konten`}
                        </span>
                    </div>

                    {error && !isFormOpen && (
                        <div className="px-6 py-4 text-sm text-red-600 border-b border-gray-100">{error}</div>
                    )}

                    <div className="overflow-x-auto responsive-table-wrap">
                        <table className="admin-table w-full text-[13px] text-left min-w-[900px]">
                            <thead className="bg-[#f8fafc] text-gray-500 font-semibold uppercase text-[10px] tracking-[0.06em]">
                                <tr>
                                    <th className="px-6 py-4">Judul</th>
                                    <th className="px-6 py-4">Jenis Konten</th>
                                    <th className="px-6 py-4">Konten</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="4">
                                            Memuat data KPR...
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="4">
                                            Belum ada konten KPR. Tambahkan data baru melalui form.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id_kpr_info} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{item.judul}</td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {jenisLabelMap[item.jenis_konten] || item.jenis_konten}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 max-w-sm">
                                                {formatContent(item.konten)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:bg-blue-50 px-2 h-8 rounded-lg"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50 px-2 h-8 rounded-lg"
                                                        onClick={() => handleDelete(item.id_kpr_info)}
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

