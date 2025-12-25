// === DONNÉES SECTION CIBLE ===
import { 
  Users, Bike, Bus, Store, ShoppingBag, Building2, 
  HeartHandshake
} from 'lucide-react';
import { motion } from 'framer-motion';

const AUDIENCE_DATA = [
  {
    title: "Particuliers",
    description: "Envoyez des colis à vos proches ou recevez vos achats, du quartier au village.",
    icon: Users,
    color: "bg-orange-500",
    ring: "ring-orange-200 dark:ring-orange-900",
    gift: "🎁"
  },
  {
    title: "Freelances & Livreurs",
    description: "Benskinneurs et coursiers : trouvez des courses et sécurisez vos revenus.",
    icon: Bike,
    color: "bg-purple-500",
    ring: "ring-purple-200 dark:ring-purple-900",
    gift: "🏍️"
  },
  {
    title: "Points Relais",
    description: "Commerces de proximité : devenez des hubs logistiques et augmentez votre trafic.",
    icon: Store,
    color: "bg-red-500",
    ring: "ring-red-200 dark:ring-red-900",
    gift: "🏠"
  },
  {
    title: "Agences de Transport",
    description: "Digitalisez votre flotte de bus ou de camions et gérez vos gares routières.",
    icon: Bus,
    color: "bg-blue-500",
    text: "text-blue-500",
    ring: "ring-blue-200 dark:ring-blue-900",
    gift: "🚌"
  },
  {
    title: "Petits Commerçants",
    description: "E-commerçants informels : expédiez facilement vos produits à vos clients.",
    icon: ShoppingBag,
    color: "bg-emerald-500",
    ring: "ring-emerald-200 dark:ring-emerald-900",
    gift: "🛍️"
  },
  {
    title: "Entreprises & ONG",
    description: "Gérez la logistique du dernier kilomètre pour vos opérations à grande échelle.",
    icon: HeartHandshake,
    color: "bg-amber-500",
    ring: "ring-amber-200 dark:ring-amber-900",
    gift: "🤝"
  }
];

export default function TargetAudienceSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-50 dark:bg-[#0b0c15]">
      
      {/* Fond décoratif Noël (Cercles flous) */}
      <div className="absolute top-20 left-0 w-72 h-72 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        
        {/* En-tête de section */}
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block py-1 px-3 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Une solution inclusive
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">
             Pour qui avons-nous bâti <br/>
             <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
               ce réseau ? 🎅
             </span>
          </h2>
        </div>

        {/* Grille de Cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AUDIENCE_DATA.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`
                  group relative p-8 rounded-3xl border border-white/50 dark:border-white/10 
                  bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-xl hover:shadow-2xl 
                  transition-all duration-300 overflow-hidden cursor-default
                `}
              >
                {/* Dégradé Hover subtil */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex flex-col h-full">
                   {/* En-tête carte */}
                   <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-300 text-white ring-4 ${item.ring}`}>
                         <Icon className="w-7 h-7" />
                      </div>
                      {/* Emoji Cadeau flottant */}
                      <span className="text-2xl filter drop-shadow-md transform group-hover:rotate-12 transition-transform duration-500 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100">
                        {item.gift}
                      </span>
                   </div>
                   
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                     {item.title}
                   </h3>
                   
                   <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-grow">
                     {item.description}
                   </p>
                   
                   {/* Indicateur de bas de carte */}
                   <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-6 group-hover:w-full group-hover:bg-gradient-to-r group-hover:from-red-500 group-hover:to-orange-500 transition-all duration-500" />
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  );
};