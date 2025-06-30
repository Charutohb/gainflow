import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase/config';
import { FaUserAlt, FaLock } from 'react-icons/fa'; // Importando os ícones

// Componente do Logo para ser reutilizado
export const AppLogo = () => (
  <h1 className="text-4xl md:text-5xl font-black text-center text-dark-text tracking-wide">
    GainFlo<span className="text-primary-green">W</span>
  </h1>
);

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (firebaseError) {
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-light-green-bg p-4">
      {/* Cartão com efeito de vidro fosco */}
      <div className="w-full max-w-sm p-8 space-y-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl">
        <AppLogo />
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Campo de E-mail com Ícone */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUserAlt className="text-light-text" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 text-dark-text bg-white/80 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
              placeholder="E-mail"
            />
          </div>

          {/* Campo de Senha com Ícone */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="text-light-text" />
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 text-dark-text bg-white/80 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
              placeholder="Senha"
            />
          </div>

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          {/* Botão de Entrar */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 font-semibold text-white bg-primary-green rounded-lg hover:bg-secondary-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green disabled:bg-slate-400 transition-colors shadow-lg"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;