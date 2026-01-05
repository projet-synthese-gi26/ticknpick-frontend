// FICHIER: src/app/layout.tsx

import type { Metadata } from 'next'
import './globals.css'
import { NotificationProvider } from '../context/NotificationContext';
import NotificationBanner from '../components/NotificationBanner';
import CookieBanner from '@/components/CookieBanner';
// IMPORTATION
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'TiiBnTick Link',
  description: 'Application de gestion logistique...',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* ENROBER NotificationProvider avec AuthProvider */}
        <AuthProvider>
          <NotificationProvider>
            <main>{children}</main>
            <NotificationBanner />
            <CookieBanner />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}