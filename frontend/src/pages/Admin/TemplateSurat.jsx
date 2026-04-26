import React, { useEffect, useMemo, useState } from 'react';
import {
    FaEdit,
    FaExternalLinkAlt,
    FaFileAlt,
    FaPlus,
    FaSave,
    FaTimes,
    FaTrash,
} from 'react-icons/fa';
import TableSlidePagination from '../../components/admin/TableSlidePagination';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { authHeaders } from '../../lib/auth';
import { apiJson } from '../../lib/api';
import useTableSlidePagination from '../../hooks/useTableSlidePagination';

const emptyForm = {
    nama_file: '',
    jenis_surat: '',
    link_gdocs: '',
};

const isValidHttpUrl = (value) => {
    try {
        const parsed = new URL(String(value || '').trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const formatUrlLabel = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '-';
    return trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed;
};

export default function TemplateSurat() {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalItemsLabel = useMemo(() => (
        isLoading ? 'Memuat...' : `${items.length} template`
    ), [isLoading, items.length]);

    const {
        currentPage,
        totalPages,
        paginatedRows: paginatedItems,
        rangeStart,
        rangeEnd,
        startIndex,
        canPrevious,
        canNext,
        goPrevious,
        goNext,
    } = useTableSlidePagination(items, {
        rowsPerPage: 10,
    });

    const fetchItems = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await apiJson('/admin/template-surat', {
                headers: authHeaders(),
                defaultErrorMessage: 'Gagal memuat daftar template surat.',
            });
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            setItems([]);
            setError(err.message || 'Gagal memuat daftar template surat.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const validateForm = (values) => {
        const nextErrors = {};

        if (!String(values.nama_file || '').trim()) {
            nextErrors.nama_file = 'Nama template wajib diisi.';
        }

        if (!String(values.jenis_surat || '').trim()) {
            nextErrors.jenis_surat = 'Jenis surat wajib diisi.';
        }

        if (!String(values.link_gdocs || '').trim()) {
            nextErrors.link_gdocs = 'Link Google Docs wajib diisi.';
        } else if (!isValidHttpUrl(values.link_gdocs)) {
            nextErrors.link_gdocs = 'Link Google Docs harus berupa URL yang valid.';
        }

        return nextErrors;
    };

    const resetFormState = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setEditingId(null);
        setIsFormOpen(false);
        setIsSubmitting(false);
    };

    const handleChange = (field) => (event) => {
        const { value } = event.target;
        setFormData((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleOpenCreate = () => {
        setSuccess('');
        setError('');
        setEditingId(null);
        setFormData(emptyForm);
        setFormErrors({});
        setIsFormOpen(true);
    };

    const handleEdit = (item) => {
        setSuccess('');
        setError('');
        setEditingId(item.id);
        setFormData({
            nama_file: item.nama_file || '',
            jenis_surat: item.jenis_surat || '',
            link_gdocs: item.link_gdocs || '',
        });
        setFormErrors({});
        setIsFormOpen(true);
    };

    const handleCancel = () => {
        resetFormState();
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSuccess('');
        setError('');

        const nextErrors = validateForm(formData);
        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            const isEdit = Boolean(editingId);
            const response = await apiJson(
                isEdit ? `/admin/template-surat/${editingId}` : '/admin/template-surat',
                {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: {
                        ...authHeaders(),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nama_file: formData.nama_file.trim(),
                        jenis_surat: formData.jenis_surat.trim(),
                        link_gdocs: formData.link_gdocs.trim(),
                    }),
                    defaultErrorMessage: isEdit
                        ? 'Gagal memperbarui template surat.'
                        : 'Gagal menambahkan template surat.',
                }
            );

            setSuccess(response?.message || (isEdit
                ? 'Template surat berhasil diperbarui.'
                : 'Template surat berhasil ditambahkan.'));
            resetFormState();
            await fetchItems();
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat menyimpan data template surat.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (item) => {
        const confirmed = window.confirm(`Hapus template surat "${item.nama_file}"?`);
        if (!confirmed) {
            return;
        }

        setSuccess('');
        setError('');
        try {
            const response = await apiJson(`/admin/template-surat/${item.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
                defaultErrorMessage: 'Gagal menghapus template surat.',
            });
            setSuccess(response?.message || 'Template surat berhasil dihapus.');
            await fetchItems();
        } catch (err) {
            setError(err.message || 'Gagal menghapus template surat.');
        }
    };

    const handleOpenTemplate = (link) => {
        const normalized = String(link || '').trim();
        if (!normalized) {
            setError('Link template tidak tersedia.');
            setSuccess('');
            return;
        }

        window.open(normalized, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="admin-page space-y-6 animate-in fade-in duration-500">
            <div className="admin-page-head flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="admin-page-title text-2xl font-bold text-gray-900">Kelola Template Surat</h1>
                    <p className="admin-page-subtitle text-gray-500 text-sm">
                        Simpan dan kelola link Google Docs template surat untuk kebutuhan administrasi.
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
                    <FaPlus className="mr-2" /> Tambah Template Surat
                </Button>
            </div>

            {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                    {success}
                </div>
            )}

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {isFormOpen && (
                <Card className="border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="flex items-center gap-3 text-primary-700">
                                <FaFileAlt />
                                <h2 className="text-lg font-semibold text-primary-900">
                                    {editingId ? 'Edit Template Surat' : 'Tambah Template Surat'}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nama Template"
                                    value={formData.nama_file}
                                    onChange={handleChange('nama_file')}
                                    placeholder="Contoh: Surat Pengajuan KPR"
                                    error={formErrors.nama_file}
                                    required
                                />
                                <Input
                                    label="Jenis Surat"
                                    value={formData.jenis_surat}
                                    onChange={handleChange('jenis_surat')}
                                    placeholder="Contoh: Pengajuan / Pernyataan / Persetujuan"
                                    error={formErrors.jenis_surat}
                                    required
                                />
                            </div>

                            <Input
                                label="Link Google Docs"
                                type="url"
                                value={formData.link_gdocs}
                                onChange={handleChange('link_gdocs')}
                                placeholder="https://docs.google.com/..."
                                error={formErrors.link_gdocs}
                                required
                            />

                            <div className="flex flex-wrap gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    <FaTimes className="mr-1" /> Batal
                                </Button>
                                <Button type="submit" isLoading={isSubmitting}>
                                    <FaSave className="mr-1" />
                                    {editingId ? 'Simpan Perubahan' : 'Simpan Template'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="border-gray-200 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-base font-semibold text-gray-800">Daftar Template Surat</h2>
                        <span className="text-xs text-gray-400">{totalItemsLabel}</span>
                    </div>

                    <div className="overflow-x-auto responsive-table-wrap">
                        <table className="admin-table w-full text-[13px] text-left min-w-[980px]">
                            <thead className="bg-[#f8fafc] text-gray-500 font-semibold uppercase text-[10px] tracking-[0.06em]">
                                <tr>
                                    <th className="px-6 py-4 w-16">No</th>
                                    <th className="px-6 py-4">Nama Template</th>
                                    <th className="px-6 py-4">Jenis Surat</th>
                                    <th className="px-6 py-4">Link Template</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="5">
                                            Memuat data template surat...
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-8 text-gray-500" colSpan="5">
                                            Belum ada template surat. Tambahkan data baru untuk mulai mengelola template.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 text-gray-500">{startIndex + index + 1}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">{item.nama_file}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.jenis_surat}</td>
                                            <td className="px-6 py-4 text-gray-500 max-w-[280px]">
                                                <a
                                                    href={item.link_gdocs}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex max-w-full items-center gap-2 text-primary-700 hover:text-primary-800"
                                                >
                                                    <span className="truncate">{formatUrlLabel(item.link_gdocs)}</span>
                                                    <FaExternalLinkAlt className="shrink-0 text-[11px]" />
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 rounded-lg"
                                                        onClick={() => handleOpenTemplate(item.link_gdocs)}
                                                    >
                                                        <FaExternalLinkAlt className="mr-2" /> Buka Template
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 rounded-lg text-blue-700 hover:bg-blue-50"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <FaEdit className="mr-2" /> Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 rounded-lg text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(item)}
                                                    >
                                                        <FaTrash className="mr-2" /> Hapus
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!isLoading && (
                        <div className="border-t border-slate-100 p-4">
                            <TableSlidePagination
                                rangeStart={rangeStart}
                                rangeEnd={rangeEnd}
                                totalItems={items.length}
                                totalPages={totalPages}
                                currentPage={currentPage}
                                itemLabel="template"
                                canPrevious={canPrevious}
                                canNext={canNext}
                                onPrevious={goPrevious}
                                onNext={goNext}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
