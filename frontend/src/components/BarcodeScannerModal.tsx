import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { X, Camera, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';

interface BarcodeScannerModalProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScannerModal({ onScanSuccess, onClose }: BarcodeScannerModalProps) {
  const [error, setError] = useState<string>('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Prohlížeč blokuje kameru. Ujistěte se, že používáte HTTPS připojení nebo jste aplikaci povolili v nastavení.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        stream.getTracks().forEach(track => track.stop());
        return BrowserMultiFormatReader.listVideoInputDevices();
      })
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCamera = devices.find(d => 
             d.label.toLowerCase().includes('back') || 
             d.label.toLowerCase().includes('zadní') ||
             d.label.toLowerCase().includes('environment') ||
             d.label.toLowerCase().includes('0')
          );
          setActiveCameraId(backCamera ? backCamera.deviceId : devices[0].deviceId);
        } else {
          setError('Nenalezeny žádné kamery na vašem zařízení.');
        }
      })
      .catch((err) => {
        setError('Přístup ke kameře byl odepřen. Zkontrolujte prosím oprávnění v prohlížeči (Povolit kameru).');
        console.error(err);
      });

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (activeCameraId && videoRef.current && !isManualMode) {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }

      const codeReader = new BrowserMultiFormatReader();
      codeReader.decodeFromVideoDevice(activeCameraId, videoRef.current, (result, err, controls) => {
        controlsRef.current = controls;
        if (result) {
          controls.stop();
          onScanSuccess(result.getText());
        }
      }).catch(e => {
        setError("Chyba při startu skenování: " + e.message);
      });
    }
  }, [activeCameraId, isManualMode]);

  const handleCameraChange = () => {
    if (cameras.length > 1) {
      const currentIndex = cameras.findIndex(c => c.deviceId === activeCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setActiveCameraId(cameras[nextIndex].deviceId);
    }
  };

  const handleClose = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
    }
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black animate-pop-in">
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3 text-white font-bold drop-shadow-md text-lg">
          <Camera className="w-6 h-6 text-indigo-400" />
          {isManualMode ? 'Ruční zadání' : 'Skenování štítku'}
        </div>
        <button onClick={handleClose} className="p-2.5 hover:bg-white/20 rounded-full transition-colors bg-black/40 backdrop-blur-md">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="relative flex-1 w-full h-full overflow-hidden bg-gray-900">
        {isManualMode ? (
          <div className="flex items-center justify-center h-full p-6">
            <form onSubmit={handleManualSubmit} className="w-full max-w-sm">
              <input 
                type="text" 
                autoFocus
                placeholder="Zadejte kód ručně..." 
                value={manualCode} 
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full p-4 mb-4 rounded-xl bg-gray-800 text-white border border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsManualMode(false)} className="flex-1 p-3 bg-gray-700 text-white rounded-xl">Zpět</button>
                <button type="submit" className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold">Potvrdit</button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {error && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/80 dark:bg-black/80 backdrop-blur-sm">
                <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-pop-in border border-gray-100 dark:border-gray-700">
                  <div className="bg-red-500 dark:bg-red-600 py-8 flex justify-center items-center">
                    <AlertTriangle className="w-16 h-16 text-white" />
                  </div>
                  <div className="p-8 text-center flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Chyba kamery!</h3>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">
                      {error}
                    </p>
                    <button 
                      onClick={() => setIsManualMode(true)}
                      className="w-full py-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-500/30 dark:shadow-red-900/30"
                    >
                      Zadat ručně
                    </button>
                    <button 
                      onClick={handleClose}
                      className="w-full py-3 mt-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full font-bold uppercase tracking-wider transition-colors"
                    >
                      Zpět
                    </button>
                  </div>
                </div>
              </div>
            )}

            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline></video>
            
            {!error && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                <div className="w-[85%] h-[30%] sm:w-[50%] sm:h-[40%] border-2 border-white/20 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] relative backdrop-blur-[1px]"></div>
                <p className="text-white text-sm mt-10 font-medium drop-shadow-lg bg-black/50 px-5 py-2.5 rounded-full backdrop-blur-md animate-pulse">
                  Zamiřte na čárový kód
                </p>
              </div>
            )}
          </>
        )}

        {!isManualMode && (
          <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-3 z-40">
            <button 
              onClick={handleClose}
              className="w-full py-4 bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/20 text-white rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl font-medium"
            >
              <ArrowLeft className="w-5 h-5" /> Zpět
            </button>
            <button 
              onClick={() => setIsManualMode(true)}
              className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-2xl transition-all shadow-xl font-medium"
            >
              Zadat kód ručně
            </button>
            {!error && cameras.length > 1 && (
              <button 
                onClick={handleCameraChange}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl font-medium"
              >
                <RefreshCw className="w-5 h-5" /> Přepnout kameru
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
