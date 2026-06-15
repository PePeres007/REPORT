// src/controllers/controlador_lista_denuncias.ts
import * as Location from 'expo-location';
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { controladorGeral } from './controlador_geral';

export class controladorListaDenuncias extends controladorGeral {
  constructor(routerInstance: any) {
    super(routerInstance);
  }

  // Algoritmo de Haversine para calcular distância real em metros
  private calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  }

  public async carregarDenuncias(apenasMinhas: boolean, apenasProximas: boolean): Promise<any[]> {
    try {
      const denunciasRef = collection(db, "denuncias");
      let consulta = query(denunciasRef, orderBy("criadoEm", "desc"));
      
      const usuarioAtual = auth.currentUser;

      // 1. Filtro Principal: Minhas ou Todas
      if (apenasMinhas) {
        if (!usuarioAtual) {
          this.exibirMensagem("Atenção", "Faça login para visualizar seus relatos.");
          return [];
        }
        consulta = query(denunciasRef, where("userId", "==", usuarioAtual.uid), orderBy("criadoEm", "desc"));
      }

      const querySnapshot = await getDocs(consulta);
      let lista: any[] = [];

      querySnapshot.forEach((doc) => {
        const dados = doc.data();
        let dataExibicao = 'Recente';
        if (dados.criadoEm?.seconds) {
          const d = new Date(dados.criadoEm.seconds * 1000);
          dataExibicao = d.toLocaleDateString('pt-BR');
        }

        lista.push({
          id: doc.id,
          dataFormatada: dataExibicao,
          ...dados
        });
      });

      // 2. Sub-filtro de Localização: Apenas Próximas (Raio de 400m)
      if (apenasProximas) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          this.exibirMensagem('Permissão Negada', 'Precisamos do GPS para achar as denúncias próximas.');
          return lista; // Se negar, ignora o filtro e retorna a lista normal
        }

        const localizacao = await Location.getCurrentPositionAsync({});
        const minhaLat = localizacao.coords.latitude;
        const minhaLon = localizacao.coords.longitude;

        lista = lista.filter(denuncia => {
          if (!denuncia.latitude || !denuncia.longitude) return false;
          const distancia = this.calcularDistanciaMetros(minhaLat, minhaLon, denuncia.latitude, denuncia.longitude);
          return distancia <= 400; 
        });
      }

      return lista;
    } catch (error: any) {
      console.error("Erro ao carregar lista de denúncias:", error);
      this.exibirMensagem("Erro", "Não foi possível carregar o feed de ocorrências.");
      return [];
    }
  }

  public verDetalhes(id: string) {
    this.navegarPara(`/detalhes_report?id=${id}`);
  }

  public async deletarDenuncia(denunciaId: string): Promise<boolean> {
    try {
      const usuarioAtual = auth.currentUser;
      if (!usuarioAtual) {
        this.exibirMensagem("Erro", "Você precisa estar logado para deletar uma denúncia.");
        return false;
      }

      // Verificar se o usuário é o dono da denúncia
      const docRef = doc(db, 'denuncias', denunciaId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        this.exibirMensagem("Erro", "Denúncia não encontrada.");
        return false;
      }

      const denunciaData = docSnap.data();
      if (denunciaData.userId !== usuarioAtual.uid) {
        this.exibirMensagem("Erro", "Você só pode deletar denúncias que você criou.");
        return false;
      }

      // Deletar a denúncia
      await deleteDoc(docRef);
      this.exibirMensagem("Sucesso", "Denúncia deletada com sucesso!");
      return true;
    } catch (error: any) {
      console.error("Erro ao deletar denúncia:", error);
      this.exibirMensagem("Erro", "Não foi possível deletar a denúncia.");
      return false;
    }
  }
}