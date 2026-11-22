import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GTA Indonesia by Ahmad Alvin Griffin (Vinsky)",
  description:
    "Game 3D Open-World berlatar kota Jakarta & Jabodetabek nyata (OpenStreetMap), mobil high-poly realistis, klakson telolet, Live Street View gratis, dan Radio Jakarta — karya Ahmad Alvin Griffin (Vinsky).",
  openGraph: {
    title: "GTA Indonesia by Ahmad Alvin Griffin (Vinsky)",
    description:
      "Jelajahi Bundaran HI, Sudirman–SCBD, Semanggi, Pondok Indah, PIK, BSD & Sentul dalam game 3D Open-World gratis untuk HP & Laptop.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#07080f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#07080f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
