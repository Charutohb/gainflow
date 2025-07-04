import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
// Não vamos mais precisar do ícone de seta no logo

const MainLayout = ({ currentUser, children }) => {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    // O fundo geral continua o mesmo
    <div className="min-h-screen bg-slate-100">
      
      {/* CABEÇALHO CORRIGIDO: 
        - Fundo 'bg-green-50' (um verde bem claro, como na sua tela de login).
        - Texto principal 'text-gray-800'.
      */}
      <header className="bg-green-50 text-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          
          {/* LOGO CORRIGIDO: 
            - Agora reflete exatamente "GainFlo" + "W".
          */}
          <div className="flex items-center text-3xl font-bold tracking-wide">
            <span className="text-gray-800">GainFlo</span>
            <span className="text-green-600">W</span>
          </div>

          {currentUser && (
            <div className="flex items-center">
              <span className="mr-4 font-medium">Olá, {currentUser.nome || currentUser.email}</span>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6">
        {children} 
      </main>
    </div>
  );
};

export default MainLayout;