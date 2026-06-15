import { useState, FormEvent, ChangeEvent } from 'react';
import { ArrowLeft, Camera, Loader2, CheckCircle2, FileText, Settings, Cpu, AlertTriangle, Plus, X, Printer, Barcode as BarcodeIcon } from 'lucide-react';
import Barcode from 'react-barcode'; // Nová knihovna

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
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl text-center max-w-md mx-auto">
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAutoGenerate && !serialNumber.trim()) {
      setError('Zadejte sériové číslo ze štítku, nebo zvolte automatické vygenerování.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('part_type', partType);
      formData.append('parameters', parameters);
      formData.append('source_equipment', sourceEquipment);
      formData.append('created_by_user', userName);
      
      if (!isAutoGenerate) {
        formData.append('serial_number', serialNumber);
      }

      // Přidáme všechny fotky pod stejným klíčem "photos"
      photos.forEach(p => formData.append('photos', p.file));

      const response = await fetch('http://localhost:8000/api/parts', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.detail || 'Chyba při evidenci.');

      // Uložíme si data z backendu (včetně vygenerovaného S/N) do success stavu
      setSuccessData(result.part);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- OBRAZOVKA ÚSPĚCHU (PŘIPRAVENÁ PRO TISK) ---
  if (successData) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl text-center max-w-md mx-auto animate-pop-in print:shadow-none print:bg-transparent print:p-0">
        
        {/* Tento blok se schová při tisku */}
        <div className="print:hidden">
          <div className="inline-block p-4 bg-green-50 dark:bg-green-900/30 rounded-full mb-4 text-green-500">
            <CheckCircle2 className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Úspěšně zaevidováno</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 text-sm">
            {successData.is_new_generated 
              ? 'Byl vytvořen zcela nový záznam a vygenerováno sériové číslo.' 
              : 'Díl s existujícím štítkem byl zapsán do databáze.'}
          </p>
        </div>

        {/* --- ČÁROVÝ KÓD (Toto se vytiskne) --- */}
        <div className="bg-white p-6 border-2 border-dashed border-gray-300 rounded-2xl mb-6 flex flex-col items-center print:border-solid print:border-black print:mb-0">
          <h3 className="font-bold text-lg text-gray-800 uppercase tracking-widest mb-2">{successData.part_type}</h3>
          <Barcode 
            value={successData.serial_number} 
            width={1.8} 
            height={80} 
            fontSize={16} 
            background="#ffffff" 
            lineColor="#000000" 
          />
          <p className="text-xs text-gray-500 mt-3 font-mono">Datum zápisu: {currentTimestamp}</p>
        </div>

        {/* Tlačítka se schovají při tisku */}
        <div className="space-y-3 print:hidden">
          {successData.is_new_generated && (
            <button onClick={handlePrint} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-all">
              <Printer className="w-5 h-5" /> Vytisknout štítek
            </button>
          )}
          <button onClick={onBack} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all">
            Zpět do menu
          </button>
        </div>
      </div>
    );
  }

  // --- HLAVNÍ FORMULÁŘ (Při tisku neviditelný) ---
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden w-full max-w-xl mx-auto print:hidden">
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Založení dílu</h2>
        <div className="w-10"></div>
      </div>

      {error && <div className="m-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">⚠️ {error}</div>}

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
              <BarcodeIcon className="w-6 h-6" /> Sériové číslo a čárový kód budou automaticky vygenerovány po uložení.
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

        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-4 px-4 rounded-2xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 mt-6">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Uložit a zaevidovat'}
        </button>
      </form>
    </div>
  );
}