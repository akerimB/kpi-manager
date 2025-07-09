import type { Metadata } from "next";
import "./globals.css";

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
          {children}
        </div>
      </body>
    </html>
  );
}
