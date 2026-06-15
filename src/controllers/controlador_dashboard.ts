import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export class ControladorDashboard {
  
  public async buscarDadosEstatisticos() {
    try {
      const querySnapshot = await getDocs(collection(db, "denuncias"));
      const denuncias: any[] = [];
      querySnapshot.forEach(doc => denuncias.push(doc.data()));

      return {
        linhaDoTempo: this.gerarDadosLinhaDoTempo(denuncias),
        barrasCategoria: this.gerarDadosBarras(denuncias),
        totais: denuncias.length
      };
    } catch (error) {
      console.error("Erro ao carregar dados analíticos:", error);
      return { linhaDoTempo: [], barrasCategoria: [], totais: 0 };
    }
  }

  // Agrupa denúncias por data para o Gráfico de Linhas (Evolução Temporal)
  private gerarDadosLinhaDoTempo(denuncias: any[]) {
    const contagemPorData: Record<string, number> = {};

    denuncias.forEach(d => {
      if (d.criadoEm?.seconds) {
        const data = new Date(d.criadoEm.seconds * 1000);
        // Formata para Dia/Mês (ex: 15/06)
        const rotulo = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
        contagemPorData[rotulo] = (contagemPorData[rotulo] || 0) + 1;
      }
    });

    // Converte o objeto num array ordenado para a biblioteca gráfica
    return Object.keys(contagemPorData)
      .sort() // Ordem cronológica básica
      .map(data => ({
        label: data,
        value: contagemPorData[data],
        dataPointText: contagemPorData[data].toString()
      }));
  }

  // Agrupa denúncias por categoria para o Gráfico de Barras
  private gerarDadosBarras(denuncias: any[]) {
    const contagemCat: Record<string, number> = {};

    denuncias.forEach(d => {
      const cat = d.categoria || 'Outros';
      // Abrevia os nomes para caberem no eixo X
      const nomeAbreviado = cat.substring(0, 5).toUpperCase(); 
      contagemCat[nomeAbreviado] = (contagemCat[nomeAbreviado] || 0) + 1;
    });

    return Object.keys(contagemCat).map(cat => ({
      label: cat,
      value: contagemCat[cat],
      frontColor: '#3B82F6' 
    }));
  }
}