import { useState } from 'react';
import BarcodeScannerModal from './BarcodeScannerModal';
import PartSplitLayout from './Shared/PartSplitLayout';
import { Save, CheckCircle } from 'lucide-react';

interface LineUsageFormProps {
  userName: string;
  userPermissions: number[];
  onBack: () => void;
}

export default function LineUsageForm({ userName, userPermissions, onBack }: LineUsageFormProps) {
  const [part, setPart] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState('');
  
  // Form fields
  const [book, setBook] = useState('');
  const [location, setLocation] = useState('');
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !location) {
      setError('Vyplňte prosím všechna pole.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('action', 'Nasazení na linku');
      formData.append('user', userName);
      
      const details = {
        Kniha: book,
        Místo: location
      };
      formData.append('details', JSON.stringify(details));

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
        <h2 className="text-2xl font-bold mb-4">Nasazení do provozu</h2>
        <p className="text-gray-500 mb-8">Naskenujte kód dílu, který chcete použít na lince.</p>
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
        <p className="text-gray-500">Díl byl zaznamenán do provozu.</p>
      </div>
    );
  }

  return (
    <PartSplitLayout part={part} title="Nasazení do provozu" onBack={onBack}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informace o použití</h3>
          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Kniha
              </label>
              <input
                type="text"
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="Např. Kniha údržby 01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Místo
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="Např. Linka 4, Pozice B"
              />
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
          >
            {isSubmitting ? 'Ukládám...' : 'Potvrdit nasazení'}
            <Save className="w-5 h-5" />
          </button>
        </div>
      </form>
    </PartSplitLayout>
  );
}
