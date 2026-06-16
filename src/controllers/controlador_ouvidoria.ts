// src/controllers/controlador_ouvidoria.ts
import { db } from "../services/firebaseConfig";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

export interface SugestaoItem {
  id: string;
  idUsuario: string;
  nomeUsuario: string;
  texto: string;
  dataCriacao?: any;
}

const ouvidoriaCollectionRef = collection(db, "ouvidoria");

export const ControladorOuvidoria = {
  // CREATE - Cidadão envia uma nova sugestão de melhoria
  async criarSugestao(idUsuario: string, nomeUsuario: string, texto: string): Promise<void> {
    try {
      await addDoc(ouvidoriaCollectionRef, {
        idUsuario,
        nomeUsuario: nomeUsuario || "Cidadão Anônimo",
        texto,
        dataCriacao: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao criar sugestão:", error);
      throw error;
    }
  },

  // READ (Cidadão) - Lista apenas as sugestões do próprio cidadão logado
  async listarMinhasSugestoes(idUsuario: string): Promise<SugestaoItem[]> {
    try {
      const q = query(
        ouvidoriaCollectionRef, 
        where("idUsuario", "==", idUsuario),
        orderBy("dataCriacao", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const lista: SugestaoItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        lista.push({
          id: docSnap.id,
          idUsuario: data.idUsuario,
          nomeUsuario: data.nomeUsuario,
          texto: data.texto || "",
          dataCriacao: data.dataCriacao
        });
      });
      return lista;
    } catch (error) {
      console.error("Erro ao buscar minhas sugestões:", error);
      throw error;
    }
  },

  // READ (Prefeitura) - Lista todas as sugestões de todos os cidadãos
  async listarTodasSugestoes(): Promise<SugestaoItem[]> {
    try {
      const q = query(ouvidoriaCollectionRef, orderBy("dataCriacao", "desc"));
      const querySnapshot = await getDocs(q);
      
      const lista: SugestaoItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        lista.push({
          id: docSnap.id,
          idUsuario: data.idUsuario,
          nomeUsuario: data.nomeUsuario,
          texto: data.texto || "",
          dataCriacao: data.dataCriacao
        });
      });
      return lista;
    } catch (error) {
      console.error("Erro ao buscar todas as sugestões:", error);
      throw error;
    }
  },

  // UPDATE - Cidadão edita a sua própria sugestão
  async atualizarSugestao(id: string, texto: string): Promise<void> {
    try {
      const docRef = doc(db, "ouvidoria", id);
      await updateDoc(docRef, { texto });
    } catch (error) {
      console.error("Erro ao atualizar sugestão:", error);
      throw error;
    }
  },

  // DELETE - Cidadão remove a sua sugestão
  async deletarSugestao(id: string): Promise<void> {
    try {
      const docRef = doc(db, "ouvidoria", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao deletar sugestão:", error);
      throw error;
    }
  }
};
