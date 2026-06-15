import { 
  FileEdit, 
  PackageCheck, 
  Wrench, 
  AlertTriangle, 
  Truck, 
  LogOut, 
  ScanLine 
} from 'lucide-react';

// Rozhraní definující, jaké funkce a data Menu přijímá z App.tsx
interface MainMenuProps {
  userName: string;
  onLogout: () => void;
  onSelectModule: (id: number) => void; 
}

export default function MainMenu({ userName, onLogout, onSelectModule }: MainMenuProps) {
  // Definice 5 hlavních modulů aplikace
  const menuItems = [
    { id: 1, title: 'Založení dílu', desc: 'První evidence a parametry', icon: FileEdit, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { id: 2, title: 'Příchod z opravy', desc: 'Výběr dodavatele a naskladnění', icon: PackageCheck, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/40' },
    { id: 3, title: 'Nasazení do provozu', desc: 'Montáž na linku', icon: Wrench, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/40' },
    { id: 4, title: 'Demontáž', desc: 'Hlášení poruchy nebo údržby', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/40' },
    { id: 5, title: 'Odeslání na opravu', desc: 'Expedice dodavateli', icon: Truck, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/40' },
  ];

  return (
    <div className="w-full w-full mx-auto">
      
      {/* --- HLAVIČKA --- */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-5 sm:p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hlavní menu</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Přihlášen jako: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{userName}</span>
          </p>
        </div>
        
        {/* Tlačítko odhlásit */}
        <button 
          onClick={onLogout} 
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 rounded-2xl transition-all duration-300 w-full sm:w-auto justify-center group"
        >
          <LogOut className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
          Odhlásit
        </button>
      </div>

      {/* --- GRID S POLOŽKAMI MENU --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {menuItems.map((item, index) => {
          const Icon = item.icon; 
          return (
            <button
              key={item.id} 
              // Propojení kliknutí s App.tsx, které následně otevře správný formulář
              onClick={() => onSelectModule(item.id)} 
              className="opacity-0 animate-fade-in-up flex items-center p-5 bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl dark:hover:shadow-gray-900/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50 transform hover:-translate-y-1.5 transition-all duration-300 text-left group"
              // Dynamické zpoždění animace pro postupný efekt naskakování kartiček
              style={{ animationDelay: `${150 + index * 100}ms` }} 
            >
              <div className={`p-4 rounded-2xl mr-5 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3 ${item.bg}`}>
                <Icon className={`w-8 h-8 ${item.color}`} />
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* --- HLAVNÍ AKČNÍ TLAČÍTKO PRO SKENOVÁNÍ --- */}
      <div 
        className="mt-10 flex justify-center opacity-0 animate-fade-in-up" 
        style={{ animationDelay: '800ms' }}
      >
        <button className="relative overflow-hidden group flex items-center justify-center gap-3 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-full shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          <ScanLine className="w-6 h-6 group-hover:animate-bounce z-10" />
          <span className="z-10">Skenovat kód zařízení</span>
        </button>
      </div>
    </div>
  );
}