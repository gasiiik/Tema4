import { useState } from 'react';
import BarcodeScannerModal from './BarcodeScannerModal';
import PartSplitLayout from './Shared/PartSplitLayout';
import { Save, CheckCircle, Upload, X } from 'lucide-react';

interface RepairArrivalFormProps {
  userName: string;
  userPermissions: number[];
  onBack: () => void;
}

export default function RepairArrivalForm({ userName, userPermissions, onBack }: RepairArrivalFormProps) {
  const [part, setPart] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState('');
  
  const [supplier, setSupplier] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [warehouse, setWarehouse] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleScanSuccess = async (scannedCode: string) => {
    setIsScanning(false);
    try {
      const response = await fetch(`/api/parts/${scannedCode}`);
      if (!response.ok) throw new Error('Díl nenalezen v databázi.');
      const data = await response.json();
      setPart(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se načíst díl.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (photos.length + selected.length > 5) {
        setError('Můžete nahrát maximálně 5 fotografií.');
        return;
      }
      setPhotos(prev => [...prev, ...selected]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !warehouse) {
      setError('Vyplňte dodavatele a sklad.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('action', 'Naskladnění z opravy');
      formData.append('user', userName);
      
      const details = {
        Dodavatel: supplier,
        Cena_Dopravy: price + ' Kč',
        Datum_Dodání: date,
        Cílový_Sklad: warehouse
      };
      formData.append('details', JSON.stringify(details));
      
      photos.forEach(file => {
        formData.append('photos', file);
      });

      const res = await fetch(`/api/parts/${part.serial_number}/history`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Nepodařilo se uložit historii');
      
      setIsSuccess(true);
      setTimeout(() => onBack(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isScanning) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-4">Příchod z opravy</h2>
        <p className="text-gray-500 mb-8">Naskenujte kód dílu, který se vrátil od dodavatele.</p>
        <BarcodeScannerModal onScanSuccess={handleScanSuccess} onClose={onBack} />
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
          <button onClick={onBack} className="px-6 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">Zpět</button>
          <button onClick={() => setIsScanning(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl">Skenovat znovu</button>
        </div>
      </div>
    );
  }

  if (!part) return null;
  if (isSuccess) return (
    <div className="w-full max-w-md mx-auto text-center p-12 bg-white dark:bg-gray-800 rounded-3xl mt-12 border animate-pop-in">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Úspěšně naskladněno</h2>
    </div>
  );

  return (
    <PartSplitLayout part={part} title="Příchod z opravy" onBack={onBack}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detaily opravy</h3>
          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Dodavatel opravy</label>
              <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Např. Siemens servis" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cena dopravy (Kč)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Datum dodání</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cílový sklad</label>
              <input type="text" value={warehouse} onChange={e => setWarehouse(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Např. Regál A2" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Foto servisního listu / dílu</label>
            <div className="flex flex-wrap gap-4">
              {photos.map((photo, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                  <img src={URL.createObjectURL(photo)} alt="Náhled" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, index) => index !== i))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500 font-medium">Nahrát</span>
                  <input type="file" multiple accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-50">
            {isSubmitting ? 'Ukládám...' : 'Potvrdit naskladnění'}
            <Save className="w-5 h-5" />
          </button>
        </div>
      </form>
    </PartSplitLayout>
  );
}
