import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Lock, User, Loader2 } from 'lucide-react';

// Rozhraní jsme rozšířili o token a hodnotu checkboxu
interface LoginFormProps {
  onLoginSuccess: (name: string, token: string, rememberMe: boolean) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Výchozí zaškrtnutí "Zůstat přihlášen"
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error('Zadali jste špatné jméno nebo heslo.');
      
      const data = await response.json();
      
      // Odesíláme data zpět do App.tsx včetně informace, jestli to máme uložit
      onLoginSuccess(data.name, data.token, rememberMe);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-500 animate-pop-in border border-gray-100 dark:border-gray-700">
      
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-full mb-4 transform transition-transform hover:scale-110 hover:rotate-3 duration-300">
          <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Přihlášení</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Evidence náhradních dílů</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm border border-red-100 dark:border-red-800 flex items-center animate-bounce-slight">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className="group relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
            Uživatelské jméno
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-2xl leading-5 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 focus:-translate-y-1 focus:shadow-lg sm:text-sm"
              placeholder="např. udrzba"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="group relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
            Heslo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="block w-full pl-11 pr-12 py-3.5 border border-gray-200 dark:border-gray-600 rounded-2xl leading-5 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 focus:-translate-y-1 focus:shadow-lg sm:text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* --- NOVÉ: Checkbox "Pamatovat si mě" a odkaz na heslo --- */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center group/check cursor-pointer">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer transition-colors"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer group-hover/check:text-indigo-600 dark:group-hover/check:text-indigo-400 transition-colors">
              Zůstat přihlášen
            </label>
          </div>

          <div className="text-sm">
            <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
              Zapomenuté heslo?
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !username || !password}
          className="relative w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none overflow-hidden group mt-4"
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
          
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Vstoupit do systému'
          )}
        </button>
      </form>
    </div>
  );
}