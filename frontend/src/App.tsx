import { apiFetch } from './apiFetch';
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

  useEffect(() => {
    apiFetch('/api/status')
      .then(async res => {
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      })
      .then(data => setIsConfigured(!!data.configured))
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
          <div className="loader scale-150 mb-8 mt-4 text-indigo-500 dark:text-gray-400">
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col items-center justify-center p-2 sm:p-6">
      <div className="fixed top-3 right-3 z-50">
        <label className="themeToggle st-sunMoonThemeToggleBtn" title="Toggle theme">
          <input
            type="checkbox"
            className="themeToggleInput"
            checked={!isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
          />
          <svg viewBox="0 0 20 20" fill="currentColor" stroke="none">
            <mask id="moon-mask">
              <rect x="0" y="0" width="20" height="20" fill="white"></rect>
              <circle cx="11" cy="3" r="8" fill="black"></circle>
            </mask>
            <circle className="sunMoon" cx="10" cy="10" r="8" mask="url(#moon-mask)"></circle>
            <g>
              <circle className="sunRay sunRay1" cx="18" cy="10" r="1.5"></circle>
              <circle className="sunRay sunRay2" cx="14" cy="16.928" r="1.5"></circle>
              <circle className="sunRay sunRay3" cx="6" cy="16.928" r="1.5"></circle>
              <circle className="sunRay sunRay4" cx="2" cy="10" r="1.5"></circle>
              <circle className="sunRay sunRay5" cx="6" cy="3.1718" r="1.5"></circle>
              <circle className="sunRay sunRay6" cx="14" cy="3.1718" r="1.5"></circle>
            </g>
          </svg>
        </label>
      </div>

      <div className={`${getWrapperWidth()} transition-all duration-300 mx-auto animate-fade-in-up w-full`}>
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
