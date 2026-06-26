/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "ADMIN_DESA" | "KETUA_RW" | "KETUA_RT";

export interface User {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  rw?: string; // RW identifier (e.g. "01")
  rt?: string; // RT identifier (e.g. "01")
  avatar?: string;
  password?: string; // Optional password field
}

export interface Keluarga {
  id: string;
  noKk: string;
  kepalaKeluargaId: string; // references Penduduk.id
  kepalaKeluargaNama: string; // cached for speed
  alamat: string;
  rw: string; // RW (e.g. "01", "02")
  rt: string; // RT (e.g. "01", "02", "03")
  jumlahAnggota: number;
}

export type JenisKelamin = "L" | "P";

export interface Penduduk {
  id: string;
  nik: string;
  noKk: string; // References Keluarga.noKk
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  jenisKelamin: JenisKelamin;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  statusPerkawinan: string;
  statusHubungan: string; // Status Hubungan Dalam Keluarga
  kewarganegaraan: "WNI" | "WNA";
  noHp: string;
  statusTinggal: "Tetap" | "Kontrak" | "Sementara";
  rw: string;
  rt: string;
  avatar?: string;
  tanggalInput: string;
}

export interface Kelahiran {
  id: string;
  nikBayi: string; // Can be dummy if not yet generated, or empty
  namaBayi: string;
  namaAyah: string;
  namaIbu: string;
  tanggalLahir: string;
  rw: string;
  rt: string;
  tanggalInput: string;
}

export interface Kematian {
  id: string;
  nik: string;
  nama: string;
  tanggalMeninggal: string;
  sebabKematian: string;
  rw: string;
  rt: string;
  tanggalInput: string;
}

export type TipeMutasi = "Datang" | "Pindah";

export interface Mutasi {
  id: string;
  jenisMutasi: TipeMutasi;
  nik: string;
  nama: string;
  alamatAsal: string;
  alamatTujuan: string;
  tanggalMutasi: string;
  rw: string;
  rt: string;
  tanggalInput: string;
}

export interface AktivitasLog {
  id: string;
  userId: string;
  username: string;
  nama: string;
  role: UserRole;
  deskripsi: string;
  timestamp: string; // ISO String
}

export interface WilayahRw {
  id: string;
  nomor: string;
  rts: string[];
}

export interface Dusun {
  id: string;
  nama: string;
  rws: WilayahRw[];
}
