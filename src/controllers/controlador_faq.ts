import { db } from "../services/firebaseConfig";
import { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp 
} from "firebase/firestore";

export interface FAQItem {
  id: string;
  pergunta: string;
  resposta: string;
  status: 'pendente' | 'respondida'; // NOVO: Controle de status
  dataCriacao?: any;
}

const faqCollectionRef = collection(db, "faq");

export const ControladorFAQ = {
  // CREATE (Prefeitura) - Já cria com a resposta oficial
  async criarPergunta(pergunta: string, resposta: string): Promise<void> {
    try {
      await addDoc(faqCollectionRef, {
        pergunta: pergunta,
        resposta: resposta,
        status: 'respondida',
        dataCriacao: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao criar FAQ:", error);
      throw error;
    }
  },

  // CREATE (Cidadão) - Cria uma dúvida que vai ficar aguardando resposta
  async enviarDuvidaCidadao(pergunta: string): Promise<void> {
    try {
      await addDoc(faqCollectionRef, {
        pergunta: pergunta,
        resposta: "", // Fica vazio até a prefeitura responder
        status: 'pendente',
        dataCriacao: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao enviar dúvida:", error);
      throw error;
    }
  },

  // READ - Lista todas as perguntas para todos verem
  async listarPerguntas(): Promise<FAQItem[]> {
    try {
      const q = query(faqCollectionRef, orderBy("dataCriacao", "desc"));
      const querySnapshot = await getDocs(q);
      
      const listaFaq: FAQItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        listaFaq.push({
          id: docSnap.id,
          pergunta: data.pergunta || "",
          resposta: data.resposta || "",
          status: data.status || "respondida", // Fallback para as antigas
          dataCriacao: data.dataCriacao
        });
      });
      
      return listaFaq;
    } catch (error) {
      console.error("Erro ao buscar FAQ:", error);
      throw error;
    }
  },

  // UPDATE - Prefeitura edita ou responde uma pergunta pendente
  async atualizarPergunta(id: string, pergunta: string, resposta: string): Promise<void> {
    try {
      const faqDocRef = doc(db, "faq", id);
      await updateDoc(faqDocRef, {
        pergunta: pergunta,
        resposta: resposta,
        status: 'respondida' // Assim que atualiza, muda para respondida
      });
    } catch (error) {
      console.error("Erro ao atualizar FAQ:", error);
      throw error;
    }
  },

  // DELETE
  async deletarPergunta(id: string): Promise<void> {
    try {
      const faqDocRef = doc(db, "faq", id);
      await deleteDoc(faqDocRef);
    } catch (error) {
      console.error("Erro ao deletar FAQ:", error);
      throw error;
    }
  }
};