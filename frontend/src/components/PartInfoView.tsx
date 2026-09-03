import { useState } from 'react';
import BarcodeScannerModal from './BarcodeScannerModal';
import PartSplitLayout from './Shared/PartSplitLayout';
import { Settings, Image as ImageIcon, Box } from 'lucide-react';

interface PartInfoViewProps {
  onBack: () => void;
  initialScannedCode?: string; // Může přijít z jiného modulu
}

export default function PartInfoView({ onBack, initialScannedCode }: PartInfoViewProps) {
  const [part, setPart] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(!initialScannedCode);
  const [error, setError] = useState('');

  // Když komponenta přijde už se scanned code, rovnou ho načteme
  useState(() => {
    if (initialScannedCode) {
      handleScanSuccess(initialScannedCode);
    }
  });

  async function handleScanSuccess(scannedCode: string) {
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
  }

  if (isScanning) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-4">Informace o dílu</h2>
        <p className="text-gray-500 mb-8">Naskenujte kód pro zobrazení detailů a historie.</p>
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
          <button onClick={onBack} className="px-6 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">Zpět do menu</button>
          <button onClick={() => setIsScanning(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl">Skenovat znovu</button>
        </div>
      </div>
    );
  }

  if (!part) return null;

  return (
    <PartSplitLayout part={part} title="Detail dílu" onBack={onBack}>
      <div className="flex flex-col h-full space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Specifikace</h3>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-4">
              <Box className="w-6 h-6 text-indigo-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Typ zařízení / Název</p>
                <p className="font-semibold text-gray-900 dark:text-white">{part.part_type}</p>
                {part.device_type && part.device_type !== 'Neuvedeno' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{part.device_type}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Settings className="w-6 h-6 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Parametry</p>
                <p className="font-semibold text-gray-900 dark:text-white">{part.parameters}</p>
                {part.additional_identifier && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Doplňkový kód: {part.additional_identifier}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {part.photos && part.photos.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Fotografie při založení</h3>
            <div className="flex flex-wrap gap-4">
              {part.photos.map((url: string, i: number) => (
                <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <img src={url} alt="Foto dílu" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button onClick={onBack} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold rounded-xl transition-all shadow-sm">
            Zavřít detail
          </button>
        </div>
      </div>
    </PartSplitLayout>
  );
}
