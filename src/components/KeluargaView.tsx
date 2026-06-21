/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Home, 
  User, 
  MapPin, 
  Map, 
  Users, 
  X,
  FileSpreadsheet,
  Info
} from "lucide-react";
import { User as UserType, Keluarga, Penduduk } from "../types";
import { db, getCartoonAvatar } from "../db/mockSupabase";

interface KeluargaViewProps {
  currentUser: UserType;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function KeluargaView({ currentUser, addToast }: KeluargaViewProps) {
  const [kkList, setKkList] = useState<Keluarga[]>([]);
  const [pendudukList, setPendudukList] = useState<Penduduk[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRw, setFilterRw] = useState("");
  const [filterRt, setFilterRt] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [noKk, setNoKk] = useState("");
  const [kepalaKeluargaNama, setKepalaKeluargaNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [rw, setRw] = useState("");
  const [rt, setRt] = useState("");

  // Detailed Modal view state
  const [selectedKk, setSelectedKk] = useState<Keluarga | null>(null);
  const [selectedKkMembers, setSelectedKkMembers] = useState<Penduduk[]>([]);

  // Custom Confirmation Modal state to bypass browser window.confirm constraints inside sandboxed iframes
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const data = await db.getKeluarga(currentUser);
      const citizens = await db.getPenduduk(currentUser);
      setKkList(data);
      setPendudukList(citizens);
    } catch (err: any) {
      addToast("Gagal memuat data KK: " + err.message, "error");
    }
  };

  // Preset location fields based on operator role (auto-filling as UX boost)
  const openInsertForm = () => {
    setEditingId(null);
    setNoKk("");
    setKepalaKeluargaNama("");
    setAlamat("");
    
    // Auto populate RT / RW limits
    const dynamicRwList = Array.from(new Set([...db.getRwList(), "01", "02"])).sort((a,b) => a.localeCompare(b));
    const defaultRw = dynamicRwList[0] || "01";
    const dynamicRtList = Array.from(new Set([...db.getRtList(currentUser.rw || defaultRw), "01", "02", "03"])).sort((a,b) => a.localeCompare(b));
    const defaultRt = dynamicRtList[0] || "01";

    if (currentUser.role === "KETUA_RT") {
      setRw(currentUser.rw || defaultRw);
      setRt(currentUser.rt || defaultRt);
    } else if (currentUser.role === "KETUA_RW") {
      setRw(currentUser.rw || defaultRw);
      setRt(defaultRt);
    } else {
      setRw(defaultRw);
      setRt(defaultRt);
    }
    
    setIsFormOpen(true);
  };

