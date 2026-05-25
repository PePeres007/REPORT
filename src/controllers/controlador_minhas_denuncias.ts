// src/controllers/controlador_minhas_denuncias.ts
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { controladorGeral } from './controlador_geral';

export class controladorMinhasDenuncias extends controladorGeral {
  constructor(routerInstance: any) {
    super(routerInstance);
  }

  public async buscarDenunciasDoUsuario(): Promise<any[]> {
    const user = auth.currentUser;
    if (!user) {
      this.exibirMensagem("Erro", "Sessão expirada. Faça login novamente.");
      return [];
    }

    try {
      const denunciasRef = collection(db, "denuncias");
      // Filtra onde o 'userId' é igual ao ID do utilizador logado
      const q = query(
        denunciasRef, 
        where("userId", "==", user.uid),
        orderBy("criadoEm", "desc")
      );

      const querySnapshot = await getDocs(q);
      const lista: any[] = [];

      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });

      return lista;
    } catch (error) {
      console.error("Erro ao buscar as minhas denúncias:", error);
      this.exibirMensagem("Erro", "Não foi possível carregar as suas denúncias.");
      return [];
    }
  }

  public verDetalhes(id: string) {
    this.navegarPara(`/detalhes_report?id=${id}`);
  }
}