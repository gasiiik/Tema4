import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import MainMenu from './components/MainMenu';
import PartCreationForm from './components/PartCreationForm';
import { Moon, Sun } from 'lucide-react';

function App() {
  // 1. Zjištění stavu přihlášení – v anonymním okně bude toto VŽDY false
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('userName') || '';
  });
  
  // 2. Řízení aktivního modulu – výchozí stav MUSÍ být null, aby se ukázalo menu
  const [activeModule, setActiveModule] = useState<number | null>(null);

  // Řízení tmavého/světlého motivu
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

  // Funkce spuštěná po úspěšném přihlášení z LoginForm
  const handleLoginSuccess = (name: string, token: string, rememberMe: boolean) => {
    setUserName(name);
    setIsAuthenticated(true);
    if (rememberMe) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', name);
      localStorage.setItem('authToken', token);
    }
  };

  // Funkce pro odhlášení z MainMenu
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName('');
    setActiveModule(null); // Resetujeme modul na menu
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
  };

  // --- KLÍČOVÁ ŘÍDICÍ LOGIKA ---
  const renderContent = () => {
    // KROK A: Pokud uživatel není přihlášen, uvidí POUZE přihlašovací formulář
    if (!isAuthenticated) {
      return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    // KROK B: Pokud je přihlášen a vybral modul 1, zobrazíme zápis dílu
    if (activeModule === 1) {
      return (
        <PartCreationForm 
          userName={userName} 
          onBack={() => setActiveModule(null)} // Návrat přepne stav na null (menu)
        />
      );
    }

    // KROK C: Pokud je přihlášen a activeModule je null, zobrazíme Hlavní menu
    return (
      <MainMenu 
        userName={userName} 
        onLogout={handleLogout} 
        onSelectModule={(id) => setActiveModule(id)} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6">
      
      {/* Tlačítko pro přepínání motivu */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:scale-110 transition-transform focus:outline-none border border-gray-100 dark:border-gray-700"
        >
          {isDarkMode ? <Sun className="text-yellow-400 w-6 h-6" /> : <Moon className="text-indigo-600 w-6 h-6" />}
        </button>
      </div>

      {/* Zde se dynamicky vykresluje obsah na základě naší funkce */}
      <div className="w-full max-w-3xl animate-fade-in-up">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;