import type { Metadata } from "next";
import "./globals.css";
import Topbar from '@/components/ui/topbar'
import Sidebar from '@/components/ui/sidebar'

export const metadata: Metadata = {
  title: "KPI Manager - Model Fabrika Strateji Yönetimi",
  description: "Model Fabrika strateji ve KPI takip sistemi",
  keywords: "KPI, Model Fabrika, Strateji, Yalın, Dijital, Yeşil, Dirençlilik",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased min-h-screen bg-gray-50">
        <div className="flex flex-col min-h-screen">
          <Topbar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
