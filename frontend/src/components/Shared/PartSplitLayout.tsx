import { ReactNode } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';

interface PartSplitLayoutProps {
  part: any;
  title: string;
  onBack: () => void;
  children: ReactNode;
}

export default function PartSplitLayout({ part, title, onBack, children }: PartSplitLayoutProps) {
  const history = part.history || [];

  return (
    <div className="w-full mx-auto max-w-7xl animate-fade-in-up">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-5 sm:p-6 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-2xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Díl: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{part.serial_number}</span> ({part.part_type})
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse lg:flex-row gap-6">
        {/* Left Sidebar: History (Bottom on mobile) */}
        <div className="w-full lg:w-1/3 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Historie dílu</h3>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 max-h-[70vh]">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Zatím žádná historie.</p>
              ) : (
                <div className="space-y-6">
                  {history.map((record: any, idx: number) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-indigo-100 dark:border-indigo-900/50 pb-2">
                      <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white dark:ring-gray-800"></div>
                      <div className="text-xs text-gray-400 mb-1">
                        {new Date(record.date).toLocaleString('cs-CZ')} • {record.user}
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">{record.action}</h4>
                      {record.details && Object.keys(record.details).length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                          {Object.entries(record.details).map(([k, v]) => (
                            <div key={k}><span className="font-semibold text-gray-500 capitalize">{k}:</span> {String(v)}</div>
                          ))}
                        </div>
                      )}
                      {record.photos && record.photos.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                          {record.photos.map((p: string, i: number) => (
                            <img key={i} src={p} alt="Záznam" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Area: Main Content / Form */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
