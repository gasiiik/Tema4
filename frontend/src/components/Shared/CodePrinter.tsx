import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import bwipjs from 'bwip-js';
import { Printer, X } from 'lucide-react';

interface CodePrinterProps {
  part: any;
  onClose: () => void;
}

export default function CodePrinter({ part, onClose }: CodePrinterProps) {
  const [codeType, setCodeType] = useState<'qr' | 'dm' | 'bar'>('qr');

  useEffect(() => {
    if (codeType === 'dm' || codeType === 'bar') {
      try {
        bwipjs.toCanvas('bwip-canvas', {
          bcid: codeType === 'dm' ? 'datamatrix' : 'code128',
          text: part.serial_number,
          scale: codeType === 'bar' ? 2 : 3,
          height: codeType === 'bar' ? 15 : undefined,
          includetext: codeType === 'bar',
          textxalign: 'center',
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, [codeType, part.serial_number]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full animate-pop-in print:shadow-none print:w-full print:max-w-none print:p-0 print:dark:bg-white">
        
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tisk štítku</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="flex gap-2 mb-6 print:hidden">
          <button onClick={() => setCodeType('qr')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${codeType === 'qr' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>QR</button>
          <button onClick={() => setCodeType('dm')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${codeType === 'dm' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>DataMatrix</button>
          <button onClick={() => setCodeType('bar')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${codeType === 'bar' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>Čárový</button>
        </div>

        {/* PRINT AREA */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[250px] print:border-none print:p-0">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white uppercase tracking-widest mb-4 text-center print:text-black">{part.part_type}</h3>
          
          {codeType === 'qr' && (
            <div className="bg-white p-2 rounded-xl">
              <QRCodeSVG value={part.serial_number} size={150} level="H" />
            </div>
          )}
          
          {(codeType === 'dm' || codeType === 'bar') && (
            <div className="bg-white p-2 rounded-xl flex justify-center overflow-hidden w-full max-w-[250px]">
              <canvas id="bwip-canvas" className="max-w-full h-auto"></canvas>
            </div>
          )}

          {codeType !== 'bar' && (
            <p className="mt-4 font-mono text-sm font-bold text-gray-900 dark:text-gray-200 print:text-black text-center break-all">{part.serial_number}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono print:text-gray-600">Zapsáno: {new Date(part.created_at || Date.now()).toLocaleDateString('cs-CZ')}</p>
        </div>

        <button onClick={handlePrint} className="w-full mt-6 bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-all print:hidden shadow-lg">
          <Printer className="w-5 h-5" /> Vytisknout štítek
        </button>
      </div>
    </div>
  );
}
