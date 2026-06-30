/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";
import { 
  User, 
  Keluarga, 
  Penduduk, 
  Kelahiran, 
  Kematian, 
  Mutasi, 
  AktivitasLog,
  JenisKelamin,
  Dusun
} from "../types";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "https://ksdrnwryfrwbvysskdim.supabase.co";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZHJud3J5ZnJ3YnZ5c3NrZGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTA3ODAsImV4cCI6MjA5NzM2Njc4MH0.D9FGGOhgQixBqaCD-ZBi8C4Zv5eW8D4ID6IbHZ-K8BQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Key names for storage
const STORAGE_KEYS = {
  USERS: "sipenduk_users",
  CURRENT_USER: "sipenduk_session_user",
  KELUARGA: "sipenduk_keluarga",
  PENDUDUK: "sipenduk_penduduk",
  KELAHIRAN: "sipenduk_kelahiran",
  KEMATIAN: "sipenduk_kematian",
  MUTASI: "sipenduk_mutasi",
  LOGS: "sipenduk_logs",
  WILAYAH: "sipenduk_wilayah",
  IS_INITIALIZED: "sipenduk_initialized_clean"
};

const INITIAL_WILAYAH: Dusun[] = [
  {
    id: "dusun-1",
    nama: "DUSUN I WARGALUYU",
    rws: [
      { id: "rw-1", nomor: "01", rts: ["01", "02", "03"] },
      { id: "rw-2", nomor: "02", rts: ["01", "02"] }
    ]
  },
  {
    id: "dusun-2",
    nama: "DUSUN II WARGALUYU",
    rws: [
      { id: "rw-3", nomor: "03", rts: ["01", "02"] },
      { id: "rw-4", nomor: "04", rts: ["01", "02", "03", "04"] }
    ]
  }
];

// Default Admin, RW, and RT accounts
const INITIAL_USERS: User[] = [
  {
    id: "user-admin",
    username: "admin",
    nama: "Superadmin",
    role: "ADMIN_DESA",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "user-rw01",
    username: "rw01",
    nama: "Bpk. Cecep Supriadi",
    role: "KETUA_RW",
    rw: "01",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "user-rw02",
    username: "rw02",
    nama: "Bpk. Asep Mulyana",
    role: "KETUA_RW",
    rw: "02",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "user-rt0101",
    username: "rt0101",
    nama: "Bpk. Ujang Sobar (RT 01/01)",
    role: "KETUA_RT",
    rw: "01",
    rt: "01",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "user-rt0201",
    username: "rt0102",
    nama: "Ibu Siti Rohmah (RT 02/01)",
    role: "KETUA_RT",
    rw: "01",
    rt: "02",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "user-rt0102",
    username: "rt0201",
    nama: "Bpk. Jajang Jamaludin (RT 01/02)",
    role: "KETUA_RT",
    rw: "02",
    rt: "01",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120"
  }
];

// Helper to calculate age dynamically
export function hitungUmur(tanggalLahir: string): number {
  const lahir = new Date(tanggalLahir);
  const sekarang = new Date();
  let umur = sekarang.getFullYear() - lahir.getFullYear();
  const m = BirdMonthGap(lahir, ...[sekarang]);
  if (m === -1) {
    umur--;
  }
  return Number.isNaN(umur) || umur < 0 ? 0 : umur;
}

// Helper to determine month gap precisely for hitungUmur
function BirdMonthGap(lahir: Date, sekarang: Date): number {
  const m = sekarang.getMonth() - lahir.getMonth();
  if (m < 0 || (m === 0 && sekarang.getDate() < lahir.getDate())) {
    return -1;
  }
  return m;
}

