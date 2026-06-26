/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  X, 
  Settings, 
  UserPlus, 
  AlertOctagon,
  Lock,
  Contact,
  Fingerprint,
  Pencil,
  Save,
  Trash,
  PlusCircle,
  MapPin,
  Landmark,
  Layers,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { User, UserRole, Dusun, WilayahRw } from "../types";
import { db } from "../db/mockSupabase";

interface UserManagementProps {
  currentUser: User;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function UserManagementView({ currentUser, addToast }: UserManagementProps) {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [wilayahList, setWilayahList] = useState<Dusun[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Tracking if we are editing an account
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<UserRole>("KETUA_RT");
  const [rw, setRw] = useState("01");
  const [rt, setRt] = useState("01");
  const [passwordState, setPasswordState] = useState("");

  // Regional management temporary states
  const [newDusunNama, setNewDusunNama] = useState("");
  const [newRwNomor, setNewRwNomor] = useState<{ [dusunId: string]: string }>({});
  const [newRtNomor, setNewRtNomor] = useState<{ [key: string]: string }>({}); // key format: dusunId-rwId
  const [editingDusunId, setEditingDusunId] = useState<string | null>(null);
  const [editingDusunNama, setEditingDusunNama] = useState("");

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
    if (currentUser.role === "ADMIN_DESA") {
      fetchUsers();
      fetchWilayah();
    }

    const handleSync = () => {
      if (currentUser.role === "ADMIN_DESA") {
        fetchUsers();
        fetchWilayah();
      }
    };
    window.addEventListener("sipenduk-db-updated", handleSync);
    return () => {
      window.removeEventListener("sipenduk-db-updated", handleSync);
    };
  }, [currentUser]);

  const fetchUsers = () => {
    setUsersList(db.getUsers());
  };

  const fetchWilayah = () => {
    setWilayahList(db.getWilayah());
  };

  // Extract all unique RW numbers from our configured wilayah
  const availableRws: string[] = Array.from(
    new Set<string>(wilayahList.flatMap(d => d.rws.map(r => r.nomor)))
  ).sort((a, b) => a.localeCompare(b));

  // Find RTs associated with the selected RW
  const availableRts: string[] = Array.from(
    new Set<string>(
      wilayahList
        .flatMap(d => d.rws.filter(r => r.nomor === rw))
        .flatMap(r => r.rts)
    )
  ).sort((a, b) => a.localeCompare(b));

  // Handle auto-selected fallback when rw changes
  useEffect(() => {
    if (availableRts.length > 0 && !availableRts.includes(rt)) {
      setRt(availableRts[0]);
    }
  }, [rw, wilayahList]);

