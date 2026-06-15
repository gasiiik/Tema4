import { useState, useEffect } from 'react';
// ZDE BYLA CHYBA: Chyběl import Loader2
import { ArrowLeft, Search, Calendar, User, Cpu, Hash, LayoutGrid, ShieldAlert, Loader2 } from 'lucide-react';

interface PartListModuleProps {
  onBack: () => void;
  userPermissions: number[];
}

export default function PartListModule({ onBack, userPermissions }: PartListModuleProps) {
  // Lokální stavy pro načtená data
  const [parts, setParts] = useState<any[]>([]);
  const [filteredParts, setFilteredParts] = useState<any[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stavy pro filtry rozhraní
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Bezpečnostní kontrola modulu 7
  if (!userPermissions.includes(7)) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl text-center max-w-md mx-auto">
        <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Přístup odepřen</h2>
        <button onClick={onBack} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors">Zpět do menu</button>
      </div>
    );
  }

  // Načtení dat z backendu
  useEffect(() => {
    fetch('http://localhost:8000/api/parts')
      .then(res => res.json())
      .then(data => {
        setParts(data);
        setFilteredParts(data);
        
        // Vytáhneme unikátní seznam uživatelů, kteří nahráli nějaký díl (pro filtr)
        const users: string[] = Array.from(new Set(data.map((p: any) => p.created_by_user)));
        setUniqueUsers(users);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Chyba při stahování dílů:", err);
        setIsLoading(false);
      });
  }, []);

  // SPUŠTĚNÍ FILTRACE (Spustí se automaticky při změně jakéhokoliv filtru)
  useEffect(() => {
    let result = [...parts];

    // 1. Filtr: Hledání podle Sériového čísla / Kódu nebo Typu dílu
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.serial_number.toLowerCase().includes(query) || 
        p.part_type.toLowerCase().includes(query)
      );
    }

    // 2. Filtr: Podle toho, KDO díl nahrál
    if (selectedUser !== '') {
      result = result.filter(p => p.created_by_user === selectedUser);
    }

    // 3. Filtr: Podle toho, KDY byl nahrán (porovnání čistého data YYYY-MM-DD)
    if (selectedDate !== '') {
      result = result.filter(p => p.created_at.startsWith(selectedDate));
    }

    setFilteredParts(result);
  }, [searchQuery, selectedUser, selectedDate, parts]);

  // Pomocná funkce pro zformátování ISO datumu na čitelný český tvar
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} v ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden w-full max-w-4xl mx-auto transition-colors duration-300 animate-pop-in">
      
      {/* Hlavní vrchní lišta */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <LayoutGrid className="w-5 h-5 text-indigo-500" /> Aktuální díly v evidenci
        </h2>
        <div className="w-10"></div>
      </div>

      {/* --- SEKCE FILTRŮ --- */}
      <div className="p-5 bg-gray-50/30 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Vyhledávání kódu */}
        <div className="relative">
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Hledat kód / název</label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Zadejte nebo naskenujte kód..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Filtr: Kdo nahrál */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Nahrál uživatel (Kdo)</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full pl-9 p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              <option value="">Všichni pracovníci</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtr: Kdy nahrál */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Datum zápisu (Kdy)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full pl-9 p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>

      </div>

      {/* --- VÝPIS DAT --- */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm font-medium">Žádné díly neodpovídají zadaným filtrům.</div>
        ) : (
          <>
            {/* Mobilní zobrazení (Karty pod sebou) - skryté na velkých obrazovkách */}
            <div className="block sm:hidden space-y-4">
              {filteredParts.map((part, i) => (
                <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 dark:text-white">{part.part_type}</h3>
                  </div>
                  <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">{part.serial_number}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-gray-700 dark:text-gray-300">Stroj:</span> {part.source_equipment}</div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <div><span className="block font-semibold text-gray-600 dark:text-gray-300">Zapsal:</span> {part.created_by_user}</div>
                    <div className="text-right"><span className="block font-semibold text-gray-600 dark:text-gray-300">Kdy:</span> {formatDate(part.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop zobrazení (Čistá přehledná tabulka) - skryté na mobilech */}
            <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4"><div className="flex items-center gap-1.5"><Cpu className="w-4 h-4"/> Typ dílu / Parametry</div></th>
                    <th className="p-4"><div className="flex items-center gap-1.5"><Hash className="w-4 h-4"/> Evidenční kód</div></th>
                    <th className="p-4">Demontováno z</th>
                    <th className="p-4"><div className="flex items-center gap-1.5"><User className="w-4 h-4"/> Zapsal (Kdo)</div></th>
                    <th className="p-4"><div className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Datum (Kdy)</div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {filteredParts.map((part, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 dark:text-gray-100">{part.part_type}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs truncate">{part.parameters}</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">{part.serial_number}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">{part.source_equipment}</td>
                      <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{part.created_by_user}</td>
                      <td className="p-4 text-xs text-gray-500 dark:text-gray-400 font-medium">{formatDate(part.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}