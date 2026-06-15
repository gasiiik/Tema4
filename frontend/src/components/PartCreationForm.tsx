import { useState, FormEvent, ChangeEvent } from 'react';
import { ArrowLeft, Camera, Loader2, CheckCircle2, FileText, Settings, Cpu } from 'lucide-react';

interface PartCreationFormProps {
  userName: string;      // Jméno přihlášeného údržbáře z App.tsx
  onBack: () => void;    // Funkce pro návrat do hlavního menu
}

export default function PartCreationForm({ userName, onBack }: PartCreationFormProps) {
  // Stavy pro textová pole
  const [partType, setPartType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [parameters, setParameters] = useState('');
  const [sourceEquipment, setSourceEquipment] = useState('');
  
  // Stavy pro uložení reálných souborů (File objektů)
  const [labelPhoto, setLabelPhoto] = useState<File | null>(null);
  const [partPhoto, setPartPhoto] = useState<File | null>(null);

  // Stavy pro URL náhledů (abychom vyfocený obrázek hned ukázali údržbáři na displeji)
  const [labelPreview, setLabelPreview] = useState<string | null>(null);
  const [partPreview, setPartPreview] = useState<string | null>(null);

  // Stavy pro řízení toku aplikace
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Automatické získání aktuálního data a času pro zobrazení v UI
  const currentTimestamp = new Date().toLocaleString('cs-CZ');

  // Pomocná funkce pro zpracování vyfocené/vybrané fotky
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>, type: 'label' | 'part') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vytvoříme dočasnou URL adresu, kterou umí HTML element <img> přečíst a zobrazit
      const previewUrl = URL.createObjectURL(file);

      if (type === 'label') {
        setLabelPhoto(file);
        setLabelPreview(previewUrl);
      } else {
        setPartPhoto(file);
        setPartPreview(previewUrl);
      }
    }
  };

  // Odeslání formuláře na backend
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mobilní validace: Údržbář musí nahrát obě fotografie, jinak ho nepustíme dál
    if (!labelPhoto || !partPhoto) {
      setError('Pro úspěšné založení musíte vyfotit štítek i samotný díl.');
      return;
    }

    setIsLoading(true);

    try {
      // Vytvoříme objekt FormData, který umí přenášet soubory i text zároveň
      const formData = new FormData();
      formData.append('part_type', partType);
      formData.append('serial_number', serialNumber);
      formData.append('parameters', parameters);
      formData.append('source_equipment', sourceEquipment);
      formData.append('created_by_user', userName); // Přidání identifikátoru uživatele
      formData.append('label_photo', labelPhoto);
      formData.append('part_photo', partPhoto);

      const response = await fetch('http://localhost:8000/api/parts', {
        method: 'POST',
        body: formData, // Předáme komplet FormData. Hlavičku Content-Type netřeba nastavovat, prohlížeč ji doplní sám.
      });

      if (!response.ok) throw new Error('Nepodařilo se uložit díl do evidence.');

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Pokud bylo uložení úspěšné, zobrazíme přehlednou "Success" obrazovku s potvrzením
  if (isSuccess) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl text-center max-w-md mx-auto animate-pop-in">
        <div className="inline-block p-4 bg-green-50 dark:bg-green-900/30 rounded-full mb-4 text-green-500">
          <CheckCircle2 className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Úspěšně zaevidováno</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Nový díl (S/N: {serialNumber}) byl bezpečně uložen do systému.
        </p>
        <button
          onClick={onBack}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all"
        >
          Zpět do menu
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden w-full max-w-xl mx-auto transition-colors duration-300">
      
      {/* Hlavička formuláře s tlačítkem zpět */}
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Založení nového dílu</h2>
        <div className="w-10"></div> {/* Vyrovnání středu */}
      </div>

      {error && (
        <div className="m-4 sm:m-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Hlavní formulář */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        
        {/* Sekce: Metadata o zápisu */}
        <div className="grid grid-cols-2 gap-4 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 rounded-2xl text-xs text-gray-500 dark:text-gray-400">
          <div>
            <span className="block font-medium">Zapisuje technik:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{userName}</span>
          </div>
          <div className="text-right">
            <span className="block font-medium">Datum a čas zápisu:</span>
            <span className="font-semibold">{currentTimestamp}</span>
          </div>
        </div>

        {/* Pole: Typ dílu */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Typ dílu</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Cpu className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              placeholder="např. Servomotor, Hydraulický ventil"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm"
              value={partType}
              onChange={(e) => setPartType(e.target.value)}
            />
          </div>
        </div>

        {/* Pole: Sériové číslo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Sériové číslo (S/N)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <FileText className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              placeholder="Unikátní kód ze štítku"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
            />
          </div>
        </div>

        {/* Pole: Demontováno ze zařízení */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Původní zařízení (Demontováno z)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Settings className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              placeholder="Identifikátor stroje / linky (např. Lis Kuka 02)"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm"
              value={sourceEquipment}
              onChange={(e) => setSourceEquipment(e.target.value)}
            />
          </div>
        </div>

        {/* Pole: Parametry (Textarea) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Technické parametry (Volitelné)</label>
          <textarea
            rows={2}
            placeholder="např. 24V, 4.5A, max tlak 200 bar"
            className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm resize-none"
            value={parameters}
            onChange={(e) => setParameters(e.target.value)}
          />
        </div>

        {/* --- FOTOSEKCE OPTIMALIZOVANÁ PRO MOBILY --- */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          
          {/* Tlačítko: Foto štítku */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 text-center">Foto štítku kódů</label>
            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 overflow-hidden relative group">
              {labelPreview ? (
                <img src={labelPreview} alt="Štítek" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-[11px] text-gray-400 mt-1">Spustit kameru</span>
                </>
              )}
              {/* capture="environment" vynutí na mobilech zadní kameru namísto selfie */}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoChange(e, 'label')} />
            </label>
          </div>

          {/* Tlačítko: Foto dílu */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 text-center">Foto samotného dílu</label>
            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 overflow-hidden relative group">
              {partPreview ? (
                <img src={partPreview} alt="Díl" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-[11px] text-gray-400 mt-1">Spustit kameru</span>
                </>
              )}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoChange(e, 'part')} />
            </label>
          </div>

        </div>

        {/* Tlačítko pro odeslání */}
        <button
          type="submit"
          disabled={isLoading || !partType || !serialNumber || !sourceEquipment}
          className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 transform hover:-translate-y-0.5"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Uložit a zaevidovat díl'}
        </button>
      </form>
    </div>
  );
}