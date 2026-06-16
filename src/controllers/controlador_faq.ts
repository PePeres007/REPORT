// src/controllers/controlador_faq.ts
import { db } from "../services/firebaseConfig";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

export interface FAQItem {
  id: string;
  pergunta: string;
  resposta: string;
  dataCriacao?: any;
}

const faqCollectionRef = collection(db, "faq");

export const ControladorFAQ = {
  // CREATE - Prefeitura cria uma nova dúvida
  async criarPergunta(pergunta: string, resposta: string): Promise<void> {
    try {
      await addDoc(faqCollectionRef, {
        pergunta: pergunta,
        resposta: resposta,
        dataCriacao: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao criar FAQ:", error);
      throw error;
    }
  },

  // READ - Cidadão e Prefeitura listam as perguntas
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
          dataCriacao: data.dataCriacao
        });
      });
      
      return listaFaq;
    } catch (error) {
      console.error("Erro ao buscar FAQ:", error);
      throw error;
    }
  },

  // UPDATE - Prefeitura edita pergunta existente
  async atualizarPergunta(id: string, pergunta: string, resposta: string): Promise<void> {
    try {
      const faqDocRef = doc(db, "faq", id);
      await updateDoc(faqDocRef, {
        pergunta: pergunta,
        resposta: resposta
      });
    } catch (error) {
      console.error("Erro ao atualizar FAQ:", error);
      throw error;
    }
  },

  // DELETE - Prefeitura deleta uma pergunta
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
