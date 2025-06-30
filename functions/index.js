const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "southamerica-east1" });

// --- Função para Adicionar Agente ---
exports.addAgentToFranchise = onCall(async (request) => {
  if (!request.auth) { throw new HttpsError("unauthenticated", "Você precisa estar autenticado para realizar esta ação."); }
  const franchiseeId = request.auth.uid;
  const agentEmail = request.data.email;
  if (!agentEmail) { throw new HttpsError("invalid-argument", "O e-mail do agente é obrigatório."); }
  try {
    const franchiseeRef = admin.firestore().collection("usuarios").doc(franchiseeId);
    const franchiseeDoc = await franchiseeRef.get();
    if (!franchiseeDoc.exists || franchiseeDoc.data().perfil !== "franqueado") { throw new HttpsError("permission-denied", "Você não tem permissão para adicionar agentes."); }
    const franquiaId = franchiseeDoc.data().franquiaId;
    const agentUserRecord = await admin.auth().getUserByEmail(agentEmail);
    const agentId = agentUserRecord.uid;
    const agentName = agentUserRecord.displayName || agentEmail.split('@')[0];
    const agentRef = admin.firestore().collection("usuarios").doc(agentId);
    await agentRef.set({
      perfil: "agente",
      franquiaId: franquiaId,
      nome: agentName,
      email: agentEmail,
    }, { merge: true });
    return { status: "success", message: `O usuário ${agentEmail} foi adicionado como agente com sucesso!` };
  } catch (error) {
    console.error("Erro ao adicionar agente:", error);
    if (error.code === "auth/user-not-found") { throw new HttpsError("not-found", "Nenhum usuário encontrado com este e-mail."); }
    throw new HttpsError("internal", "Ocorreu um erro interno. Tente novamente.");
  }
});

// --- Função para Remover Agente ---
exports.removeAgentFromFranchise = onCall(async (request) => {
  if (!request.auth) { throw new HttpsError("unauthenticated", "Você precisa estar autenticado para realizar esta ação."); }
  const franchiseeId = request.auth.uid;
  const agentIdToRemove = request.data.agentId;
  if (!agentIdToRemove) { throw new HttpsError("invalid-argument", "O ID do agente é obrigatório."); }
  try {
    const franchiseeRef = admin.firestore().collection("usuarios").doc(franchiseeId);
    const franchiseeDoc = await franchiseeRef.get();
    if (!franchiseeDoc.exists || franchiseeDoc.data().perfil !== "franqueado") { throw new HttpsError("permission-denied", "Você não tem permissão para remover agentes."); }
    const agentRef = admin.firestore().collection("usuarios").doc(agentIdToRemove);
    await agentRef.update({ perfil: "sem_franquia", franquiaId: null });
    return { status: "success", message: "O agente foi removido da sua equipe com sucesso." };
  } catch (error) {
    console.error("Erro ao remover agente:", error);
    throw new HttpsError("internal", "Ocorreu um erro interno ao remover o agente.");
  }
});

// --- NOVA Função para Criar Franqueado ---
exports.createFranchisee = onCall(async (request) => {
    // Verificação de Segurança do chamador
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
    }

    const superAdminId = request.auth.uid;
    const superAdminRef = admin.firestore().collection("usuarios").doc(superAdminId);
    const superAdminDoc = await superAdminRef.get();

    if (!superAdminDoc.exists || superAdminDoc.data().perfil !== "superadmin") {
      throw new HttpsError("permission-denied", "Apenas Super Admins podem criar franqueados.");
    }

    // Validação dos dados recebidos
    const { email, senha, nome, franquiaId } = request.data;
    if (!email || !senha || !nome || !franquiaId) {
      throw new HttpsError("invalid-argument", "Todos os campos são obrigatórios.");
    }

    try {
      // Criar o usuário no Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email: email,
        password: senha,
        displayName: nome,
      });

      // Criar o documento do usuário no Firestore
      const newUserRef = admin.firestore().collection("usuarios").doc(userRecord.uid);
      await newUserRef.set({
        nome: nome,
        email: email,
        perfil: "franqueado",
        franquiaId: franquiaId,
      });

      return { status: "success", message: `Franqueado ${nome} criado com sucesso!` };

    } catch (error) {
      console.error("Erro ao criar franqueado:", error);
      if (error.code === 'auth/email-already-exists') {
          throw new HttpsError('already-exists', 'Este e-mail já está em uso por outra conta.');
      }
      throw new HttpsError("internal", "Ocorreu um erro interno ao criar o franqueado.");
    }
  });