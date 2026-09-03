import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { X, Camera, RefreshCw } from 'lucide-react';

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
              <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/90">
                <div className="text-red-400 text-center p-6 bg-red-950/50 rounded-2xl border border-red-900/50 max-w-sm backdrop-blur-md">
                  <p className="font-bold mb-2">Chyba kamery</p>
                  {error}
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
          <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-3">
            <button 
              onClick={() => setIsManualMode(true)}
              className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-2xl transition-all z-20"
            >
              Zadat kód ručně
            </button>
            {!error && cameras.length > 1 && (
              <button 
                onClick={handleCameraChange}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all z-20 flex items-center justify-center gap-2"
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
