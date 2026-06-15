import { useState, FormEvent, useEffect } from 'react';
import { ArrowLeft, UserPlus, ShieldCheck, Users, Shield, Save, Edit2, CheckCircle2, ShieldAlert } from 'lucide-react';

interface UserManagementProps {
  onBack: () => void;
  userPermissions: number[];
}

export default function UserManagement({ onBack, userPermissions }: UserManagementProps) {
  // Řízení podmodulů: 'users' = Správa uživatelů, 'roles' = Správa pozic
  const [subModule, setSubModule] = useState<'users' | 'roles'>('users');

  // Databázové stavy načítané z API
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  // Formulářové stavy pro uživatele
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [editingUsername, setEditingUsername] = useState<string | null>(null);

  // Formulářové stavy pro pozice (role)
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');

  // Kompletní definice všech 7 modulů v aplikaci pro zaškrtávací políčka práv
  const ALL_APP_MODULES = [
    { id: 1, name: '1. Založení dílu' },
    { id: 2, name: '2. Příchod z opravy' },
    { id: 3, name: '3. Nasazení do provozu' },
    { id: 4, name: '4. Demontáž' },
    { id: 5, name: '5. Odeslání na opravu' },
    { id: 7, name: '7. Aktuální díly (Přehled)' },
    { id: 6, name: '6. Správa uživatelů / administrace' },
  ];

  // Načtení kompletních dat z backendu při startu nebo změně
  const refreshData = async () => {
    try {
      const resUsers = await fetch('http://localhost:8000/api/users');
      const dataUsers = await resUsers.json();
      setUsersList(dataUsers);

      const resRoles = await fetch('http://localhost:8000/api/roles');
      const dataRoles = await resRoles.json();
      setRolesList(dataRoles);
      
      if (dataRoles.length > 0 && !userRole) {
        setUserRole(dataRoles[0].id);
      }
    } catch (err) {
      console.error("Chyba synchronizace dat s API", err);
    }
  };

  useEffect(() => {
    if (userPermissions.includes(6)) {
      refreshData();
    }
  }, [userPermissions]);

  // Tvrdá bezpečnostní pojistka přímo v komponentě
  if (!userPermissions.includes(6)) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl text-center max-w-md mx-auto">
        <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Přístup odepřen</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Nemáte oprávnění pro vstup do administrace systému.</p>
        <button onClick={onBack} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors">Zpět do menu</button>
      </div>
    );
  }

  // Akce: Vytvoření nebo Úprava uživatele
  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = editingUsername !== null;
      const url = isEditing ? `http://localhost:8000/api/users/${editingUsername}` : 'http://localhost:8000/api/users';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: isEditing ? editingUsername : username, password, name, role: userRole })
      });

      if (!res.ok) throw new Error("Chyba validace na serveru.");

      setMessage(isEditing ? "Uživatel byl úspěšně aktualizován" : "Uživatel byl úspěšně vytvořen");
      setUsername(''); setPassword(''); setName(''); setEditingUsername(null);
      refreshData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Příprava dat vybraného uživatele do editačního formuláře
  const startEditUser = (user: any) => {
    setEditingUsername(user.username);
    setUsername(user.username);
    setName(user.name);
    setPassword(user.password);
    setUserRole(user.role);
  };

  // Akce: Vytvoření nové prázdné pracovní pozice (role)
  const handleCreateRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoleId || !newRoleName) return;
    try {
      const res = await fetch('http://localhost:8000/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newRoleId.toLowerCase(), name: newRoleName, permissions: [1, 7] }) // Výchozí práva na založení a přehled
      });
      if (!res.ok) throw new Error("ID pozice již existuje.");
      setNewRoleId(''); setNewRoleName('');
      setMessage("Nová pozice byla úspěšně vytvořena");
      refreshData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Akce: Změna konkrétního práva u pozice (Zapnutí/Vypnutí Checkboxu)
  const handlePermissionToggle = async (roleId: string, moduleId: number) => {
    const targetRole = rolesList.find(r => r.id === roleId);
    if (!targetRole) return;

    let updatedPermissions = [...targetRole.permissions];
    if (updatedPermissions.includes(moduleId)) {
      // Pokud právo existuje, kliknutím ho odebereme
      updatedPermissions = updatedPermissions.filter(id => id !== moduleId);
    } else {
      // Pokud neexistuje, přidáme ho do pole
      updatedPermissions.push(moduleId);
    }

    try {
      await fetch(`http://localhost:8000/api/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roleId, name: targetRole.name, permissions: updatedPermissions })
      });
      refreshData();
    } catch (err) {
      console.error("Selhal zápis změn práv na backend", err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-4xl mx-auto overflow-hidden transition-colors duration-300">
      
      {/* Hlavní vrchní lišta administrace */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
        <h2 className="text-xl font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
          <Shield className="w-6 h-6" /> Systémová Administrace
        </h2>
        <div className="w-10"></div>
      </div>

      {/* SUBMODULY: Přepínání mezi Uživateli a Pozicemi */}
      <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/10">
        <button
          onClick={() => { setSubModule('users'); setEditingUsername(null); setUsername(''); setPassword(''); setName(''); }}
          className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-all
            ${subModule === 'users' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
          `}
        >
          <Users className="w-4 h-4" /> 1. Správa uživatelů
        </button>
        <button
          onClick={() => setSubModule('roles')}
          className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-all
            ${subModule === 'roles' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
          `}
        >
          <ShieldCheck className="w-4 h-4" /> 2. Správa pozic a práv
        </button>
      </div>

      <div className="p-6">
        {message && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl flex gap-2 items-center mb-6 border border-green-100 dark:border-green-800 animate-pop-in">
            <CheckCircle2 className="w-5 h-5"/> {message}
          </div>
        )}

        {/* --- SUBMODUL 1: SPRÁVA UŽIVATELŮ --- */}
        {subModule === 'users' && (
          <div className="space-y-8 animate-fade-in-up">
            
            {/* Formulář pro vytvoření / úpravu uživatelského účtu */}
            <form onSubmit={handleSaveUser} className="bg-gray-50/50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="font-bold text-gray-900 dark:text-white md:col-span-2 flex items-center gap-2 border-b pb-2 border-gray-200/50 dark:border-gray-600/30">
                <UserPlus className="w-4 h-4 text-indigo-500" /> {editingUsername ? `Režim úpravy: ${editingUsername}` : 'Registrace nového uživatele'}
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Celé Jméno a Příjmení</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="např. Jaroslav Mareš" className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Uživatelské jméno (Login)</label>
                <input type="text" required disabled={editingUsername !== null} value={username} onChange={e => setUsername(e.target.value)} placeholder="jmares" className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 dark:text-white transition-all" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Přihlašovací Heslo</label>
                <input type="text" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Zadejte heslo" className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Pracovní pozice (Systémová role)</label>
                <select value={userRole} onChange={e => setUserRole(e.target.value)} className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all cursor-pointer">
                  {rolesList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-600/30 mt-2">
                {editingUsername && (
                  <button type="button" onClick={() => { setEditingUsername(null); setUsername(''); setPassword(''); setName(''); }} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors">
                    Zrušit úpravy
                  </button>
                )}
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-bold py-2.5 px-6 rounded-xl text-sm flex items-center gap-2 shadow-md shadow-indigo-500/10">
                  <Save className="w-4 h-4"/> {editingUsername ? 'Uložit změny' : 'Založit uživatele'}
                </button>
              </div>
            </form>

            {/* Přehledová tabulka registrovaných uživatelů */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Celé jméno</th>
                    <th className="p-4">Uživatelský login</th>
                    <th className="p-4">Aktuální heslo</th>
                    <th className="p-4">Přiřazená pozice</th>
                    <th className="p-4 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {usersList.map(u => (
                    <tr key={u.username} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-4 font-bold text-gray-900 dark:text-gray-100">{u.name}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400 font-medium">{u.username}</td>
                      <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-50/30 dark:bg-gray-900/10">{u.password}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-lg text-xs font-semibold">
                          {rolesList.find(r => r.id === u.role)?.name || u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => startEditUser(u)} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-xl transition-colors" title="Upravit uživatele">
                          <Edit2 className="w-4 h-4"/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SUBMODUL 2: SPRÁVA POZIC A PRÁV --- */}
        {subModule === 'roles' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Rychlý formulář pro přidání nové pozice (Role) */}
            <form onSubmit={handleCreateRole} className="bg-gray-50/50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-end shadow-sm">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">ID role (Systémový kód bez diakritiky a mezer)</label>
                <input type="text" required value={newRoleId} onChange={e => setNewRoleId(e.target.value)} placeholder="např. vedouci_skladu" className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Zobrazený název pozice v systému</label>
                <input type="text" required value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="např. Vedoucí skladu" className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
              </div>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-bold py-2.5 px-6 rounded-xl text-sm h-[42px] shadow-md">
                Přidat pozici
              </button>
            </form>

            {/* Matrice / Přehled práv pro jednotlivé pracovní pozice */}
            <div className="space-y-4">
              {rolesList.map(roleItem => (
                <div key={roleItem.id} className="p-5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
                  <div className="flex items-center gap-2 border-b pb-3 mb-4 border-gray-100 dark:border-gray-700">
                    <Shield className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                      {roleItem.name} <span className="text-sm font-mono text-gray-400 font-normal">({roleItem.id})</span>
                    </h4>
                  </div>
                  
                  {/* Grid modulových checkboxů pro danou roli */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ALL_APP_MODULES.map(mod => {
                      const isChecked = roleItem.permissions.includes(mod.id);
                      return (
                        <label key={mod.id} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all select-none
                          ${isChecked 
                            ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-300 font-semibold' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }
                        `}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePermissionToggle(roleItem.id, mod.id)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer mr-3 transition-colors"
                          />
                          <span className="text-xs leading-tight">{mod.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}