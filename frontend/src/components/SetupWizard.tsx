import { apiFetch } from '../apiFetch';
import { useState } from 'react';
import { Database, Server, User as UserIcon, Lock, Save, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [dbType, setDbType] = useState<'internal' | 'external'>('internal');
  
  const [dbHost, setDbHost] = useState('db');
  const [dbPort, setDbPort] = useState('3306');
  const [dbUser, setDbUser] = useState('tema4_user');
  const [dbPassword, setDbPassword] = useState('tema4_password');
  const [dbName, setDbName] = useState('tema4_db');

  const [adminUser, setAdminUser] = useState('admin');
  const [adminName, setAdminName] = useState('Hlavní administrátor');
  const [adminPassword, setAdminPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDbTypeChange = (type: 'internal' | 'external') => {
    setDbType(type);
    if (type === 'internal') {
      setDbHost('db');
      setDbPort('3306');
      setDbUser('tema4_user');
      setDbPassword('tema4_password');
      setDbName('tema4_db');
    } else {
      setDbHost('localhost');
      setDbPort('3306');
      setDbUser('');
      setDbPassword('');
      setDbName('');
    }
  };

  const handleSetupSubmit = async () => {
    if (!adminUser || !adminName || !adminPassword) {
      setError('Vyplňte prosím všechny údaje pro administrátora.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_host: dbHost,
          db_port: dbPort,
          db_user: dbUser,
          db_password: dbPassword,
          db_name: dbName,
          admin_username: adminUser,
          admin_name: adminName,
          admin_password: adminPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Chyba při instalaci.');

      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-pop-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mb-6">
          <ShieldCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Prvotní nastavení systému</h1>
        <p className="text-gray-500 dark:text-gray-400">Vítejte! Před prvním použitím je potřeba systém nakonfigurovat.</p>
      </div>

      {error && (
        <div className="p-4 mb-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-800/50 text-sm font-medium">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-fade-in-up">
          <h2 className="text-xl font-bold border-b border-gray-100 dark:border-gray-700 pb-2">Krok 1: Připojení k databázi</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleDbTypeChange('internal')}
              className={`p-4 flex flex-col items-center gap-3 rounded-2xl border-2 transition-all ${dbType === 'internal' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300'}`}
            >
              <Database className="w-8 h-8" />
              <span className="font-bold">Interní databáze</span>
              <span className="text-xs text-center">Použije se výchozí lokální MariaDB dodaná v Dockeru.</span>
            </button>
            <button 
              onClick={() => handleDbTypeChange('external')}
              className={`p-4 flex flex-col items-center gap-3 rounded-2xl border-2 transition-all ${dbType === 'external' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300'}`}
            >
              <Server className="w-8 h-8" />
              <span className="font-bold">Externí server</span>
              <span className="text-xs text-center">Připojit se k existujícímu MariaDB/MySQL serveru.</span>
            </button>
          </div>

          <div className="space-y-4 mt-6 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Hostitel</label>
                <input type="text" value={dbHost} onChange={e => setDbHost(e.target.value)} disabled={dbType === 'internal'} className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border outline-none disabled:opacity-60" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Port</label>
                <input type="text" value={dbPort} onChange={e => setDbPort(e.target.value)} disabled={dbType === 'internal'} className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border outline-none disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Uživatel DB</label>
              <input type="text" value={dbUser} onChange={e => setDbUser(e.target.value)} disabled={dbType === 'internal'} className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Heslo DB</label>
              <input type="text" value={dbPassword} onChange={e => setDbPassword(e.target.value)} disabled={dbType === 'internal'} className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Název databáze</label>
              <input type="text" value={dbName} onChange={e => setDbName(e.target.value)} disabled={dbType === 'internal'} className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border outline-none disabled:opacity-60" />
            </div>
          </div>

          <button onClick={() => setStep(2)} className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex justify-center items-center gap-2">
            Pokračovat <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in-up">
          <h2 className="text-xl font-bold border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
             Krok 2: Vytvoření administrátora
          </h2>
          <p className="text-sm text-gray-500">Zadejte přihlašovací údaje pro hlavní účet s plnými přístupovými právy.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Přihlašovací jméno</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input type="text" value={adminUser} onChange={e => setAdminUser(e.target.value)} className="w-full pl-10 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Zobrazované jméno</label>
              <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Heslo administrátora</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full pl-10 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => setStep(1)} className="px-6 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-2xl font-bold transition-colors">
              Zpět
            </button>
            <button disabled={isLoading} onClick={handleSetupSubmit} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50">
              {isLoading ? 'Dokončování...' : 'Uložit a nastavit systém'} <Save className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-8 animate-pop-in space-y-4">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Instalace dokončena!</h2>
          <p className="text-gray-500 mb-8">Databáze byla připojena a systém je připraven k použití.</p>
          <button onClick={onComplete} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30">
            Přejít na přihlášení
          </button>
        </div>
      )}
    </div>
  );
}
