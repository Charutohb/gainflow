import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { collection, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase/config';

// Importações das Telas e Componentes
import LoginScreen from './screens/LoginScreen.jsx';
import MainLayout from './layouts/MainLayout.jsx'; // <-- Precisamos do Layout Principal
import PainelSuperAdmin from './screens/PainelSuperAdmin.jsx';
import DashboardFranqueado from './screens/DashboardFranqueado.jsx';
import DashboardAgente from './screens/DashboardAgente.jsx';
import PromocaoModal from './components/PromocaoModal.jsx';

function App() {
  const { currentUser } = useAuth();
  const [promocao, setPromocao] = useState(null);

  useEffect(() => {
    const checkForNotifications = async () => {
      if (currentUser?.perfil === 'agente') {
        const q = query(
          collection(db, "notificacoes"),
          where("agenteId", "==", currentUser.uid),
          where("lida", "==", false),
          where("tipo", "==", "promocao"),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const notificationDoc = querySnapshot.docs[0];
          setPromocao({ id: notificationDoc.id, ...notificationDoc.data() });
        }
      }
    };
    checkForNotifications();
  }, [currentUser]);

  const handleClosePromocaoModal = async () => {
    if (!promocao) return;
    const notificationRef = doc(db, 'notificacoes', promocao.id);
    await updateDoc(notificationRef, { lida: true });
    setPromocao(null);
  };

  const renderDashboard = () => {
    if (!currentUser || !currentUser.perfil) {
      return <div className="p-6">Carregando perfil...</div>;
    }
    switch (currentUser.perfil) {
      case 'superadmin':
        return <PainelSuperAdmin />;
      case 'franqueado':
        return <DashboardFranqueado />;
      case 'agente':
        return <DashboardAgente />;
      default:
        return <div className="p-6">Perfil de usuário desconhecido.</div>;
    }
  };

  return (
    <>
      {/* Lógica Corrigida: Se houver usuário, renderiza o Layout Principal 
          que "envelopa" o dashboard correto. Senão, mostra o Login. */}
      {currentUser ? (
        <MainLayout currentUser={currentUser}>
          {renderDashboard()}
        </MainLayout>
      ) : (
        <LoginScreen />
      )}

      {/* O Modal de Promoção continua renderizando por cima de tudo */}
      <PromocaoModal 
        isOpen={!!promocao}
        onClose={handleClosePromocaoModal}
        mensagem={promocao?.mensagem}
      />
    </>
  );
}

export default App;