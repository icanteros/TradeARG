import React from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { LogIn, UserPlus, LogOut, Save, Cloud, ShieldAlert, Check } from 'lucide-react';

interface UserProfile {
  username: string;
  location: string;
  stores: string;
  avatar: string;
}

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onViewChange: (view: 'landing' | 'collection' | 'trade' | 'import' | 'profile') => void;
  session: Session | null;
  authLoading: boolean;
}

export default function ProfileView({ 
  userProfile, 
  onUpdateProfile, 
  onViewChange,
  session,
  authLoading
}: ProfileViewProps) {
  // Local profile form state
  const [username, setUsername] = React.useState(userProfile.username);
  const [location, setLocation] = React.useState(userProfile.location);
  const [stores, setStores] = React.useState(userProfile.stores);
  const [avatar, setAvatar] = React.useState(userProfile.avatar);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Authentication form state
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [registerUsername, setRegisterUsername] = React.useState('');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authLocalLoading, setAuthLocalLoading] = React.useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = React.useState<string | null>(null);

  // Sync state if profile prop changes
  React.useEffect(() => {
    setUsername(userProfile.username);
    setLocation(userProfile.location);
    setStores(userProfile.stores);
    setAvatar(userProfile.avatar);
  }, [userProfile]);

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      username,
      location,
      stores,
      avatar
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setAuthLocalLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setAuthSuccessMsg('¡Sesión iniciada con éxito!');
        setEmail('');
        setPassword('');
      } else {
        if (!registerUsername.trim()) {
          throw new Error('El nombre de usuario es obligatorio.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: registerUsername.trim()
            }
          }
        });
        if (error) throw error;
        setAuthSuccessMsg('¡Registro completado! Por favor revisa tu correo para verificar tu cuenta (si corresponde) o inicia sesión.');
        setAuthMode('login');
        setPassword('');
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      setAuthLocalLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex min-h-screen pt-16 bg-[#05050a] text-[#dae2fd]">
      
      {/* Side Navigation Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#05050a] border-r border-[#2d2d44] flex flex-col py-8 px-4 justify-between hidden md:flex z-20">
        <nav className="space-y-1">
          <button
            onClick={() => onViewChange('landing')}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#c7c4d7] hover:text-primary hover:bg-primary/5 rounded transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl group-hover:drop-shadow-[0_0_5px_#00b8ff]">
              dashboard
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[11px]">
              Dashboard
            </span>
          </button>
          
          <button
            onClick={() => onViewChange('collection')}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#c7c4d7] hover:text-primary hover:bg-primary/5 rounded transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">
              library_books
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[11px]">
              My Collection
            </span>
          </button>
          
          <button
            onClick={() => onViewChange('import')}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#c7c4d7] hover:text-primary hover:bg-primary/5 rounded transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">
              cloud_upload
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[11px]">
              Import
            </span>
          </button>
          
          <button
            onClick={() => onViewChange('trade')}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#c7c4d7] hover:text-primary hover:bg-primary/5 rounded transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">
              group
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[11px]">
              Search Users
            </span>
          </button>
        </nav>
      </aside>

      {/* Main Container */}
      <main className="flex-1 md:ml-64 bg-[#05050a] px-4 md:px-10 py-10 pb-36 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          
          {/* Header Title block */}
          <div className="space-y-2">
            <h2 className="font-sans text-3xl md:text-4xl font-black text-on-surface tracking-tight uppercase italic select-none">
              PERFIL DE OPERADOR
            </h2>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${session ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-secondary shadow-[0_0_8px_#00f2ff]'}`}></span>
              <p className="font-sans text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.25em] select-none">
                {session ? 'ONLINE SYNC MODE (SUPABASE)' : 'GUEST LOCAL MODE (LOCALSTORAGE)'}
              </p>
            </div>
          </div>

          {authLoading || authLocalLoading ? (
            /* Main Loading State */
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,184,255,0.4)]"></div>
              <p className="text-xs text-on-surface-variant font-mono uppercase tracking-[0.2em] animate-pulse">Procesando autenticación...</p>
            </div>
          ) : !session ? (
            /* LOGIN / REGISTER CONTAINER */
            <div className="bg-[#121221] border border-primary/20 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-8 max-w-md mx-auto">
              
              {/* Tab Selector */}
              <div className="flex border-b border-[#2d2d44]">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                  className={`flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                    authMode === 'login'
                      ? 'border-primary text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.3)]'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                  className={`flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                    authMode === 'register'
                      ? 'border-primary text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.3)]'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {/* Status Notifications */}
              {authError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-bold font-sans flex items-start gap-2 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs font-bold font-sans flex items-start gap-2 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4 font-sans">
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-[#908fa0]">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      placeholder="Ej. BlackLotusArgentina"
                      required
                      className="w-full bg-[#05050a] border border-[#2d2d44] text-[#dae2fd] text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-[#908fa0]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operador@tradearg.com"
                    required
                    className="w-full bg-[#05050a] border border-[#2d2d44] text-[#dae2fd] text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-[#908fa0]">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-[#05050a] border border-[#2d2d44] text-[#dae2fd] text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 bg-primary hover:brightness-110 text-white py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,184,255,0.35)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {authMode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      Ingresar al Portal
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Crear Cuenta de Operador
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-[9px] text-on-surface-variant font-mono">
                  Al conectarte con Supabase, tu colección y tus datos se sincronizarán en la nube para que otros coleccionistas puedan ver tu inventario público de canjes.
                </p>
              </div>

            </div>
          ) : (
            /* LOGGED IN USER PROFILE MANAGEMENT */
            <div className="space-y-6">
              
              {/* Success Banner */}
              {saveSuccess && (
                <div className="bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 p-4 rounded-xl text-xs font-bold font-sans flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Perfil sincronizado y guardado con éxito en la base de datos!</span>
                </div>
              )}

              {/* Settings Box */}
              <div className="bg-[#121221] border border-primary/20 p-6 sm:p-8 rounded-2xl shadow-2xl">
                <form onSubmit={handleSubmitProfile} className="space-y-6">
                  
                  {/* Status header with syncing indicator */}
                  <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-xs font-sans text-emerald-400">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <div>
                        <p className="font-bold">Sincronización en la Nube Activa</p>
                        <p className="text-[10px] text-emerald-400/80 font-mono">Sesión: {session.user.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="bg-transparent border border-red-500/40 hover:bg-red-500/10 text-red-400 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Cerrar Sesión
                    </button>
                  </div>

                  {/* Profile Avatar setup */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#2d2d44]/50">
                    <div className="w-24 h-24 rounded-xl border-2 border-emerald-500 p-1 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-[#05050a] flex-shrink-0 select-none">
                      <img
                        src={avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbdoIxp_Cnk7hU5w0DX4ZH_TSG_MByPvwQyeIP58d1q89JJOw8ze26_JmPuIdS3ImrcV1bDUfNg01DYsW5biuiu-2y37bxw6w5ULCET2XIgG23uctjIEa-v-_A1u5CDQP5tGJaREtDq4BmfaYANOMTojgGR-bywm3I3DB4DKEsP9o8SfAXElwDlQqtGy8dAr6lmJk8rMwLBkWdapJY8-KYbTB47OUvTArd-1wwARK7eyiGltZw7Zpei7D9kH4sJN6W8xc7cDJQPE0'}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbdoIxp_Cnk7hU5w0DX4ZH_TSG_MByPvwQyeIP58d1q89JJOw8ze26_JmPuIdS3ImrcV1bDUfNg01DYsW5biuiu-2y37bxw6w5ULCET2XIgG23uctjIEa-v-_A1u5CDQP5tGJaREtDq4BmfaYANOMTojgGR-bywm3I3DB4DKEsP9o8SfAXElwDlQqtGy8dAr6lmJk8rMwLBkWdapJY8-KYbTB47OUvTArd-1wwARK7eyiGltZw7Zpei7D9kH4sJN6W8xc7cDJQPE0';
                        }}
                      />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#908fa0] font-sans">
                        URL del Avatar (Imagen de Perfil)
                      </label>
                      <input
                        type="url"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="Pega la URL de tu imagen..."
                        className="w-full bg-[#05050a] border border-[#2d2d44] text-[#dae2fd] text-xs font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Form Input fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Nombre de usuario */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#908fa0] font-sans">
                        Nombre del Operador (Username)
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ej. Neo_User"
                        maxLength={25}
                        required
                        className="w-full bg-[#05050a] border border-[#2d2d44] text-[#dae2fd] text-xs font-sans rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>

                    {/* Ubicación física */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#908fa0] font-sans">
                        Ubicación (Ciudad / Provincia)
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ej. CABA, Buenos Aires"
                        required
                        className="w-full bg-[#05050a] border border-[#2d2d44] text-[#dae2fd] text-xs font-sans rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>

                  </div>

                  {/* Lugares de tradeo frecuente */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#908fa0] font-sans">
                      Lugares / Tiendas de Tradeo Frecuentes
                    </label>
                    <input
                      type="text"
                      value={stores}
                      onChange={(e) => setStores(e.target.value)}
                      placeholder="Ej. Magic Lair, Sector 9, Dima Games, Club de Rol..."
                      className="w-full bg-[#05050a] border border-[#2d2d44] text-[#dae2fd] text-xs font-sans rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <p className="text-[9px] text-on-surface-variant font-mono">
                      Separa las tiendas con comas. Servirá para informar a otros usuarios dónde encontrarte para hacer canjes.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-[#2d2d44]/30 flex justify-end">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      Sincronizar Perfil
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Mobile Sticky Navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#05050a]/95 backdrop-blur-md border-t border-primary/20 flex justify-around py-4 px-2 z-40 select-none">
        <button 
          onClick={() => onViewChange('landing')}
          className="flex flex-col items-center gap-1 text-[#c7c4d7] hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
        </button>
        <button 
          onClick={() => onViewChange('collection')}
          className="flex flex-col items-center gap-1 text-[#c7c4d7] hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">library_books</span>
        </button>
        <button 
          onClick={() => onViewChange('import')}
          className="flex flex-col items-center gap-1 text-[#c7c4d7] hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
        </button>
        <button 
          onClick={() => onViewChange('trade')}
          className="flex flex-col items-center gap-1 text-[#c7c4d7] hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">group</span>
        </button>
        <button 
          onClick={() => onViewChange('profile')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${session ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-primary drop-shadow-[0_0_5px_#00b8ff]'}`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            person
          </span>
        </button>
      </nav>

    </div>
  );
}