  const handleEdit = (kk: Keluarga) => {
    setEditingId(kk.id);
    setNoKk(kk.noKk);
    setKepalaKeluargaNama(kk.kepalaKeluargaNama);
    setAlamat(kk.alamat);
    setRw(kk.rw);
    setRt(kk.rt);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Hapus Kartu Keluarga",
      message: "Apakah Anda yakin ingin menghapus data Kartu Keluarga ini secara permanen?",
      onConfirm: async () => {
        try {
          const success = await db.deleteKeluarga(id, currentUser);
          if (success) {
            addToast("Kartu Keluarga berhasil dihapus dari arsip.", "success");
            fetchData();
          } else {
            addToast("Kartu Keluarga tidak ditemukan atau gagal dihapus.", "warning");
          }
        } catch (err: any) {
          addToast(err.message || "Gagal menghapus Kartu Keluarga.", "error");
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (noKk.length !== 16 || !/^\d+$/.test(noKk)) {
      addToast("Nomor KK harus berupa 16 digit angka!", "warning");
      return;
    }

    if (!kepalaKeluargaNama.trim() || !alamat.trim() || !rw.trim() || !rt.trim()) {
      addToast("Harap isi semua field formulir!", "warning");
      return;
    }

    // Prepare payload
    const payload = {
      noKk,
      kepalaKeluargaId: "", // will reference dynamic penduduk key when linked later
      kepalaKeluargaNama: kepalaKeluargaNama.trim(),
      alamat: alamat.trim(),
      rw: rw.padStart(2, "0"),
      rt: rt.padStart(2, "0")
    };

    try {
      if (editingId) {
        await db.updateKeluarga(editingId, payload, currentUser);
        addToast("Sistem memperbarui Kartu Keluarga dengan sukses.", "success");
      } else {
        // Check for duplicates
        const duplicated = kkList.some(k => k.noKk === noKk);
        if (duplicated) {
          addToast("Nomor KK sudah terdaftar di sistem!", "error");
          return;
        }
        await db.insertKeluarga(payload, currentUser);
        addToast("Kartu Keluarga baru berhasil didaftarkan.", "success");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Gagal menyimpan data KK.", "error");
    }
  };

  // Detail Modal Handler
  const showDetailModal = (kk: Keluarga) => {
    setSelectedKk(kk);
    // Find all residents referencing this No KK
    const members = pendudukList.filter(p => p.noKk === kk.noKk);
    setSelectedKkMembers(members);
  };

  // Compute filtering lists
  const filteredKk = kkList.filter(kk => {
    const matchesSearch = 
      kk.noKk.includes(searchQuery) || 
      kk.kepalaKeluargaNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kk.alamat.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRw = filterRw === "" || kk.rw === filterRw;
    const matchesRt = filterRt === "" || kk.rt === filterRt;

    return matchesSearch && matchesRw && matchesRt;
  });

  // Calculate pages
  const totalPages = Math.ceil(filteredKk.length / itemsPerPage) || 1;
  const paginatedKk = filteredKk.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Collect unique RWs and RTs under current list for filters
  const uniqueRws = Array.from(new Set(kkList.map(k => k.rw))).sort();
  const uniqueRts = Array.from(new Set(kkList.map(k => k.rt))).sort();

  return (
    <div className="space-y-6">
      
      {/* Header card with action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-500" /> Data Keluarga (KK)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Mengelola arsip Kartu Keluarga penduduk Desa Wargaluyu.</p>
        </div>
        
        <button
          id="btn-add-kk"
          onClick={openInsertForm}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Registrasi KK Baru
        </button>
      </div>

      {/* FILTERBAR ROW */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row gap-3">
        
        {/* Text Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-kk"
            type="text"
            placeholder="Cari berdasarkan No KK, Kepala Keluarga, atau alamat..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs transition-all font-medium"
          />
        </div>

        {/* Dropdown filter options */}
        <div className="flex flex-wrap md:flex-nowrap gap-2 shrink-0">
          
          {/* RW Filter */}
          {currentUser.role === "ADMIN_DESA" && (
            <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 shrink-0">RW:</span>
              <select
                value={filterRw}
                onChange={(e) => {
                  setFilterRw(e.target.value);
                  setFilterRt("");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none pr-1 select-none"
              >
                <option value="">Semua RW</option>
                {Array.from(new Set([...db.getRwList(), "01", "02"])).sort((a,b) => a.localeCompare(b)).map(rwNum => (
                  <option key={rwNum} value={rwNum}>RW {rwNum}</option>
                ))}
              </select>
            </div>
          )}

          {/* RT Filter */}
          {currentUser.role !== "KETUA_RT" && (
            <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 shrink-0">RT:</span>
              <select
                value={filterRt}
                onChange={(e) => {
                  setFilterRt(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none pr-1 select-none"
              >
                <option value="">Semua RT</option>
                {Array.from(new Set([...db.getRtList(currentUser.role === "KETUA_RW" ? currentUser.rw : filterRw), "01", "02", "03"])).sort((a,b) => a.localeCompare(b)).map(rtNum => (
                  <option key={rtNum} value={rtNum}>RT {rtNum}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters action */}
          {(filterRw !== "" || filterRt !== "" || searchQuery !== "") && (
            <button
              onClick={() => {
                setFilterRw("");
                setFilterRt("");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="text-xs font-semibold px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 rounded-xl transition-all border border-rose-500/10 cursor-pointer"
            >
              Reset Filter
            </button>
          )}

        </div>

      </div>

      {/* STICKY MAIN TABLE SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/20 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3.5">Nomor KK</th>
                <th className="px-5 py-3.5">Kepala Keluarga</th>
                <th className="px-5 py-3.5">Alamat Lengkap</th>
                <th className="px-5 py-3.5 text-center">RT / RW</th>
                <th className="px-5 py-3.5 text-center">Anggota Kel.</th>
                <th className="px-5 py-3.5 text-right">Opsi Operasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedKk.length > 0 ? (
                paginatedKk.map((kk) => (
                  <tr key={kk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-slate-800 dark:text-slate-100 tracking-wider">
                      {kk.noKk}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                        {kk.kepalaKeluargaNama.charAt(0)}
                      </div>
                      {kk.kepalaKeluargaNama}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {kk.alamat}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        RT {kk.rt} / RW {kk.rw}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-mono">
                        <Users className="w-3.5 h-3.5" /> {kk.jumlahAnggota} orang
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1 shrink-0">
                      <button
                        onClick={() => showDetailModal(kk)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Detail Keluarga
                      </button>
                      <button
                        onClick={() => handleEdit(kk)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 text-slate-650 dark:text-slate-350 hover:bg-emerald-500/5 transition-all inline-flex items-center cursor-pointer"
                        title="Edit KK"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(kk.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 text-rose-500 hover:bg-rose-500/5 transition-all inline-flex items-center cursor-pointer"
                        title="Hapus KK"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 bg-slate-50/20 dark:bg-transparent">
                    <Home className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Tidak ada data Kartu Keluarga ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL FOOTER */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-450 dark:text-slate-500">
          <span>Menampilkan <strong>{Math.min(filteredKk.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredKk.length, currentPage * itemsPerPage)}</strong> dari <strong>{filteredKk.length}</strong> KK</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">Halaman {currentPage} dari {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FORM DIALOG POPUP MODAL (NOTION-LIKE SLIDE/FLOAT EFFECT) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            
            {/* Modal Heading Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/10">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-500" /> {editingId ? "Ubah Kartu Keluarga" : "Registrasi KK Baru"}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-450 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Nomor KK Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nomor Kartu Keluarga (16-Digit)</label>
                <input
                  id="form-no-kk"
                  type="text"
                  maxLength={16}
                  required
                  placeholder="3204XXXXXXXXXXXXXXXX"
                  value={noKk}
                  onChange={(e) => setNoKk(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono tracking-widest font-medium"
                />
              </div>

              {/* Kepala Keluarga Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Kepala Keluarga</label>
                <input
                  id="form-kk-nama"
                  type="text"
                  required
                  placeholder="Nama Lengkap Kepala Keluarga"
                  value={kepalaKeluargaNama}
                  onChange={(e) => setKepalaKeluargaNama(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Alamat Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alamat Rumah Lengkap</label>
                <textarea
                  id="form-kk-alamat"
                  required
                  rows={2}
                  placeholder="Nama jalan, nomor rumah, kampung, blok, dll..."
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium whitespace-pre-wrap"
                />
              </div>

              {/* Territorials grid combo */}
              <div className="grid grid-cols-2 gap-3 pb-3">
                
                {/* RW dropdown/input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RW</label>
                  {currentUser.role === "ADMIN_DESA" ? (
                    <select
                      value={rw}
                      onChange={(e) => {
                        const newRw = e.target.value;
                        setRw(newRw);
                        const dynamicRts = Array.from(new Set([...db.getRtList(newRw), "01", "02", "03"])).sort((a,b) => a.localeCompare(b));
                        if (dynamicRts.length > 0) {
                          setRt(dynamicRts[0]);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      {Array.from(new Set([...db.getRwList(), "01", "02"])).sort((a,b) => a.localeCompare(b)).map(rwNum => (
                        <option key={rwNum} value={rwNum}>{rwNum}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={rw}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/50 text-xs font-bold text-slate-500"
                    />
                  )}
                </div>

                {/* RT Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RT (Rukun Tetangga)</label>
                  {currentUser.role === "KETUA_RT" ? (
                    <input
                      type="text"
                      readOnly
                      value={rt}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/50 text-xs font-bold text-slate-500"
                    />
                  ) : (
                    <select
                      value={rt}
                      onChange={(e) => setRt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      {Array.from(new Set([...db.getRtList(currentUser.role === "KETUA_RW" ? currentUser.rw : rw), "01", "02", "03"])).sort((a,b) => a.localeCompare(b)).map(rtNum => (
                        <option key={rtNum} value={rtNum}>{rtNum}</option>
                      ))}
                    </select>
                  )}
                </div>

              </div>

              {/* RLS Informer Warning Banner */}
              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-550/10 text-[10px] text-slate-450 dark:text-slate-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Kartu Keluarga yang diregistrasi akan otomatis dikaitkan ke koordinasi wilayah pelapor sesuai kebijakan RLS PostgreSQL.</span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan KK"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL PANEL - lists family citizens detail */}
      {selectedKk && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            
            {/* Modal custom banner */}
            <div className="p-6 bg-gradient-to-br from-emerald-950 to-slate-900 text-white relative">
              <button 
                onClick={() => setSelectedKk(null)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-emerald-450 uppercase tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/20">
                Kartu Keluarga Detail
              </span>
              <h3 className="text-lg font-bold mt-2 font-mono tracking-wider">{selectedKk.noKk}</h3>
              <p className="text-xs text-slate-300 mt-1">Kepala Keluarga: <span className="font-extrabold text-white text-sm">{selectedKk.kepalaKeluargaNama}</span></p>
              
              <div className="grid grid-cols-2 mt-4 pt-4 border-t border-white/10 gap-2 text-xs md:flex md:gap-6">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">RT / RW</span>
                  <span className="font-bold text-slate-200">RT {selectedKk.rt} / RW {selectedKk.rw}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Pemerintah Wilayah</span>
                  <span className="font-bold text-slate-200 font-sans">Kec. Arjasari, Kab. Bandung</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Alamat Rumah</span>
                  <span className="font-bold text-slate-200 truncate whitespace-nowrap block max-w-[170px]" title={selectedKk.alamat}>{selectedKk.alamat}</span>
                </div>
              </div>
            </div>

            {/* List of members */}
            <div className="p-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" /> Anggota Keluarga Terdaftar ({selectedKkMembers.length})
              </h4>
              
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {selectedKkMembers.length > 0 ? (
                  selectedKkMembers.map((member) => (
                    <div key={member.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-slate-200/50 dark:border-slate-700/50 bg-slate-100/50 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden text-emerald-600">
                        <img src={getCartoonAvatar(member.jenisKelamin, member.tanggalLahir, member.namaLengkap)} alt="Avatar" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{member.namaLengkap}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-450 rounded font-mono shrink-0">
                            {member.statusHubungan}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">NIK: {member.nik} • {member.pekerjaan}</p>
                      </div>
                      <div className="text-right text-[11px] font-mono font-semibold shrink-0">
                        <span className={`px-1.5 py-0.2 rounded ${member.jenisKelamin === "L" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                          {member.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </span>
                        <p className="text-[9px] text-slate-450 mt-1">U-{(new Date().getFullYear() - new Date(member.tanggalLahir).getFullYear())} thn</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    Belum ada anggota keluarga yang terkait dengan nomor KK ini.<br />
                    <span className="text-[10px] text-slate-400 mt-1 block">Silakan registrasikan penduduk baru dengan No. KK ini di menu Data Penduduk.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Inner action footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 text-right">
              <button
                onClick={() => setSelectedKk(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
