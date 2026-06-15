import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import MainMenu from './components/MainMenu';
import PartCreationForm from './components/PartCreationForm';
import UserManagement from './components/UserManagement';
import PartListModule from './components/PartListModule';
import { Moon, Sun } from 'lucide-react';

function App() {
  // 1. STAV: Zjištění, zda je uživatel již přihlášen z předchozí relace
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  // 2. STAV: Načtení jména přihlášeného uživatele
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('userName') || '';
  });
  
  // 3. STAV: Neprůstřelné načtení uživatelských oprávnění (práva na moduly)
  // Obsahuje try-catch blok, který zabrání chybě, pokud v paměti zůstal neplatný text (např. "undefined")
  const [userPermissions, setUserPermissions] = useState<number[]>(() => {
    const saved = localStorage.getItem('userPermissions');
    try {
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Chyba při čtení oprávnění z localStorage, resetuji na prázdné pole.", e);
    }
    return []; // Výchozí stav při chybě nebo prázdné paměti
  });
  
  // 4. STAV: Řízení aktivní obrazovky (modulu)
  // null = Hlavní menu, 1 = Založení dílu, 6 = Administrace, 7 = Přehled dílů
  const [activeModule, setActiveModule] = useState<number | null>(null);

  // 5. STAV: Detekce a nastavení Dark / Light modu podle systému nebo předchozí volby
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Effect, který fyzicky přepíná třídu 'dark' na elementu <html> a ukládá volbu
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Funkce spuštěná z LoginForm po úspěšném ověření na Python backendu
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

  // Funkce pro odhlášení – kompletně vyčistí stavy i lokální paměť prohlížeče
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName('');
    setUserPermissions([]);
    setActiveModule(null);
    localStorage.clear(); // Bezpečně smaže všechny záznamy z localStorage
  };

  // --- CENTRÁLNÍ ŘÍZENÍ RENDERU (PŘEPÍNÁNÍ OBRAZOVEK) ---
  const renderContent = () => {
    // KROK A: Pokud uživatel není ověřen, uvidí pouze přihlášení
    if (!isAuthenticated) {
      return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    // KROK B: Modul 1 - Založení dílu
    if (activeModule === 1) {
      return (
        <PartCreationForm 
          userName={userName} 
          userPermissions={userPermissions}
          onBack={() => setActiveModule(null)} // Návrat nastaví activeModule zpět na null (menu)
        />
      );
    }

    // KROK C: Modul 6 - Správa uživatelů / Admin panel
    if (activeModule === 6) {
      return (
        <UserManagement 
          userPermissions={userPermissions}
          onBack={() => setActiveModule(null)} 
        />
      );
    }

    // KROK D: Modul 7 - Přehled a filtrace dílů
    if (activeModule === 7) {
      return (
        <PartListModule 
          userPermissions={userPermissions}
          onBack={() => setActiveModule(null)} 
        />
      );
    }

    // KROK E: Výchozí pohled pro přihlášeného uživatele -> Hlavní rozcestník (Menu)
    return (
      <MainMenu 
        userName={userName} 
        userPermissions={userPermissions}
        onLogout={handleLogout} 
        onSelectModule={(id) => setActiveModule(id)} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6">
      
      {/* Plovoucí tlačítko pro přepínání vzhledu */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:scale-110 transition-transform focus:outline-none border border-gray-100 dark:border-gray-700"
        >
          {isDarkMode ? <Sun className="text-yellow-400 w-6 h-6" /> : <Moon className="text-indigo-600 w-6 h-6" />}
        </button>
      </div>

      {/* Dynamické vykreslení obsahu obalené plynulou animací náběhu */}
      <div className="w-full max-w-3xl animate-fade-in-up">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;