import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

export class controladorHome {
  // Busca as denúncias no Firebase
  async carregarDenuncias() {
    try {
      const querySnapshot = await getDocs(collection(db, "denuncias"));
      const dados: any[] = [];
      querySnapshot.forEach((doc) => {
        dados.push({ id: doc.id, ...doc.data() });
      });
      console.log("✅ Denúncias carregadas!");
      return dados;
    } catch (error) {
      console.log("❌ Erro ao buscar:", error);
      return [];
    }
  }

  // Retorna a configuração de região inicial do mapa (Recife)
  obterRegiaoInicial() {
    return {
      latitude: -8.068733,
      longitude: -34.878515,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
  }
}