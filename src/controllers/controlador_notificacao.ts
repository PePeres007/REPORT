import { collection, doc, getDocs, onSnapshot, query, updateDoc, where, increment } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export interface Notificacao {
  id: string;
  tipo: 'avaliacao' | 'interacao' | 'resolvida';
  titulo: string;
  mensagem: string;
  dataEnvio: any;
  categoriaDenuncia: string;
  usuarioId: string;
  denunciaId?: string;
  lida?: boolean;
  autorAcaoId?: string | null;
}

function formatarDataEnvio(dataEnvio: any): string {
  if (dataEnvio?.seconds) {
    const d = new Date(dataEnvio.seconds * 1000);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return 'Recentemente';
}

function normalizarNotificacao(docSnap: any): Notificacao {
  const dados = docSnap.data();
  return {
    id: docSnap.id,
    ...dados,
    dataEnvio: formatarDataEnvio(dados.dataEnvio),
  } as Notificacao;
}

export const ControladorNotificacao = {
  buscarNotificacoesDoUsuario: async (usuarioId: string): Promise<Notificacao[]> => {
    try {
      const notificacoesRef = collection(db, 'notificacoes');
      const q = query(
        notificacoesRef,
        where('usuarioId', '==', usuarioId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .sort((a, b) => {
          const aSeconds = a.data().dataEnvio?.seconds ?? 0;
          const bSeconds = b.data().dataEnvio?.seconds ?? 0;
          return bSeconds - aSeconds;
        })
        .map(normalizarNotificacao);
    } catch (error) {
      console.error('Erro ao buscar notificações no Firestore: ', error);
      throw error;
    }
  },

  escutarNotificacoesDoUsuario: (
    usuarioId: string,
    callback: (lista: Notificacao[]) => void,
    onError?: (error: Error) => void
  ) => {
    const notificacoesRef = collection(db, 'notificacoes');
    const q = query(
      notificacoesRef,
      where('usuarioId', '==', usuarioId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs
          .sort((a, b) => {
            const aSeconds = a.data().dataEnvio?.seconds ?? 0;
            const bSeconds = b.data().dataEnvio?.seconds ?? 0;
            return bSeconds - aSeconds;
          })
          .map(normalizarNotificacao);
        callback(lista);
      },
      (error) => {
        console.error('Erro ao escutar notificações:', error);
        if (onError) onError(error as Error);
      }
    );
  },

  marcarComoLida: async (notificacaoId: string): Promise<void> => {
    const notificacaoRef = doc(db, 'notificacoes', notificacaoId);
    await updateDoc(notificacaoRef, { lida: true });
  },

  marcarTodasComoLidas: async (usuarioId: string): Promise<void> => {
    const q = query(
      collection(db, 'notificacoes'),
      where('usuarioId', '==', usuarioId),
      where('lida', '==', false)
    );
    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs.map((docSnap) =>
        updateDoc(docSnap.ref, { lida: true })
      )
    );
  },

  votarNaDenuncia: async (denunciaId: string, voto: 'resolvido' | 'irregular'): Promise<void> => {
    try {
      const denunciaRef = doc(db, 'denuncias', denunciaId);
      if (voto === 'resolvido') {
        await updateDoc(denunciaRef, { votos_resolvido: increment(1) });
      } else {
        await updateDoc(denunciaRef, { votos_continua: increment(1) });
      }
    } catch (error) {
      console.error('Erro ao registrar voto na denúncia: ', error);
      throw error;
    }
  },
};