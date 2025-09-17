import type { Metadata } from 'next'
import './globals.css'
// Importez le provider et le composant de bannière
import { NotificationProvider } from '../context/NotificationContext';
import NotificationBanner from '../components/NotificationBanner';
import CookieBanner from '@/components/CookieBanner';


export const metadata: Metadata = {
  title: 'PicknDrop Link',
  description: 'Application de gestion logistique pour dépôt,  et retrait de colis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        {/* Enrobez votre application avec le Provider */}
        <NotificationProvider>
          <main className="min-h-screen">
            {children}
          </main>
          {/* Affichez la bannière ici */}
          <NotificationBanner />
          <CookieBanner />
        </NotificationProvider>
      </body>
    </html>
  )
}