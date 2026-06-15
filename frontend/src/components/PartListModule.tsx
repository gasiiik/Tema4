import { useState, useEffect } from 'react';
// Přidány ikony ChevronLeft a ChevronRight pro listování
import { ArrowLeft, Search, Calendar, User, Cpu, Hash, LayoutGrid, ShieldAlert, Loader2, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PartListModuleProps {
  onBack: () => void;
  userPermissions: number[];
}

export default function PartListModule({ onBack, userPermissions }: PartListModuleProps) {
  const [parts, setParts] = useState<any[]>([]);
  const [filteredParts, setFilteredParts] = useState<any[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Stavy pro novou galerii fotek (Lightbox)
  const [viewPhotos, setViewPhotos] = useState<string[] | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!userPermissions.includes(7)) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl text-center max-w-md mx-auto">
        <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Přístup odepřen</h2>
        <button onClick={onBack} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors">Zpět do menu</button>
      </div>
    );
  }

  useEffect(() => {
    fetch('http://localhost:8000/api/parts')
      .then(res => res.json())
      .then(data => {
        setParts(data);
        setFilteredParts(data);
        const users: string[] = Array.from(new Set(data.map((p: any) => p.created_by_user)));
        setUniqueUsers(users);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Chyba při stahování dílů:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...parts];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.serial_number.toLowerCase().includes(query) || 
        p.part_type.toLowerCase().includes(query)
      );
    }

    if (selectedUser !== '') {
      result = result.filter(p => p.created_by_user === selectedUser);
    }

    if (selectedDate !== '') {
      result = result.filter(p => p.created_at.startsWith(selectedDate));
    }

    setFilteredParts(result);
  }, [searchQuery, selectedUser, selectedDate, parts]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} v ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Pomocná funkce pro bezpečné otevření galerie vždy od první fotky
  const openGallery = (photos: string[]) => {
    setViewPhotos(photos);
    setCurrentPhotoIndex(0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden w-full max-w-5xl mx-auto transition-colors duration-300 animate-pop-in relative">
      
      {/* --- VYLEPŠENÉ MODÁLNÍ OKNO PRO FOTKY (FULLSCREEN LIGHTBOX) --- */}
      {viewPhotos !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
          
          {/* Křížek pro zavření vpravo nahoře */}
          <button 
            onClick={() => setViewPhotos(null)} 
            className="absolute top-4 right-4 md:top-8 md:right-8 z-50 p-3 bg-white/10 hover:bg-red-500 rounded-full text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Hlavní oblast pro fotografii a šipky */}
          {viewPhotos.length > 0 ? (
            <div className="relative flex items-center justify-center w-full h-full max-w-7xl p-4">
              
              {/* Šipka doleva */}
              {viewPhotos.length > 1 && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setCurrentPhotoIndex((prev) => (prev === 0 ? viewPhotos.length - 1 : prev - 1)); 
                  }} 
                  className="absolute left-4 md:left-8 z-10 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white transition-all"
                >
                  <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
                </button>
              )}

              {/* Samotná fotografie */}
              <img 
                src={viewPhotos[currentPhotoIndex]} 
                alt={`Fotografie dílu ${currentPhotoIndex + 1}`} 
                className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl transition-opacity duration-300"
              />

              {/* Šipka doprava */}
              {viewPhotos.length > 1 && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setCurrentPhotoIndex((prev) => (prev === viewPhotos.length - 1 ? 0 : prev + 1)); 
                  }} 
                  className="absolute right-4 md:right-8 z-10 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white transition-all"
                >
                  <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-white text-lg">Žádné fotografie k zobrazení.</p>
          )}

          {/* Spodní posuvník (indikátor teček) */}
          {viewPhotos.length > 1 && (
            <div className="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 bg-black/50 rounded-full">
              {viewPhotos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPhotoIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentPhotoIndex 
                      ? 'bg-white scale-150' 
                      : 'bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* SEKCE FILTRŮ */}
      <div className="p-5 bg-gray-50/30 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Hledat kód / název</label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Zadejte kód..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Nahrál (Kdo)</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full pl-9 p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all">
              <option value="">Všichni pracovníci</option>
              {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Datum zápisu (Kdy)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full pl-9 p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
          </div>
        </div>
      </div>

      {/* VÝPIS DAT */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm font-medium">Žádné díly neodpovídají zadaným filtrům.</div>
        ) : (
          <>
            {/* --- MOBILNÍ ZOBRAZENÍ --- */}
            <div className="block sm:hidden space-y-4">
              {filteredParts.map((part, i) => (
                <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 dark:text-white">{part.part_type}</h3>
                  </div>
                  <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 inline-block px-2 py-1 rounded">{part.serial_number}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-gray-700 dark:text-gray-300">Stroj:</span> {part.source_equipment}</div>
                  
                  {/* Tlačítko pro fotky na mobilu */}
                  {part.photos && part.photos.length > 0 && (
                    <button onClick={() => openGallery(part.photos)} className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 transition-colors">
                      <ImageIcon className="w-4 h-4" /> Zobrazit fotky ({part.photos.length})
                    </button>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <div><span className="block font-semibold text-gray-600 dark:text-gray-300">Zapsal:</span> {part.created_by_user}</div>
                    <div className="text-right"><span className="block font-semibold text-gray-600 dark:text-gray-300">Kdy:</span> {formatDate(part.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* --- DESKTOP ZOBRAZENÍ --- */}
            <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4"><div className="flex items-center gap-1.5"><Cpu className="w-4 h-4"/> Díl / Parametry</div></th>
                    <th className="p-4"><div className="flex items-center gap-1.5"><Hash className="w-4 h-4"/> Evidenční kód</div></th>
                    <th className="p-4">Demontováno z</th>
                    <th className="p-4"><div className="flex items-center gap-1.5"><User className="w-4 h-4"/> Zapsal (Kdo)</div></th>
                    <th className="p-4"><div className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Datum (Kdy)</div></th>
                    <th className="p-4 text-center">Fotodokumentace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {filteredParts.map((part, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 dark:text-gray-100">{part.part_type}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs truncate">{part.parameters}</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                        <span className="bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">{part.serial_number}</span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">{part.source_equipment}</td>
                      <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{part.created_by_user}</td>
                      <td className="p-4 text-xs text-gray-500 dark:text-gray-400 font-medium">{formatDate(part.created_at)}</td>
                      <td className="p-4 text-center">
                        {part.photos && part.photos.length > 0 ? (
                          <button 
                            onClick={() => openGallery(part.photos)} 
                            className="inline-flex items-center justify-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" /> {part.photos.length} fotek
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl">Bez fota</span>
                        )}
                      </td>
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