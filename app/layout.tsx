import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Garden OS",
  description: "Your garden’s operating system. Grow Smarter. Harvest Better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var m=new Date().getMonth();var s=m>=2&&m<=4?'spring':m>=5&&m<=7?'summer':m>=8&&m<=10?'fall':'winter';try{var t=localStorage.getItem('garden-os-season');if(['spring','summer','fall','winter'].includes(t))s=t;}catch(e){}document.documentElement.dataset.season=s;})()` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
