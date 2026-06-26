/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  Calendar,
  Phone,
  Bookmark,
  GraduationCap,
  Briefcase,
  Layers,
  Heart,
  Globe2,
  MapPin,
  Contact
} from "lucide-react";
import { User as UserType, Penduduk, Keluarga } from "../types";
import { db, hitungUmur, getCartoonAvatar } from "../db/mockSupabase";

interface PendudukViewProps {
  currentUser: UserType;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function PendudukView({ currentUser, addToast }: PendudukViewProps) {
  const [pendudukList, setPendudukList] = useState<Penduduk[]>([]);
  const [kkList, setKkList] = useState<Keluarga[]>([]);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRw, setFilterRw] = useState("");
  const [filterRt, setFilterRt] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUsia, setFilterUsia] = useState(""); // Category: Bayi, Anak, Remaja, Dewasa, Lansia
  const [filterPendidikan, setFilterPendidikan] = useState("");
  const [filterPekerjaan, setFilterPekerjaan] = useState("");
  const [filterUmurMin, setFilterUmurMin] = useState("");
  const [filterUmurMax, setFilterUmurMax] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 15 Form Fields
  const [nik, setNik] = useState("");
  const [noKk, setNoKk] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P">("L");
  const [agama, setAgama] = useState("Islam");
  const [pendidikan, setPendidikan] = useState("SLTA / Sederajat");
  const [pekerjaan, setPekerjaan] = useState("Karyawan Swasta");
  const [statusPerkawinan, setStatusPerkawinan] = useState("Belum Kawin");
  const [statusHubungan, setStatusHubungan] = useState("Anak");
  const [kewarganegaraan, setKewarganegaraan] = useState<"WNI" | "WNA">("WNI");
  const [noHp, setNoHp] = useState("");
  const [statusTinggal, setStatusTinggal] = useState<"Tetap" | "Kontrak" | "Sementara">("Tetap");
  const [rw, setRw] = useState("");
  const [rt, setRt] = useState("");
  const [isDisabilitas, setIsDisabilitas] = useState(false);
  const [jenisDisabilitas, setJenisDisabilitas] = useState("");

  // Citizen Detail Modal state
  const [selectedPenduduk, setSelectedPenduduk] = useState<Penduduk | null>(null);

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

    const handleSync = () => {
      fetchData();
    };
    window.addEventListener("sipenduk-db-updated", handleSync);
    return () => {
      window.removeEventListener("sipenduk-db-updated", handleSync);
    };
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const pData = await db.getPenduduk(currentUser);
      const kkData = await db.getKeluarga(currentUser);
      setPendudukList(pData);
      setKkList(kkData);
    } catch (err: any) {
      addToast("Gagal memuat data penduduk: " + err.message, "error");
    }
  };

  const openInsertForm = () => {
    setEditingId(null);
    setNik("");
    setNoKk(kkList[0]?.noKk || "");
    setNamaLengkap("");
    setTempatLahir("");
    setTanggalLahir("2000-01-01");
    setJenisKelamin("L");
    setAgama("Islam");
    setPendidikan("SLTA / Sederajat");
    setPekerjaan("Karyawan Swasta");
    setStatusPerkawinan("Belum Kawin");
    setStatusHubungan("Anak");
    setKewarganegaraan("WNI");
    setNoHp("");
    setStatusTinggal("Tetap");
    setIsDisabilitas(false);
    setJenisDisabilitas("");
    
    // territorial locks based on operator credentials
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

  const handleEdit = (p: Penduduk) => {
    setEditingId(p.id);
    setNik(p.nik);
    setNoKk(p.noKk);
    setNamaLengkap(p.namaLengkap);
    setTempatLahir(p.tempatLahir);
    setTanggalLahir(p.tanggalLahir);
    setJenisKelamin(p.jenisKelamin);
    setAgama(p.agama);
    setPendidikan(p.pendidikan);
    setPekerjaan(p.pekerjaan);
    setStatusPerkawinan(p.statusPerkawinan);
    setStatusHubungan(p.statusHubungan);
    setKewarganegaraan(p.kewarganegaraan);
    setNoHp(p.noHp);
    setStatusTinggal(p.statusTinggal);
    setRw(p.rw);
    setRt(p.rt);
    setIsDisabilitas(!!p.isDisabilitas);
    setJenisDisabilitas(p.jenisDisabilitas || "");
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Hapus Penduduk",
      message: "Apakah Anda yakin ingin menghapus arsip data penduduk ini secara permanen?",
      onConfirm: async () => {
        try {
          const success = await db.deletePenduduk(id, currentUser);
          if (success) {
            addToast("Data penduduk berhasil dihapus.", "success");
            fetchData();
          } else {
            addToast("Data penduduk tidak ditemukan.", "warning");
          }
        } catch (err: any) {
          addToast(err.message || "Gagal menghapus data penduduk.", "error");
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      addToast("NIK harus berupa 16 digit angka!", "warning");
      return;
    }

    if (noKk.length !== 16 || !/^\d+$/.test(noKk)) {
      addToast("Nomor KK terkait harus 16 digit angka!", "warning");
      return;
    }

    if (!namaLengkap.trim() || !tempatLahir.trim() || !tanggalLahir) {
      addToast("Mohon lengkapi seluruh kolom formulir!", "warning");
      return;
    }

    const payload = {
      nik,
      noKk,
      namaLengkap: namaLengkap.trim(),
      tempatLahir: tempatLahir.trim(),
      tanggalLahir,
      jenisKelamin,
      agama,
      pendidikan,
      pekerjaan,
      statusPerkawinan,
      statusHubungan,
      kewarganegaraan,
      noHp: noHp.trim(),
      statusTinggal,
      rw: rw.padStart(2, "0"),
      rt: rt.padStart(2, "0"),
      isDisabilitas,
      jenisDisabilitas: isDisabilitas ? jenisDisabilitas : "",
      avatar: getCartoonAvatar(jenisKelamin, tanggalLahir, namaLengkap)
    };

    try {
      if (editingId) {
        await db.updatePenduduk(editingId, payload, currentUser);
        addToast("Informasi kependudukan warga berhasil diperbarui.", "success");
      } else {
        // Prevent duplicate NIKs
        const duplicates = pendudukList.some(p => p.nik === nik);
        if (duplicates) {
          addToast("NIK yang Anda masukkan sudah terregistrasi!", "error");
          return;
        }
        await db.insertPenduduk(payload, currentUser);
        addToast("Warga baru berhasil didaftarkan ke dalam sistem database.", "success");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Gagal menyimpan rincian kependudukan.", "error");
    }
  };

  // Real-time double filter search rule (NIK, Name, or Occupation)
  const filteredPenduduk = pendudukList.filter(p => {
    const age = hitungUmur(p.tanggalLahir);

    const matchesSearch = 
      p.nik.includes(searchQuery) ||
      p.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pekerjaan.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRw = filterRw === "" || p.rw === filterRw;
    const matchesRt = filterRt === "" || p.rt === filterRt;
    const matchesStatus = filterStatus === "" || p.statusTinggal === filterStatus;

    // Filter Usia (Kategori)
    let matchesUsia = true;
    if (filterUsia === "bayi") {
      matchesUsia = age <= 2;
    } else if (filterUsia === "anak") {
      matchesUsia = age > 2 && age <= 12;
    } else if (filterUsia === "remaja") {
      matchesUsia = age >= 13 && age <= 17;
    } else if (filterUsia === "dewasa") {
      matchesUsia = age >= 18 && age <= 59;
    } else if (filterUsia === "lansia") {
      matchesUsia = age >= 60;
    }

    // Filter Pendidikan
    const matchesPendidikan = filterPendidikan === "" || p.pendidikan === filterPendidikan;

    // Filter Pekerjaan
    const matchesPekerjaan = filterPekerjaan === "" || p.pekerjaan === filterPekerjaan;

    // Filter Umur Eksak Range
    let matchesUmurMin = true;
    if (filterUmurMin !== "") {
      const minVal = parseInt(filterUmurMin, 10);
      if (!isNaN(minVal)) {
        matchesUmurMin = age >= minVal;
      }
    }

    let matchesUmurMax = true;
    if (filterUmurMax !== "") {
      const maxVal = parseInt(filterUmurMax, 10);
      if (!isNaN(maxVal)) {
        matchesUmurMax = age <= maxVal;
      }
    }

    return matchesSearch && matchesRw && matchesRt && matchesStatus && matchesUsia && matchesPendidikan && matchesPekerjaan && matchesUmurMin && matchesUmurMax;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredPenduduk.length / itemsPerPage) || 1;
  const paginatedPenduduk = filteredPenduduk.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Title Hero Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" /> Data Kependudukan Aktif
          </h2>
          <p className="text-xs text-slate-400 mt-1">Mengelola draf informasi seluruh warga desa Wargaluyu.</p>
        </div>

        <button
          id="btn-add-penduduk"
          onClick={openInsertForm}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Registrasi Penduduk Baru
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-3">
        
        {/* Row 1: Search and exact Age range */}
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Real-time search query search-input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-penduduk"
              type="text"
              placeholder="Cari warga berdasarkan Nama Lengkap, NIK, Pekerjaan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs transition-all font-medium"
            />
          </div>

          {/* Min & Max Age Filter Inputs */}
          <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1.5 border border-slate-200 dark:border-slate-805 rounded-xl shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">Rentang Umur:</span>
            <input
              type="number"
              min="0"
              max="150"
              placeholder="Min"
              value={filterUmurMin}
              onChange={(e) => {
                setFilterUmurMin(e.target.value);
                setCurrentPage(1);
              }}
              className="w-12 bg-white dark:bg-slate-900 px-1.5 py-0.5 border border-slate-205 dark:border-slate-800 rounded text-xs text-center focus:outline-none font-bold text-slate-800 dark:text-slate-100"
            />
            <span className="text-slate-400 text-xs">s/d</span>
            <input
              type="number"
              min="0"
              max="150"
              placeholder="Max"
              value={filterUmurMax}
              onChange={(e) => {
                setFilterUmurMax(e.target.value);
                setCurrentPage(1);
              }}
              className="w-12 bg-white dark:bg-slate-900 px-1.5 py-0.5 border border-slate-205 dark:border-slate-800 rounded text-xs text-center focus:outline-none font-bold text-slate-800 dark:text-slate-100"
            />
            <span className="text-slate-450 dark:text-slate-500 text-[10px] font-bold">Thn</span>
          </div>

        </div>

        {/* Row 2: Categorical Dropdowns */}
        <div className="flex flex-wrap gap-2 items-center">
          
          {/* RW dropdown */}
          {currentUser.role === "ADMIN_DESA" && (
            <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">RW:</span>
              <select
                value={filterRw}
                onChange={(e) => {
                  setFilterRw(e.target.value);
                  setFilterRt("");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-750 dark:text-slate-200 focus:outline-none pr-1 select-none"
              >
                <option value="">Semua RW</option>
                {Array.from(new Set([...db.getRwList(), "01", "02"])).sort((a,b) => a.localeCompare(b)).map(rwNum => (
                  <option key={rwNum} value={rwNum}>RW {rwNum}</option>
                ))}
              </select>
            </div>
          )}

          {/* RT dropdown */}
          {currentUser.role !== "KETUA_RT" && (
            <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">RT:</span>
              <select
                value={filterRt}
                onChange={(e) => {
                  setFilterRt(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-750 dark:text-slate-200 focus:outline-none pr-1 select-none"
              >
                <option value="">Semua RT</option>
                {Array.from(new Set([...db.getRtList(currentUser.role === "KETUA_RW" ? currentUser.rw : filterRw), "01", "02", "03"])).sort((a,b) => a.localeCompare(b)).map(rtNum => (
                  <option key={rtNum} value={rtNum}>RT {rtNum}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tinggal Type filter */}
          <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">Hunian:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-750 dark:text-slate-200 focus:outline-none pr-1 select-none"
            >
              <option value="">Semua Status</option>
              <option value="Tetap">Tetap</option>
              <option value="Kontrak">Kontrak</option>
              <option value="Sementara">Sementara</option>
            </select>
          </div>

          {/* Kategori Usia filter */}
          <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">Usia:</span>
            <select
              value={filterUsia}
              onChange={(e) => {
                setFilterUsia(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-750 dark:text-slate-200 focus:outline-none pr-1 select-none"
            >
              <option value="">Semua Kategori</option>
              <option value="bayi">Bayi (0 - 2 thn)</option>
              <option value="anak">Anak-anak (3 - 12 thn)</option>
              <option value="remaja">Remaja (13 - 17 thn)</option>
              <option value="dewasa">Dewasa (18 - 59 thn)</option>
              <option value="lansia">Lansia (≥ 60 thn)</option>
            </select>
          </div>

          {/* Pendidikan filter */}
          <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">Pendidikan:</span>
            <select
              value={filterPendidikan}
              onChange={(e) => {
                setFilterPendidikan(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-750 dark:text-slate-200 focus:outline-none pr-1 select-none"
            >
              <option value="">Semua Tingkat</option>
              <option value="Tidak / Belum Sekolah">Tidak / Belum Sekolah</option>
              <option value="Belum Tamat SD / Sederajat">Belum Tamat SD</option>
              <option value="Tamat SD / Sederajat">Tamat SD / Sederajat</option>
              <option value="SLTP / Sederajat">SLTP / Sederajat (SMP)</option>
              <option value="SLTA / Sederajat">SLTA / Sederajat (SMA/SMK)</option>
              <option value="Diploma I / II">Diploma I / II</option>
              <option value="Diploma III">Diploma III</option>
              <option value="Diploma IV / Strata I">Strata I (S1)</option>
              <option value="Strata II">Strata II (S2)</option>
              <option value="Strata III">Strata III (S3)</option>
            </select>
          </div>

          {/* Pekerjaan filter */}
          <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">Pekerjaan:</span>
            <select
              value={filterPekerjaan}
              onChange={(e) => {
                setFilterPekerjaan(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-750 dark:text-slate-200 focus:outline-none pr-1 select-none"
            >
              <option value="">Semua Pekerjaan</option>
              <option value="BELUM/TIDAK BEKERJA">BELUM/TIDAK BEKERJA</option>
              <option value="MENGURUS RUMAH TANGGA">MENGURUS RUMAH TANGGA</option>
              <option value="PELAJAR/MAHASISWA">PELAJAR/MAHASISWA</option>
              <option value="PENSIUNAN">PENSIUNAN</option>
              <option value="PEGAWAI NEGERI SIPIL">PNS</option>
              <option value="TENTARA NASIONAL INDONESIA">TNI</option>
              <option value="KEPOLISIAN RI">POLRI</option>
              <option value="KARYAWAN SWASTA">KARYAWAN SWASTA</option>
              <option value="KARYAWAN BUMN">KARYAWAN BUMN</option>
              <option value="KARYAWAN BUMD">KARYAWAN BUMD</option>
              <option value="BURUH HARIAN LEPAS">BURUH HARIAN LEPAS</option>
              <option value="PETANI/PEKEBUN">PETANI/PEKEBUN</option>
              <option value="PETERNAK">PETERNAK</option>
              <option value="NELAYAN/PERIKANAN">NELAYAN/PERIKANAN</option>
              <option value="PEDAGANG">PEDAGANG</option>
              <option value="WIRASWASTA">WIRASWASTA</option>
              <option value="GURU / DOSEN">GURU / DOSEN</option>
              <option value="MEDIK / DOKTER / BIDAN">MEDIK/DOKTER/BIDAN</option>
              <option value="KONSTRUKSI">KONSTRUKSI</option>
              <option value="SENIMAN">SENIMAN</option>
              <option value="LAINNYA">LAINNYA</option>
            </select>
          </div>

          {/* Reset button */}
          {(filterRw !== "" || filterRt !== "" || filterStatus !== "" || filterUsia !== "" || filterPendidikan !== "" || filterPekerjaan !== "" || filterUmurMin !== "" || filterUmurMax !== "") && (
            <button
              onClick={() => {
                setFilterRw("");
                setFilterRt("");
                setFilterStatus("");
                setFilterUsia("");
                setFilterPendidikan("");
                setFilterPekerjaan("");
                setFilterUmurMin("");
                setFilterUmurMax("");
                setCurrentPage(1);
              }}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-550 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 p-1.5 py-1 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer select-none"
            >
              RESET FILTER
            </button>
          )}

        </div>

      </div>

      {/* TABLE AND GRID COMBINED VIEW FOR PREMIUM RESPONSIVENESS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-55/70 dark:bg-slate-955/20 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3.5">Warga</th>
                <th className="px-5 py-3.5">Nomor NIK (KTP ID)</th>
                <th className="px-5 py-3.5 text-center">J/K</th>
                <th className="px-5 py-3.5 text-center">Umur (Automated)</th>
                <th className="px-5 py-3.5">Pekerjaan Utama</th>
                <th className="px-5 py-3.5 text-center">Wilayah RT/RW</th>
                <th className="px-5 py-3.5 text-right">Opsi Operasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedPenduduk.length > 0 ? (
                paginatedPenduduk.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                    
                    {/* Warga Column */}
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-slate-200/50 dark:border-slate-700/50 bg-slate-100/50 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden text-emerald-600">
                          <img src={getCartoonAvatar(p.jenisKelamin, p.tanggalLahir, p.namaLengkap)} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-500 transition-colors cursor-pointer" onClick={() => setSelectedPenduduk(p)}>
                            {p.namaLengkap}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                            p.statusTinggal === "Tetap" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                            p.statusTinggal === "Kontrak" ? "bg-amber-500/10 text-amber-600" : "bg-sky-500/10 text-sky-600"
                          }`}>
                            Tinggal {p.statusTinggal}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* NIK */}
                    <td className="px-5 py-4 font-mono font-semibold text-slate-800 dark:text-slate-100 tracking-wider">
                      {p.nik}
                    </td>

                    {/* J/K */}
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.jenisKelamin === "L" ? "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-blue-100/60 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {p.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </td>

                    {/* Umur */}
                    <td className="px-5 py-4 text-center font-bold text-slate-755 dark:text-slate-300 font-mono">
                      {hitungUmur(p.tanggalLahir)} thn
                    </td>

                    {/* Pekerjaan */}
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={p.pekerjaan}>
                      {p.pekerjaan}
                    </td>

                    {/* RT / RW */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                        RT {p.rt} / RW {p.rw}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-4 text-right space-x-1 shrink-0">
                      <button
                        onClick={() => setSelectedPenduduk(p)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:border-emerald-500/30 text-slate-600 dark:text-slate-400 hover:bg-emerald-500/5 transition-all inline-flex items-center cursor-pointer"
                        title="Lihat Detail Warga"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:border-emerald-500/30 text-slate-600 dark:text-slate-400 hover:bg-emerald-500/5 transition-all inline-flex items-center cursor-pointer"
                        title="Edit Data"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:border-rose-500/30 text-rose-500 hover:bg-rose-500/5 transition-all inline-flex items-center cursor-pointer"
                        title="Hapus Warga"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 bg-slate-50/20 dark:bg-transparent">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Tidak ada arsip data penduduk ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL FOOTER */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-450 dark:text-slate-500">
          <span>Menampilkan <strong>{Math.min(filteredPenduduk.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredPenduduk.length, currentPage * itemsPerPage)}</strong> dari <strong>{filteredPenduduk.length}</strong> jiwa</span>
          
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

      {/* FULL FORM DIALOG FOR CITIZEN REGISTRATION/EDIT (15 FIELDS) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* Modal Head */}
            <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/10">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" /> {editingId ? "Ubah Informasi Penduduk" : "Registrasi Penduduk Baru"}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-450 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable form body content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Alert note */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Contact className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Formulir pendaftaran digital standar kependudukan nasional untuk basis data Wargaluyu.</span>
              </div>

              {/* Grid 1: NIK & KK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nomor Induk Kependudukan (NIK - 16 Digit)</label>
                  <input
                    id="form-nik"
                    type="text"
                    maxLength={16}
                    required
                    placeholder="3204XXXXXXXXXXXXXXXX"
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono font-medium tracking-widest"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. Kartu Keluarga (KK)</label>
                  <select
                    value={noKk}
                    onChange={(e) => setNoKk(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  >
                    {kkList.map(k => (
                      <option key={k.id} value={k.noKk}>{k.noKk} (K.K. {k.kepalaKeluargaNama})</option>
                    ))}
                    {kkList.length === 0 && <option value="">Tidak ada Kartu Keluarga terdaftar</option>}
                  </select>
                </div>

              </div>

              {/* Grid 2: Nama & TTL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Lengkap Sesuai KTP/SIAK</label>
                <input
                  id="form-nama"
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap warga"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tempat Lahir</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bandung, Tasikmalaya, dll"
                    value={tempatLahir}
                    onChange={(e) => setTempatLahir(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Lahir (Untuk Penghitungan Umur)</label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Grid 3: J/K, Religion, Citizenship */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jenis Kelamin</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setJenisKelamin("L")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        jenisKelamin === "L" 
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                          : "border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/15"
                      }`}
                    >
                      Laki-laki
                    </button>
                    <button
                      type="button"
                      onClick={() => setJenisKelamin("P")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        jenisKelamin === "P" 
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                          : "border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/15"
                      }`}
                    >
                      Perempuan
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Agama</label>
                  <select
                    value={agama}
                    onChange={(e) => setAgama(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen Protestan</option>
                    <option value="Katolik">Kristen Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                    <option value="Lainnya">Lainnya / Aliran Kepercayaan</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kewarganegaraan</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setKewarganegaraan("WNI")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        kewarganegaraan === "WNI" 
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                          : "border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/15"
                      }`}
                    >
                      WNI
                    </button>
                    <button
                      type="button"
                      onClick={() => setKewarganegaraan("WNA")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        kewarganegaraan === "WNA" 
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                          : "border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/15"
                      }`}
                    >
                      WNA
                    </button>
                  </div>
                </div>

              </div>

              {/* Grid 4: Pendidikan & Pekerjaan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Jenjang Pendidikan Terakhir
                  </label>
                  <select
                    value={pendidikan}
                    onChange={(e) => setPendidikan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Tidak / Belum Sekolah">Tidak / Belum Sekolah</option>
                    <option value="Belum Tamat SD / Sederajat">Belum Tamat SD / Sederajat</option>
                    <option value="Tamat SD / Sederajat">Tamat SD / Sederajat</option>
                    <option value="SLTP / Sederajat">SLTP / Sederajat (SMP)</option>
                    <option value="SLTA / Sederajat">SLTA / Sederajat (SMA/SMK)</option>
                    <option value="Diploma I / II">Diploma I / II</option>
                    <option value="Diploma III">Diploma III (Akademik)</option>
                    <option value="Diploma IV / Strata I">Diploma IV / Strata I (Sarjana S1)</option>
                    <option value="Strata II">Strata II (Magister S2)</option>
                    <option value="Strata III">Strata III (Doktor S3)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Jenis Pekerjaan Utama
                  </label>
                  <select
                    value={pekerjaan}
                    onChange={(e) => setPekerjaan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="BELUM/TIDAK BEKERJA">BELUM/TIDAK BEKERJA</option>
                    <option value="MENGURUS RUMAH TANGGA">MENGURUS RUMAH TANGGA</option>
                    <option value="PELAJAR/MAHASISWA">PELAJAR/MAHASISWA</option>
                    <option value="PENSIUNAN">PENSIUNAN</option>
                    <option value="PEGAWAI NEGERI SIPIL">PEGAWAI NEGERI SIPIL (PNS)</option>
                    <option value="TENTARA NASIONAL INDONESIA">TENTARA NASIONAL INDONESIA (TNI)</option>
                    <option value="KEPOLISIAN RI">KEPOLISIAN RI (POLRI)</option>
                    <option value="KARYAWAN SWASTA">KARYAWAN SWASTA</option>
                    <option value="KARYAWAN BUMN">KARYAWAN BUMN</option>
                    <option value="KARYAWAN BUMD">KARYAWAN BUMD</option>
                    <option value="BURUH HARIAN LEPAS">BURUH HARIAN LEPAS</option>
                    <option value="PETANI/PEKEBUN">PETANI/PEKEBUN</option>
                    <option value="PETERNAK">PETERNAK</option>
                    <option value="NELAYAN/PERIKANAN">NELAYAN/PERIKANAN</option>
                    <option value="PEDAGANG">PEDAGANG / PERDAGANGAN</option>
                    <option value="WIRASWASTA">WIRASWASTA</option>
                    <option value="GURU / DOSEN">GURU / DOSEN</option>
                    <option value="MEDIK / DOKTER / BIDAN">MEDIK / DOKTER / BIDAN</option>
                    <option value="KONSTRUKSI">KONSTRUKSI</option>
                    <option value="SENIMAN">SENIMAN</option>
                    <option value="LAINNYA">LAINNYA</option>
                  </select>
                </div>

              </div>

              {/* Grid 5: Marital, Family, Phone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-slate-400" /> Status Perkawinan
                  </label>
                  <select
                    value={statusPerkawinan}
                    onChange={(e) => setStatusPerkawinan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin / Menikah</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" /> Hubungan Keluarga
                  </label>
                  <select
                    value={statusHubungan}
                    onChange={(e) => setStatusHubungan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Suami">Suami</option>
                    <option value="Isteri">Isteri</option>
                    <option value="Anak">Anak</option>
                    <option value="Menantu">Menantu</option>
                    <option value="Cucu">Cucu</option>
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Mertua">Mertua</option>
                    <option value="Famili Lain">Famili Lain</option>
                    <option value="Pembantu">Pembantu</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Nomor Handphone (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="08XXXXXXXXXX (Bisa dikosongkan)"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value.replace(/[^\d+-\s]/g, ""))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  />
                </div>

              </div>

              {/* Grid 6: Living Status, RT, RW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Tempat Tinggal</label>
                  <select
                    value={statusTinggal}
                    onChange={(e) => setStatusTinggal(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Tetap">Tetap (Tinggal Permanen)</option>
                    <option value="Kontrak">Kontrak (Tinggal Sewa)</option>
                    <option value="Sementara">Sementara (Tinggal Domisili Sementara)</option>
                  </select>
                </div>

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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                    >
                      {Array.from(new Set([...db.getRtList(currentUser.role === "KETUA_RW" ? currentUser.rw : rw), "01", "02", "03"])).sort((a,b) => a.localeCompare(b)).map(rtNum => (
                        <option key={rtNum} value={rtNum}>{rtNum}</option>
                      ))}
                    </select>
                  )}
                </div>

              </div>

              {/* Disability Section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-750 dark:text-slate-300">Apakah Warga Menyandang Disabilitas?</label>
                    <p className="text-[10px] text-slate-400 mt-0.5">Aktifkan jika warga memiliki keterbatasan fisik, intelektual, mental, atau sensorik.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !isDisabilitas;
                      setIsDisabilitas(nextVal);
                      if (!nextVal) setJenisDisabilitas("");
                    }}
                    className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                      isDisabilitas
                        ? "bg-rose-600/10 border-rose-500 text-rose-700 dark:text-rose-400"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300"
                    }`}
                  >
                    {isDisabilitas ? "Penyandang Disabilitas" : "Bukan Disabilitas"}
                  </button>
                </div>

                {isDisabilitas && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/60 animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-left">Jenis Disabilitas</label>
                    <select
                      value={jenisDisabilitas}
                      required={isDisabilitas}
                      onChange={(e) => setJenisDisabilitas(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="">-- Pilih Jenis Disabilitas --</option>
                      <option value="Disabilitas Fisik">Disabilitas Fisik (Daksa / Lumpuh / dll)</option>
                      <option value="Disabilitas Intelektual">Disabilitas Intelektual (Down Syndrome / dll)</option>
                      <option value="Disabilitas Mental">Disabilitas Mental (Schizophrenia / Bipolar / dll)</option>
                      <option value="Disabilitas Sensorik Netra">Disabilitas Sensorik Netra (Buta)</option>
                      <option value="Disabilitas Sensorik Rungu Wicara">Disabilitas Sensorik Rungu Wicara (Tuli / Bisu)</option>
                      <option value="Disabilitas Ganda / Multi">Disabilitas Ganda / Multi</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  {editingId ? "Simpan Perubahan" : "Daftarkan Penduduk"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* INDIVIDUAL RESIDENT DETAIL MODAL VIEW (NOTION INSPIRED CARD) */}
      {selectedPenduduk && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            
            {/* Colored Header Banner */}
            <div className="p-6 bg-gradient-to-br from-teal-950 to-slate-900 text-white relative">
              <button 
                onClick={() => setSelectedPenduduk(null)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-400 bg-slate-900 overflow-hidden shrink-0">
                  <img src={getCartoonAvatar(selectedPenduduk.jenisKelamin, selectedPenduduk.tanggalLahir, selectedPenduduk.namaLengkap)} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedPenduduk.namaLengkap}</h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">NIK: {selectedPenduduk.nik}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold text-emerald-300">
                    RT {selectedPenduduk.rt} / RW {selectedPenduduk.rw} • Dusun Wargaluyu
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body Info Columns */}
            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
              
              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">No. Kartu Keluarga</span>
                <span className="font-bold text-slate-700 dark:text-slate-350 font-mono">{selectedPenduduk.noKk}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Tempat, Tanggal Lahir</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{selectedPenduduk.tempatLahir}, {new Date(selectedPenduduk.tanggalLahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Jenis Kelamin</span>
                <span className="font-bold text-slate-705 dark:text-slate-350">{selectedPenduduk.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Agama</span>
                <span className="font-bold text-slate-705 dark:text-slate-350">{selectedPenduduk.agama}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Pendidikan Terakhir</span>
                <span className="font-bold text-slate-705 dark:text-slate-350">{selectedPenduduk.pendidikan}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Pekerjaan Utama</span>
                <span className="font-bold text-slate-710 dark:text-slate-350">{selectedPenduduk.pekerjaan}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Status Perkawinan</span>
                <span className="font-bold text-slate-710 dark:text-slate-350">{selectedPenduduk.statusPerkawinan}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Hubungan Keluarga</span>
                <span className="font-bold text-slate-710 dark:text-slate-350">{selectedPenduduk.statusHubungan}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Kewarganegaraan</span>
                <span className="font-bold text-slate-710 dark:text-slate-355 font-mono">{selectedPenduduk.kewarganegaraan}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">No. HP Aktif</span>
                <span className="font-bold text-slate-710 dark:text-slate-355 font-mono">{selectedPenduduk.noHp}</span>
              </div>

              <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col gap-1">
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Status Kesehatan / Disabilitas</span>
                {selectedPenduduk.isDisabilitas ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 self-start">
                    ⚠️ Menyandang Disabilitas: {selectedPenduduk.jenisDisabilitas}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 self-start">
                    ✓ Sehat Walafiat (Non-Disabilitas)
                  </span>
                )}
              </div>

              <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between text-[10px] text-slate-450">
                <span>Status Tempat Tinggal: <strong className="text-emerald-500 font-bold uppercase">{selectedPenduduk.statusTinggal}</strong></span>
                <span>Dimasukkan: {new Date(selectedPenduduk.tanggalInput).toLocaleDateString("id-ID")}</span>
              </div>

            </div>

            {/* Modal actions */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 text-right">
              <button
                onClick={() => setSelectedPenduduk(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup Jendela Rincian
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
                className="px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl transition"
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
