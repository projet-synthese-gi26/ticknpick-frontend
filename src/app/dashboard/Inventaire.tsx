'use client';

import React, { useState, useMemo, useEffect, useCallback, MouseEvent } from 'react';
import { Package, Search, Filter, Eye, CheckCircle, AlertTriangle, X, MapPin, Phone, User, Barcode, Send, Archive, Receipt, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
type ParcelStatus = 'En attente' | 'Reçu' | 'Retiré';
type ParcelType = 'Standard' | 'Express';

interface Parcel {
  id: string;
  status: ParcelStatus;
  type: ParcelType;
  arrivalDate: string;
  withdrawalDate?: string;
  location: string;
  designation: string;
  sender: { name: string; phone: string; company?: string; originAddress: string; };
  recipient: { name: string; phone: string; deliveryAddress: string; };
}

const initialParcels: Parcel[] = [
  { id: 'PKD-85743', status: 'Reçu', type: 'Express', arrivalDate: '2025-07-28T10:30:00Z', location: 'A12-3B', designation: 'Pièces électroniques pour ordinateur', sender: { name: 'Jumia Cameroon', phone: '+237 678 111 222', originAddress: 'Douala, Akwa' }, recipient: { name: 'Ndongo Jean Pierre', phone: '+237 678 123 456', deliveryAddress: 'Yaoundé, Centre-ville' } },
  { id: 'PKD-92384', status: 'En attente', type: 'Standard', arrivalDate: '2025-07-27T15:00:00Z', location: 'C04-1A', designation: 'Commande de repas Glovo', sender: { name: 'Glovo Express', phone: '+237 699 333 444', originAddress: 'Yaoundé, Bastos' }, recipient: { name: 'Mballa Marie Claire', phone: '+237 699 876 543', deliveryAddress: 'Yaoundé, Mvan' } },
  { id: 'PKD-10398', status: 'Retiré', type: 'Standard', arrivalDate: '2025-07-26T09:15:00Z', withdrawalDate: '2025-07-28T14:00:00Z', location: 'B07-2C', designation: 'Livres et manuels scolaires', sender: { name: 'Amazon Global', phone: '+1 888 280 4331', originAddress: 'USA' }, recipient: { name: 'Fouda Paul Martin', phone: '+237 677 234 567', deliveryAddress: 'Yaoundé, Biyem-Assi' } },
  { id: 'PKD-58271', status: 'En attente', type: 'Standard', arrivalDate: '2025-07-28T11:45:00Z', location: 'RECEPT-01', designation: 'Gadgets électroniques divers', sender: { name: 'AliExpress', phone: '+86 571 8502 2088', originAddress: 'Chine' }, recipient: { name: 'Awono Alice Lemoine', phone: '+237 654 321 987', deliveryAddress: 'Yaoundé, Omnisports' } },
  { id: 'PKD-63209', status: 'Reçu', type: 'Express', arrivalDate: '2025-07-25T16:20:00Z', location: 'D15-4A', designation: 'Articles de mode', sender: { name: 'Cdiscount', phone: '+33 9 70 80 90 50', originAddress: 'France' }, recipient: { name: 'Biya Lucas Bernard', phone: '+237 698 765 432', deliveryAddress: 'Yaoundé, Nlongkak' } }
];

const getStatusConfig = (status: ParcelStatus) => {
  switch (status) {
    case 'En attente': return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    case 'Reçu': return { icon: Archive, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    case 'Retiré': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    default: return { icon: Package, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
  }
};

interface ContextMenuProps {
  x: number; y: number; parcel: Parcel; onClose: () => void;
  onRegisterArrival: (id: string) => void; onRegisterWithdrawal: (id: string) => void; onViewDetails: (parcel: Parcel) => void;
}

const ContextMenu = ({ x, y, parcel, onClose, onRegisterArrival, onRegisterWithdrawal, onViewDetails }: ContextMenuProps) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  const menuItems = [];
  if (parcel.status === 'En attente') {
    menuItems.push(<button key="depot" onClick={() => onRegisterArrival(parcel.id)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"><Send className="w-4 h-4 text-blue-500" /><span>Enregistrer le Dépôt</span></button>);
  } else if (parcel.status === 'Reçu') {
    menuItems.push(<button key="retrait" onClick={() => onRegisterWithdrawal(parcel.id)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 flex items-center space-x-3 transition-colors"><CheckCircle className="w-4 h-4 text-green-500" /><span>Enregistrer le Retrait</span></button>);
  }
  menuItems.push(
    <button key="details" onClick={() => onViewDetails(parcel)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"><Eye className="w-4 h-4 text-gray-500" /><span>Voir les Détails</span></button>,
    <button key="facture" onClick={onClose} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"><Receipt className="w-4 h-4 text-gray-500" /><span>Imprimer Facture</span></button>
  );

  return (
    <div ref={menuRef} style={{ top: y, left: x }} className="absolute z-50 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 backdrop-blur-sm">
      {menuItems}
    </div>
  );
};

interface DetailsModalProps {
  parcel: Parcel | null; onClose: () => void;
}

const DetailsModal = ({ parcel, onClose }: DetailsModalProps) => {
  if (!parcel) return null;
  const { icon: StatusIcon, color, bg } = getStatusConfig(parcel.status);
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-2xl ${bg}`}><Barcode className={`w-8 h-8 ${color}`} /></div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Détails du Colis</h2>
                <span className="font-mono text-lg text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">{parcel.id}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6"/></button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl ${bg} ${getStatusConfig(parcel.status).border} border-2`}>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Statut Actuel</h3>
              <div className="flex items-center space-x-3">
                <StatusIcon className={`w-8 h-8 ${color}`} />
                <span className={`text-xl font-bold ${color}`}>{parcel.status}</span>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-purple-50 border-2 border-purple-200">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Localisation</h3>
              <div className="flex items-center space-x-3">
                <MapPin className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-purple-800 font-mono">{parcel.location}</span>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-200">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Type Service</h3>
              <div className="flex items-center space-x-3">
                {parcel.type === 'Express' ? <Star className="w-8 h-8 text-amber-600" /> : <Package className="w-8 h-8 text-amber-600" />}
                <span className="text-xl font-bold text-amber-800">{parcel.type}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-bold text-xl text-gray-800 border-b border-gray-200 pb-3">Informations Générales</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm font-semibold text-gray-500 mb-1">Désignation</p>
                  <p className="font-semibold text-gray-800">{parcel.designation}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Arrivée</p>
                    <p className="font-semibold text-gray-800">{new Date(parcel.arrivalDate).toLocaleDateString('fr-FR')}</p>
                    <p className="text-sm text-gray-600">{new Date(parcel.arrivalDate).toLocaleTimeString('fr-FR')}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Retrait</p>
                    <p className="font-semibold text-gray-800">{parcel.withdrawalDate ? new Date(parcel.withdrawalDate).toLocaleDateString('fr-FR') : 'Non retiré'}</p>
                    {parcel.withdrawalDate && <p className="text-sm text-gray-600">{new Date(parcel.withdrawalDate).toLocaleTimeString('fr-FR')}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-xl text-gray-800 border-b border-gray-200 pb-3">Contacts</h3>
              <div className="space-y-6">
                <div className="p-6 border-2 border-blue-100 rounded-2xl bg-blue-50/30">
                  <h4 className="font-bold text-lg flex items-center space-x-2 text-blue-800 mb-4">
                    <User className="w-5 h-5" /><span>Expéditeur</span>
                  </h4>
                  <div className="space-y-3">
                    <p className="font-semibold text-gray-900">{parcel.sender.name}</p>
                    {parcel.sender.company && <p className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-lg inline-block">{parcel.sender.company}</p>}
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Phone className="w-4 h-4" /><span>{parcel.sender.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <MapPin className="w-4 h-4" /><span>{parcel.sender.originAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-2 border-green-100 rounded-2xl bg-green-50/30">
                  <h4 className="font-bold text-lg flex items-center space-x-2 text-green-800 mb-4">
                    <User className="w-5 h-5" /><span>Destinataire</span>
                  </h4>
                  <div className="space-y-3">
                    <p className="font-semibold text-gray-900">{parcel.recipient.name}</p>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Phone className="w-4 h-4" /><span>{parcel.recipient.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <MapPin className="w-4 h-4" /><span>{parcel.recipient.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Le nom de la clé pour le localStorage
const INVENTORY_STORAGE_KEY = 'inventory_parcels';

export default function InventoryPage() {
    const router = useRouter(); // Instancier le router
    const [parcels, setParcels] = useState<Parcel[]>(() => {
    if (typeof window !== 'undefined') {
      const savedParcels = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (savedParcels) {
        return JSON.parse(savedParcels);
      }
    }
    return initialParcels;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParcelStatus | 'Tous'>('Tous');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, parcel: Parcel } | null>(null);

  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = p.id.toLowerCase().includes(searchLower) || p.sender.name.toLowerCase().includes(searchLower) || p.recipient.name.toLowerCase().includes(searchLower) || p.designation.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'Tous' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());
  }, [parcels, searchQuery, statusFilter]);

    // MODIFIÉ : Sauvegarder les modifications des colis dans le localStorage
  useEffect(() => {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(parcels));
  }, [parcels]);

  const statusCounts = useMemo(() => {
    return parcels.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {} as Record<ParcelStatus, number>);
  }, [parcels]);

  const handleRightClick = (event: MouseEvent<HTMLTableRowElement>, parcel: Parcel) => {
    event.preventDefault();
    setContextMenu({ x: event.pageX, y: event.pageY, parcel });
  };

  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  
  // MODIFIÉ : Cette fonction ne met plus à jour le statut, elle redirige.
  const handleRegisterArrival = useCallback((id: string) => {
    // 1. Stocker l'instruction et l'ID du colis dans localStorage
    // Cela indique à la page /envoyer de pré-remplir le formulaire de dépôt.
    localStorage.setItem('redirect_to_deposit', JSON.stringify({ packageId: id }));

    // 2. Rediriger vers la page d'enregistrement
    router.push('/emit-package');

    // 3. Fermer le menu contextuel
    closeContextMenu();
  }, [router, closeContextMenu]); // Ajouter les dépendances au useCallback
  
    // MODIFIÉ : Cette fonction redirige maintenant vers la page de retrait.
  const handleRegisterWithdrawal = useCallback((id: string) => {
    // 1. Stocker l'instruction et l'ID du colis dans localStorage
    localStorage.setItem('redirect_to_withdrawal', JSON.stringify({ packageId: id }));

    // 2. Rediriger vers la page de retrait des colis
    // Assurez-vous que le chemin est correct pour votre projet.
    router.push('/withdraw-package'); // Par exemple, si votre page de retrait est à cette URL

    // 3. Fermer le menu
    closeContextMenu();
  }, [router, closeContextMenu]);

  const viewDetails = (parcel: Parcel) => { setSelectedParcel(parcel); setIsModalOpen(true); closeContextMenu(); };
  const closeModal = () => { setIsModalOpen(false); setSelectedParcel(null); };
  
  


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} parcel={contextMenu.parcel} onClose={closeContextMenu} onRegisterArrival={handleRegisterArrival} onRegisterWithdrawal={handleRegisterWithdrawal} onViewDetails={viewDetails} />}
      {isModalOpen && <DetailsModal parcel={selectedParcel} onClose={closeModal} />}

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold text-gray-600">Total Colis</p><p className="text-3xl font-bold text-gray-900">{parcels.length}</p></div>
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-6 rounded-2xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div><p className="text-orange-100 font-semibold">En Attente</p><p className="text-3xl font-bold">{statusCounts['En attente'] || 0}</p></div>
              <AlertTriangle className="w-12 h-12 text-orange-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 p-6 rounded-2xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div><p className="text-blue-100 font-semibold">Reçus</p><p className="text-3xl font-bold">{statusCounts['Reçu'] || 0}</p></div>
              <Archive className="w-12 h-12 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-500 p-6 rounded-2xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div><p className="text-green-100 font-semibold">Retirés</p><p className="text-3xl font-bold">{statusCounts['Retiré'] || 0}</p></div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-2xl text-gray-900">Suivi des Colis</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Rechercher par code, nom ou désignation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/80" />
                </div>
                <div className="relative w-full sm:w-auto">
                  <Filter className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="pl-12 pr-8 py-3 w-full border border-gray-200 rounded-2xl appearance-none focus:ring-2 focus:ring-blue-500 bg-white/80">
                    <option value="Tous">Tous les statuts</option>
                    <option value="En attente">En attente</option>
                    <option value="Reçu">Reçu</option>
                    <option value="Retiré">Retiré</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Code Colis</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Désignation</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Expéditeur/Destinataire</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Arrivée</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredParcels.map((parcel) => {
                  const { icon: StatusIcon, color, bg, border } = getStatusConfig(parcel.status);
                  return (
                    <tr key={parcel.id} className="hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group" onContextMenu={(e) => handleRightClick(e, parcel)}>
                      <td className="px-6 py-4" onClick={() => viewDetails(parcel)}>
                        <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{parcel.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border-2 ${bg} ${color} ${border}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span>{parcel.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{parcel.designation}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${parcel.type === 'Express' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                              {parcel.type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-bold text-gray-900">{parcel.recipient.name}</p>
                          <p className="text-gray-600">← <span className="font-semibold">{parcel.sender.name}</span></p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{new Date(parcel.arrivalDate).toLocaleDateString('fr-FR')}</p>
                          <p className="text-xs text-gray-500">{new Date(parcel.arrivalDate).toLocaleTimeString('fr-FR')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => viewDetails(parcel)} className="text-gray-400 hover:text-blue-600 p-3 rounded-full hover:bg-blue-50 transition-all group-hover:scale-110">
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredParcels.length === 0 && (
              <div className="text-center py-20 px-6">
                <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-xl text-gray-700 mb-2">Aucun colis trouvé</h3>
                <p className="text-gray-500">Modifiez vos critères de recherche ou vos filtres.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}