'use client';

import React, { useState, useMemo, ChangeEvent, FormEvent, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  User,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart2,
  Phone,
  Mail,
  MapPin,
  Search,
  Plus,
  Filter,
  X,
  ClipboardList,
  Target,
  BadgePercent,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Enregistrement des composants Chart.js (déjà fait dans votre dashboard, mais bon à garder ici pour la portabilité)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

//==============================================================================
// 1. INTERFACES TYPESCRIPT DÉTAILLÉES
//==============================================================================
type StaffStatus = 'En ligne' | 'En pause' | 'Hors ligne';
type StaffRole = 'Manutentionnaire' | 'Responsable Stock' | 'Superviseur' | 'Accueil Client' | 'Préparateur Commandes';
type TaskStatus = 'À faire' | 'En cours' | 'Terminé';

interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
}

interface AttendanceRecord {
  date: string;
  checkIn?: string;
  checkOut?: string;
  breaks: { start: string; end: string }[];
}

// --- Interface pour les props de AddStaffModal
interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddStaff: (newMember: Omit<StaffMember, 'contact'> & { // Le type est légèrement ajusté pour correspondre à la création
        name: string;
        role: StaffRole;
        workZone: 'Zone A - Réception' | 'Zone B - Stockage' | 'Zone C - Expédition';
        phone: string;
        email: string;
    }) => void;
}

//--- Définition de l'interface pour les props du composant KPI
interface StaffKpiCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail?: string; // Le '?' rend cette prop optionnelle
  colorClass: string;
}

interface StaffListTableProps {
  members: StaffMember[];
  onSelectMember: (member: StaffMember) => void;
}

interface StaffDetailSheetProps {
    member: StaffMember;
    onClose: () => void;
}

interface PerformanceMetrics {
  parcelsProcessed: number;
  successRate: number; // en %
  errorCount: number;
  avgProcessingTime: number; // en minutes
}

interface StaffMember {
  id: string;
  name: string;
  avatar: string;
  role: StaffRole;
  workZone: 'Zone A - Réception' | 'Zone B - Stockage' | 'Zone C - Expédition';
  status: StaffStatus;
  contact: { phone: string; email: string };
  assignedTasks: Task[];
  attendance: AttendanceRecord[];
  performance: PerformanceMetrics;
}

//==============================================================================
// 2. DONNÉES DE SIMULATION AVANCÉES
//==============================================================================
const initialStaffMembers: StaffMember[] = [
  {
    id: 'emp-001',
    name: 'Essono Cédric',
    avatar: '/avatars/essono.png',
    role: 'Manutentionnaire',
    workZone: 'Zone B - Stockage',
    status: 'En ligne',
    contact: { phone: '+237 699112233', email: 'c.essono@pickndrop.cm' },
    assignedTasks: [
      { id: 't-101', description: 'Ranger 50 nouveaux colis', status: 'En cours', dueDate: '2025-07-28' },
      { id: 't-102', description: 'Scanner inventaire Allée B-3', status: 'À faire', dueDate: '2025-07-28' },
    ],
    attendance: [{ date: '2025-07-28', checkIn: '08:02', breaks: [] }],
    performance: { parcelsProcessed: 125, successRate: 99.2, errorCount: 1, avgProcessingTime: 5 },
  },
  {
    id: 'emp-002',
    name: 'Mballa Alice',
    avatar: '/avatars/mballa.png',
    role: 'Responsable Stock',
    workZone: 'Zone A - Réception',
    status: 'En pause',
    contact: { phone: '+237 677445566', email: 'a.mballa@pickndrop.cm' },
    assignedTasks: [
      { id: 't-103', description: 'Valider le lot Jumia H-56', status: 'Terminé', dueDate: '2025-07-28' },
      { id: 't-104', description: 'Assigner tâches aux manutentionnaires', status: 'En cours', dueDate: '2025-07-28' },
    ],
    attendance: [{ date: '2025-07-28', checkIn: '07:58', breaks: [{ start: '12:05', end: '' }] }],
    performance: { parcelsProcessed: 88, successRate: 100, errorCount: 0, avgProcessingTime: 8 },
  },
  {
    id: 'emp-003',
    name: 'Fouda Martin',
    avatar: '/avatars/fouda.png',
    role: 'Préparateur Commandes',
    workZone: 'Zone C - Expédition',
    status: 'Hors ligne',
    contact: { phone: '+237 655778899', email: 'm.fouda@pickndrop.cm' },
    assignedTasks: [
      { id: 't-105', description: 'Préparer expédition pour Douala', status: 'À faire', dueDate: '2025-07-29' },
    ],
    attendance: [{ date: '2025-07-27', checkIn: '08:00', checkOut: '17:05', breaks: [{ start: '12:00', end: '13:00' }] }],
    performance: { parcelsProcessed: 210, successRate: 98.1, errorCount: 4, avgProcessingTime: 4 },
  },
  {
    id: 'emp-004',
    name: 'Ngono Sandrine',
    avatar: '/avatars/ngono.png',
    role: 'Accueil Client',
    workZone: 'Zone A - Réception',
    status: 'En ligne',
    contact: { phone: '+237 688990011', email: 's.ngono@pickndrop.cm' },
    assignedTasks: [
        { id: 't-106', description: 'Traiter 5 retraits clients', status: 'En cours', dueDate: '2025-07-28' }
    ],
    attendance: [{date: '2025-07-28', checkIn: '08:30', breaks: []}],
    performance: { parcelsProcessed: 45, successRate: 99.8, errorCount: 0, avgProcessingTime: 3 },
  }
];

