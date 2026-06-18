import { useState, FormEvent, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Camera, Loader2, CheckCircle2, FileText, Settings, Cpu, AlertTriangle, Plus, X, Printer, Barcode as BarcodeIcon } from 'lucide-react';
import Barcode from 'react-barcode';

interface PartCreationFormProps {
  userName: string;
  userPermissions: number[];
  onBack: () => void;
}

export default function PartCreationForm({ userName, userPermissions, onBack }: PartCreationFormProps) {
  const [partType, setPartType] = useState('');
  const [parameters, setParameters] = useState('');
  const [sourceEquipment, setSourceEquipment] = useState('');
  
  // Řízení sériového čísla
  const [isAutoGenerate, setIsAutoGenerate] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');

  // Dynamické pole fotek (max 5)
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);

  // Řízení stavů
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  const currentTimestamp = new Date().toLocaleString('cs-CZ');

  if (!userPermissions.includes(1)) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl text-center max-w-md mx-auto animate-pop-in">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Přístup odepřen</h2>
        <button onClick={onBack} className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Zpět do menu</button>
      </div>
    );
  }

  // Přidání fotek do pole (max 5)
  const handlePhotoAdd = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      if (photos.length + newFiles.length > 5) {
        setError('Můžete nahrát maximálně 5 fotografií celkem.');
        return;
      }

      const newPhotos = newFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

      setPhotos(prev => [...prev, ...newPhotos]);
      setError('');
    }
  };

  // Odstranění fotky z náhledu
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Funkce pro resetování formuláře pro vytvoření dalšího dílu
  const handleReset = () => {
    setSuccessData(null);
    setPartType('');
    setParameters('');
    setSourceEquipment('');
    setSerialNumber('');
    setIsAutoGenerate(false);
    setPhotos([]);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAutoGenerate && !serialNumber.trim()) {
      setError('Zadejte sériové číslo ze štítku, nebo zvolte automatické vygenerování.');
      return;
    }

    setIsLoading(true);

    let finalSerialNumber = serialNumber.trim();

    // --- ZPŘÍSNĚNÁ KONTROLA A BEZPEČNÉ GENEROVÁNÍ ---
    try {
      const resCheck = await fetch('http://localhost:8000/api/parts');
      if (resCheck.ok) {
        const existingParts = await resCheck.json();
        
        if (Array.isArray(existingParts)) {
          const existingCodes = existingParts.map((part: any) => String(part.serial_number || '').trim().toLowerCase());

          if (!isAutoGenerate) {
            if (existingCodes.includes(finalSerialNumber.toLowerCase())) {
              setError(`Díl s evidenčním kódem "${finalSerialNumber}" již v databázi existuje. Prosím, zkontrolujte štítek nebo použijte jiný kód.`);
              setIsLoading(false);
              return; 
            }
          } else {
            let newCode = '';
            let isDuplicate = true;
            let attempts = 0;
            
            const safePrefix = partType ? partType.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'DIL') : 'DIL';
            const prefix = safePrefix.length > 0 ? safePrefix : 'DIL';
            
            while (isDuplicate && attempts < 20) {
              const randomNum = Math.floor(100000 + Math.random() * 900000);
              newCode = `${prefix}-${randomNum}`;
              
              if (!existingCodes.includes(newCode.toLowerCase())) {
                isDuplicate = false;
              }
              attempts++;
            }
            
            if (isDuplicate) {
              setError('Systému se nepodařilo vygenerovat unikátní kód. Zkuste to prosím znovu.');
              setIsLoading(false);
              return;
            }
            
            finalSerialNumber = newCode;
          }
        }
      }
    } catch (err) {
      console.error("Chyba při kontrole duplicit:", err);
      setError("Nepodařilo se ověřit databázi s kódy. Zkontrolujte připojení k serveru.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('part_type', partType);
      formData.append('parameters', parameters);
      formData.append('source_equipment', sourceEquipment);
      formData.append('created_by_user', userName);
      formData.append('serial_number', finalSerialNumber); 

      photos.forEach(p => formData.append('photos', p.file));

      const response = await fetch('http://localhost:8000/api/parts', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.detail || 'Chyba při ukládání na server.');

      setSuccessData(result.part || result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* --- MODÁLNÍ OKNO ÚSPĚCHU (Teleportované přes celou obrazovku) --- */}
      {successData && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4 print:bg-white print:block">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full animate-pop-in print:shadow-none print:bg-transparent print:p-0 print:max-w-none print:animate-none">
            
            <div className="print:hidden">
              <div className="inline-block p-4 bg-green-50 dark:bg-green-900/30 rounded-full mb-4 text-green-500">
                <CheckCircle2 className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Úspěšně zaevidováno</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 text-sm">
                {isAutoGenerate 
                  ? 'Byl vytvořen zcela nový záznam a bezpečně vygenerováno unikátní sériové číslo.' 
                  : 'Díl s existujícím štítkem byl úspěšně zapsán do databáze.'}
              </p>
            </div>

            {/* --- ČÁROVÝ KÓD (Toto se vytiskne) --- */}
            <div className="bg-white p-6 border-2 border-dashed border-gray-300 rounded-2xl mb-6 flex flex-col items-center print:border-solid print:border-black print:mb-0 print:p-2">
              <h3 className="font-bold text-lg text-gray-800 uppercase tracking-widest mb-2">
                {successData.part_type || partType}
              </h3>
              <Barcode 
                value={successData.serial_number || serialNumber} 
                width={1.8} 
                height={80} 
                fontSize={16} 
                background="#ffffff" 
                lineColor="#000000" 
              />
              <p className="text-xs text-gray-500 mt-3 font-mono">Datum zápisu: {currentTimestamp}</p>
            </div>

            <div className="space-y-3 print:hidden">
              <button onClick={handlePrint} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg">
                <Printer className="w-5 h-5" /> Vytisknout štítek
              </button>

              <button onClick={handleReset} className="w-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-all">
                <Plus className="w-5 h-5" /> Vytvořit další díl
              </button>
              
              <button onClick={onBack} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all">
                Zpět do menu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- HLAVNÍ FORMULÁŘ S ANIMACÍ --- */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden w-full max-w-xl mx-auto transition-colors duration-300 animate-pop-in print:hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Založení dílu</h2>
          <div className="w-10"></div>
        </div>

        {/* VYLEPŠENÁ CHYBOVÁ HLÁŠKA */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 flex items-start gap-3 animate-fade-in shadow-sm">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-300 text-sm mb-1">Pozor, chyba</h3>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          
          {/* IDENTIFIKACE DÍLU */}
          <div className="p-4 rounded-2xl border-2 border-indigo-50 dark:border-indigo-900/30 bg-indigo-50/10 dark:bg-indigo-900/10 space-y-4">
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
              <button type="button" onClick={() => setIsAutoGenerate(false)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isAutoGenerate ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700'}`}>Mám štítek (S/N)</button>
              <button type="button" onClick={() => { setIsAutoGenerate(true); setSerialNumber(''); }} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isAutoGenerate ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700'}`}>Zcela nový díl</button>
            </div>

            {!isAutoGenerate ? (
              <div>
                <label className="block text-sm font-semibold mb-1">Opsat sériové číslo ze štítku</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
                  <input type="text" required={!isAutoGenerate} placeholder="S/N kód" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="w-full pl-11 p-3 border rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium">
                <BarcodeIcon className="w-6 h-6 flex-shrink-0" /> 
                <span>Sériové číslo a čárový kód budou po uložení <b>bezpečně vygenerovány z databáze</b>.</span>
              </div>
            )}
          </div>

          {/* OSTATNÍ ÚDAJE */}
          <div>
            <label className="block text-sm font-semibold mb-1">Typ dílu</label>
            <div className="relative">
              <Cpu className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
              <input type="text" required placeholder="Servomotor, Ventil..." value={partType} onChange={(e) => setPartType(e.target.value)} className="w-full pl-11 p-3 border rounded-xl bg-gray-50/50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Původní zařízení (Demontováno z)</label>
            <div className="relative">
              <Settings className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
              <input type="text" required placeholder="Lis Kuka 02" value={sourceEquipment} onChange={(e) => setSourceEquipment(e.target.value)} className="w-full pl-11 p-3 border rounded-xl bg-gray-50/50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* FOTOGALERIE */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold">Fotodokumentace</label>
              <span className="text-xs text-gray-500 font-medium">{photos.length} / 5 fotek</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative h-24 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={photo.preview} alt={`Foto ${index+1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-80 hover:opacity-100"><X className="w-3 h-3"/></button>
                </div>
              ))}
              
              {photos.length < 5 && (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 transition-colors">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase">Přidat</span>
                  <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handlePhotoAdd} />
                </label>
              )}
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-4 px-4 rounded-2xl shadow-lg hover:shadow-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 mt-6 transition-all">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Uložit a zaevidovat'}
          </button>
        </form>
      </div>
    </>
  );
}