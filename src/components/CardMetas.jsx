import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const ProgressBar = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const color = percentage >= 100 ? '#4caf50' : '#f44336';
    return (
        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', marginTop: '0.5rem' }}>
            <div style={{
                width: `${Math.min(percentage, 100)}%`, backgroundColor: color, height: '24px', 
                borderRadius: '4px', textAlign: 'center', color: 'white', 
                lineHeight: '24px', transition: 'width 0.5s ease-in-out'
            }}>
                {Math.round(percentage)}%
            </div>
        </div>
    );
};

const CardMetas = () => {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({ ativosM1: 0, tpvTransacionadoM1: 0, taxaMigracao: 0 });
    const [metas, setMetas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mesRelatorio, setMesRelatorio] = useState('');

    useEffect(() => {
        if (!currentUser || !currentUser.uid) { setLoading(false); return; }
        const now = new Date();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const nomeMesAnterior = startOfLastMonth.toLocaleString('pt-BR', { month: 'long' });
        const anoAnterior = startOfLastMonth.getFullYear();
        setMesRelatorio(`${nomeMesAnterior} de ${anoAnterior}`);
        const fetchMetas = async () => {
            const mesId = startOfLastMonth.toLocaleString('pt-BR', { month: 'long' }).toLowerCase();
            const anoId = startOfLastMonth.getFullYear();
            const metaDocId = `${currentUser.uid}_${mesId}_${anoId}`;
            const metaRef = doc(db, "metas", metaDocId);
            const metaSnap = await getDoc(metaRef);
            if (metaSnap.exists()) { setMetas(metaSnap.data()); } else { setMetas(null); }
        };
        const q = query(collection(db, "clientes"), where("agenteId", "==", currentUser.uid), where("createdAt", ">=", startOfLastMonth), where("createdAt", "<=", endOfLastMonth));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientesM1 = snapshot.docs.map(doc => doc.data());
            const ativosM1 = clientesM1.filter(c => c.isAtivo).length;
            const tpvPrecificadoM1 = clientesM1.reduce((sum, c) => sum + (c.tpvPrecificado || 0), 0);
            const tpvTransacionadoM1 = clientesM1.reduce((sum, c) => sum + (c.tpvTransacionado || 0), 0);
            const taxaMigracao = tpvPrecificadoM1 > 0 ? (tpvTransacionadoM1 / tpvPrecificadoM1) : 0;
            setStats({ ativosM1, tpvTransacionadoM1, taxaMigracao });
        });
        fetchMetas().then(() => setLoading(false));
        return () => unsubscribe();
    }, [currentUser]);

    let remuneracaoTotal = 0;
    if (metas) {
        const valorRef = metas.valorReferencia || 0;
        const valorPilarAtivos = valorRef * 0.30;
        const valorPilarMigracao = valorRef * 0.30;
        const valorPilarTpv = valorRef * 0.40;
        const percAtivos = (metas.objetivoAtivos || 1) > 0 ? (stats.ativosM1 / metas.objetivoAtivos) : 0;
        const percMigracao = (metas.objetivoMigracao || 1) > 0 ? (stats.taxaMigracao / metas.objetivoMigracao) : 0;
        const percTpvTransacionado = (metas.objetivoTpvTransacionado || 1) > 0 ? (stats.tpvTransacionadoM1 / metas.objetivoTpvTransacionado) : 0;
        const remunAtivos = percAtivos >= (metas.setpointAtivos || 0) ? percAtivos * valorPilarAtivos : 0;
        const remunMigracao = percMigracao >= (metas.setpointMigracao || 0) ? percMigracao * valorPilarMigracao : 0;
        const remunTpvTransacionado = percTpvTransacionado >= (metas.setpointTpvTransacionado || 0) ? percTpvTransacionado * valorPilarTpv : 0;
        
        console.log("== DEBUG DO CÁLCULO DE ATIVOS ==", {
            percentualAtingido: percAtivos,
            setpointNecessario: metas.setpointAtivos,
            condicaoAprovada: percAtivos >= (metas.setpointAtivos || 0),
            valorDoPilar: valorPilarAtivos,
            remuneracaoCalculada: remunAtivos
        });

        remuneracaoTotal = remunAtivos + remunMigracao + remunTpvTransacionado;
    }

    if (loading) return <p>Calculando performance...</p>;
    
    return (
        <div>
            <div style={{ backgroundColor: '#333', color: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'normal', textTransform: 'uppercase' }}>Relatório de Performance (Referente à Carteira de {mesRelatorio})</h3>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 'bold' }}>{remuneracaoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            {!metas ? (<p>Aguardando definição de metas pelo seu líder para o mês de {mesRelatorio}.</p>) : (
                <>
                    <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>1. Ativação da Carteira</h4>
                        <p>Resultado: {stats.ativosM1} / {metas.objetivoAtivos || 0} Clientes Ativados</p>
                        <ProgressBar value={stats.ativosM1} max={metas.objetivoAtivos || 1} />
                    </div>
                    <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>2. Migração da Carteira</h4>
                        <p>Resultado: {(stats.taxaMigracao * 100).toFixed(1)}% / {(metas.objetivoMigracao * 100).toFixed(0)}%</p>
                        <ProgressBar value={stats.taxaMigracao} max={metas.objetivoMigracao || 0.8} />
                    </div>
                    <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>3. TPV Transacionado</h4>
                        <p>Resultado: {stats.tpvTransacionadoM1.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {(metas.objetivoTpvTransacionado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <ProgressBar value={stats.tpvTransacionadoM1} max={metas.objetivoTpvTransacionado || 1} />
                    </div>
                </>
            )}
        </div>
    );
};
export default CardMetas;