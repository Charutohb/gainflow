import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen'; // Precisaremos criar esta tela
import MainLayout from './layouts/MainLayout'; // E esta
import DashboardAgente from './screens/DashboardAgente';
import DashboardFranqueado from './screens/DashboardFranqueado';
import PainelSuperAdmin from './screens/PainelSuperAdmin';

function App() {
  const { currentUser } = useAuth();

  const renderDashboard = () => {
    if (!currentUser?.perfil) {
      return <div className="p-8">Carregando perfil ou perfil não encontrado...</div>
    }
    let dashboardComponent;
    switch (currentUser.perfil) {
      case 'superadmin': dashboardComponent = <PainelSuperAdmin />; break;
      case 'franqueado': dashboardComponent = <DashboardFranqueado />; break;
      case 'agente': dashboardComponent = <DashboardAgente />; break;
      default: dashboardComponent = <p>Perfil desconhecido.</p>;
    }
    return <MainLayout>{dashboardComponent}</MainLayout>;
  };
  return currentUser ? renderDashboard() : <LoginScreen />;
}

export default App;