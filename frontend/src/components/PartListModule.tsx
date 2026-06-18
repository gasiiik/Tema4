import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Search, Calendar, User, Cpu, Hash, LayoutGrid, ShieldAlert, Loader2, Image as ImageIcon, X, ChevronLeft, ChevronRight, Printer, Trash2, AlertTriangle } from 'lucide-react';
import Barcode from 'react-barcode';

export interface PartItem {
  id?: string;
  part_type: string;
  serial_number: string;
  parameters: string;
  source_equipment: string;
  created_by_user: string;
  created_at: string;
  photos: string[];
}

interface PartListModuleProps {
  onBack: () => void;
  userPermissions: number[];
}

export default function PartListModule({ onBack, userPermissions }: PartListModuleProps) {
  const [parts, setParts] = useState<PartItem[]>([]);
  const [filteredParts, setFilteredParts] = useState<PartItem[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Stavy pro galerii fotek
  const [viewPhotos, setViewPhotos] = useState<string[] | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Stavy pro tisk štítku
  const [printPart, setPrintPart] = useState<PartItem | null>(null);

  // Stavy pro stránkování
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Stavy pro mazání záznamu
  const [partToDelete, setPartToDelete] = useState<PartItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      .then((data: PartItem[]) => {
        setParts(data);
        setFilteredParts(data);
        const users: string[] = Array.from(new Set(data.map(p => p.created_by_user)));
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
    setCurrentPage(1); 
  }, [searchQuery, selectedUser, selectedDate, parts]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} v ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const openGallery = (photos: string[]) => {
    setViewPhotos(photos);
    setCurrentPhotoIndex(0);
  };

  const confirmDelete = async () => {
    if (!partToDelete) return;
    setIsDeleting(true);

    try {
      const identifier = partToDelete.id || partToDelete.serial_number; 
      
      const response = await fetch(`http://localhost:8000/api/parts/${identifier}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setParts(prev => prev.filter(p => p.serial_number !== partToDelete.serial_number));
        setFilteredParts(prev => prev.filter(p => p.serial_number !== partToDelete.serial_number));
        setPartToDelete(null);
      } else {
        alert("Nepodařilo se smazat záznam. Zkontrolujte připojení nebo práva.");
      }
    } catch (error) {
      console.error("Chyba při mazání:", error);
      alert("Došlo k chybě při komunikaci se serverem.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(filteredParts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  return (
    <>
      {/* --- MODÁLNÍ OKNO PRO POTVRZENÍ SMAZÁNÍ (Portal) --- */}
      {partToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Opravdu smazat?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Chystáte se trvale smazat díl <br/>
              <span className="font-bold text-gray-800 dark:text-gray-200">{partToDelete.part_type}</span> <br/>
              (S/N: <span className="font-mono text-indigo-500">{partToDelete.serial_number}</span>). <br/>
              Tato akce je nevratná.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setPartToDelete(null)} 
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Zrušit
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Trash2 className="w-5 h-5" /> Smazat</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODÁLNÍ OKNO PRO TISK ŠTÍTKU (Portal) --- */}
      {printPart && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm print:bg-white print:block">
          
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl print:p-0 print:shadow-none print:w-full print:max-w-none print:bg-transparent">
            
            {/* --- KOMPLEXNÍ A DETAILNÍ ŠTÍTEK PRO TISK --- */}
            <div className="bg-white p-6 border-4 border-black rounded-2xl mb-6 flex flex-col items-center print:border-2 print:border-black print:mb-0 print:p-4">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Evidenční štítek</div>
              
              {/* Zobrazení Typu dílu */}
              <h3 className="font-black text-2xl text-gray-900 uppercase text-center leading-tight mb-1">
                {printPart.part_type}
              </h3>
              
              {/* Zobrazení Parametrů */}
              {printPart.parameters && printPart.parameters !== "Neuvedeno" && (
                <p className="text-xs font-medium text-gray-600 text-center mb-3 line-clamp-2">
                  {printPart.parameters}
                </p>
              )}
              
              <div className="flex justify-center w-full my-2 bg-white">
                <Barcode 
                  value={printPart.serial_number} 
                  width={1.8} 
                  height={70} 
                  fontSize={16} 
                  background="#ffffff" 
                  lineColor="#000000"
                  margin={0} 
                />
              </div>

              {/* Informační tabulka */}
              <div className="w-full grid grid-cols-2 gap-x-2 gap-y-3 text-xs text-left mt-4 border-t-2 border-gray-100 pt-4">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Stroj / Zařízení:</span>
                  <b className="text-gray-800 break-words">{printPart.source_equipment || "Nezadáno"}</b>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Zapsal:</span>
                  <b className="text-gray-800 truncate block">{printPart.created_by_user}</b>
                </div>
                <div className="col-span-2 text-center text-[10px] font-mono text-gray-400 mt-1">
                  Zapsáno: {formatDate(printPart.created_at)}
                </div>
              </div>
            </div>

            <div className="space-y-3 print:hidden">
              <button 
                onClick={() => window.print()} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg"
              >
                <Printer className="w-5 h-5" /> Vytisknout štítek
              </button>
              
              <button 
                onClick={() => setPrintPart(null)} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* GALERIE FOTEK (Portal) */}
      {viewPhotos !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in print:hidden">
          <button onClick={() => setViewPhotos(null)} className="absolute top-4 right-4 md:top-8 md:right-8 z-50 p-3 bg-white/10 hover:bg-red-500 rounded-full text-white transition-all">
            <X className="w-6 h-6" />
          </button>
          {viewPhotos.length > 0 ? (
            <div className="relative flex items-center justify-center w-full h-full max-w-7xl p-4">
              {viewPhotos.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex((prev) => (prev === 0 ? viewPhotos.length - 1 : prev - 1)); }} className="absolute left-4 md:left-8 z-10 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white transition-all">
                  <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
                </button>
              )}
              <img src={viewPhotos[currentPhotoIndex]} alt={`Fotografie dílu ${currentPhotoIndex + 1}`} className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl transition-opacity duration-300"/>
              {viewPhotos.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex((prev) => (prev === viewPhotos.length - 1 ? 0 : prev + 1)); }} className="absolute right-4 md:right-8 z-10 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white transition-all">
                  <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-white text-lg">Žádné fotografie k zobrazení.</p>
          )}
        </div>,
        document.body
      )}

      {/* HLAVNÍ APLIKACE */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden w-full max-w-5xl mx-auto transition-colors duration-300 animate-pop-in relative print:hidden">
        
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <LayoutGrid className="w-5 h-5 text-indigo-500" /> Aktuální díly v evidenci
          </h2>
          <div className="w-10"></div>
        </div>

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

        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm font-medium">Žádné díly neodpovídají zadaným filtrům.</div>
          ) : (
            <>
              {/* MOBILNÍ ZOBRAZENÍ */}
              <div className="block sm:hidden space-y-4">
                {currentParts.map((part, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 dark:text-white">{part.part_type}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setPrintPart(part)} className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-indigo-100 hover:text-indigo-600 transition-colors">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPartToDelete(part)} className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 hover:text-red-700 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 inline-block px-2 py-1 rounded">{part.serial_number}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-gray-700 dark:text-gray-300">Stroj:</span> {part.source_equipment}</div>
                    
                    {part.photos && part.photos.length > 0 && (
                      <button onClick={() => openGallery(part.photos)} className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 transition-colors">
                        <ImageIcon className="w-4 h-4" /> Fotky ({part.photos.length})
                      </button>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <div><span className="block font-semibold text-gray-600 dark:text-gray-300">Zapsal:</span> {part.created_by_user}</div>
                      <div className="text-right"><span className="block font-semibold text-gray-600 dark:text-gray-300">Kdy:</span> {formatDate(part.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP ZOBRAZENÍ */}
              <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4"><div className="flex items-center gap-1.5"><Cpu className="w-4 h-4"/> Díl / Parametry</div></th>
                      <th className="p-4"><div className="flex items-center gap-1.5"><Hash className="w-4 h-4"/> Evidenční kód</div></th>
                      <th className="p-4">Demontováno z</th>
                      <th className="p-4"><div className="flex items-center gap-1.5"><User className="w-4 h-4"/> Zapsal</div></th>
                      <th className="p-4"><div className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Datum</div></th>
                      <th className="p-4 text-center text-indigo-500">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {currentParts.map((part, i) => (
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
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {part.photos && part.photos.length > 0 ? (
                              <button onClick={() => openGallery(part.photos)} className="inline-flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 p-2 rounded-xl transition-colors" title="Zobrazit fotky">
                                <ImageIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="p-2 text-gray-300 dark:text-gray-600"><ImageIcon className="w-4 h-4" /></span>
                            )}
                            
                            <button onClick={() => setPrintPart(part)} className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-black hover:text-white dark:hover:bg-gray-600 p-2 rounded-xl transition-colors" title="Vytisknout štítek">
                              <Printer className="w-4 h-4" />
                            </button>
                            
                            <button onClick={() => setPartToDelete(part)} className="inline-flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 p-2 rounded-xl transition-colors" title="Smazat díl">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* OVLÁDÁNÍ STRÁNKOVÁNÍ */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4 px-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Zobrazeno <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}</span> až <span className="font-bold text-gray-900 dark:text-white">{Math.min(endIndex, filteredParts.length)}</span> z <span className="font-bold text-gray-900 dark:text-white">{filteredParts.length}</span> záznamů
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
                      Strana {currentPage} z {totalPages}
                    </span>
                    
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}