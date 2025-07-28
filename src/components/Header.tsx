import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            LogistiColis
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/emit-package" className="text-gray-600 hover:text-blue-600 transition-colors">
              Émettre
            </Link>
            <Link href="/register-delivery-point" className="text-gray-600 hover:text-blue-600 transition-colors">
              Point de livraison
            </Link>
            <Link href="/receive-package" className="text-gray-600 hover:text-blue-600 transition-colors">
              Recevoir
            </Link>
            <Link href="/withdraw-package" className="text-gray-600 hover:text-blue-600 transition-colors">
              Retirer
            </Link>
            <Link href="/payment" className="text-gray-600 hover:text-blue-600 transition-colors">
              Payer
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Connexion
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
