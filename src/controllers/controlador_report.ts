import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Alert } from 'react-native';
import { db, storage } from '../services/firebaseConfig';
import { controladorGeral } from './controlador_geral';

export interface DadosReport {
  categoria: string;
  fotoUri: string | null;
  endereco: string;
  descricao: string;
  latitude: number;
  longitude: number;
  urgencia: string;
}

export const CATEGORIAS = [
  { id: 'infraestrutura', label: 'Infraestrutura', descricao: 'Buracos, iluminação...', icone: '🚧', orgaoSolucao: 'EMLURB / Sec. de Infraestrutura' },
  { id: 'meio ambiente', label: 'Meio Ambiente', descricao: 'Poluição, queda de árvore...', icone: '🌳', orgaoSolucao: 'SEMAM / Controle Ambiental' },
  { id: 'segurança', label: 'Segurança Pública', descricao: 'Riscos, vandalismo...', icone: '🚨', orgaoSolucao: 'Guarda Municipal / Defesa Civil' },
  { id: 'transporte', label: 'Transporte', descricao: 'Sinalizações, bloqueios...', icone: '🚌', orgaoSolucao: 'CTTU' },
  { id: 'saneamento', label: 'Saneamento', descricao: 'Esgoto, drenagem, inundação...', icone: '💧', orgaoSolucao: 'COMPESA / Limpeza Urbana' },
];

export const LISTA_ORGAOS_MUNICIPAIS = [
  'EMLURB / Sec. de Infraestrutura',
  'SEMAM / Controle Ambiental',
  'Guarda Municipal / Defesa Civil',
  'CTTU',
  'COMPESA / Limpeza Urbana'
];

export class controladorReport extends controladorGeral {
  constructor(routerInstance: any) {
    super(routerInstance);
  }

  async obterEnderecoPorCoordenadas(latitude: number, longitude: number): Promise<string> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return 'Endereço não disponível';

