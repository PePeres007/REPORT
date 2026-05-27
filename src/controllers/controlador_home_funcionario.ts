import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { controladorGeral } from './controlador_geral';
import { limparSessao } from '../services/userStorage';

export class controladorHomeFuncionario extends controladorGeral {
  constructor(routerInstance: any) {
    super(routerInstance);
  }

  public async buscarTodasDenuncias(): Promise<any[]> {
    try {
      const q = query(collection(db, "denuncias"), orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      const lista: any[] = [];

      querySnapshot.forEach((docSnap) => {
        const dados = docSnap.data();
        
        let dataFormatada = 'Recente';
        if (dados.criadoEm?.seconds) {
          const d = new Date(dados.criadoEm.seconds * 1000);
          dataFormatada = d.toLocaleDateString('pt-BR');
        }

        // Tenta extrair o bairro caso não exista um campo específico mapeado
        // O reverseGeocode salva como: "Rua, Número, Bairro, Cidade..."
        let bairroDetectado = dados.bairro || 'Não Identificado';
        if (!dados.bairro && dados.endereco) {
          const partes = dados.endereco.split(',');
          if (partes.length > 2) {
            bairroDetectado = partes[2].trim();
          }
        }

        lista.push({
          id: docSnap.id,
          dataFormatada,
          bairroLimpo: bairroDetectado,
          ...dados
        });
      });

      return lista;
    } catch (error) {
      console.error("Erro ao carregar denúncias no painel do servidor:", error);
      return [];
    }
  }

  /**
   * @public
   * @description Executa a filtragem combinada na lista de denúncias na memória (alta performance)
   */
  public aplicarFiltrosCombinados(
    lista: any[],
    statusAba: string,
    urgencia: string,
    categoria: string,
    bairro: string
  ): any[] {
    return lista.filter(item => {
      // 1. Filtro da Sub-página (Avanço / Status)
      // Mapeia os termos visuais para os salvos no banco
      const statusItem = item.status?.toLowerCase() || 'pendente';
      if (statusAba === 'pendente' && statusItem !== 'pendente') return false;
      if (statusAba === 'em_andamento' && statusItem !== 'em_analise') return false;
      if (statusAba === 'finalizado' && statusItem !== 'resolvido') return false;

      // 2. Filtro de Urgência
      if (urgencia !== 'Todos' && item.urgencia !== urgencia) return false;

      // 3. Filtro de Categoria
      if (categoria !== 'Todos' && item.categoria !== categoria) return false;

      // 4. Filtro de Bairro
      if (bairro !== 'Todos' && item.bairroLimpo !== bairro) return false;

      return true;
    });
  }

  // Coleta todos os bairros únicos presentes nas denúncias para alimentar o seletor da UI
  public extrairBairrosUnicos(lista: any[]): string[] {
    const bairros = lista.map(item => item.bairroLimpo);
    return ['Todos', ...new Set(bairros)].filter(Boolean);
  }

  public async encerrarSessao(): Promise<void> {
    try {
      await auth.signOut();
      await limparSessao();
      this.substituirRota('/login');
    } catch (error) {
      this.exibirMensagem("Erro", "Não foi possível encerrar a sessão.");
    }
  }

  public verDetalhesOcorrencia(id: string) {
    this.navegarPara(`/detalhes_report?id=${id}`);
  }
}