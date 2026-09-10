import { useState } from 'react';
import BarcodeScannerModal from './BarcodeScannerModal';
import PartSplitLayout from './Shared/PartSplitLayout';
import { Save, CheckCircle, UploadCloud, CheckSquare } from 'lucide-react';

interface DispatchFormProps {
  userName: string;
  userPermissions: number[];
  onBack: () => void;
}

export default function DispatchForm({ userName, userPermissions, onBack }: DispatchFormProps) {
  const [part, setPart] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState('');
  
  // Form fields
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [labelPhoto, setLabelPhoto] = useState<File | null>(null);
  const [partPhoto, setPartPhoto] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleScanSuccess = async (scannedCode: string) => {
    setIsScanning(false);
    try {
      const response = await fetch(`/api/parts/${scannedCode}`);
      if (!response.ok) {
        throw new Error('Díl nenalezen v databázi.');
      }
      const data = await response.json();
      setPart(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se načíst díl.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      setError('Musíte potvrdit shodu parametrů dílu.');
      return;
    }
    if (!labelPhoto || !partPhoto) {
      setError('Vyberte prosím obě fotografie (štítek i díl).');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('action', 'Odeslání na opravu');
      formData.append('user', userName);
      
      const details = {
        info: 'Odesláno dodavateli k opravě.',
      };
      formData.append('details', JSON.stringify(details));
      
      formData.append('photos', labelPhoto);
      formData.append('photos', partPhoto);

      const res = await fetch(`/api/parts/${part.serial_number}/history`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Nepodařilo se uložit historii');
      
      setIsSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isScanning) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-4">Odeslání na dopravu</h2>
        <p className="text-gray-500 mb-8">Naskenujte kód dílu pro odeslání do opravy.</p>
        <BarcodeScannerModal 
          onScanSuccess={handleScanSuccess} 
          onClose={onBack} 
        />
      </div>
    );
  }

  if (error && !part) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl mt-12 border border-gray-100 dark:border-gray-700 animate-fade-in-up">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2">Díl nenalezen</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={onBack} className="px-6 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Zpět
          </button>
          <button onClick={() => setIsScanning(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
            Skenovat znovu
          </button>
        </div>
      </div>
    );
  }

  if (!part) return null;

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-12 bg-white dark:bg-gray-800 rounded-3xl shadow-xl mt-12 border border-gray-100 dark:border-gray-700 animate-pop-in">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Úspěšně zaevidováno</h2>
        <p className="text-gray-500">Díl byl zaznamenán jako odeslaný na opravu.</p>
      </div>
    );
  }

  return (
    <PartSplitLayout part={part} title="Odeslání na opravu" onBack={onBack}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Potvrzení parametrů a dokumentace</h3>
          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
          
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 mb-6 space-y-3">
             <p className="text-sm text-gray-600 dark:text-gray-400">Prosím, vizuálně zkontrolujte, že fyzický díl odpovídá následujícím údajům z evidence:</p>
             <ul className="list-disc list-inside text-sm font-semibold text-gray-800 dark:text-gray-200 space-y-1">
               <li>Typ dílu: <span className="text-indigo-600 dark:text-indigo-400">{part.part_type}</span></li>
               <li>Sériové číslo: <span className="text-indigo-600 dark:text-indigo-400">{part.serial_number}</span></li>
               <li>Parametry: <span className="text-indigo-600 dark:text-indigo-400">{part.parameters}</span></li>
             </ul>
             
             <label className="flex items-center gap-3 mt-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Potvrzuji, že parametry dílu souhlasí.</span>
             </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Foto štítku <span className="text-red-500">*</span>
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={(e) => handleFileChange(e, setLabelPhoto)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full p-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 transition-colors ${labelPhoto ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 group-hover:border-indigo-400'}`}>
                   {labelPhoto ? <CheckSquare className="w-6 h-6 text-green-500" /> : <UploadCloud className="w-6 h-6 text-gray-400" />}
                   <span className={`text-sm font-medium ${labelPhoto ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                     {labelPhoto ? labelPhoto.name : 'Pořídit foto štítku'}
                   </span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Foto celého dílu <span className="text-red-500">*</span>
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={(e) => handleFileChange(e, setPartPhoto)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full p-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 transition-colors ${partPhoto ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 group-hover:border-indigo-400'}`}>
                   {partPhoto ? <CheckSquare className="w-6 h-6 text-green-500" /> : <UploadCloud className="w-6 h-6 text-gray-400" />}
                   <span className={`text-sm font-medium ${partPhoto ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                     {partPhoto ? partPhoto.name : 'Pořídit foto dílu'}
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isConfirmed || !labelPhoto || !partPhoto}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
          >
            {isSubmitting ? 'Odesílám...' : 'Potvrdit odeslání'}
            <Save className="w-5 h-5" />
          </button>
        </div>
      </form>
    </PartSplitLayout>
  );
}
