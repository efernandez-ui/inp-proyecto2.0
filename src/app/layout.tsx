import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BotmakerWebchat from '@/components/BotmakerWebchat'
import FloatingAnnouncement from '@/components/FloatingAnnouncement'
import { Providers } from '@/components/Providers'
import { ToastContainer } from 'react-toastify';
import CarritoSoloLecturaModal from '@/components/cart/CarritoSoloLecturaModal';
import 'react-toastify/dist/ReactToastify.css';
import { TOAST_Z_INDEX } from '@/components/modals/modalStack';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tienda Virtual INTERCAP",
  description: "Repuestos y accesorios para motos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Navbar />
          <main className="flex flex-grow flex-col bg-gray-50">
            {children}
          </main>
          <Footer />
          <FloatingAnnouncement />
          <CarritoSoloLecturaModal />
          <BotmakerWebchat />
          <ToastContainer style={{ zIndex: TOAST_Z_INDEX }} />
        </Providers>
      </body>
    </html>
  );
}
