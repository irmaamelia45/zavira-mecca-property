import React, { useEffect, useMemo, useState } from 'react';
import { FaBuilding, FaSave, FaPlus, FaTrash, FaTrophy, FaUsers, FaInfoCircle, FaImage } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { authHeaders } from '../../lib/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function CompanyProfileManagement() {
    const [activeTab, setActiveTab] = useState('general');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isLogoDrag, setIsLogoDrag] = useState(false);
    const [awardDragId, setAwardDragId] = useState(null);
    const [teamDragId, setTeamDragId] = useState(null);

    const [generalInfo, setGeneralInfo] = useState({
        name: '',
        description: '',
        whatsapp: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    const [visionMission, setVisionMission] = useState({
        vision: '',
        mission: ''
    });

    const [awards, setAwards] = useState([{ id: 1, title: '', desc: '', image: '', preview: '', file: null }]);
    const [team, setTeam] = useState([{ id: 1, name: '', role: '', image: '', preview: '', file: null }]);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE}/api/company-profile`);
                if (!response.ok) {
                    throw new Error('Gagal memuat profil perusahaan.');
                }
                const data = await response.json();
                if (data) {
                    setGeneralInfo({
                        name: data.nama_perusahaan || '',
                        description: data.deskripsi || '',
                        whatsapp: data.whatsapp || ''
                    });
                    setVisionMission({
                        vision: data.visi || '',
                        mission: data.misi || ''
                    });
                    setLogoUrl(data.logo_path || '');
                    setAwards(
                        (data.penghargaan || []).map((item, index) => ({
                            id: Date.now() + index,
                            title: item.title || '',
                            desc: item.desc || '',
                            image: item.image || '',
                            preview: '',
                            file: null
                        }))
                    );
                    setTeam(
                        (data.struktur_organisasi || []).map((item, index) => ({
                            id: Date.now() + index + 100,
                            name: item.name || '',
                            role: item.role || '',
                            image: item.image || '',
                            preview: '',
                            file: null
                        }))
                    );
                }
            } catch (err) {
                setError(err.message || 'Gagal memuat profil perusahaan.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const resolveImage = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const isFormEmpty = useMemo(() => {
        return (
            !generalInfo.name &&
            !generalInfo.description &&
            !generalInfo.whatsapp &&
            !visionMission.vision &&
            !visionMission.mission &&
            awards.every((item) => !item.title && !item.desc) &&
            team.every((item) => !item.name && !item.role)
        );
    }, [generalInfo, visionMission, awards, team]);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const payloadAwards = awards.map((item) => ({
                title: item.title,
                desc: item.desc,
                image: item.image || ''
            }));
            const payloadTeam = team.map((item) => ({
                name: item.name,
                role: item.role,
                image: item.image || ''
            }));

            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('nama_perusahaan', generalInfo.name);
            formData.append('deskripsi', generalInfo.description || '');
            formData.append('whatsapp', generalInfo.whatsapp || '');
            formData.append('visi', visionMission.vision || '');
            formData.append('misi', visionMission.mission || '');
            formData.append('penghargaan', JSON.stringify(payloadAwards));
            formData.append('struktur_organisasi', JSON.stringify(payloadTeam));

            if (logoFile) {
                formData.append('logo', logoFile);
            }

            awards.forEach((item, index) => {
                if (item.file) {
                    formData.append(`awards_images[${index}]`, item.file);
                }
            });

            team.forEach((item, index) => {
                if (item.file) {
                    formData.append(`team_images[${index}]`, item.file);
                }
            });

            const response = await fetch(`${API_BASE}/api/company-profile`, {
                method: 'POST',
                headers: authHeaders(),
                body: formData
            });

            if (!response.ok) {
                throw new Error('Gagal menyimpan profil perusahaan.');
            }

            alert('Profil Perusahaan berhasil diperbarui!');
        } catch (err) {
            setError(err.message || 'Gagal menyimpan profil perusahaan.');
        } finally {
            setIsSaving(false);
        }
    };

    const addAward = () => {
        setAwards([...awards, { id: Date.now(), title: '', desc: '', image: '', preview: '', file: null }]);
    };
    const updateAward = (id, field, value) => {
        setAwards(awards.map(a => a.id === id ? { ...a, [field]: value } : a));
    };
    const removeAward = (id) => {
        setAwards(awards.filter(a => a.id !== id));
    };

    const addTeamMember = () => {
        setTeam([...team, { id: Date.now(), name: '', role: '', image: '', preview: '', file: null }]);
    };
    const updateTeamMember = (id, field, value) => {
        setTeam(team.map(t => t.id === id ? { ...t, [field]: value } : t));
    };
    const removeTeamMember = (id) => {
        setTeam(team.filter(t => t.id !== id));
    };

    const handleLogoFile = (file) => {
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleAwardFile = (awardId, file) => {
        if (!file) return;
        setAwards((prev) =>
            prev.map((item) =>
                item.id === awardId
                    ? {
                        ...item,
                        file,
                        preview: URL.createObjectURL(file)
                    }
                    : item
            )
        );
    };

    const handleTeamFile = (memberId, file) => {
        if (!file) return;
        setTeam((prev) =>
            prev.map((item) =>
                item.id === memberId
                    ? {
                        ...item,
                        file,
                        preview: URL.createObjectURL(file)
                    }
                    : item
            )
        );
    };

    const tabs = [
        { id: 'general', label: 'Umum', icon: <FaInfoCircle /> },
        { id: 'vismis', label: 'Visi & Misi', icon: <FaBuilding /> },
        { id: 'awards', label: 'Penghargaan', icon: <FaTrophy /> },
        { id: 'team', label: 'Struktur Organisasi', icon: <FaUsers /> },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Profil Perusahaan</h1>
                    <p className="text-gray-500 text-sm">Kelola informasi profil, visi misi, dan struktur organisasi.</p>
                </div>
                <Button onClick={handleSave} className="bg-primary-600 text-white" disabled={isSaving}>
                    <FaSave className="mr-2" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {isFormEmpty && !isLoading && (
                <p className="text-xs text-gray-400">Belum ada data profil perusahaan yang tersimpan.</p>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1">
                {activeTab === 'general' && (
                    <Card className="border-gray-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Informasi Umum</h3>
                            <div
                                className={`relative rounded-2xl border border-dashed p-6 transition ${
                                    isLogoDrag ? 'border-primary-400 bg-primary-100/60' : 'border-primary-200 bg-primary-50/40'
                                }`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsLogoDrag(true);
                                }}
                                onDragLeave={() => setIsLogoDrag(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsLogoDrag(false);
                                    const file = e.dataTransfer.files?.[0];
                                    handleLogoFile(file);
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        handleLogoFile(file);
                                    }}
                                />
                                <div className="flex flex-col items-center justify-center gap-3 text-center">
                                    <div className="h-14 w-14 rounded-2xl bg-white text-primary-600 flex items-center justify-center shadow-sm">
                                        {logoPreview || logoUrl ? (
                                            <img
                                                src={logoPreview || resolveImage(logoUrl)}
                                                alt="Preview Logo"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <FaImage className="text-xl" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-primary-900">Klik atau drop untuk upload logo perusahaan</p>
                                        <p className="text-xs text-gray-500">Format: JPG, PNG (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nama Perusahaan</label>
                                <Input
                                    value={generalInfo.name}
                                    onChange={(e) => setGeneralInfo({ ...generalInfo, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Deskripsi Singkat</label>
                                <textarea
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    rows="4"
                                    value={generalInfo.description}
                                    onChange={(e) => setGeneralInfo({ ...generalInfo, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">WhatsApp Marketing Utama (62...)</label>
                                <Input
                                    value={generalInfo.whatsapp}
                                    onChange={(e) => setGeneralInfo({ ...generalInfo, whatsapp: e.target.value.replace(/\D/g, '') })}
                                    placeholder="6281234567890"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'vismis' && (
                    <Card className="border-gray-200 shadow-sm">
                        <CardContent className="p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Visi & Misi</h3>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Visi</label>
                                <textarea
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    rows="3"
                                    value={visionMission.vision}
                                    onChange={(e) => setVisionMission({ ...visionMission, vision: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Misi</label>
                                <textarea
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[180px]"
                                    rows="6"
                                    value={visionMission.mission}
                                    onChange={(e) => setVisionMission({ ...visionMission, mission: e.target.value })}
                                />
                                <p className="text-xs text-gray-400">Pisahkan setiap misi dengan baris baru.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'awards' && (
                    <Card className="border-gray-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-bold text-gray-800">Daftar Penghargaan</h3>
                                <Button size="sm" variant="outline" onClick={addAward}><FaPlus className="mr-1" /> Tambah</Button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {awards.map((award) => (
                                    <div key={award.id} className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                                        <Button
                                            variant="ghost"
                                            className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-2"
                                            onClick={() => removeAward(award.id)}
                                        >
                                            <FaTrash />
                                        </Button>
                                        <div
                                            className={`relative rounded-xl border border-dashed p-5 transition ${
                                                awardDragId === award.id
                                                    ? 'border-secondary-400 bg-secondary-100/70'
                                                    : 'border-secondary-200 bg-secondary-50/60'
                                            }`}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setAwardDragId(award.id);
                                            }}
                                            onDragLeave={() => setAwardDragId(null)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setAwardDragId(null);
                                                const file = e.dataTransfer.files?.[0];
                                                handleAwardFile(award.id, file);
                                            }}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    handleAwardFile(award.id, file);
                                                }}
                                            />
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="h-14 w-14 rounded-2xl bg-white text-primary-600 flex items-center justify-center shadow-sm overflow-hidden">
                                                    {award.preview || award.image ? (
                                                        <img
                                                            src={award.preview || resolveImage(award.image)}
                                                            alt="Award"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <FaImage className="text-xl" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-primary-900">Klik atau drop untuk upload foto penghargaan</p>
                                                    <p className="text-xs text-gray-500">Format: JPG, PNG (Max 5MB)</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                value={award.title}
                                                onChange={(e) => updateAward(award.id, 'title', e.target.value)}
                                                placeholder="Judul Penghargaan"
                                            />
                                            <Input
                                                value={award.desc}
                                                onChange={(e) => updateAward(award.id, 'desc', e.target.value)}
                                                placeholder="Deskripsi Penghargaan"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {awards.length === 0 && <p className="text-gray-400 text-sm italic">Belum ada data penghargaan.</p>}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'team' && (
                    <Card className="border-gray-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-bold text-gray-800">Struktur Organisasi</h3>
                                <Button size="sm" variant="outline" onClick={addTeamMember}><FaPlus className="mr-1" /> Tambah</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {team.map((member) => (
                                    <div key={member.id} className="border border-gray-200 rounded-xl p-4 bg-white relative group shadow-sm space-y-3">
                                        <div
                                            className={`relative rounded-xl border border-dashed p-5 transition ${
                                                teamDragId === member.id
                                                    ? 'border-secondary-400 bg-secondary-100/70'
                                                    : 'border-secondary-200 bg-secondary-50/60'
                                            }`}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setTeamDragId(member.id);
                                            }}
                                            onDragLeave={() => setTeamDragId(null)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setTeamDragId(null);
                                                const file = e.dataTransfer.files?.[0];
                                                handleTeamFile(member.id, file);
                                            }}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    handleTeamFile(member.id, file);
                                                }}
                                            />
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="h-14 w-14 rounded-2xl bg-white text-primary-600 flex items-center justify-center shadow-sm overflow-hidden">
                                                    {member.preview || member.image ? (
                                                        <img
                                                            src={member.preview || resolveImage(member.image)}
                                                            alt={member.name || 'Team'}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <FaImage className="text-xl" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-primary-900">Klik atau drop untuk upload foto anggota</p>
                                                    <p className="text-xs text-gray-500">Format: JPG, PNG (Max 5MB)</p>
                                                </div>
                                            </div>
                                        </div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Nama</label>
                                        <Input
                                            value={member.name}
                                            onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                                            placeholder="Contoh: Ahmad Fauzi"
                                            className="mt-1"
                                        />
                                        <label className="mt-3 text-xs font-semibold text-gray-500 uppercase">Jabatan</label>
                                        <Input
                                            value={member.role}
                                            onChange={(e) => updateTeamMember(member.id, 'role', e.target.value)}
                                            placeholder="Contoh: CEO"
                                            className="mt-1"
                                        />
                                        <button
                                            onClick={() => removeTeamMember(member.id)}
                                            className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
