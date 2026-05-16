import { collection, doc, getDocs, increment, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../services/firebaseConfig'; // Certifique-se de que o caminho para o seu firebaseConfig está correto aqui

export interface Notificacao {
  id: string;
  tipo: 'RESOLVIDO' | 'CONTINUA';
  titulo: string;
  mensagem: string;
  dataEnvio: any; 
  categoriaDenuncia: string;
  usuarioId: string;
}

export const ControladorNotificacao = {
  /**
   * Busca todas as notificações oficiais geradas pelo sistema para o usuário logado
   */
  buscarNotificacoesDoUsuario: async (usuarioId: string): Promise<any[]> => {
    try {
      const notificacoesRef = collection(db, 'notificacoes');
      const q = query(
        notificacoesRef,
        where('usuarioId', '==', usuarioId),
        orderBy('dataEnvio', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const lista: any[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const dados = docSnap.data();
        
        // Trata a data caso venha como Timestamp do Firebase
        let dataFormatada = 'Recentemente';
        if (dados.dataEnvio?.seconds) {
          const d = new Date(dados.dataEnvio.seconds * 1000);
          dataFormatada = d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        lista.push({
          id: docSnap.id,
          ...dados,
          dataEnvio: dataFormatada
        });
      });
      
      return lista;
    } catch (error) {
      console.error("Erro ao buscar notificações no Firestore: ", error);
      throw error;
    }
  },

  /**
   * Executado quando qualquer usuário interage com uma denúncia de terceiros no Mapa
   */
  votarNaDenuncia: async (denunciaId: string, voto: 'resolvido' | 'irregular'): Promise<void> => {
    try {
      const denunciaRef = doc(db, 'denuncias', denunciaId);
      
      if (voto === 'resolvido') {
        await updateDoc(denunciaRef, {
          votos_resolvido: increment(1)
        });
      } else {
        await updateDoc(denunciaRef, {
          votos_continua: increment(1)
        });
      }
    } catch (error) {
      console.error("Erro ao registrar voto na denúncia: ", error);
      throw error;
    }
  }
};
