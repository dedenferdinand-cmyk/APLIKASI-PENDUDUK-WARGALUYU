/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Truck, 
  Search, 
  Plus, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ArrowRightLeft,
  Calendar,
  Layers,
  MapPin,
  HelpCircle
} from "lucide-react";
import { User, Mutasi, TipeMutasi } from "../types";
import { db } from "../db/mockSupabase";

interface MutasiViewProps {
  currentUser: User;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function MutasiView({ currentUser, addToast }: MutasiViewProps) {
  const [mutasiList, setMutasiList] = useState<Mutasi[]>([]);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRw, setFilterRw] = useState("");
  const [filterRt, setFilterRt] = useState("");
  const [filterJenis, setFilterJenis] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [jenisMutasi, setJenisMutasi] = useState<TipeMutasi>("Datang");
  const [nik, setNik] = useState("");
  const [nama, setNama] = useState("");
  const [alamatAsal, setAlamatAsal] = useState("");
  const [alamatTujuan, setAlamatTujuan] = useState("");
  const [tanggalMutasi, setTanggalMutasi] = useState("");
  const [rw, setRw] = useState("");
  const [rt, setRt] = useState("");

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
      const data = await db.getMutasi(currentUser);
      setMutasiList(data);
    } catch (err: any) {
      addToast("Gagal memuat log mutasi: " + err.message, "error");
    }
  };

  const openInsertForm = () => {
    setJenisMutasi("Datang");
    setNik("");
    setNama("");
    setAlamatAsal("");
    setAlamatTujuan("");
    setTanggalMutasi(new Date().toISOString().split("T")[0]);
    
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

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Hapus Mutasi",
      message: "Apakah Anda yakin ingin menghapus catatan mutasi kependudukan warga ini secara permanen?",
      onConfirm: async () => {
        try {
          const success = await db.deleteMutasi(id, currentUser);
          if (success) {
            addToast("Catatan mutasi berhasil dihapus dari arsip.", "success");
            fetchData();
          } else {
            addToast("Catatan mutasi tidak ditemukan atau gagal dihapus.", "warning");
          }
        } catch (err: any) {
          addToast(err.message || "Gagal menghapus catatan.", "error");
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      addToast("NIK warga mutasi wajib 16 digit angka!", "warning");
      return;
    }

    if (!nama.trim() || !alamatAsal.trim() || !alamatTujuan.trim() || !tanggalMutasi) {
      addToast("Harap isi seluruh field formulir!", "warning");
      return;
    }

    const payload = {
      jenisMutasi,
      nik,
      nama: nama.trim(),
      alamatAsal: alamatAsal.trim(),
      alamatTujuan: alamatTujuan.trim(),
      tanggalMutasi,
      rw: rw.padStart(2, "0"),
      rt: rt.padStart(2, "0")
    };

    try {
      await db.insertMutasi(payload, currentUser);
      addToast(`Log mutasi [${jenisMutasi}] warga ${nama} sukses disimpan.`, "success");
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Gagal menyimpan log mutasi.", "error");
    }
  };

  // Filter application
  const filteredList = mutasiList.filter(m => {
    const matchesSearch = 
      m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nik.includes(searchQuery) ||
      m.alamatAsal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.alamatTujuan.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRw = filterRw === "" || m.rw === filterRw;
    const matchesRt = filterRt === "" || m.rt === filterRt;
    const matchesJenis = filterJenis === "" || m.jenisMutasi === filterJenis;

    return matchesSearch && matchesRw && matchesRt && matchesJenis;
  });

  // Pages
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Title Hero Header Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-500" /> Mutasi Penduduk (Masuk & Keluar)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Mengawasi perpindahan penduduk dari dan ke lingkungan Desa Wargaluyu.</p>
        </div>

        <button
          id="btn-add-mutasi"
          onClick={openInsertForm}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Registrasi Mutasi Warga
        </button>
      </div>

      {/* FILTERBAR ROW */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row gap-3">
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-mutasi"
            type="text"
            placeholder="Cari berdasarkan nama, NIK, alamat asal atau tujuan..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-850 dark:text-slate-100 placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-2 shrink-0">
          
          <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-810 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">Mutasi:</span>
            <select
              value={filterJenis}
              onChange={(e) => {
                setFilterJenis(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-705 dark:text-slate-200 focus:outline-none"
            >
              <option value="">Semua Jenis</option>
              <option value="Datang">Datang / Masuk</option>
              <option value="Pindah">Pindah / Keluar</option>
            </select>
          </div>

          {currentUser.role === "ADMIN_DESA" && (
            <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-810 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">RW:</span>
              <select
                value={filterRw}
                onChange={(e) => {
                  setFilterRw(e.target.value);
                  setFilterRt("");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-705 dark:text-slate-200 focus:outline-none"
              >
                <option value="">Semua RW</option>
                {Array.from(new Set([...db.getRwList(), "01", "02"])).sort((a,b) => a.localeCompare(b)).map(rwNum => (
                  <option key={rwNum} value={rwNum}>RW {rwNum}</option>
                ))}
              </select>
            </div>
          )}

          {currentUser.role !== "KETUA_RT" && (
            <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-810 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">RT:</span>
              <select
                value={filterRt}
                onChange={(e) => {
                  setFilterRt(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-705 dark:text-slate-200 focus:outline-none"
              >
                <option value="">Semua RT</option>
                {Array.from(new Set([...db.getRtList(currentUser.role === "KETUA_RW" ? currentUser.rw : filterRw), "01", "02", "03"])).sort((a,b) => a.localeCompare(b)).map(rtNum => (
                  <option key={rtNum} value={rtNum}>RT {rtNum}</option>
                ))}
              </select>
            </div>
          )}

        </div>

      </div>

      {/* MUTATION DATABASE TABLE BOX */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-55/70 dark:bg-slate-955/20 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3.5">Jenis Mutasi</th>
                <th className="px-5 py-3.5">Nama Warga</th>
                <th className="px-5 py-3.5">Nomor NIK KTP</th>
                <th className="px-5 py-3.5">Asal Pengiriman</th>
                <th className="px-5 py-3.5">Tujuan Transfer</th>
                <th className="px-5 py-3.5 text-center">Tanggal Pindah</th>
                <th className="px-5 py-3.5 text-center">RT / RW</th>
                <th className="px-5 py-3.5 text-right font-bold text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedList.length > 0 ? (
                paginatedList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        m.jenisMutasi === "Datang" 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}>
                        <ArrowRightLeft className="w-3 h-3" />
                        {m.jenisMutasi === "Datang" ? "Masuk / Datang" : "Keluar / Pindah"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-150">
                      {m.nama}
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-slate-500 dark:text-slate-450 tracking-wider">
                      {m.nik}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 max-w-[130px] truncate" title={m.alamatAsal}>
                      {m.alamatAsal}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 max-w-[130px] truncate" title={m.alamatTujuan}>
                      {m.alamatTujuan}
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-slate-655 dark:text-slate-350">
                      {new Date(m.tanggalMutasi).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-450 font-bold">
                        RT {m.rt} / RW {m.rw}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:border-rose-500/30 text-rose-500 hover:bg-rose-500/5 transition-colors cursor-pointer inline-flex items-center"
                        title="Hapus log mutasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <Truck className="w-10 h-10 mx-auto text-slate-350 mb-2" />
                    Belum ada riwayat mutasi domisili warga.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL FOOTER */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-805/80 flex items-center justify-between text-xs text-slate-450 dark:text-slate-500">
          <span>Menampilkan <strong>{Math.min(filteredList.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredList.length, currentPage * itemsPerPage)}</strong> dari <strong>{filteredList.length}</strong> mutasi</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-105"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold font-mono">Halaman {currentPage} dari {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-805 disabled:opacity-40 hover:bg-slate-105"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FORM DIALOG POPUP MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/10">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-500 animate-pulse" /> Pendaftaran Mutasi Penduduk
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-450 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jenis Mutasi Wilayah</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setJenisMutasi("Datang")}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      jenisMutasi === "Datang" 
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                        : "border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/15"
                    }`}
                  >
                    Warga Datang / Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenisMutasi("Pindah")}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      jenisMutasi === "Pindah" 
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                        : "border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/15"
                    }`}
                  >
                    Warga Pindah / Keluar
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nomor NIK KTP Warga (16 Digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  required
                  placeholder="3204XXXXXXXXXXXXXXXX"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs font-mono tracking-wider text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Lengkap Kepala Mutasi</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap warga terkait"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alamat Tempat Asal</label>
                <input
                  type="text"
                  required
                  placeholder="Kota asal / RT / RW lama..."
                  value={alamatAsal}
                  onChange={(e) => setAlamatAsal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alamat Tempat Tujuan baru</label>
                <input
                  type="text"
                  required
                  placeholder="Nama jalan / Kampung Wargaluyu rt..."
                  value={alamatTujuan}
                  onChange={(e) => setAlamatTujuan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Pengurusan Mutasi</label>
                  <input
                    type="date"
                    required
                    value={tanggalMutasi}
                    onChange={(e) => setTanggalMutasi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RT / RW</label>
                  <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/50 text-xs font-bold text-center text-slate-450 dark:text-slate-400 self-center mt-0.5">
                    {rt}/{rw}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-450 dark:text-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Simpan Catatan Mutasi
                </button>
              </div>

            </form>
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