// Valeur moyenne pour les graphiques de comparaison
const TEAM_AVERAGE_PERFORMANCE = {
    parcelsProcessed: 142,
    successRate: 99.0,
    errorCount: 2,
    avgProcessingTime: 5.5,
};

//==============================================================================
// 3. SOUS-COMPOSANTS POUR LA PAGE
//==============================================================================

//--- Cartes KPI pour la section Personnel
const StaffKpiCard = ({ icon, title, value, detail, colorClass }: StaffKpiCardProps) => (
  <div className={`bg-gradient-to-br ${colorClass} p-5 rounded-2xl shadow-lg text-white`}>
    <div className="flex items-center space-x-4">
      <div className="bg-white/20 p-3 rounded-xl">{icon}</div>
      <div>
        <p className="text-sm opacity-80">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
    {detail && <p className="text-xs opacity-70 mt-3">{detail}</p>}
  </div>
);

//--- Tableau listant les membres du personnel
const StaffListTable = ({ members, onSelectMember }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50/80">
                <tr>
                    {['Personnel', 'Rôle / Zone', 'Performance du jour', 'Statut', ''].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {members.map(member => (
                    <tr key={member.id} className="hover:bg-green-50/50 transition-all duration-200 cursor-pointer" onClick={() => onSelectMember(member)}>
                        <td className="px-6 py-4">
                            <div className="flex items-center">
                                <User className="h-10 w-10 text-white bg-green-500 rounded-full p-2 mr-4" />
                                <div>
                                    <p className="font-semibold text-gray-900">{member.name}</p>
                                    <p className="text-sm text-gray-500">{member.contact.email}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <p className="font-semibold text-gray-800">{member.role}</p>
                            <p className="text-xs text-gray-500">{member.workZone}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center text-sm">
                               <Package className="w-4 h-4 mr-2 text-gray-500" />
                                <span className="font-bold text-gray-800">{member.performance.parcelsProcessed}</span>
                                <span className="text-gray-600 ml-1">colis traités</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold
                                ${member.status === 'En ligne' ? 'bg-green-100 text-green-800' :
                                member.status === 'En pause' ? 'bg-amber-100 text-amber-800' :
                                'bg-gray-200 text-gray-700'}`}>
                                <span className={`h-2.5 w-2.5 rounded-full mr-2 ${member.status === 'En ligne' ? 'bg-green-500' : member.status === 'En pause' ? 'bg-amber-400' : 'bg-gray-400'}`} />
                                {member.status}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                             <button className="text-green-600 hover:text-green-800 font-semibold text-sm">Détails</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

//--- Fiche de détail d'un employé (Panneau latéral)
const StaffDetailSheet = ({ member, onClose }: StaffDetailSheetProps) => {
    const performanceData = {
        labels: ['Colis traités', 'Taux de réussite (%)', 'Erreurs', 'Tps moyen (min)'],
        datasets: [
            {
                label: member.name,
                data: [member.performance.parcelsProcessed, member.performance.successRate, member.performance.errorCount, member.performance.avgProcessingTime],
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: '#16a34a',
                borderWidth: 1,
            },
            {
                label: 'Moyenne Equipe',
                data: [TEAM_AVERAGE_PERFORMANCE.parcelsProcessed, TEAM_AVERAGE_PERFORMANCE.successRate, TEAM_AVERAGE_PERFORMANCE.errorCount, TEAM_AVERAGE_PERFORMANCE.avgProcessingTime],
                backgroundColor: 'rgba(209, 213, 219, 0.7)',
                borderColor: '#9ca3af',
                borderWidth: 1,
            },
        ],
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 right-0 h-full w-full max-w-2xl bg-gray-50 shadow-2xl z-50 flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-white">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                             <User className="h-16 w-16 text-white bg-green-600 rounded-full p-4" />
                             <div>
                                <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
                                <p className="text-green-700 font-semibold">{member.role}</p>
                             </div>
                        </div>
                         <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                   
                    {/* Infos de base & Présence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl border">
                             <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center"><User className="w-5 h-5 mr-2 text-green-600"/>Informations</h3>
                            <div className="space-y-2 text-sm">
                                <p><strong className="text-gray-500 w-24 inline-block">Zone:</strong> {member.workZone}</p>
                                <p><strong className="text-gray-500 w-24 inline-block">Tél:</strong> {member.contact.phone}</p>
                                <p><strong className="text-gray-500 w-24 inline-block">Email:</strong> {member.contact.email}</p>
                            </div>
                        </div>
                         <div className="bg-white p-5 rounded-xl border">
                             <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center"><Clock className="w-5 h-5 mr-2 text-green-600"/>Présence du jour</h3>
                             <div className="space-y-2 text-sm">
                                <p><strong className="text-gray-500 w-24 inline-block">Statut:</strong> {member.status}</p>
                                <p><strong className="text-gray-500 w-24 inline-block">Arrivée:</strong> {member.attendance[0]?.checkIn || 'N/A'}</p>
                                <p><strong className="text-gray-500 w-24 inline-block">Départ:</strong> {member.attendance[0]?.checkOut || 'N/A'}</p>
                             </div>
                        </div>
                    </div>

                    {/* Performance */}
                    <div className="bg-white p-5 rounded-xl border">
                        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-green-600"/>Performance vs Moyenne</h3>
                        <Bar data={performanceData} options={{ responsive: true, plugins: { legend: { position: 'top' }}}}/>
                    </div>

                    {/* Tâches assignées */}
                    <div className="bg-white p-5 rounded-xl border">
                         <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-green-600"/>Tâches Assignées</h3>
                         <div className="space-y-3">
                             {member.assignedTasks.map(task => (
                                 <div key={task.id} className="p-3 rounded-lg bg-gray-50/80 flex justify-between items-center">
                                     <p className="text-sm text-gray-800">{task.description}</p>
                                     <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                         task.status === 'Terminé' ? 'bg-green-100 text-green-700' : 
                                         task.status === 'En cours' ? 'bg-blue-100 text-blue-700' :
                                         'bg-amber-100 text-amber-700'
                                         }`}>{task.status}</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

//--- Modal d'ajout d'un membre
const AddStaffModal = ({ isOpen, onClose, onAddStaff }:AddStaffModalProps) => {
    const [formData, setFormData] = useState({
        name: '', role: 'Manutentionnaire', workZone: 'Zone B - Stockage', phone: '', email: ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onAddStaff({
            ...formData,
            id: `emp-${Date.now()}`,
            avatar: '/avatars/default.png',
            status: 'Hors ligne',
            assignedTasks: [],
            attendance: [],
            performance: { parcelsProcessed: 0, successRate: 100, errorCount: 0, avgProcessingTime: 0 },
            contact: { phone: formData.phone, email: formData.email },
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                         <h2 className="text-xl font-bold text-gray-900">Ajouter un Membre du Personnel</h2>
                         <p className="text-sm text-gray-500">Remplissez les informations ci-dessous.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <input type="text" name="name" placeholder="Nom complet" value={formData.name} onChange={handleChange} className="input-form" required />
                        <select name="role" value={formData.role} onChange={handleChange} className="input-form">
                            <option>Manutentionnaire</option>
                            <option>Responsable Stock</option>
                            <option>Superviseur</option>
                            <option>Accueil Client</option>
                            <option>Préparateur Commandes</option>
                        </select>
                        <select name="workZone" value={formData.workZone} onChange={handleChange} className="input-form">
                             <option>Zone A - Réception</option>
                             <option>Zone B - Stockage</option>
                             <option>Zone C - Expédition</option>
                        </select>
                        <input type="tel" name="phone" placeholder="Téléphone" value={formData.phone} onChange={handleChange} className="input-form" />
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="input-form" required/>
                    </div>
                    <div className="p-6 bg-gray-50 flex justify-end space-x-3 rounded-b-2xl">
                         <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
                         <button type="submit" className="btn-primary">Ajouter Membre</button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .input-form {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid #d1d5db;
                    background-color: #f9fafb;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .input-form:focus {
                    outline: none;
                    border-color: #22c55e;
                    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
                }
                .btn-primary {
                     background-color: #16a34a;
                     color: white;
                     padding: 0.6rem 1.25rem;
                     border-radius: 0.5rem;
                     font-weight: 600;
                     transition: background-color 0.2s;
                }
                .btn-primary:hover { background-color: #15803d; }
                .btn-secondary {
                     background-color: #e5e7eb;
                     color: #374151;
                     padding: 0.6rem 1.25rem;
                     border-radius: 0.5rem;
                     font-weight: 600;
                     transition: background-color 0.2s;
                }
                 .btn-secondary:hover { background-color: #d1d5db; }
            `}</style>
        </div>
    )
};

//==============================================================================
// 4. COMPOSANT PRINCIPAL DE LA PAGE
//==============================================================================
export default function PersonnelPage() {
    const [staff, setStaff] = useState<StaffMember[]>(initialStaffMembers);
    const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');

    const filteredStaff = useMemo(() => {
        return staff.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                member.role.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'Tous' || member.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [staff, searchTerm, statusFilter]);
    
    const staffKpi = useMemo(() => {
        return {
            total: staff.length,
            online: staff.filter(s => s.status === 'En ligne').length,
            onBreak: staff.filter(s => s.status === 'En pause').length,
        };
    }, [staff]);

    const handleAddStaff = (newMember) => {
        setStaff(prev => [newMember, ...prev]);
        setIsAddModalOpen(false); // ferme le modal après ajout
    };

  return (
    <div className="p-8 bg-gray-50 flex-1 space-y-8">
        {/* Titre et actions */}
        <div className="flex justify-between items-center">
            <div>
                 <h1 className="text-3xl font-bold text-gray-900">Gestion du Personnel</h1>
                 <p className="text-gray-600 mt-1">Suivez, gérez et évaluez votre équipe en temps réel.</p>
            </div>
             <button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-md">
                <Plus className="h-5 w-5" />
                <span>Ajouter un employé</span>
            </button>
        </div>
        
        {/* Cartes KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StaffKpiCard title="Total Employés" value={String(staffKpi.total)} icon={<Users className="w-6 h-6"/>} colorClass="from-blue-500 to-indigo-600" />
            <StaffKpiCard title="En Ligne" value={String(staffKpi.online)} detail="Actuellement actifs sur site" icon={<CheckCircle className="w-6 h-6"/>} colorClass="from-green-500 to-emerald-600"/>
            <StaffKpiCard title="En Pause" value={String(staffKpi.onBreak)} icon={<Clock className="w-6 h-6"/>} colorClass="from-amber-500 to-orange-500"/>
            <StaffKpiCard title="Total Colis Traités" value="468" detail="Pour la journée en cours" icon={<Package className="w-6 h-6"/>} colorClass="from-purple-500 to-violet-600" />
        </div>
        
        {/* Toolbar de la liste */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-1/3">
                  <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou rôle..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500"
                  />
            </div>
             <div className="relative w-full md:w-auto">
                <Filter className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"/>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pl-12 pr-8 py-3 w-full md:w-56 border border-gray-200 rounded-xl appearance-none bg-gray-50 focus:ring-2 focus:ring-green-500">
                    <option value="Tous">Tous les statuts</option>
                    <option value="En ligne">En ligne</option>
                    <option value="En pause">En pause</option>
                    <option value="Hors ligne">Hors ligne</option>
                </select>
             </div>
        </div>

        {/* Tableau du Personnel */}
        <StaffListTable members={filteredStaff} onSelectMember={setSelectedMember} />
        
        {/* Fiche de détail et Modal d'ajout */}
        {selectedMember && <StaffDetailSheet member={selectedMember} onClose={() => setSelectedMember(null)} />}
        <AddStaffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddStaff={handleAddStaff} />
    </div>
  );
}