"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Car,
  Gamepad2,
  Keyboard,
  Smartphone,
  ShieldAlert,
  X,
  Radio,
  MapPin,
  Fuel,
} from "lucide-react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [tab, setTab] = useState<"controls" | "city" | "gta">("controls");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-pink-500/40 bg-slate-950/95 text-white shadow-2xl shadow-pink-500/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-orange-500/20 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-pink-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide">
                PANDUAN BERMAIN & FITUR LENGKAP
              </h2>
              <p className="text-[11px] text-cyan-300">
                GTA Indonesia by Ahmad Alvin Griffin (Vinsky)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-slate-300 hover:bg-red-500 hover:text-white transition"
            aria-label="Tutup Panduan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="grid grid-cols-3 gap-1.5 border-b border-white/10 bg-slate-900/90 p-2">
          <button
            onClick={() => setTab("controls")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs sm:text-sm font-bold transition ${
              tab === "controls"
                ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <Keyboard className="h-4 w-4" />
            <span>Kontrol PC & HP</span>
          </button>
          <button
            onClick={() => setTab("city")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs sm:text-sm font-bold transition ${
              tab === "city"
                ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <Car className="h-4 w-4" />
            <span>Kota Jakarta & CDID</span>
          </button>
          <button
            onClick={() => setTab("gta")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs sm:text-sm font-bold transition ${
              tab === "gta"
                ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span>Aksi GTA & Mini-Games</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm">
          {tab === "controls" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-500/30 bg-slate-900/80 p-4">
                <h3 className="flex items-center gap-2 font-black text-orange-300 mb-3">
                  <Keyboard className="h-4 w-4" /> Kontrol Laptop / PC (Keyboard & Mouse)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    ["W / A / S / D atau Panah", "Gas, Mundur, Belok / Jalan Kaki"],
                    ["Space", "Rem Tangan (Drift) / Lompat Parkour"],
                    ["Shift", "Nitro Boost / Lari Cepat"],
                    ["F", "Masuk / Keluar Mobil"],
                    ["C", "Ganti Kamera (Chase / Hood / Cockpit)"],
                    ["Q / E / Z", "Lampu Sein Kiri / Kanan / Hazard"],
                    ["H", "Klakson Telolet Basuri V3"],
                    ["R", "Ganti Channel Radio Jakarta Live"],
                    ["L", "Nyalakan / Matikan Lampu Utama"],
                    ["P", "Buka Smartphone Karakter & GPS"],
                    ["Klik Kiri Mouse", "Tembak Senjata (Saat Jalan Kaki)"],
                    ["ESC", "Menu Pause & Sakelar Mode HP/Laptop"],
                  ].map(([k, desc]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between gap-2 rounded-xl bg-black/40 px-3 py-2 border border-white/5"
                    >
                      <kbd className="rounded bg-pink-500/20 border border-pink-400/40 px-2 py-0.5 font-mono font-bold text-pink-200 shrink-0">
                        {k}
                      </kbd>
                      <span className="text-right text-slate-300">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4">
                <h3 className="flex items-center gap-2 font-black text-cyan-300 mb-2">
                  <Smartphone className="h-4 w-4" /> Kontrol HP / Tablet (Layar Sentuh)
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-5">
                  <li>
                    <strong>Virtual Analog Joystick (Kiri Bawah):</strong> Geser jari untuk menyetir mobil atau menggerakkan karakter ke segala arah.
                  </li>
                  <li>
                    <strong>Pedal GAS & REM (Kanan Bawah):</strong> Tahan pedal untuk melaju atau mengerem/drift (berubah menjadi tombol Maju & Lompat saat jalan kaki).
                  </li>
                  <li>
                    <strong>Tombol NITRO, TELOLET, KELUAR/MASUK & TEMBAK:</strong> Tersedia instan di sebelah kanan layar saat Mode HP aktif.
                  </li>
                  <li>
                    Gunakan pemilih perangkat di <strong>Menu Utama</strong> atau <strong>Pause (ESC)</strong> untuk beralih antara Mode Auto, HP, dan Laptop kapan saja.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {tab === "city" && (
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-2">
                <h3 className="flex items-center gap-2 font-black text-pink-400">
                  <Car className="h-4 w-4" /> Garasi Mobil Indonesia & Bengkel Modif CDID
                </h3>
                <p className="text-slate-300">
                  Buka HP Karakter (tekan <kbd className="rounded bg-white/15 px-1.5">P</kbd> atau klik tombol <strong>HP / GPS</strong>) lalu masuk ke tab <strong>Garasi</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
                  <li>Spawn instan mobil jalanan Indonesia & Eropa: <strong>Toyota Avanza, Kijang Innova, Mercedes-Benz C/E-Class, BMW M4/3-Series, Honda Civic Type-R, Taksi Bluebird, Bus TransJakarta, Angkot Mikrolet, Polisi PJR, Supercar, Jet,</strong> dan <strong>Speedboat PIK</strong>.</li>
                  <li>Modifikasi langsung di <strong>Bengkel Modif</strong>: ubah warna cat metalik, warna velg alloy racing, aktifkan neon kolong, pasang pelat nomor Jakarta custom (<code>B 1 VKY</code>), dan upgrade mesin hingga Stage 3.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-2">
                <h3 className="flex items-center gap-2 font-black text-emerald-400">
                  <Fuel className="h-4 w-4" /> SPBU Pertamina & Rute Nyata Jakarta (.GeoJSON)
                </h3>
                <p className="text-slate-300 text-xs">
                  Tata letak jalan Sudirman–Bundaran HI–SCBD–Semanggi–Blok M–Pondok Indah mengikuti koordinat asli OpenStreetMap. Kendarai mobil melewati zona hijau di <strong>SPBU Pertamina</strong> untuk isi bensin 100% dan perbaikan bodi otomatis, dan patuhi lampu merah persimpangan bersama 30+ lalu lintas AI Jakarta!
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-2">
                <h3 className="flex items-center gap-2 font-black text-cyan-400">
                  <MapPin className="h-4 w-4" /> Live Street View & Screenshot Jakarta
                </h3>
                <p className="text-slate-300 text-xs">
                  Tab <strong>GPS / Street View</strong> di HP menampilkan koordinat GPS nyata, foto lokasi sekitar Jakarta yang berubah otomatis saat berkendara, tombol <strong>Ambil Foto / Screenshot Jakarta (.PNG)</strong> ber-watermark resmi, serta tombol <strong>Buka Google Street View 360°</strong> tanpa API Key.
                </p>
              </div>
            </div>
          )}

          {tab === "gta" && (
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="rounded-2xl border border-red-500/30 bg-slate-900/80 p-4 space-y-1.5">
                <h3 className="flex items-center gap-2 font-black text-red-400">
                  <ShieldAlert className="h-4 w-4" /> Wanted Level Bintang 1–5 & Balap Liar
                </h3>
                <p className="text-slate-300 text-xs">
                  Keluar dari mobil (<kbd className="rounded bg-white/15 px-1">F</kbd>) dan menembak di jalanan memicu <strong>Wanted Level Bintang 1–5</strong>. Mobil Polisi PJR Korlantas dengan sirine merah-biru akan mengejarmu! Buka tab <strong>Dunia</strong> di HP untuk memulai <strong>Balap Liar Sudirman/Sentul</strong> berhadiah <strong>$15.000</strong> atau membersihkan status buronan polisi.
                </p>
              </div>

              <div className="rounded-2xl border border-pink-500/30 bg-slate-900/80 p-4 space-y-1.5">
                <h3 className="flex items-center gap-2 font-black text-pink-300">
                  <Radio className="h-4 w-4" /> Radio Jakarta Live & Upload MP3 Sendiri
                </h3>
                <p className="text-slate-300 text-xs">
                  Tekan <kbd className="rounded bg-white/15 px-1">R</kbd> atau gunakan <strong>Head Unit Radio</strong> di layar mobil/HP untuk mendengarkan <strong>Prambors FM, Hard Rock FM, Delta FM, Gen FM, Elshinta, I-Radio</strong>, playlist lokal offline-safe, atau klik <strong>Upload MP3</strong> untuk memutar lagu favorit dari HP/laptopmu sendiri!
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4 space-y-1.5">
                <h3 className="flex items-center gap-2 font-black text-cyan-300">
                  <Gamepad2 className="h-4 w-4" /> 3 Mini-Games Berhadiah ($) di HP Karakter
                </h3>
                <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                  <li><strong>Neon Cyber Snake:</strong> Kumpulkan neon orb & raih $40 per poin.</li>
                  <li><strong>Urban Warzone FPS:</strong> Lawan bot bersenjata di arena Jakarta ($1.500/kill).</li>
                  <li><strong>Sentul Drag Race 402m:</strong> Balap drag 402m oper gigi manual + NOS berhadiah $12.000!</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-slate-900/90 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-2 text-sm font-black text-white shadow-lg hover:brightness-110 transition"
          >
            Siap Bermain!
          </button>
        </div>
      </div>
    </div>
  );
};
