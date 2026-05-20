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

  title: "CHJ",

  description: "CHJ personal website",

  icons: {
    icon: "/chj-icon-20260520.png?v=5",
    shortcut: "/chj-icon-20260520.png?v=5",
    apple: [
      {
        url: "/apple-touch-icon.png?v=5",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/chj-icon-20260520.png?v=5",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {

    title: "CHJ",

    capable: true,

    statusBarStyle: "default",

  },

};

export default function RootLayout({

  children,

}: {

  children: React.ReactNode;

}) {

  return (

    <html lang="en">

      <head>

        <link rel="apple-touch-icon" sizes="180x180" href="/chj-icon-20260520.png?v=9" />

        <link rel="icon" type="image/png" sizes="180x180" href="/chj-icon-20260520.png?v=9" />

        <link rel="shortcut icon" href="/chj-icon-20260520.png?v=9" />

        <meta name="apple-mobile-web-app-title" content="CHJ" />

        <meta name="apple-mobile-web-app-capable" content="yes" />

      </head>

      <body>{children}</body>

    </html>

  );

}
