import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import PainelSuperAdmin from './screens/PainelSuperAdmin.jsx';
import DashboardFranqueado from './screens/DashboardFranqueado.jsx';
import DashboardAgente from './screens/DashboardAgente.jsx';

function App() {
  const { currentUser } = useAuth();
  const renderDashboard = () => {
    if (!currentUser || !currentUser.perfil) {
      return <div className="flex items-center justify-center h-screen"><p>Carregando perfil...</p></div>;
    }
    let dashboardComponent;
    switch (currentUser.perfil) {
      case 'superadmin': dashboardComponent = <PainelSuperAdmin />; break;
      case 'franqueado': dashboardComponent = <DashboardFranqueado />; break;
      case 'agente': dashboardComponent = <DashboardAgente />; break;
      default: dashboardComponent = <p>Perfil de usuário desconhecido.</p>;
    }
    return <MainLayout>{dashboardComponent}</MainLayout>;
  };
  return currentUser ? renderDashboard() : <LoginScreen />;
}

export default App;