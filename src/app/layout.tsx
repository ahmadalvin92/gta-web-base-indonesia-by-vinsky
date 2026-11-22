import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GTA Indonesia by Ahmad Alvin Griffin (Vinsky)",
  description:
    "Game 3D Open-World Ultra-Realistic berlatar peta Jabodetabek nyata (OpenStreetMap), fisika mengemudi CDID, klakson telolet, Google Street View gratis, dan portal mini-games — karya Ahmad Alvin Griffin (Vinsky).",
  openGraph: {
    title: "GTA Indonesia by Ahmad Alvin Griffin (Vinsky)",
    description:
      "Jelajahi Bundaran HI, SCBD, PIK, BSD, Sentul & Bekasi dalam game web 3D Open-World 100% gratis untuk HP & Laptop.",
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
      <body className="bg-[#07080f] text-white antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