  // Handle user delete
  const handleDeleteUser = (userId: string, targetNama: string) => {
    if (userId === currentUser.id) {
      addToast("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!", "warning");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Hapus Akun",
      message: `Apakah Anda yakin ingin menghapus akun operator "${targetNama}"?`,
      onConfirm: () => {
        try {
          const success = db.deleteUser(userId, currentUser);
          if (success) {
            addToast("Operator telah berhasil dihapus dari sistem.", "success");
            fetchUsers();
          } else {
            addToast("User tidak ditemukan atau gagal dihapus.", "warning");
          }
        } catch (err: any) {
          addToast(err.message || "Gagal menghapus user.", "error");
        }
      }
    });
  };

  // Open form for adding user
  const handleOpenAddForm = () => {
    setEditingUser(null);
    setUsername("");
    setNama("");
    setRole("KETUA_RT");
    setRw(availableRws[0] || "01");
    setRt("01");
    setPasswordState("");
    setIsFormOpen(true);
  };

  // Open form for editing user
  const handleOpenEditForm = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setNama(user.nama);
    setRole(user.role);
    setRw(user.rw || availableRws[0] || "01");
    setRt(user.rt || "01");
    setPasswordState(user.password || "");
    setIsFormOpen(true);
  };

  // Submit user form (Add or Edit)
  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !nama.trim()) {
      addToast("Harap isi seluruh isian formulir!", "warning");
      return;
    }

    const sanitizedUsername = username.toLowerCase().trim().replace(/\s/g, "");

    try {
      if (editingUser) {
        // Edit flow
        const updatedFields: Partial<User> = {
          username: sanitizedUsername,
          nama: nama.trim(),
          role,
          rw: role !== "ADMIN_DESA" ? rw : undefined,
          rt: role === "KETUA_RT" ? rt : undefined,
          password: passwordState.trim() ? passwordState.trim() : undefined
        };

        const success = db.updateUser(editingUser.id, updatedFields, currentUser);
        if (success) {
          addToast(`Akun operator harian ${nama} berhasil diperbarui!`, "success");
        } else {
          addToast("Gagal memperbarui data pengguna.", "error");
        }
      } else {
        // Create flow
        const newUser: User = {
          id: "user-" + Math.random().toString(36).substring(2, 9),
          username: sanitizedUsername,
          nama: nama.trim(),
          role,
          rw: role !== "ADMIN_DESA" ? rw : undefined,
          rt: role === "KETUA_RT" ? rt : undefined,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
        };
        if (passwordState.trim()) {
          newUser.password = passwordState.trim();
        }

        db.addUser(newUser, currentUser);
        addToast(`Akun operator harian baru untuk ${nama} berhasil diaktifkan!`, "success");
      }

      setIsFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      addToast(err.message || "Gagal menyimpan akun operator.", "error");
    }
  };

  // ==========================================
  // DUSUN, RW, RT MANAGEMENT OPERATIONS
  // ==========================================

  const handleAddDusun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDusunNama.trim()) return;

    try {
      const list = [...wilayahList];
      const newDusun: Dusun = {
        id: "dusun-" + Date.now(),
        nama: newDusunNama.toUpperCase().trim(),
        rws: []
      };

      list.push(newDusun);
      db.saveWilayah(list, currentUser);
      setNewDusunNama("");
      fetchWilayah();
      addToast(`Berhasil menambahkan wilayah ${newDusun.nama}!`, "success");
    } catch (err: any) {
      console.error(err);
      addToast(`Gagal menambah Dusun: ${err.message || err}`, "error");
    }
  };

  const handleRenameDusun = (dusunId: string) => {
    if (!editingDusunNama.trim()) return;

    try {
      const list = wilayahList.map(d => {
        if (d.id === dusunId) {
          return { ...d, nama: editingDusunNama.toUpperCase().trim() };
        }
        return d;
      });

      db.saveWilayah(list, currentUser);
      setEditingDusunId(null);
      setEditingDusunNama("");
      fetchWilayah();
      addToast("Nama Dusun berhasil diperbarui!", "success");
    } catch (err: any) {
      console.error(err);
      addToast(`Gagal merename Dusun: ${err.message || err}`, "error");
    }
  };

  const handleDeleteDusun = (dusunId: string, namaDusun: string) => {
    try {
      const dusunObj = wilayahList.find(d => d.id === dusunId);
      if (dusunObj && dusunObj.rws.length > 0) {
        addToast(`Tidak bisa menghapus ${namaDusun} karena masih memiliki RW di bawahnya!`, "warning");
        return;
      }

      setConfirmModal({
        isOpen: true,
        title: "Konfirmasi Hapus Dusun",
        message: `Apakah Anda yakin ingin menghapus wilayah Dusun "${namaDusun}" dari konfigurasi sistem?`,
        onConfirm: () => {
          try {
            const list = wilayahList.filter(d => d.id !== dusunId);
            db.saveWilayah(list, currentUser);
            fetchWilayah();
            addToast(`Wilayah ${namaDusun} didelete dari draf sistem.`, "success");
          } catch (err: any) {
            console.error(err);
            addToast(`Gagal menghapus Dusun: ${err.message || err}`, "error");
          }
        }
      });
    } catch (err: any) {
      console.error(err);
      addToast(`Gagal menghapus Dusun: ${err.message || err}`, "error");
    }
  };

  const handleAddRw = (dusunId: string) => {
    try {
      let nrw = newRwNomor[dusunId]?.trim();
      if (!nrw) {
        addToast("Harap isi nomor RW (contoh: 05) terlebih dahulu!", "warning");
        return;
      }

      // Auto-pad single digit numbers (e.g. "5" -> "05")
      if (/^\d$/.test(nrw)) {
        nrw = "0" + nrw;
      }

      const list = [...wilayahList];
      const dusunIndex = list.findIndex(d => d.id === dusunId);
      if (dusunIndex === -1) return;

      // Check duplicate RW within this Dusun
      if (list[dusunIndex].rws.find(r => r.nomor === nrw)) {
        addToast(`RW ${nrw} sudah terdaftar di bawah dusun ini!`, "error");
        return;
      }

      list[dusunIndex].rws.push({
        id: "rw-" + Date.now(),
        nomor: nrw,
        rts: ["01", "02"] // default standard RTs
      });

      db.saveWilayah(list, currentUser);
      setNewRwNomor({ ...newRwNomor, [dusunId]: "" });
      fetchWilayah();
      addToast(`RW ${nrw} berhasil ditambahkan di ${list[dusunIndex].nama}!`, "success");
    } catch (err: any) {
      console.error(err);
      addToast(`Gagal menambah RW: ${err.message || err}`, "error");
    }
  };

  const handleDeleteRw = (dusunId: string, rwId: string, nomorRw: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Hapus RW",
      message: `Apakah Anda yakin ingin menghapus RW ${nomorRw} beserta seluruh RT di dalamnya?`,
      onConfirm: () => {
        try {
          const list = wilayahList.map(d => {
            if (d.id === dusunId) {
              return {
                ...d,
                rws: d.rws.filter(r => r.id !== rwId)
              };
            }
            return d;
          });

          db.saveWilayah(list, currentUser);
          fetchWilayah();
          addToast(`RW ${nomorRw} berhasil dihapus dari draf area.`, "success");
        } catch (err: any) {
          console.error(err);
          addToast(`Gagal menghapus RW: ${err.message || err}`, "error");
        }
      }
    });
  };

  const handleAddRt = (dusunId: string, rwId: string) => {
    try {
      const key = `${dusunId}-${rwId}`;
      let nrt = newRtNomor[key]?.trim();
      if (!nrt) {
        addToast("Harap isi nomor RT terlebih dahulu!", "warning");
        return;
      }

      // Auto-pad single digit numbers (e.g. "4" -> "04")
      if (/^\d$/.test(nrt)) {
        nrt = "0" + nrt;
      }

      const list = wilayahList.map(d => {
        if (d.id === dusunId) {
          return {
            ...d,
            rws: d.rws.map(r => {
              if (r.id === rwId) {
                if (r.rts.includes(nrt)) {
                  addToast(`RT ${nrt} sudah terdaftar di bawah RW ini!`, "error");
                  return r;
                }
                addToast(`RT ${nrt} berhasil dilampirkan!`, "success");
                return {
                  ...r,
                  rts: [...r.rts, nrt].sort((a, b) => a.localeCompare(b))
                };
              }
              return r;
            })
          };
        }
        return d;
      });

      db.saveWilayah(list, currentUser);
      setNewRtNomor({ ...newRtNomor, [key]: "" });
      fetchWilayah();
    } catch (err: any) {
      console.error(err);
      addToast(`Gagal menambah RT: ${err.message || err}`, "error");
    }
  };

  const handleDeleteRt = (dusunId: string, rwId: string, nomorRt: string) => {
    try {
      const list = wilayahList.map(d => {
        if (d.id === dusunId) {
          return {
            ...d,
            rws: d.rws.map(r => {
              if (r.id === rwId) {
                return {
                  ...r,
                  rts: r.rts.filter(rtNum => rtNum !== nomorRt)
                };
              }
              return r;
            })
          };
        }
        return d;
      });

      db.saveWilayah(list, currentUser);
      fetchWilayah();
      addToast(`RT ${nomorRt} dilepaskan dari struktur.`, "success");
    } catch (err: any) {
      console.error(err);
      addToast(`Gagal menghapus RT: ${err.message || err}`, "error");
    }
  };


  // RESTRICTION GUARD FOR RW / RT ROLES (BEAUTIFUL SECURITY WALLPAPER)
  if (currentUser.role !== "ADMIN_DESA") {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-lg max-w-lg mx-auto my-12 relative overflow-hidden animate-in fade-in zoom-in duration-200" id="guard-restriction">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
        <Lock className="w-14 h-14 text-rose-500 mx-auto stroke-1 mb-4" />
        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Akses Terbatas Terdeteksi</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Sesuai asas kebijakan kerahasiaan wilayah dan perlindungan data SIDEWA Wargaluyu, tingkat akun <strong>{currentUser.role.replace("_", " ")}</strong> tidak diizinkan mengakses pengaturan manajemen akun operator atau merubah draf struktur wilayah desa.
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-950 mt-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-500">
          Silakan hubungi Superadmin selaku administrator utama untuk penyesuaian hak izin masuk.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="view-user-management">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-emerald-500" /> Manajemen Wilayah & Akun Operator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Mengatur pembagian hierarki daerah Dusun, RW, RT Wargaluyu serta operasional akun petugas desa.
          </p>
        </div>

        <button
          id="btn-add-operator"
          onClick={handleOpenAddForm}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer text-xs self-start md:self-auto h-11"
        >
          <UserPlus className="w-4 h-4" /> Tambah Akun Operator
        </button>
      </div>

      {/* TWO COLUMN GRID: LEFT = USER LIST, RIGHT = STRUCTURE EXPLORER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: OPERATORS LIST (SPANS 7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/65 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" /> Daftar Akun Operator Aktif
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                {usersList.length} Petugas
              </span>
            </div>

            {/* RESPONSIVE TABLE FOR DESKTOP & TABLETS */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-955/20 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-105 dark:border-slate-800">
                    <th className="px-5 py-3">Nama Operator</th>
                    <th className="px-5 py-3">Username</th>
                    <th className="px-5 py-3">Level Hak</th>
                    <th className="px-5 py-3 text-center">RW</th>
                    <th className="px-5 py-3 text-center">RT</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/5 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-505 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                          {user.nama.substring(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold">{user.nama}</div>
                          {user.id === currentUser.id && (
                            <span className="text-[9px] text-emerald-550 font-semibold bg-emerald-500/10 px-1 py-px rounded">Aktif</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                        {user.username}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          user.role === "ADMIN_DESA" ? "bg-amber-500/10 text-amber-500" :
                          user.role === "KETUA_RW" ? "bg-purple-500/10 text-purple-500" : "bg-sky-500/10 text-sky-500"
                        }`}>
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-650 dark:text-slate-350">
                        {user.rw || "Seluruh"}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-650 dark:text-slate-350">
                        {user.rt || "Seluruh"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditForm(user)}
                            className="p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer"
                            title="Edit Akun"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.nama)}
                            disabled={user.id === currentUser.id}
                            className="p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 hover:border-rose-500 text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ENHANCED MOBILE FRIENDLY LAYOUT FOR MOBILE SCREENS ("di buat enak untuk tampilan hp") */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {usersList.map((user) => (
                <div key={user.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-505 dark:text-emerald-400 flex items-center justify-center font-bold">
                        {user.nama.substring(0, 1)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.nama}</h4>
                        <div className="text-[10px] font-mono text-slate-400">@{user.username}</div>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      user.role === "ADMIN_DESA" ? "bg-amber-500/10 text-amber-500" :
                      user.role === "KETUA_RW" ? "bg-purple-500/10 text-purple-500" : "bg-sky-500/10 text-sky-500"
                    }`}>
                      {user.role.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850/60 text-[10px]">
                    <div className="flex-1">
                      <span className="text-slate-400 font-semibold block text-[8px] uppercase">Rukun Warga (RW)</span>
                      <strong className="text-slate-700 dark:text-slate-350">{user.rw || "Seluruh Wilayah"}</strong>
                    </div>
                    <div className="flex-1">
                      <span className="text-slate-400 font-semibold block text-[8px] uppercase">Rukun Tetangga (RT)</span>
                      <strong className="text-slate-700 dark:text-slate-350">{user.rt || "Seluruh Wilayah"}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-dotted border-slate-200 dark:border-slate-800">
                    {user.id === currentUser.id && (
                      <span className="text-[10px] text-emerald-550 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md mr-auto">Sesi Anda</span>
                    )}
                    <button
                      onClick={() => handleOpenEditForm(user)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all text-[11px] font-semibold cursor-pointer min-h-[38px] w-20"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.nama)}
                      disabled={user.id === currentUser.id}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-rose-100 hover:border-rose-500 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 transition-all text-[11px] font-semibold disabled:opacity-20 cursor-pointer min-h-[38px] w-20"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: VILLAGE REGIONAL STRUCTURE EDITOR (SPANS 5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm p-5 space-y-4">
            
            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500 animate-pulse" /> Hierarki Struktur Wilayah Desa
              </h3>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full font-bold">
                Level: Dusun → RW → RT
              </span>
            </div>

            {/* QUICK ADD NEW DUSUN */}
            <form onSubmit={handleAddDusun} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Tambah Dusun Baru..."
                value={newDusunNama}
                onChange={(e) => setNewDusunNama(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950/40 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer min-w-[40px] h-9"
                title="Tambah Dusun"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* ACCORDION/LIST OF DUSUNS WITH RWs AND RTs CONTAINER */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {wilayahList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                  <AlertOctagon className="w-8 h-8 text-amber-500 mx-auto" />
                  <p>Struktur wilayah saat ini masih kosong.</p>
                </div>
              ) : (
                wilayahList.map((dusun) => (
                  <div 
                    key={dusun.id} 
                    className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-950/10 shadow-sm space-y-4"
                  >
                    
                    {/* DUSUN HEADER */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-150/60 dark:border-slate-800/40 pb-2">
                      <div className="flex-1">
                        {editingDusunId === dusun.id ? (
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={editingDusunNama}
                              onChange={(e) => setEditingDusunNama(e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 text-xs rounded focus:outline-none font-bold uppercase w-full max-w-[160px]"
                            />
                            <button
                              onClick={() => handleRenameDusun(dusun.id)}
                              className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingDusunId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1 cursor-pointer hover:text-emerald-500 transition-colors"
                            onClick={() => {
                              setEditingDusunId(dusun.id);
                              setEditingDusunNama(dusun.nama);
                            }}
                            title="Klik untuk rename"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {dusun.nama}
                            <Pencil className="w-2.5 h-2.5 ml-1 text-slate-400 opacity-50 hover:opacity-100" />
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteDusun(dusun.id, dusun.nama)}
                        disabled={dusun.rws.length > 0}
                        className="p-1.5 text-slate-405 hover:text-rose-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-rose-500/30 transition-all cursor-pointer disabled:opacity-20"
                        title="Hapus Dusun (Hanya yang kosong)"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>

                    {/* RW & RT LISTS IN THIS DUSUN */}
                    <div className="space-y-3">
                      
                      {/* ADD NEW RW IN THIS DUSUN */}
                      <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-1.5 rounded-xl">
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="Nomor RW (ex. 05)..."
                          value={newRwNomor[dusun.id] || ""}
                          onChange={(e) => setNewRwNomor({ ...newRwNomor, [dusun.id]: e.target.value })}
                          className="flex-1 bg-transparent px-2 text-[11px] focus:outline-none dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddRw(dusun.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-600 hover:text-white dark:text-slate-305 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          + RW
                        </button>
                      </div>

                      {/* INDIVIDUAL RW SUBCARDS */}
                      {dusun.rws.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada RW di dusun ini.</p>
                      ) : (
                        dusun.rws.map((rwObj) => {
                          const key = `${dusun.id}-${rwObj.id}`;
                          return (
                            <div 
                              key={rwObj.id} 
                              className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                  RK / RW {rwObj.nomor}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRw(dusun.id, rwObj.id, rwObj.nomor)}
                                  className="text-[9px] text-rose-500 border border-rose-100 hover:bg-rose-500/5 px-2 py-0.5 rounded cursor-pointer transition"
                                >
                                  Hapus RW
                                </button>
                              </div>

                              {/* LIST OF INTERACTIVE RT BADGES */}
                              <div className="flex flex-wrap gap-1">
                                {rwObj.rts.length === 0 ? (
                                  <span className="text-[9px] text-slate-400 italic">Belum ada RT</span>
                                ) : (
                                  rwObj.rts.map((rtnum) => (
                                    <span 
                                      key={rtnum}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 pl-2 pr-1 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60 transition group cursor-pointer"
                                      onClick={() => handleDeleteRt(dusun.id, rwObj.id, rtnum)}
                                      title="Klik untuk hapus RT ini"
                                    >
                                      RT {rtnum}
                                      <X className="w-2.5 h-2.5 text-slate-400 hover:text-rose-500 stroke-2" />
                                    </span>
                                  ))
                                )}
                              </div>

                              {/* SMALL INLINE RT ADDER */}
                              <div className="flex gap-1 items-center bg-slate-50 dark:bg-slate-950/40 p-1 rounded-lg border border-slate-100 dark:border-slate-850">
                                <input
                                  type="text"
                                  maxLength={10}
                                  placeholder="RT Baru (ex. 04)"
                                  value={newRtNomor[key] || ""}
                                  onChange={(e) => setNewRtNomor({ ...newRtNomor, [key]: e.target.value })}
                                  className="w-full bg-transparent px-1.5 text-[10.5px] focus:outline-none text-slate-650 dark:text-slate-350"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddRt(dusun.id, rwObj.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] px-2 py-1 rounded cursor-pointer antialiased"
                                >
                                  + RT
                                </button>
                              </div>

                            </div>
                          );
                        })
                      )}

                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

      {/* MODAL WINDOW: REGISTER / EDIT ACCOUNT */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-505" />
                {editingUser ? "Modifikasi Akun Operator" : "Registrasi Akun Operator Baru"}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-450 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block dark:text-slate-400">Nama Lengkap Operator</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Jaka Sumarna"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/30 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block dark:text-slate-400">Username Login (Tanpa Spasi)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: rt0103"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/30 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[9px] text-slate-400">Password default untuk masuk awal akan disamakan dengan username jika dikosongkan.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block dark:text-slate-400">
                  Password Operator {editingUser && "(Kosongkan jika tidak ingin mengubah)"}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "••••••••" : "Masukkan password default"}
                  value={passwordState}
                  onChange={(e) => setPasswordState(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/30 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block dark:text-slate-400">Level Hak Akses Sistem</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="KETUA_RT">Ketua Rukun Tetangga (KETUA_RT)</option>
                  <option value="KETUA_RW">Ketua Rukun Warga (KETUA_RW)</option>
                  <option value="ADMIN_DESA">Petugas Administrasi Desa (ADMIN_DESA)</option>
                </select>
              </div>

              {/* DYNAMIC REGIONAL SELECT COORINDATOR USING THE LOADED WILAYAH STRUCTURE */}
              {role !== "ADMIN_DESA" && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850/60 border-dashed">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wilayah RW</label>
                    <select
                      value={rw}
                      onChange={(e) => setRw(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs dark:text-white focus:outline-none"
                    >
                      {availableRws.map((rwNumber) => (
                        <option key={rwNumber} value={rwNumber}>RW {rwNumber}</option>
                      ))}
                      {availableRws.length === 0 && (
                        <option value="01">RW 01 (Default)</option>
                      )}
                    </select>
                  </div>

                  {role === "KETUA_RT" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rukun Tetangga (RT)</label>
                      <select
                        value={rt}
                        onChange={(e) => setRt(e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs dark:text-white focus:outline-none"
                      >
                        {availableRts.map((rtNumber) => (
                          <option key={rtNumber} value={rtNumber}>RT {rtNumber}</option>
                        ))}
                        {availableRts.length === 0 && (
                          <option value="01">RT 01 (Default)</option>
                        )}
                      </select>
                    </div>
                  )}

                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800 font-semibold text-xs">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 hover:bg-slate-1 pointer-events-auto hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer min-h-[38px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] min-h-[38px] flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {editingUser ? "Simpan Perubahan" : "Aktifkan Akun"}
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
