const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

// Define a região e outras opções globais
setGlobalOptions({ region: "southamerica-east1" });

// Inicializa o Firebase Admin
admin.initializeApp();

// --- FUNÇÃO PARA CRIAR AGENTES (JÁ EXISTENTE) ---
exports.criarNovoAgente = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }

  const { nome, email, senha, dataContratacao, planoCarreiraId } = request.data;
  const franqueadoUid = request.auth.uid;

  if (!dataContratacao || !planoCarreiraId || !nome || !email || !senha) {
    throw new HttpsError("invalid-argument", "Todos os campos (nome, email, senha, data e plano) são obrigatórios.");
  }

  try {
    const franqueadoDoc = await admin.firestore().collection("usuarios").doc(franqueadoUid).get();
    if (!franqueadoDoc.exists || franqueadoDoc.data().perfil !== "franqueado") {
      throw new HttpsError("permission-denied", "Você não tem permissão para criar agentes.");
    }
    
    const franquiaId = franqueadoDoc.data().franquiaId;
    if (!franquiaId) {
        throw new HttpsError("failed-precondition", "O franqueado não está associado a uma franquia.");
    }

    const userRecord = await admin.auth().createUser({ email: email, password: senha, displayName: nome });

    await admin.firestore().collection("usuarios").doc(userRecord.uid).set({
      nome: nome,
      email: email,
      perfil: "agente",
      status: "ativo",
      franquiaId: franquiaId,
      planoCarreiraId: planoCarreiraId,
      dataContratacao: admin.firestore.Timestamp.fromDate(new Date(dataContratacao)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Agente ${nome} criado com sucesso!` };
  } catch (error) {
    console.error("ERRO INTERNO NA FUNÇÃO:", error);
    throw new HttpsError("internal", `Erro no servidor: ${error.message}`);
  }
});


// --- NOVA FUNÇÃO PARA CRIAR FRANQUEADOS ---
exports.criarNovoFranqueado = onCall(async (request) => {
  // Apenas um superadmin pode criar um franqueado
  const superAdminUid = request.auth.uid;
  const superAdminDoc = await admin.firestore().collection("usuarios").doc(superAdminUid).get();
  if (!superAdminDoc.exists || superAdminDoc.data().perfil !== "superadmin") {
    throw new HttpsError("permission-denied", "Você não tem permissão para esta operação.");
  }

  const { nome, email, senha, franquiaId } = request.data;
  if (!nome || !email || !senha || !franquiaId) {
    throw new HttpsError("invalid-argument", "Todos os campos são obrigatórios.");
  }

  try {
    // Cria o usuário na Autenticação
    const userRecord = await admin.auth().createUser({
      email: email,
      password: senha,
      displayName: nome,
    });

    // Cria o documento no Firestore
    await admin.firestore().collection("usuarios").doc(userRecord.uid).set({
      nome: nome,
      email: email,
      perfil: "franqueado", // Define o perfil correto
      status: "ativo",
      franquiaId: franquiaId, // Associa à franquia selecionada
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Franqueado ${nome} criado com sucesso!` };
  } catch (error) {
    console.error("ERRO AO CRIAR FRANQUEADO:", error);
    throw new HttpsError("internal", `Erro no servidor: ${error.message}`);
  }
});