// Helper to get cartoon avatar based on age and gender
export function getCartoonAvatar(gender: "L" | "P", tanggalLahir: string, name: string): string {
  const age = hitungUmur(tanggalLahir);
  
  let bg = "#e2e8f0";
  let content = "";
  
  if (age <= 2) {
    // 1. Bayi / Baby (Age <= 2)
    bg = "#fed7aa"; // Soft Orange
    content = `
      <!-- Head -->
      <circle cx='50' cy='52' r='24' fill='%23ffedd5' />
      <!-- Eyes -->
      <circle cx='42' cy='48' r='3' fill='%231e293b' />
      <circle cx='58' cy='48' r='3' fill='%231e293b' />
      <!-- Cheeks -->
      <circle cx='37' cy='54' r='3' fill='%23fecdd3' />
      <circle cx='63' cy='54' r='3' fill='%23fecdd3' />
      <!-- Smile -->
      <path d='M 46 58 Q 50 62 54 58' stroke='%23f43f5e' stroke-width='2.5' fill='none' stroke-linecap='round' />
      <!-- Baby Hair lock -->
      <path d='M 50 28 Q 53 22 50 18 Q 47 22 50 28' fill='%23d97706' />
    `;
  } else if (age <= 12) {
    // 2. Anak-anak / Kids (Age 3 - 12)
    if (gender === "L") {
      bg = "#93c5fd"; // Soft Blue
      content = `
        <!-- Face -->
        <circle cx='50' cy='52' r='22' fill='%23ffedd5' />
        <!-- Caps / Boy Hair -->
        <path d='M 28 42 Q 50 18 72 42' fill='%231e293b' />
        <!-- Eyes -->
        <circle cx='43' cy='48' r='2.5' fill='%231e293b' />
        <circle cx='57' cy='48' r='2.5' fill='%231e293b' />
        <!-- Smiling Mouth -->
        <path d='M 45 58 Q 50 63 55 58' stroke='%231e293b' stroke-width='2' fill='none' stroke-linecap='round' />
        <!-- Clothes -->
        <path d='M 32 72 C 32 72 38 88 50 88 C 62 88 68 72 68 72 Z' fill='%232563eb' />
      `;
    } else {
      bg = "#fbcfe8"; // Soft Pink
      content = `
        <!-- Ponytails -->
        <circle cx='28' cy='38' r='8' fill='%23475569' />
        <circle cx='72' cy='38' r='8' fill='%23475569' />
        <!-- Face -->
        <circle cx='50' cy='52' r='22' fill='%23ffedd5' />
        <!-- Girl Hair Front -->
        <path d='M 28 44 Q 50 26 72 44 C 65 31 35 31 28 44' fill='%23475569' />
        <!-- Eyes -->
        <circle cx='43' cy='48' r='2.5' fill='%231e293b' />
        <circle cx='57' cy='48' r='2.5' fill='%231e293b' />
        <!-- Cute Smile -->
        <path d='M 45 58 Q 50 63 55 58' stroke='%23e11d48' stroke-width='2' fill='none' stroke-linecap='round' />
        <!-- Clothes -->
        <path d='M 32 72 C 32 72 38 88 50 88 C 62 88 68 72 68 72 Z' fill='%23db2777' />
      `;
    }
  } else if (age >= 60) {
    // 3. Lansia / Tua (Elderly, >= 60)
    if (gender === "L") {
      bg = "#cbd5e1"; // Slate Grey
      content = `
        <!-- Grandfather Balding/Grey Hair -->
        <path d='M 28 50 C 24 30 76 30 72 50 Z' fill='%2394a3b8' />
        <circle cx='50' cy='52' r='21' fill='%23fee082' />
        <path d='M 35 38 Q 50 32 65 38' fill='%2394a3b8' />
        <!-- Balding center forehead -->
        <circle cx='50' cy='52' r='21' fill='%23ffedd5' />
        <!-- Wrinkles -->
        <path d='M 44 38 Q 50 36 56 38' stroke='%23cbd5e1' stroke-width='1.5' fill='none' />
        <!-- Glasses -->
        <circle cx='42' cy='48' r='6' stroke='%23475569' stroke-width='2' fill='none' />
        <circle cx='58' cy='48' r='6' stroke='%23475569' stroke-width='2' fill='none' />
        <line x1='48' y1='48' x2='52' y2='48' stroke='%23475569' stroke-width='2' />
        <!-- Eyes -->
        <circle cx='42' cy='48' r='1.5' fill='%231e293b' />
        <circle cx='58' cy='48' r='1.5' fill='%231e293b' />
        <!-- White/Grey Moustache -->
        <path d='M 40 58 Q 50 54 60 58 Q 50 72 40 58' fill='%23e2e8f0' stroke='%23cbd5e1' stroke-width='1' />
        <!-- Smile -->
        <path d='M 46 58 Q 50 61 54 58' stroke='%231e293b' stroke-width='1.5' fill='none' />
        <!-- Clothes -->
        <path d='M 32 72 T 50 90 T 68 72 Z' fill='%231e293b' />
        <path d='M 45 72 L 50 82 L 55 72 Z' fill='%23e2e8f0' />
      `;
    } else {
      bg = "#fde047"; // Warm yellow-amber
      content = `
        <!-- Bun on top of hair -->
        <circle cx='50' cy='24' r='8' fill='%2394a3b8' />
        <!-- Face -->
        <circle cx='50' cy='52' r='21' fill='%23ffedd5' />
        <!-- Grey Hair -->
        <path d='M 28 48 C 28 30 72 30 72 48 C 65 34 35 34 28 48' fill='%2394a3b8' />
        <!-- Glasses -->
        <circle cx='42' cy='48' r='6' stroke='%23475569' stroke-width='2' fill='none' />
        <circle cx='58' cy='48' r='6' stroke='%23475569' stroke-width='2' fill='none' />
        <line x1='48' y1='48' x2='52' y2='48' stroke='%23475569' stroke-width='2' />
        <!-- Eyes -->
        <circle cx='42' cy='48' r='1.5' fill='%231e293b' />
        <circle cx='58' cy='48' r='1.5' fill='%231e293b' />
        <!-- Cheeks -->
        <circle cx='36' cy='54' r='2.5' fill='%23fecdd3' />
        <circle cx='64' cy='54' r='2.5' fill='%23fecdd3' />
        <!-- Smile -->
        <path d='M 45 58 Q 50 63 55 58' stroke='%231e293b' stroke-width='1.5' fill='none' stroke-linecap='round' />
        <!-- Clothes -->
        <path d='M 32 72 T 50 90 T 68 72 Z' fill='%23475569' />
        <path d='M 44 72 L 50 82 L 56 72 Z' fill='%23db2777' />
      `;
    }
  } else {
    // 4. Dewasa / Adult (Age 13 - 59)
    if (gender === "L") {
      bg = "#6ee7b7"; // Soft Emerald
      content = `
        <!-- Short Boy Hair behind -->
        <path d='M 26 48 C 24 24 76 24 74 48 Z' fill='%231e293b' />
        <!-- Face -->
        <circle cx='50' cy='52' r='22' fill='%23ffedd5' />
        <!-- Eyes -->
        <circle cx='42' cy='46' r='2.5' fill='%231e293b' />
        <circle cx='58' cy='46' r='2.5' fill='%231e293b' />
        <!-- Hair Front -->
        <path d='M 28 38 Q 45 28 60 34 Q 72 38 72 42' stroke='%231e293b' stroke-width='4' fill='none' stroke-linecap='round' />
        <!-- Cute Smile -->
        <path d='M 44 56 Q 50 61 56 56' stroke='%231e293b' stroke-width='2' fill='none' stroke-linecap='round' />
        <!-- Clothes -->
        <path d='M 30 72 C 30 72 36 88 50 88 C 64 88 70 72 70 72 Z' fill='%2315803d' />
        <!-- V-neck shirt inner -->
        <path d='M 45 72 L 50 78 L 55 72 Z' fill='%23f8fafc' />
      `;
    } else {
      bg = "#c084fc"; // Purple
      content = `
        <!-- Long Hair behind -->
        <path d='M 26 50 C 26 30 74 30 74 50 L 76 72 L 24 72 Z' fill='%23312e81' />
        <!-- Face -->
        <circle cx='50' cy='52' r='21' fill='%23ffedd5' />
        <!-- Eyes -->
        <circle cx='43' cy='46' r='2.5' fill='%231e293b' />
        <circle cx='57' cy='46' r='2.5' fill='%231e293b' />
        <!-- Bangs/Hair front -->
        <path d='M 29 44 C 35 34 65 34 71 44' stroke='%23312e81' stroke-width='5' fill='none' stroke-linecap='round' />
        <!-- Cheeks -->
        <circle cx='36' cy='52' r='2' fill='%23fecdd3' />
        <circle cx='64' cy='52' r='2' fill='%23fecdd3' />
        <!-- Gentle Smile -->
        <path d='M 45 56 Q 50 61 55 56' stroke='%23e11d48' stroke-width='2' fill='none' stroke-linecap='round' />
        <!-- Clothes -->
        <path d='M 32 72 C 32 72 38 88 50 88 C 62 88 68 72 68 72 Z' fill='%23701a75' />
      `;
    }
  }
  
  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="${bg}" />
    ${content}
  </svg>`.replace(/%23/g, "#").replace(/\s+/g, " ");
    
  try {
    const base64Svg = btoa(unescape(encodeURIComponent(rawSvg)));
    return `data:image/svg+xml;base64,${base64Svg}`;
  } catch (e) {
    return `data:image/svg+xml,${encodeURIComponent(rawSvg)}`;
  }
}

// Initial Family Cards (KK)
const INITIAL_KELUARGA: Keluarga[] = [];

// Initial Citizens
const INITIAL_PENDUDUK: Penduduk[] = [];

// Initial Birth Registry
const INITIAL_KELAHIRAN: Kelahiran[] = [];

// Initial Death Registry
const INITIAL_KEMATIAN: Kematian[] = [];

// Initial Mutation Registry
const INITIAL_MUTASI: Mutasi[] = [];

// Initial Audit Logs
const INITIAL_LOGS: AktivitasLog[] = [];

// Base DB Class that emulates Supabase operations + enforces Row Level Security
export class MockSupabaseClient {
  private lastSyncTimestamps: { [key: string]: number } = {};
  private lastLocalWriteTimestamps: { [key: string]: number } = {};

  getLastSyncTimestamp(tableName: string): number {
    return this.lastSyncTimestamps[tableName] || 0;
  }

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_KEYS.KELUARGA, JSON.stringify(INITIAL_KELUARGA));
      localStorage.setItem(STORAGE_KEYS.PENDUDUK, JSON.stringify(INITIAL_PENDUDUK));
      localStorage.setItem(STORAGE_KEYS.KELAHIRAN, JSON.stringify(INITIAL_KELAHIRAN));
      localStorage.setItem(STORAGE_KEYS.KEMATIAN, JSON.stringify(INITIAL_KEMATIAN));
      localStorage.setItem(STORAGE_KEYS.MUTASI, JSON.stringify(INITIAL_MUTASI));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
      localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(INITIAL_WILAYAH));
      localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, "true");
    } else {
      // Force update of cached names if they contain the old name
      try {
        const storedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
        if (storedUsersRaw && (storedUsersRaw.includes("Dadang") || storedUsersRaw.includes("Sulaeman"))) {
          const parsedUsers = JSON.parse(storedUsersRaw) as User[];
          const updatedUsers = parsedUsers.map(u => {
            if (u.id === "user-admin" || u.username === "admin") {
              return { ...u, nama: "Superadmin" };
            }
            return u;
          });
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
        }

        const storedCurrentRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (storedCurrentRaw && (storedCurrentRaw.includes("Dadang") || storedCurrentRaw.includes("Sulaeman"))) {
          const parsedCurrentUser = JSON.parse(storedCurrentRaw) as User;
          if (parsedCurrentUser.id === "user-admin" || parsedCurrentUser.username === "admin") {
            parsedCurrentUser.nama = "Superadmin";
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsedCurrentUser));
          }
        }
      } catch (e) {
        console.error("Migration error:", e);
      }
    }
  }

  // REAL SUPABASE SYNCHRONIZATION HELPERS (Double-Write & Status)
  async syncTableFromSupabase(tableName: string, storageKey: string, force = false): Promise<boolean> {
    const now = Date.now();
    const lastSync = this.lastSyncTimestamps[tableName] || 0;
    const lastWrite = this.lastLocalWriteTimestamps[tableName] || 0;

    // 1. For regional hierarchy (wilayah), we want the local state to be the source of truth if edited.
    // Avoid blindly overwriting regional changes in the background with potentially empty or stale cloud configuration.
    if (tableName === "wilayah") {
      const hasLocal = localStorage.getItem(storageKey);
      if (hasLocal && (lastWrite > 0 || now - lastSync < 300000)) { // 5 minutes cache for wilayah
        return true;
      }
    }

    // 2. For all tables, if we have written locally within the last 15 seconds,
    // skip pulling to avoid race conditions (overwriting newer local edits with stale pull).
    if (now - lastWrite < 15000) {
      return true;
    }

    // Cache for 2.5 seconds to prevent spamming queries
    if (!force && (now - lastSync < 2500)) {
      return true;
    }
    try {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) {
        console.warn(`[Supabase Sync] Pull on '${tableName}' failed:`, error);
        return false;
      }
      if (data) {
        // Prevent cloud overwriting with empty array if we have local defaults
        if (data.length === 0) {
          if (tableName === "wilayah") {
            const currentWilayah = this.getWilayah();
            if (currentWilayah && currentWilayah.length > 0) {
              console.log("[Supabase Sync] Seeding remote 'wilayah' table with local configuration...");
              for (const d of currentWilayah) {
                await this.supUpsert("wilayah", { id: d.id, nama: d.nama, rws: d.rws });
              }
              this.lastSyncTimestamps[tableName] = now;
              return true;
            }
          } else if (tableName === "users") {
            const currentUsers = this.getUsers();
            if (currentUsers && currentUsers.length > 0) {
              console.log("[Supabase Sync] Seeding remote 'users' table with local accounts...");
              for (const u of currentUsers) {
                await this.supUpsert("users", u);
              }
              this.lastSyncTimestamps[tableName] = now;
              return true;
            }
          }
        }

        const localData = this.getItems<any>(storageKey);
        const mergedData = data.map((remoteItem: any) => {
          const localItem = localData.find((l: any) => l.id === remoteItem.id);
          if (localItem) {
            return { ...localItem, ...remoteItem };
          }
          return remoteItem;
        });

        const remoteIds = new Set(data.map((r: any) => r.id));
        const localOnlyRecent = localData.filter((l: any) => {
          if (remoteIds.has(l.id)) return false;
          const lastWrite = this.lastLocalWriteTimestamps[tableName] || 0;
          return Date.now() - lastWrite < 60000;
        });

        const finalData = [...localOnlyRecent, ...mergedData];
        this.saveItems(storageKey, finalData, false);
        this.lastSyncTimestamps[tableName] = now;
        return true;
      }
      return false;
    } catch (e: any) {
      console.warn(`[Supabase Connection Failure] Pull failed for table '${tableName}':`, e);
      return false;
    }
  }

  async syncAll(force = false): Promise<boolean> {
    const tables = [
      { name: "users", key: STORAGE_KEYS.USERS },
      { name: "keluarga", key: STORAGE_KEYS.KELUARGA },
      { name: "penduduk", key: STORAGE_KEYS.PENDUDUK },
      { name: "kelahiran", key: STORAGE_KEYS.KELAHIRAN },
      { name: "kematian", key: STORAGE_KEYS.KEMATIAN },
      { name: "mutasi", key: STORAGE_KEYS.MUTASI },
      { name: "logs", key: STORAGE_KEYS.LOGS },
      { name: "wilayah", key: STORAGE_KEYS.WILAYAH }
    ];
    let allSuccess = true;
    for (const t of tables) {
      const res = await this.syncTableFromSupabase(t.name, t.key, force);
      if (!res) allSuccess = false;
    }
    return allSuccess;
  }

  private filterRecordForSupabase(tableName: string, record: any): any {
    const schemas: { [key: string]: string[] } = {
      users: ["id", "username", "password", "nama", "role", "rw", "rt", "avatar", "tanggalInput"],
      keluarga: ["id", "noKk", "kepalaKeluargaId", "kepalaKeluargaNama", "alamat", "rw", "rt", "jumlahAnggota"],
      penduduk: [
        "id", "nik", "noKk", "namaLengkap", "tempatLahir", "tanggalLahir", "jenisKelamin",
        "agama", "pendidikan", "pekerjaan", "statusPerkawinan", "statusHubungan",
        "kewarganegaraan", "noHp", "statusTinggal", "rw", "rt", "avatar", "tanggalInput"
      ],
      kelahiran: ["id", "nikBayi", "namaBayi", "namaAyah", "namaIbu", "tanggalLahir", "rw", "rt", "tanggalInput"],
      kematian: ["id", "nik", "nama", "tanggalMeninggal", "sebabKematian", "rw", "rt", "tanggalInput"],
      mutasi: ["id", "jenisMutasi", "nik", "nama", "alamatAsal", "alamatTujuan", "tanggalMutasi", "rw", "rt", "tanggalInput"],
      logs: ["id", "userId", "username", "role", "action", "ipAddress", "userAgent", "timestamp"],
      wilayah: ["id", "nama", "rws"]
    };

    const allowedColumns = schemas[tableName];
    if (!allowedColumns) return record;

    const filtered: any = {};
    for (const key of allowedColumns) {
      if (key in record) {
        filtered[key] = record[key];
      }
    }
    return filtered;
  }

  async supUpsert(tableName: string, record: any): Promise<{ success: boolean; error?: any }> {
    try {
      const filteredRecord = this.filterRecordForSupabase(tableName, record);
      const { error } = await supabase.from(tableName).upsert(filteredRecord);
      if (error) {
        console.warn(`[Supabase Error] Upsert table '${tableName}' failed:`, error);
        return { success: false, error };
      }
      return { success: true };
    } catch (e: any) {
      console.warn(`[Supabase Connection Failure] Ignored for offline redundancy on table '${tableName}':`, e);
      return { success: false, error: e };
    }
  }

  async supDelete(tableName: string, id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) {
        console.warn(`[Supabase Error] Delete from '${tableName}' failed:`, error);
        return { success: false, error };
      }
      return { success: true };
    } catch (e: any) {
      console.warn(`[Supabase Connection Failure] Ignored for offline redundancy on table '${tableName}':`, e);
      return { success: false, error: e };
    }
  }

  async testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.from("users").select("id").limit(1);
      if (error) {
        if (error.code === "PGRST116" || error.code === "42P01" || error.code === "PGRST205") {
          return {
            success: true,
            message: "Koneksi ke Supabase berhasil! Namun tabel 'users' belum dideklarasikan di skema cloud Anda."
          };
        }
        return {
          success: false,
          message: `Koneksi gagal: [${error.code}] ${error.message}`
        };
      }
      return {
        success: true,
        message: "Koneksi berhasil dan tabel operasional aktif!"
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Koneksi gagal: ${e.message || e}`
      };
    }
  }

  async uploadAllToSupabase(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const results: { [key: string]: string } = {};
      const tables = [
        { name: "users", key: STORAGE_KEYS.USERS },
        { name: "keluarga", key: STORAGE_KEYS.KELUARGA },
        { name: "penduduk", key: STORAGE_KEYS.PENDUDUK },
        { name: "kelahiran", key: STORAGE_KEYS.KELAHIRAN },
        { name: "kematian", key: STORAGE_KEYS.KEMATIAN },
        { name: "mutasi", key: STORAGE_KEYS.MUTASI },
        { name: "logs", key: STORAGE_KEYS.LOGS },
        { name: "wilayah", key: STORAGE_KEYS.WILAYAH }
      ];

      for (const t of tables) {
        const localData = this.getItems<any>(t.key);
        if (localData && localData.length > 0) {
          const { error } = await supabase.from(t.name).upsert(localData);
          if (error) {
            results[t.name] = `Gagal: ${error.message}`;
          } else {
            results[t.name] = `Berhasil (${localData.length} baris)`;
          }
        } else {
          results[t.name] = "Kosong (tidak diunggah)";
        }
      }
      return { success: true, message: "Seluruh data lokal berhasil diunggah ke Supabase!", details: results };
    } catch (e: any) {
      return { success: false, message: e.message || "Gagal melakukan koneksi ke Supabase." };
    }
  }

  async downloadAllFromSupabase(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const results: { [key: string]: string } = {};
      const tables = [
        { name: "users", key: STORAGE_KEYS.USERS },
        { name: "keluarga", key: STORAGE_KEYS.KELUARGA },
        { name: "penduduk", key: STORAGE_KEYS.PENDUDUK },
        { name: "kelahiran", key: STORAGE_KEYS.KELAHIRAN },
        { name: "kematian", key: STORAGE_KEYS.KEMATIAN },
        { name: "mutasi", key: STORAGE_KEYS.MUTASI },
        { name: "logs", key: STORAGE_KEYS.LOGS },
        { name: "wilayah", key: STORAGE_KEYS.WILAYAH }
      ];

      for (const t of tables) {
        const { data, error } = await supabase.from(t.name).select("*");
        if (error) {
          results[t.name] = `Gagal: ${error.message}`;
        } else if (data) {
          this.saveItems(t.key, data);
          results[t.name] = `Berhasil diunduh (${data.length} baris)`;
        }
      }
      return { success: true, message: "Seluruh data dari Supabase berhasil diunduh ke penyimpanan lokal!", details: results };
    } catch (e: any) {
      return { success: false, message: e.message || "Gagal melakukan koneksi ke Supabase." };
    }
  }

  // Row Level Security filters
  private applyRLSFilter<T extends { rw?: string; rt?: string }>(data: T[], user: User): T[] {
    if (user.role === "ADMIN_DESA") {
      return data; // Full access
    }
    if (user.role === "KETUA_RW") {
      // Ketua RW can only see data belonging to their RW
      return data.filter(item => item.rw === user.rw);
    }
    if (user.role === "KETUA_RT") {
      // Ketua RT can only see data belonging to their RW and RT
      return data.filter(item => item.rw === user.rw && item.rt === user.rt);
    }
    return [];
  }

  // Row Level Security check for single record write permissions
  validateRLSWrite<T extends { rw?: string; rt?: string }>(record: T, user: User): boolean {
    if (user.role === "ADMIN_DESA") return true;
    if (user.role === "KETUA_RW") {
      return record.rw === user.rw;
    }
    if (user.role === "KETUA_RT") {
      return record.rw === user.rw && record.rt === user.rt;
    }
    return false;
  }

  // LOGS MANAGEMENT
  async addLog(user: User, deskripsi: string): Promise<void> {
    const logs = this.getItems<AktivitasLog>(STORAGE_KEYS.LOGS);
    const newLog: AktivitasLog = {
      id: "log-" + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      deskripsi,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog); // Put newest log first
    this.saveItems(STORAGE_KEYS.LOGS, logs.slice(0, 50)); // Keep last 50 logs
  }

  async getLogs(user: User): Promise<AktivitasLog[]> {
    await this.syncTableFromSupabase("logs", STORAGE_KEYS.LOGS);
    const logs = this.getItems<AktivitasLog>(STORAGE_KEYS.LOGS);
    // Row Level Security: RW/RT can only see log records for their territory or logs generated by themselves
    if (user.role === "ADMIN_DESA") {
      return logs;
    }
    return logs.filter(log => log.userId === user.id || (user.rw && log.deskripsi.includes(`RW ${user.rw}`)));
  }

  // USERS MANAGEMENT
  getUsers(): User[] {
    const list = this.getItems<User>(STORAGE_KEYS.USERS);
    
    // If the list is empty, or we have never successfully pulled from Supabase yet,
    // merge initial defaults.
    if (list.length === 0 || !this.lastSyncTimestamps["users"]) {
      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem("sidewa_deleted_user_ids") || "[]") as string[];
      } catch (e) {
        console.warn("Failed to read deleted user IDs", e);
      }

      const merged = [...list];
      for (const initUser of INITIAL_USERS) {
        if (deletedIds.includes(initUser.id)) {
          continue;
        }
        if (!merged.some(u => u.username.toLowerCase() === initUser.username.toLowerCase())) {
          merged.push(initUser);
        }
      }
      if (merged.length !== list.length) {
        this.saveItems(STORAGE_KEYS.USERS, merged);
      }
      return merged;
    }

    // If we have successfully synced from Supabase in the past, the remote database list is the single source of truth.
    // We must NOT blindly merge missing default users back, because they might have been explicitly deleted from another device.
    // However, to prevent absolute lockout, we always make sure at least the 'admin' superuser exists.
    const hasAdmin = list.some(u => u.username.toLowerCase() === "admin");
    if (!hasAdmin) {
      const adminUser = INITIAL_USERS.find(u => u.username === "admin");
      if (adminUser) {
        const newList = [adminUser, ...list];
        this.saveItems(STORAGE_KEYS.USERS, newList);
        return newList;
      }
    }

    return list;
  }

  async addUser(user: User, operator: User): Promise<boolean> {
    if (operator.role !== "ADMIN_DESA") {
      throw new Error("Unauthorized! Only Admin Desa can perform user management.");
    }
    const users = this.getUsers();
    if (users.find(u => u.username === user.username)) {
      throw new Error("Username already exists!");
    }

    // If a deleted ID is being reused or added back, remove it from the deleted tracking list
    try {
      const deletedIds = JSON.parse(localStorage.getItem("sidewa_deleted_user_ids") || "[]") as string[];
      if (deletedIds.includes(user.id)) {
        const filtered = deletedIds.filter(id => id !== user.id);
        localStorage.setItem("sidewa_deleted_user_ids", JSON.stringify(filtered));
      }
    } catch (e) {}

    users.push(user);
    this.saveItems(STORAGE_KEYS.USERS, users);
    
    // Attempt real-time cloud sync
    const res = await this.supUpsert("users", user);
    if (!res.success) {
      const errorMsg = res.error?.message || "Koneksi Supabase gagal.";
      throw new Error(`Akun tersimpan LOKAL, tetapi GAGAL terunggah ke Cloud Supabase! Detail Error: ${errorMsg}. Pastikan skema tabel 'users' Anda di Supabase memiliki seluruh kolom: id, username, nama, role, rw, rt, password, avatar.`);
    }

    this.addLog(operator, `Menambahkan pengguna baru: ${user.nama} (${user.role})`);
    return true;
  }

  async deleteUser(userId: string, operator: User): Promise<boolean> {
    if (operator.role !== "ADMIN_DESA") {
      throw new Error("Unauthorized! Only Admin Desa can delete users.");
    }
    let users = this.getUsers();
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return false;

    // Track this user ID as explicitly deleted so it won't be re-added by fallback
    try {
      const deletedIds = JSON.parse(localStorage.getItem("sidewa_deleted_user_ids") || "[]") as string[];
      if (!deletedIds.includes(userId)) {
        deletedIds.push(userId);
        localStorage.setItem("sidewa_deleted_user_ids", JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn("Failed to write deleted user ID", e);
    }

    users = users.filter(u => u.id !== userId);
    this.saveItems(STORAGE_KEYS.USERS, users);
    
    const res = await this.supDelete("users", userId);
    if (!res.success) {
      const errorMsg = res.error?.message || "Koneksi Supabase gagal.";
      throw new Error(`Akun dihapus LOKAL, tetapi GAGAL dihapus dari Cloud Supabase! Detail Error: ${errorMsg}`);
    }

    this.addLog(operator, `Menghapus pengguna: ${userToDelete.nama} (${userToDelete.role})`);
    return true;
  }

  async updateUser(userId: string, updatedFields: Partial<User>, operator: User): Promise<boolean> {
    if (operator.role !== "ADMIN_DESA") {
      throw new Error("Unauthorized! Only Admin Desa can perform user management.");
    }
    let users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    if (updatedFields.username && updatedFields.username !== users[userIndex].username) {
      if (users.find(u => u.username === updatedFields.username)) {
        throw new Error("Username already exists!");
      }
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updatedFields
    };

    this.saveItems(STORAGE_KEYS.USERS, users);
    
    const res = await this.supUpsert("users", users[userIndex]);
    if (!res.success) {
      const errorMsg = res.error?.message || "Koneksi Supabase gagal.";
      throw new Error(`Data diubah LOKAL, tetapi GAGAL diperbarui ke Cloud Supabase! Detail Error: ${errorMsg}. Pastikan skema tabel 'users' Anda kompatibel.`);
    }

    this.addLog(operator, `Mengubah data pengguna: ${users[userIndex].nama} (${users[userIndex].role})`);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      this.setCurrentUser(users[userIndex]);
    }

    return true;
  }

  async resetPasswordMandiri(username: string, nama: string, passwordBaru: string): Promise<boolean> {
    const users = this.getUsers();
    const matchedIndex = users.findIndex(
      u => u.username.toLowerCase().trim() === username.toLowerCase().trim() &&
           u.nama.toLowerCase().trim() === nama.toLowerCase().trim()
    );

    if (matchedIndex === -1) {
      throw new Error("Identitas tidak cocok! Pastikan Username dan Nama Lengkap sesuai dengan data operator.");
    }

    const updatedUser = {
      ...users[matchedIndex],
      password: passwordBaru.trim()
    };

    users[matchedIndex] = updatedUser;
    this.saveItems(STORAGE_KEYS.USERS, users);
    
    const res = await this.supUpsert("users", updatedUser);
    if (!res.success) {
      const errorMsg = res.error?.message || "Koneksi Supabase gagal.";
      throw new Error(`Password berhasil direset LOKAL, tetapi GAGAL disinkronkan ke Cloud Supabase! Detail Error: ${errorMsg}`);
    }

    this.addLog(updatedUser, `Melakukan reset password akun secara mandiri.`);

    return true;
  }

  // WILAYAH (DUSUN / RW / RT) MANAGEMENT
  getWilayah(): Dusun[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WILAYAH);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(INITIAL_WILAYAH));
      return INITIAL_WILAYAH;
    }
    try {
      return JSON.parse(raw) as Dusun[];
    } catch (e) {
      return INITIAL_WILAYAH;
    }
  }

  saveWilayah(wilayah: Dusun[], operator: User): boolean {
    if (operator.role !== "ADMIN_DESA") {
      throw new Error("Unauthorized! Only Admin Desa can modify regional configuration.");
    }

    const oldWilayah = this.getWilayah();
    const oldIds = oldWilayah.map(d => d.id);
    const newIds = wilayah.map(d => d.id);
    const deletedIds = oldIds.filter(id => !newIds.includes(id));

    this.saveItems(STORAGE_KEYS.WILAYAH, wilayah);

    // Delete removed ones from Supabase
    deletedIds.forEach(id => {
      this.supDelete("wilayah", id);
    });

    // Upsert added/updated ones
    wilayah.forEach(d => {
      this.supUpsert("wilayah", { id: d.id, nama: d.nama, rws: d.rws });
    });

    this.addLog(operator, `Mengubah konfigurasi hierarki wilayah Dusun, RW, dan RT`);
    return true;
  }

  getRwList(): string[] {
    const list = this.getWilayah();
    const rws = list.flatMap(d => d.rws.map(r => r.nomor));
    return Array.from(new Set<string>(rws)).sort((a, b) => a.localeCompare(b));
  }

  getRtList(rwNomor?: string): string[] {
    const list = this.getWilayah();
    let rts: string[] = [];
    if (rwNomor) {
      rts = list.flatMap(d => d.rws.filter(r => r.nomor === rwNomor).flatMap(r => r.rts));
    } else {
      rts = list.flatMap(d => d.rws.flatMap(r => r.rts));
    }
    return Array.from(new Set<string>(rts)).sort((a, b) => a.localeCompare(b));
  }

  // CURRENT SESSION
  getCurrentUser(): User | null {
    const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return u ? JSON.parse(u) : null;
  }

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // KELUARGA (KK) API WITH RLS
  async getKeluarga(user: User): Promise<Keluarga[]> {
    await this.syncTableFromSupabase("keluarga", STORAGE_KEYS.KELUARGA);
    await this.syncTableFromSupabase("penduduk", STORAGE_KEYS.PENDUDUK);
    
    const rawKeluarga = this.getItems<Keluarga>(STORAGE_KEYS.KELUARGA);
    const rawPenduduk = this.getItems<Penduduk>(STORAGE_KEYS.PENDUDUK);

    // Dynamic update of jumlahAnggota for each Keluarga row
    const updatedKeluarga = rawKeluarga.map(kk => {
      const count = rawPenduduk.filter(p => p.noKk === kk.noKk).length;
      return {
        ...kk,
        jumlahAnggota: count
      };
    });

    // Save back to local storage so any update is persisted locally
    this.saveItems(STORAGE_KEYS.KELUARGA, updatedKeluarga);

    return this.applyRLSFilter(updatedKeluarga, user);
  }

  async insertKeluarga(kk: Omit<Keluarga, "id" | "jumlahAnggota">, user: User): Promise<Keluarga> {
    if (!this.validateRLSWrite(kk, user)) {
      throw new Error("RLS Violation! Anda tidak memiliki izin menulis data untuk wilayah RT/RW ini.");
    }
    const raw = this.getItems<Keluarga>(STORAGE_KEYS.KELUARGA);

    // Duplicate KK check
    const isDuplicate = raw.some(x => x.noKk === kk.noKk);
    if (isDuplicate) {
      throw new Error(`Data Ganda! Kartu Keluarga No ${kk.noKk} sudah terdaftar di database.`);
    }

    const newKk: Keluarga = {
      ...kk,
      id: "kk-" + Math.random().toString(36).substring(2, 9),
      jumlahAnggota: 0 // Will auto update based on residents referencing this KK
    };
    raw.unshift(newKk);
    this.saveItems(STORAGE_KEYS.KELUARGA, raw, true);
    this.supUpsert("keluarga", newKk);
    this.addLog(user, `Menambahkan Kartu Keluarga baru No: ${kk.noKk}, Kepala Keluarga: ${kk.kepalaKeluargaNama} di RT ${kk.rt}/RW ${kk.rw}`);
    return newKk;
  }

  async updateKeluarga(id: string, kk: Partial<Keluarga>, user: User): Promise<Keluarga> {
    const raw = this.getItems<Keluarga>(STORAGE_KEYS.KELUARGA);
    const index = raw.findIndex(k => k.id === id);
    if (index === -1) throw new Error("Data KK tidak ditemukan!");
    const target = raw[index];

    // Check RLS on both the existing and incoming targets
    if (!this.validateRLSWrite(target, user) || (kk.rw && !this.validateRLSWrite(kk as Keluarga, user))) {
      throw new Error("RLS Violation! Anda tidak memiliki izin mengubah data KK wilayah ini.");
    }

    // Duplicate KK check on update
    if (kk.noKk && kk.noKk !== target.noKk) {
      const isDuplicate = raw.some(x => x.noKk === kk.noKk && x.id !== id);
      if (isDuplicate) {
        throw new Error(`Data Ganda! Nomor KK ${kk.noKk} sudah digunakan oleh KK lain.`);
      }
    }

    const updated = { ...target, ...kk };
    raw[index] = updated;
    this.saveItems(STORAGE_KEYS.KELUARGA, raw, true);
    this.supUpsert("keluarga", updated);
    this.addLog(user, `Memperbarui KK No: ${updated.noKk}, Kepala Keluarga: ${updated.kepalaKeluargaNama}`);
    return updated;
  }

  async deleteKeluarga(id: string, user: User): Promise<boolean> {
    const raw = this.getItems<Keluarga>(STORAGE_KEYS.KELUARGA);
    const target = raw.find(k => k.id === id);
    if (!target) return false;

    if (!this.validateRLSWrite(target, user)) {
      throw new Error("RLS Violation! Anda tidak mempunyai akses menghapus KK wilayah ini.");
    }

    const filtered = raw.filter(k => k.id !== id);
    this.saveItems(STORAGE_KEYS.KELUARGA, filtered, true);
    this.supDelete("keluarga", id);
    this.addLog(user, `Menghapus KK No: ${target.noKk} Kepala Keluarga: ${target.kepalaKeluargaNama}`);
    return true;
  }

  // PENDUDUK API WITH RLS
  async getPenduduk(user: User): Promise<Penduduk[]> {
    await this.syncTableFromSupabase("penduduk", STORAGE_KEYS.PENDUDUK);
    const raw = this.getItems<Penduduk>(STORAGE_KEYS.PENDUDUK);
    return this.applyRLSFilter(raw, user);
  }

  async insertPenduduk(p: Omit<Penduduk, "id" | "tanggalInput"> & { alamat?: string }, user: User): Promise<Penduduk> {
    if (!this.validateRLSWrite(p, user)) {
      throw new Error("RLS Violation! Anda tidak memiliki izin menulis data penduduk wilayah RT/RW ini.");
    }
    const raw = this.getItems<Penduduk>(STORAGE_KEYS.PENDUDUK);
    
    // Duplicate NIK check
    const isDuplicate = raw.some(x => x.nik === p.nik);
    if (isDuplicate) {
      throw new Error(`Data Ganda! Penduduk dengan NIK ${p.nik} sudah terdaftar di database.`);
    }

    const { alamat, ...pendudukData } = p;
    const newP: Penduduk = {
      ...pendudukData,
      id: "p-" + Math.random().toString(36).substring(2, 9),
      tanggalInput: new Date().toISOString()
    };
    raw.unshift(newP);
    this.saveItems(STORAGE_KEYS.PENDUDUK, raw, true);
    this.supUpsert("penduduk", newP);

    // Auto update KK members block
    this.recalculateKkAnggotaCount(p.noKk, alamat);

    this.addLog(user, `Menambahkan Penduduk baru NIK: ${p.nik}, Nama: ${p.namaLengkap} di RT ${p.rt}/RW ${p.rw}`);
    return newP;
  }

  async updatePenduduk(id: string, p: Partial<Penduduk>, user: User): Promise<Penduduk> {
    const raw = this.getItems<Penduduk>(STORAGE_KEYS.PENDUDUK);
    const index = raw.findIndex(x => x.id === id);
    if (index === -1) throw new Error("Penduduk tidak ditemukan!");
    const target = raw[index];

    if (!this.validateRLSWrite(target, user) || (p.rw && !this.validateRLSWrite(p as Penduduk, user))) {
      throw new Error("RLS Violation! Anda tidak mempunyai izin mengedit data penduduk wilayah ini.");
    }

    // Duplicate NIK check on update
    if (p.nik && p.nik !== target.nik) {
      const isDuplicate = raw.some(x => x.nik === p.nik && x.id !== id);
      if (isDuplicate) {
        throw new Error(`Data Ganda! NIK ${p.nik} sudah digunakan oleh penduduk lain.`);
      }
    }

    const oldNoKk = target.noKk;
    const updated = { ...target, ...p };
    raw[index] = updated;
    this.saveItems(STORAGE_KEYS.PENDUDUK, raw, true);
    this.supUpsert("penduduk", updated);

    // Recalculate member count for previous and new KK in case it changed
    this.recalculateKkAnggotaCount(oldNoKk);
    if (updated.noKk !== oldNoKk) {
      this.recalculateKkAnggotaCount(updated.noKk);
    }

    this.addLog(user, `Memperbarui Penduduk NIK: ${updated.nik}, Nama: ${updated.namaLengkap}`);
    return updated;
  }

  async deletePenduduk(id: string, user: User): Promise<boolean> {
    const raw = this.getItems<Penduduk>(STORAGE_KEYS.PENDUDUK);
    const target = raw.find(x => x.id === id);
    if (!target) return false;

    if (!this.validateRLSWrite(target, user)) {
      throw new Error("RLS Violation! Anda tidak memiliki izin menghapus data penduduk wilayah ini.");
    }

    const filtered = raw.filter(x => x.id !== id);
    this.saveItems(STORAGE_KEYS.PENDUDUK, filtered, true);
    this.supDelete("penduduk", id);

    // Auto recalculate KK
    this.recalculateKkAnggotaCount(target.noKk);

    this.addLog(user, `Menghapus Penduduk NIK: ${target.nik}, Nama: ${target.namaLengkap}`);
    return true;
  }

  // KELAHIRAN API WITH RLS
  async getKelahiran(user: User): Promise<Kelahiran[]> {
    await this.syncTableFromSupabase("kelahiran", STORAGE_KEYS.KELAHIRAN);
    const raw = this.getItems<Kelahiran>(STORAGE_KEYS.KELAHIRAN);
    return this.applyRLSFilter(raw, user);
  }

  async insertKelahiran(k: Omit<Kelahiran, "id" | "tanggalInput">, user: User): Promise<Kelahiran> {
    if (!this.validateRLSWrite(k, user)) {
      throw new Error("RLS Violation! Anda tidak memiliki izin menulis data kelahiran wilayah RT/RW ini.");
    }
    const raw = this.getItems<Kelahiran>(STORAGE_KEYS.KELAHIRAN);
    const newK: Kelahiran = {
      ...k,
      id: "b-" + Math.random().toString(36).substring(2, 9),
      tanggalInput: new Date().toISOString()
    };
    raw.unshift(newK);
    this.saveItems(STORAGE_KEYS.KELAHIRAN, raw, true);
    this.supUpsert("kelahiran", newK);
    this.addLog(user, `Mencatat Kelahiran Bayi: ${k.namaBayi}, Ibu: ${k.namaIbu} di RT ${k.rt}/RW ${k.rw}`);
    return newK;
  }

  async deleteKelahiran(id: string, user: User): Promise<boolean> {
    const raw = this.getItems<Kelahiran>(STORAGE_KEYS.KELAHIRAN);
    const target = raw.find(x => x.id === id);
    if (!target) return false;

    if (!this.validateRLSWrite(target, user)) {
      throw new Error("RLS Violation! Anda tidak berwenang menghapus data wilayah ini.");
    }

    this.saveItems(STORAGE_KEYS.KELAHIRAN, raw.filter(x => x.id !== id), true);
    this.supDelete("kelahiran", id);
    this.addLog(user, `Menghapus data kelahiran bayi: ${target.namaBayi}`);
    return true;
  }

  // KEMATIAN API WITH RLS
  async getKematian(user: User): Promise<Kematian[]> {
    await this.syncTableFromSupabase("kematian", STORAGE_KEYS.KEMATIAN);
    const raw = this.getItems<Kematian>(STORAGE_KEYS.KEMATIAN);
    return this.applyRLSFilter(raw, user);
  }

  async insertKematian(k: Omit<Kematian, "id" | "tanggalInput">, user: User): Promise<Kematian> {
    if (!this.validateRLSWrite(k, user)) {
      throw new Error("RLS Violation! Anda tidak memiliki izin menulis data kematian wilayah RT/RW ini.");
    }
    const raw = this.getItems<Kematian>(STORAGE_KEYS.KEMATIAN);
    const newK: Kematian = {
      ...k,
      id: "d-" + Math.random().toString(36).substring(2, 9),
      tanggalInput: new Date().toISOString()
    };
    raw.unshift(newK);
    this.saveItems(STORAGE_KEYS.KEMATIAN, raw, true);
    this.supUpsert("kematian", newK);

    // Optional: Auto adjust residents table status
    const penduduk = this.getItems<Penduduk>(STORAGE_KEYS.PENDUDUK);
    const index = penduduk.findIndex(p => p.nik === k.nik);
    if (index !== -1) {
      // Clear or label deceased
      penduduk[index].statusTinggal = "Sementara"; // or we could simulate deleting them fully from active citizens
      penduduk[index].namaLengkap += " (Almarhum/ah)";
      this.saveItems(STORAGE_KEYS.PENDUDUK, penduduk, true);
      this.supUpsert("penduduk", penduduk[index]);
    }

    this.addLog(user, `Mencatat Kematian NIK: ${k.nik}, Nama: ${k.nama} di RT ${k.rt}/RW ${k.rw}`);
    return newK;
  }

  async deleteKematian(id: string, user: User): Promise<boolean> {
    const raw = this.getItems<Kematian>(STORAGE_KEYS.KEMATIAN);
    const target = raw.find(x => x.id === id);
    if (!target) return false;

    if (!this.validateRLSWrite(target, user)) {
      throw new Error("RLS Violation! Anda tidak memiliki izin menghapus data wilayah ini.");
    }

    this.saveItems(STORAGE_KEYS.KEMATIAN, raw.filter(x => x.id !== id), true);
    this.supDelete("kematian", id);
    this.addLog(user, `Menghapus pencatatan kematian: ${target.nama}`);
    return true;
  }

  // MUTASI API WITH RLS
  async getMutasi(user: User): Promise<Mutasi[]> {
    await this.syncTableFromSupabase("mutasi", STORAGE_KEYS.MUTASI);
    const raw = this.getItems<Mutasi>(STORAGE_KEYS.MUTASI);
    return this.applyRLSFilter(raw, user);
  }

  async insertMutasi(m: Omit<Mutasi, "id" | "tanggalInput">, user: User): Promise<Mutasi> {
    if (!this.validateRLSWrite(m, user)) {
      throw new Error("RLS Violation! Anda tidak memiliki izin menulis data mutasi wilayah RT/RW ini.");
    }
    const raw = this.getItems<Mutasi>(STORAGE_KEYS.MUTASI);
    const newM: Mutasi = {
      ...m,
      id: "m-" + Math.random().toString(36).substring(2, 9),
      tanggalInput: new Date().toISOString()
    };
    raw.unshift(newM);
    this.saveItems(STORAGE_KEYS.MUTASI, raw, true);
    this.supUpsert("mutasi", newM);
    this.addLog(user, `Mencatat Mutasi [${m.jenisMutasi}] NIK: ${m.nik}, Nama: ${m.nama} di RT ${m.rt}/RW ${m.rw}`);
    return newM;
  }

  async deleteMutasi(id: string, user: User): Promise<boolean> {
    const raw = this.getItems<Mutasi>(STORAGE_KEYS.MUTASI);
    const target = raw.find(x => x.id === id);
    if (!target) return false;

    if (!this.validateRLSWrite(target, user)) {
      throw new Error("RLS Violation! Anda tidak memiliki izin menghapus data wilayah ini.");
    }

    this.saveItems(STORAGE_KEYS.MUTASI, raw.filter(x => x.id !== id), true);
    this.supDelete("mutasi", id);
    this.addLog(user, `Menghapus pencatatan mutasi: ${target.nama}`);
    return true;
  }

  // Helper calculation logic
  private recalculateKkAnggotaCount(noKk: string, alamat?: string) {
    const penduduk = this.getItems<Penduduk>(STORAGE_KEYS.PENDUDUK);
    const keluarga = this.getItems<Keluarga>(STORAGE_KEYS.KELUARGA);
    const familyMembers = penduduk.filter(p => p.noKk === noKk);
    const count = familyMembers.length;

    if (count === 0) {
      const index = keluarga.findIndex(k => k.noKk === noKk);
      if (index !== -1) {
        const target = keluarga[index];
        const filtered = keluarga.filter(k => k.noKk !== noKk);
        this.saveItems(STORAGE_KEYS.KELUARGA, filtered, true);
        this.supDelete("keluarga", target.id);
      }
      return;
    }

    const index = keluarga.findIndex(k => k.noKk === noKk);
    const headOfFamily = familyMembers.find(p => p.statusHubungan === "Kepala Keluarga") || familyMembers[0];

    if (index !== -1) {
      keluarga[index].jumlahAnggota = count;
      if (headOfFamily) {
        keluarga[index].kepalaKeluargaId = headOfFamily.id;
        keluarga[index].kepalaKeluargaNama = headOfFamily.namaLengkap;
      }
      if (alamat && alamat.trim() !== "") {
        keluarga[index].alamat = alamat;
      }
      this.saveItems(STORAGE_KEYS.KELUARGA, keluarga, true);
      this.supUpsert("keluarga", keluarga[index]);
    } else {
      // Create new KK automatically
      const newKk: Keluarga = {
        id: "kk-" + Math.random().toString(36).substring(2, 9),
        noKk: noKk,
        kepalaKeluargaId: headOfFamily ? headOfFamily.id : "",
        kepalaKeluargaNama: headOfFamily ? headOfFamily.namaLengkap : "BELUM ADA KEPALA KELUARGA",
        alamat: (alamat && alamat.trim() !== "") ? alamat : "DUSUN I WARGALUYU",
        rw: headOfFamily ? headOfFamily.rw : "01",
        rt: headOfFamily ? headOfFamily.rt : "01",
        jumlahAnggota: count
      };
      keluarga.unshift(newKk);
      this.saveItems(STORAGE_KEYS.KELUARGA, keluarga, true);
      this.supUpsert("keluarga", newKk);
    }
  }

  // Bulk Seed/Reset Data for simulation
  resetDatabase(user: User): void {
    if (user.role !== "ADMIN_DESA") {
      throw new Error("Hanya Admin Desa yang dapat mereset ulang database!");
    }

    // Capture auto-backup before wiping in case they need to revert
    try {
      const backup: { [key: string]: string | null } = {};
      const keys = [
        STORAGE_KEYS.USERS,
        STORAGE_KEYS.KELUARGA,
        STORAGE_KEYS.PENDUDUK,
        STORAGE_KEYS.KELAHIRAN,
        STORAGE_KEYS.KEMATIAN,
        STORAGE_KEYS.MUTASI,
        STORAGE_KEYS.LOGS,
        STORAGE_KEYS.WILAYAH
      ];
      keys.forEach(k => {
        backup[k] = localStorage.getItem(k);
      });
      localStorage.setItem("sipenduk_backup_before_reset", JSON.stringify(backup));
    } catch (e) {
      console.warn("Gagal membuat cadangan pra-reset lokal:", e);
    }

    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.KELUARGA);
    localStorage.removeItem(STORAGE_KEYS.PENDUDUK);
    localStorage.removeItem(STORAGE_KEYS.KELAHIRAN);
    localStorage.removeItem(STORAGE_KEYS.KEMATIAN);
    localStorage.removeItem(STORAGE_KEYS.MUTASI);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.IS_INITIALIZED);
    localStorage.removeItem("sidewa_deleted_user_ids");
    this.init();
    this.addLog(user, "Melakukan reset database kependudukan ke kondisi awal.");
  }

  hasBackupBeforeReset(): boolean {
    const backupStr = localStorage.getItem("sipenduk_backup_before_reset");
    if (!backupStr) return false;
    try {
      const backup = JSON.parse(backupStr);
      // Ensure there's actually some content in the backup keys
      return Object.values(backup).some(v => v !== null && v !== "[]" && v !== "");
    } catch {
      return false;
    }
  }

  undoResetDatabase(user: User): boolean {
    if (user.role !== "ADMIN_DESA") {
      throw new Error("Hanya Admin Desa yang dapat memulihkan cadangan database!");
    }
    const backupStr = localStorage.getItem("sipenduk_backup_before_reset");
    if (!backupStr) {
      throw new Error("Tidak ditemukan data cadangan sebelum reset terakhir.");
    }

    try {
      const backup = JSON.parse(backupStr);
      Object.entries(backup).forEach(([key, val]) => {
        if (val !== null) {
          localStorage.setItem(key, val as string);
        } else {
          localStorage.removeItem(key);
        }
      });
      // Also restore initialized marker
      localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, "true");
      // Remove backup key once restored to prevent redundant undo
      localStorage.removeItem("sipenduk_backup_before_reset");

      this.addLog(user, "Membatalkan reset database kependudukan dan memulihkan data sebelum reset.");
      return true;
    } catch (e: any) {
      throw new Error("Gagal mengurai atau menerapkan data cadangan: " + e.message);
    }
  }

  // Under-the-hood direct store accessor helpers
  private getItems<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private getTableNameFromKey(key: string): string {
    switch (key) {
      case STORAGE_KEYS.USERS: return "users";
      case STORAGE_KEYS.KELUARGA: return "keluarga";
      case STORAGE_KEYS.PENDUDUK: return "penduduk";
      case STORAGE_KEYS.KELAHIRAN: return "kelahiran";
      case STORAGE_KEYS.KEMATIAN: return "kematian";
      case STORAGE_KEYS.MUTASI: return "mutasi";
      case STORAGE_KEYS.LOGS: return "logs";
      case STORAGE_KEYS.WILAYAH: return "wilayah";
      default: return "";
    }
  }

  private saveItems<T>(key: string, items: T[], isLocalWrite = false): void {
    localStorage.setItem(key, JSON.stringify(items));
    const tableName = this.getTableNameFromKey(key);
    if (tableName && isLocalWrite) {
      this.lastLocalWriteTimestamps[tableName] = Date.now();
    }
  }
}

export const db = new MockSupabaseClient();
