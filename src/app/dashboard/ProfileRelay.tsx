'use client';
import React, { useEffect, useState } from 'react';
import { Building, Plus, MapPin, Edit, Calendar, Loader2 } from 'lucide-react';
import { relayPointService, RelayPoint } from '@/services/relayPointService';
// Carte
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });


export default function ProfileRelayManager() {
    const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMap, setViewMap] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadRelays();
    }, []);

    const loadRelays = async () => {
        setLoading(true);
        try {
            // APPEL API DIRECT
            const data = await relayPointService.getAllRelayPoints();
            setRelayPoints(data || []);
        } catch(err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Logique fictive d'ajout via API
    const handleAddRelay = async (newPoint: any) => {
        // await apiClient.post('/api/relay-points', newPoint);
        setIsAdding(false);
        loadRelays();
    }

    if(loading) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-orange-500 animate-spin"/></div>

    return (
         <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Building className="w-6 h-6 text-orange-500" />
                Réseau d'Agence ({relayPoints.length})
              </h3>
              <div className="flex gap-2">
                 <button onClick={()=>setViewMap(!viewMap)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition text-sm">
                     {viewMap ? 'Voir Liste' : 'Voir Carte'}
                 </button>
                 <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2 px-4 rounded-xl hover:shadow-lg transition">
                    <Plus className="w-5 h-5" /> Ajouter
                 </button>
              </div>
            </div>
            
            {viewMap ? (
                <div className="h-80 rounded-xl overflow-hidden border border-gray-200">
                    <MapContainer center={[3.8480, 11.5021]} zoom={12} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {relayPoints.map(rp => (
                            <Marker key={rp.id} position={[rp.latitude, rp.longitude]} />
                        ))}
                    </MapContainer>
                </div>
            ) : (
                <div className="grid gap-4">
                     {relayPoints.length === 0 ? <p className="text-gray-500 italic text-center">Aucun point relais supplémentaire.</p> : null}
                     {relayPoints.map(rp => (
                         <div key={rp.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex justify-between items-center">
                             <div>
                                 <h4 className="font-bold text-gray-800">{rp.relayPointName}</h4>
                                 <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> {rp.relay_point_address}</p>
                             </div>
                             <button className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Edit className="w-4 h-4"/></button>
                         </div>
                     ))}
                </div>
            )}

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                     <div className="bg-white p-6 rounded-2xl max-w-md w-full">
                          <h3 className="text-xl font-bold mb-4">Nouveau Point Relais</h3>
                          <p className="text-sm text-gray-500 mb-4">Intégration future du formulaire API ici.</p>
                          <div className="flex gap-3 justify-end">
                              <button onClick={()=>setIsAdding(false)} className="text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">Annuler</button>
                              <button onClick={()=>handleAddRelay({})} className="text-white bg-orange-500 px-4 py-2 rounded-lg">Confirmer</button>
                          </div>
                     </div>
                </div>
            )}
         </div>
    );
}