      const [endereco] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (endereco) {
        return `${endereco.street || endereco.name}, ${endereco.streetNumber || 'S/N'}, ${endereco.district || endereco.subregion}, ${endereco.city}`;
      }
      return 'Endereço não encontrado';
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      return 'Erro ao buscar endereço';
    }
  }

  async tirarFoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos da permissão da câmera para tirar a foto.');
      return null;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets.length > 0) return resultado.assets[0].uri;
    return null;
  }

  private async uploadFoto(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const nomeArquivo = `reports/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, nomeArquivo);

      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Erro no upload da foto:', error);
      throw new Error('Falha ao enviar a imagem.');
    }
  }

  async salvarReport(dados: DadosReport, usuarioId: string): Promise<boolean> {
    try {
      let urlFoto = null;
      if (dados.fotoUri) urlFoto = await this.uploadFoto(dados.fotoUri);

      const reportParaSalvar = {
        userId: usuarioId,
        categoria: dados.categoria,
        endereco: dados.endereco,
        descricao: dados.descricao,
        latitude: dados.latitude,
        longitude: dados.longitude,
        urgencia: dados.urgencia,
        fotoUrl: urlFoto,
        status: 'pendente',
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
        apoiadores: [],
        resolvidos: [],
      };

      await addDoc(collection(db, 'denuncias'), reportParaSalvar);
      return true;
    } catch (error) {
      console.error('Erro ao salvar o report no banco:', error);
      Alert.alert('Erro', 'Não foi possível registrar a denúncia. Tente novamente mais tarde.');
      return false;
    }
  }

  async apoiarDenuncia(reportId: string, userId: string) {
    try {
      const docRef = doc(db, 'denuncias', reportId);
      await updateDoc(docRef, { apoiadores: arrayUnion(userId) });
      await this.criarNotificacoesParaMonitorados(reportId, 'apoio', userId);
      Alert.alert('Sucesso', 'Você apoiou esta ocorrência!');
    } catch (error) {
      console.error('Erro ao apoiar:', error);
    }
  }

  async resolverDenuncia(reportId: string, userId: string) {
    try {
      const docRef = doc(db, 'denuncias', reportId);
      await updateDoc(docRef, { resolvidos: arrayUnion(userId) });
      await this.criarNotificacoesParaMonitorados(reportId, 'resolvida', userId);
      Alert.alert('Sucesso', 'Você marcou esta ocorrência como resolvida!');
    } catch (error) {
      console.error('Erro ao resolver:', error);
    }
  }

  async salvarPlanejamentoSolucao(reportId: string, dadosRelatorio: any) {
    try {
      const docRef = doc(db, 'denuncias', reportId);
      await updateDoc(docRef, {
        status: 'em_analise',
        relatorioTecnico: {
          orgaoSolucao: dadosRelatorio.orgaoSolucao || '',
          orgaoAuxiliar: dadosRelatorio.orgaoAuxiliar || 'Nenhum',
          dataPrevista: dadosRelatorio.dataPrevista || '',
          planoSolucao: dadosRelatorio.planoSolucao || '',
          custosEstimados: {
            maoDeObra: parseFloat(dadosRelatorio.maoDeObra),
            material: parseFloat(dadosRelatorio.material),
            intervencao: parseFloat(dadosRelatorio.intervencao),
            apoio: parseFloat(dadosRelatorio.apoio),
          },
          dataPlanejamento: new Date().toISOString(),
        },
      });

      const autorAcaoId = getAuth().currentUser?.uid;
      await this.criarNotificacoesParaMonitorados(reportId, 'interacao', autorAcaoId);
      return true;
    } catch (error) {
      console.error('Erro ao salvar planejamento:', error);
      return false;
    }
  }

  async finalizarOcorrenciaComRelatorio(reportId: string, dadosRelatorio: any, relatorioAtual: any) {
    try {
      const docRef = doc(db, 'denuncias', reportId);
      await updateDoc(docRef, {
        status: 'resolvido',
        relatorioTecnico: {
          ...relatorioAtual,
          orgaoSolucao: dadosRelatorio.orgaoSolucao || '',
          orgaoAuxiliar: dadosRelatorio.orgaoAuxiliar || 'Nenhum',
          dataPrevista: dadosRelatorio.dataPrevista || '',
          planoSolucao: dadosRelatorio.planoSolucao || '',
          custosEstimados: {
            maoDeObra: parseFloat(dadosRelatorio.maoDeObra),
            material: parseFloat(dadosRelatorio.material),
            intervencao: parseFloat(dadosRelatorio.intervencao),
            apoio: parseFloat(dadosRelatorio.apoio),
          },
          dataConclusao: dadosRelatorio.dataConclusao || '',
          gastosTotais: parseFloat(dadosRelatorio.gastosTotais),
          dataFinalizacaoDoc: new Date().toISOString(),
        },
      });

      const autorAcaoId = getAuth().currentUser?.uid;
      await this.criarNotificacoesParaMonitorados(reportId, 'resolvida', autorAcaoId);
      return true;
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      return false;
    }
  }


  private mapearCampoMonitoramento(tipo: 'apoio' | 'interacao' | 'resolvida' | 'avaliacao') {
    // O Radar salva o interesse de "apoios" no campo `avaliacao`.
    // Para compatibilidade com a UI atual, apoio e avaliação usam o mesmo campo no Firestore.
    return tipo === 'apoio' ? 'avaliacao' : tipo;
  }

  private mapearTipoNotificacao(tipo: 'apoio' | 'interacao' | 'resolvida' | 'avaliacao') {
    // Mantém o tipo salvo compatível com a Central de Notificações atual.
    return tipo === 'apoio' ? 'avaliacao' : tipo;
  }

  private async obterDetalhesDenuncia(denunciaId: string): Promise<{ titulo: string; categoria: string } | null> {
    try {
      const reportRef = doc(db, 'denuncias', denunciaId);
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) return null;

      const dados = reportSnap.data();
      return {
        titulo: dados.titulo || dados.descricao || 'Ocorrência monitorada',
        categoria: dados.categoria || 'Geral',
      };
    } catch (error) {
      console.error('Erro ao buscar detalhes da denúncia:', error);
      return null;
    }
  }

  public async avaliarReport(idReport: string, nota: number): Promise<boolean> {
    try {
      const reportRef = doc(db, 'denuncias', idReport);
      await updateDoc(reportRef, {
        'avaliacao.nota': nota,
        'avaliacao.data': new Date().toISOString(),
      });

      const autorAcaoId = getAuth().currentUser?.uid;
      await this.criarNotificacoesParaMonitorados(idReport, 'avaliacao', autorAcaoId);
      return true;
    } catch (erro) {
      console.error('Erro ao enviar avaliação:', erro);
      return false;
    }
  }


  public async criarNotificacoesParaMonitorados(
    denunciaId: string,
    tipo: 'apoio' | 'interacao' | 'resolvida' | 'avaliacao',
    autorAcaoId?: string
  ) {
    try {
      const detalhes = await this.obterDetalhesDenuncia(denunciaId);
      const tituloDenuncia = detalhes?.titulo || 'Ocorrência monitorada';
      const categoriaDenuncia = detalhes?.categoria || 'Geral';

      const campoMonitoramento = this.mapearCampoMonitoramento(tipo);
      const tipoNotificacao = this.mapearTipoNotificacao(tipo);

      const q = query(
        collection(db, 'monitoramentos'),
        where('denunciaId', '==', denunciaId)
      );


      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (queryError: any) {
        console.error('Erro na query de monitoramentos. Índice composto faltando?', queryError?.message || queryError);
        return; // impede crash silencioso
      }
      const docsFiltrados = snapshot.docs.filter(
        (docItem) => docItem.data()[campoMonitoramento] === true
      );
      console.log('Denuncia:', denunciaId);
      console.log('Campo monitoramento:', campoMonitoramento);
      console.log('Monitoramentos encontrados:', snapshot.docs.length);
      snapshot.docs.forEach((docItem) => {
      const data = docItem.data();
      console.log('Documento monitoramento:', JSON.stringify(data));
      console.log('Campo resolvida:', data['resolvida'], typeof data['resolvida']);
      console.log('userId monitoramento:', data['userId']);
      console.log('autorAcaoId:', autorAcaoId);
      console.log('São iguais?', data['userId'] === autorAcaoId);
      });
      Alert.alert(
        'DEBUG',
        `Denúncia: ${denunciaId}\nCampo: ${campoMonitoramento}\nMonitoramentos encontrados: ${snapshot.docs.length}\nFiltrados (${campoMonitoramento}=true): ${docsFiltrados.length}`
      );
      const promessas = docsFiltrados
        .map((docItem) => {
          const monitoramento = docItem.data() as { userId?: string };

          if (!monitoramento.userId) return null;
          if (autorAcaoId && monitoramento.userId === autorAcaoId) return null;

          const mensagem =
            tipo === 'apoio'
              ? `A denúncia "${tituloDenuncia}" recebeu um novo apoio.`
              : tipo === 'interacao'
              ? `A denúncia "${tituloDenuncia}" recebeu uma nova atualização.`
              : tipo === 'avaliacao'
              ? `A denúncia "${tituloDenuncia}" recebeu uma nova avaliação.`
              : `A denúncia "${tituloDenuncia}" foi marcada como resolvida.`;

          return addDoc(collection(db, 'notificacoes'), {
            usuarioId: monitoramento.userId,
            denunciaId,
            tipo: tipoNotificacao,
            titulo: tituloDenuncia,
            mensagem,
            lida: false,
            dataEnvio: serverTimestamp(),
            categoriaDenuncia,
            autorAcaoId: autorAcaoId || null,
          });
        })
        .filter(Boolean) as Promise<any>[];

      await Promise.all(promessas);
      console.log('Notificações criadas com sucesso. Total:', promessas.length);
    } catch (error) {
      console.error('Erro ao criar notificações para monitorados:', error);
    }
  }

  async criarMonitoramento(
    userId: string,
    denunciaId: string,
    interacao: boolean,
    avaliacao: boolean,
    resolvida: boolean
  ) {
    try {
      const refDoc = doc(collection(db, 'monitoramentos'));
      await setDoc(refDoc, {
        userId,
        denunciaId,
        interacao: interacao === true,
        avaliacao: avaliacao === true,
        resolvida: resolvida === true,
        criadoEm: serverTimestamp(),
      });
      return refDoc.id;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async atualizarMonitoramento(
    id: string,
    interacao: boolean,
    avaliacao: boolean,
    resolvida: boolean
  ) {
    await updateDoc(doc(db, 'monitoramentos', id), {
      interacao,
      avaliacao,
      resolvida,
    });
  }

  async removerMonitoramento(id: string) {
    await deleteDoc(doc(db, 'monitoramentos', id));
  }

  async carregarMonitoramentosUsuario(userId: string) {
    const q = query(collection(db, 'monitoramentos'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}
