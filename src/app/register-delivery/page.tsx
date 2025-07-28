'use client';
import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowRightIcon,
  Package2Icon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  PhoneIcon,
  MapPinIcon,
  CubeIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { Package, Sparkles, AlertTriangle, Search, Filter, PackageCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';

type PackageStatus = 'En attente' | 'A expedier' | 'Retiré';

interface PackageInfo {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  departurePoint: string;
  arrivalPoint: string;
  description: string;
  weight: string;
  declaredValue?: string;
  isFragile: boolean;
  isPerishable: boolean;
  isInsured: boolean;
  status: PackageStatus;
  createdAt: string;
  lastUpdated: string;
}

const WarehouseInventory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'Tous'>('Tous');
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Données mockées pour la démonstration
  const [packages, setPackages] = useState<PackageInfo[]>([
    {
      id: '1',
      trackingNumber: 'PDL001ABC',
      senderName: 'Alice Mbarga',
      senderPhone: '+237 699000001',
      recipientName: 'Bob Nkomo',
      recipientPhone: '+237 677000002',
      departurePoint: 'Relais Mvan',
      arrivalPoint: 'Relais Bonamoussadi',
      description: 'Documents importants',
      weight: '2.5',
      declaredValue: '25000',
      isFragile: false,
      isPerishable: false,
      isInsured: true,
      status: 'En attente',
      createdAt: '2025-01-25',
      lastUpdated: '2025-01-25'
    },
    {
      id: '2',
      trackingNumber: 'PDL002XYZ',
      senderName: 'Charles Fotso',
      senderPhone: '+237 655000003',
      recipientName: 'Diana Kouam',
      recipientPhone: '+237 688000004',
      departurePoint: 'Relais Omnisport',
      arrivalPoint: 'Relais Makepe',
      description: 'Vêtements pour enfants',
      weight: '1.2',
      isFragile: true,
      isPerishable: false,
      isInsured: false,
      status: 'A expedier',
      createdAt: '2025-01-24',
      lastUpdated: '2025-01-25'
    },
    {
      id: '3',
      trackingNumber: 'PDL003DEF',
      senderName: 'Eve Payeur',
      senderPhone: '+237 650123456',
      recipientName: 'Frank Destin',
      recipientPhone: '+237 670654321',
      departurePoint: 'Relais Logpom',
      arrivalPoint: 'Relais Deido',
      description: 'Électronique fragile',
      weight: '1.8',
      declaredValue: '150000',
      isFragile: true,
      isPerishable: false,
      isInsured: true,
      status: 'Retiré',
      createdAt: '2025-01-23',
      lastUpdated: '2025-01-25'
    },
    {
      id: '4',
      trackingNumber: 'PDL004GHI',
      senderName: 'Grace Expéditeur',
      senderPhone: '+237 660987654',
      recipientName: 'Henri Bénéficiaire',
      recipientPhone: '+237 680123789',
      departurePoint: 'Relais Biyem-Assi',
      arrivalPoint: 'Relais Akwa',
      description: 'Produits alimentaires',
      weight: '3.0',
      isFragile: false,
      isPerishable: true,
      isInsured: false,
      status: 'En attente',
      createdAt: '2025-01-25',
      lastUpdated: '2025-01-25'
    },
    {
      id: '5',
      trackingNumber: 'PDL005JKL',
      senderName: 'Isaac Vendeur',
      senderPhone: '+237 645678901',
      recipientName: 'Julie Acheteuse',
      recipientPhone: '+237 675432109',
      departurePoint: 'Relais Tsinga',
      arrivalPoint: 'Relais Emombo',
      description: 'Livre et matériel éducatif',
      weight: '0.8',
      declaredValue: '15000',
      isFragile: false,
      isPerishable: false,
      isInsured: true,
      status: 'A expedier',
      createdAt: '2025-01-24',
      lastUpdated: '2025-01-25'
    }
  ]);

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const matchesSearch = searchQuery === '' || 
        pkg.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'Tous' || pkg.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [packages, searchQuery, statusFilter]);

  const getStatusConfig = (status: PackageStatus) => {
    switch (status) {
      case 'En attente':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: ClockIcon,
          bgClass: 'bg-yellow-50'
        };
      case 'A expedier':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: TruckIcon,
          bgClass: 'bg-blue-50'
        };
      case 'Retiré':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircleIcon,
          bgClass: 'bg-green-50'
        };
    }
  };

  const getNextStatus = (currentStatus: PackageStatus): PackageStatus | null => {
    switch (currentStatus) {
      case 'En attente':
        return 'A expedier';
      case 'A expedier':
        return 'Retiré';
      case 'Retiré':
        return null;
      default:
        return null;
    }
  };

  const updatePackageStatus = (packageId: string) => {
    setPackages(prevPackages => 
      prevPackages.map(pkg => {
        if (pkg.id === packageId) {
          const nextStatus = getNextStatus(pkg.status);
          if (nextStatus) {
            return {
              ...pkg,
              status: nextStatus,
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          }
        }
        return pkg;
      })
    );
  };

  const statusCounts = useMemo(() => {
    return packages.reduce((acc, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1;
      return acc;
    }, {} as Record<PackageStatus, number>);
  }, [packages]);

  const showPackageDetails = (pkg: PackageInfo) => {
    setSelectedPackage(pkg);
    setShowDetails(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <Navbar />
      <div className="max-w-7xl mt-24 mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventaire Entrepôt</h1>
            <p className="text-gray-600">Gestion et suivi des colis en entrepôt</p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Colis</p>
                  <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
                </div>
                <CubeIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">En attente</p>
                  <p className="text-2xl font-bold text-yellow-800">{statusCounts['En attente'] || 0}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">À expédier</p>
                  <p className="text-2xl font-bold text-blue-800">{statusCounts['A expedier'] || 0}</p>
                </div>
                <TruckIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Retirés</p>
                  <p className="text-2xl font-bold text-green-800">{statusCounts['Retiré'] || 0}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par N° de suivi, expéditeur ou destinataire..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PackageStatus | 'Tous')}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white min-w-[160px]"
                >
                  <option value="Tous">Tous les statuts</option>
                  <option value="En attente">En attente</option>
                  <option value="A expedier">À expédier</option>
                  <option value="Retiré">Retirés</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des colis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expéditeur → Destinataire
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itinéraire
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.map((pkg) => {
                  const statusConfig = getStatusConfig(pkg.status);
                  const StatusIcon = statusConfig.icon;
                  const nextStatus = getNextStatus(pkg.status);

                  return (
                    <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${statusConfig.bgClass} flex items-center justify-center`}>
                            <PackageCheck className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {pkg.trackingNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {pkg.createdAt}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            <strong>De:</strong> {pkg.senderName}
                          </div>
                          <div className="text-sm text-gray-900">
                            <strong>Vers:</strong> {pkg.recipientName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="w-4 h-4 mr-1 text-green-500" />
                          <span className="truncate max-w-[120px]">{pkg.departurePoint}</span>
                          <ArrowRightIcon className="w-4 h-4 mx-2 text-gray-400" />
                          <MapPinIcon className="w-4 h-4 mr-1 text-red-500" />
                          <span className="truncate max-w-[120px]">{pkg.arrivalPoint}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 truncate max-w-[150px]">
                            {pkg.description}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <ScaleIcon className="w-3 h-3 mr-1" />
                              {pkg.weight}kg
                            </span>
                            {pkg.isFragile && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                Fragile
                              </span>
                            )}
                            {pkg.isPerishable && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                                <FireIcon className="w-3 h-3 mr-1" />
                                Périssable
                              </span>
                            )}
                            {pkg.isInsured && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                <ShieldCheckIcon className="w-3 h-3 mr-1" />
                                Assuré
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {pkg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => showPackageDetails(pkg)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {nextStatus && (
                            <button
                              onClick={() => updatePackageStatus(pkg.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                              title={`Passer à: ${nextStatus}`}
                            >
                              <ArrowRightIcon className="w-3 h-3 mr-1" />
                              {nextStatus}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredPackages.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Aucun colis trouvé</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || statusFilter !== 'Tous' 
                  ? 'Aucun colis ne correspond à vos critères de recherche.'
                  : 'Aucun colis dans l\'entrepôt pour le moment.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Modal détails */}
        {showDetails && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Détails du Colis {selectedPackage.trackingNumber}
                  </h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Statut actuel</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusConfig(selectedPackage.status).color}`}>
                        {React.createElement(getStatusConfig(selectedPackage.status).icon, { className: "w-4 h-4 mr-1" })}
                        {selectedPackage.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Dernière mise à jour: {selectedPackage.lastUpdated}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <UserCircleIcon className="w-4 h-4 mr-2" />
                        Expéditeur
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Nom:</strong> {selectedPackage.senderName}</p>
                        <p className="flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {selectedPackage.senderPhone}
                        </p>
                        <p className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1 text-green-500" />
                          {selectedPackage.departurePoint}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <UserCircleIcon className="w-4 h-4 mr-2" />
                        Destinataire
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Nom:</strong> {selectedPackage.recipientName}</p>
                        <p className="flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {selectedPackage.recipientPhone}
                        </p>
                        <p className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1 text-red-500" />
                          {selectedPackage.arrivalPoint}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <CubeIcon className="w-4 h-4 mr-2" />
                      Informations du Colis
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm"><strong>Description:</strong> {selectedPackage.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center">
                          <ScaleIcon className="w-4 h-4 mr-1 text-gray-400" />
                          <strong>Poids:</strong> {selectedPackage.weight} kg
                        </span>
                        {selectedPackage.declaredValue && (
                          <span><strong>Valeur:</strong> {parseFloat(selectedPackage.declaredValue).toLocaleString()} FCFA</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedPackage.isFragile && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                            Fragile
                          </span>
                        )}
                        {selectedPackage.isPerishable && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            <FireIcon className="w-3 h-3 mr-1" />
                            Périssable
                          </span>
                        )}
                        {selectedPackage.isInsured && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            <ShieldCheckIcon className="w-3 h-3 mr-1" />
                            Assuré
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {getNextStatus(selectedPackage.status) && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          updatePackageStatus(selectedPackage.id);
                          setShowDetails(false);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                      >
                        <ArrowRightIcon className="w-4 h-4 mr-2" />
                        Passer à: {getNextStatus(selectedPackage.status)}
                        <Sparkles className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WarehouseInventory;