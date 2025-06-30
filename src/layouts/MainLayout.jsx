import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from '../screens/LoginScreen';
import { FiLogOut } from 'react-icons/fi'; // <-- Importamos o ícone aqui

const MainLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-light-bg">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl">
              <AppLogo />
            </div>
            {currentUser && (
              <div className="flex items-center">
                <span className="hidden sm:block mr-4 text-light-text">
                  Olá, <span className="font-medium text-dark-text">{currentUser.nome || currentUser.email}</span>
                </span>
                {/* --- BOTÃO SAIR ATUALIZADO COM ÍCONE --- */}
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <FiLogOut className="mr-2 h-4 w-4" /> {/* Ícone adicionado */}
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;