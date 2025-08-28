'use client';
import React from 'react';
import Link from 'next/link';
import { Package, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">PicknDrop</span>
            </div>
            <p className="text-gray-400">La solution simple et fiable pour tous vos envois de colis au Cameroun.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link href="/expedition" className="text-gray-400 hover:text-white transition-colors">Envoyer un colis</Link></li>
              <li><Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">Comment ça marche</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Espace PRO</Link></li>
              <li><Link href="/tracking" className="text-gray-400 hover:text-white transition-colors">Suivre un colis</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Légal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Conditions Générales</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Politique de Confidentialité</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Suivez-nous</h3>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="w-6 h-6" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="w-6 h-6" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram className="w-6 h-6" /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} PicknDrop Cameroun. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}