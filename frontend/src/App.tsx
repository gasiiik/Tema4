import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import MainMenu from './components/MainMenu';
import PartCreationForm from './components/PartCreationForm';
import UserManagement from './components/UserManagement';
import PartListModule from './components/PartListModule';
import LineUsageForm from './components/LineUsageForm';
import RepairArrivalForm from './components/RepairArrivalForm';
import DismantleForm from './components/DismantleForm';
import DispatchForm from './components/DispatchForm';
import PartInfoView from './components/PartInfoView';
import SetupWizard from './components/SetupWizard';
import { Moon, Sun, Loader2 } from 'lucide-react';

function App() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('userName') || '';
  });
  
  const [userPermissions, setUserPermissions] = useState<number[]>(() => {
    const saved = localStorage.getItem('userPermissions');
    try {
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Chyba při čtení oprávnění.", e);
    }
    return [];
  });
  
  const [activeModule, setActiveModule] = useState<number | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Check setup status on load
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setIsConfigured(data.configured))
      .catch(() => setIsConfigured(false));
  }, []);

  const handleLoginSuccess = (name: string, token: string, rememberMe: boolean, permissions: number[]) => {
    setUserName(name);
    setUserPermissions(permissions);
    setIsAuthenticated(true);
    if (rememberMe) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', name);
      localStorage.setItem('authToken', token);
      localStorage.setItem('userPermissions', JSON.stringify(permissions));
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName('');
    setUserPermissions([]);
    setActiveModule(null);
    localStorage.clear();
  };

  const getWrapperWidth = () => {
    if (isConfigured === false) return 'max-w-2xl';
    if (!isAuthenticated) return 'max-w-md';
    if (activeModule === null) return 'max-w-4xl';
    return 'max-w-6xl xl:max-w-7xl w-full';
  };

  const renderContent = () => {
    if (isConfigured === null) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-500" />
          <p>Ověřuji stav systému...</p>
        </div>
      );
    }

    if (isConfigured === false) {
      return <SetupWizard onComplete={() => setIsConfigured(true)} />;
    }

    if (!isAuthenticated) return <LoginForm onLoginSuccess={handleLoginSuccess} />;

    if (activeModule === 1) return <PartCreationForm userName={userName} userPermissions={userPermissions} onBack={() => setActiveModule(null)} />;
    if (activeModule === 2) return <RepairArrivalForm userName={userName} userPermissions={userPermissions} onBack={() => setActiveModule(null)} />;
    if (activeModule === 3) return <LineUsageForm userName={userName} userPermissions={userPermissions} onBack={() => setActiveModule(null)} />;
    if (activeModule === 4) return <DismantleForm userName={userName} userPermissions={userPermissions} onBack={() => setActiveModule(null)} />;
    if (activeModule === 5) return <DispatchForm userName={userName} userPermissions={userPermissions} onBack={() => setActiveModule(null)} />;
    
    if (activeModule === 6) return <UserManagement userPermissions={userPermissions} onBack={() => setActiveModule(null)} />;
    if (activeModule === 7) return <PartListModule userPermissions={userPermissions} onBack={() => setActiveModule(null)} />;
    if (activeModule === 99) return <PartInfoView onBack={() => setActiveModule(null)} />;

    return <MainMenu userName={userName} userPermissions={userPermissions} onLogout={handleLogout} onSelectModule={(id) => setActiveModule(id)} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col items-center justify-center p-2 sm:p-6">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:scale-110 transition-transform focus:outline-none border border-gray-100 dark:border-gray-700"
        >
          {isDarkMode ? <Sun className="text-yellow-400 w-6 h-6" /> : <Moon className="text-indigo-600 w-6 h-6" />}
        </button>
      </div>

      <div className={`${getWrapperWidth()} transition-all duration-300 mx-auto animate-fade-in-up w-full`}>
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
