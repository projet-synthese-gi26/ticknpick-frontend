import type { Metadata } from 'next'
import './globals.css'
import FloatingBackButton from '../components/BackButton'

export const metadata: Metadata = {
  title: 'PicknDrop Point',
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
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
