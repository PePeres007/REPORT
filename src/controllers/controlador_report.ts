import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { addDoc, arrayUnion, collection, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Alert } from 'react-native';
import { db, storage } from '../services/firebaseConfig';
import { controladorGeral } from './controlador_geral';

// Estrutura de dados de um report
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
  { 
    id: 'infraestrutura', 
    label: 'Infraestrutura', 
    descricao: 'Buracos, iluminação...', 
    icone: '🚧',
    orgaoSolucao: 'EMLURB / Sec. de Infraestrutura'
  },
  { 
    id: 'meio ambiente', 
    label: 'Meio Ambiente', 
    descricao: 'Poluição, queda de árvore...', 
    icone: '🌳',
    orgaoSolucao: 'SEMAM / Controle Ambiental'
  },
  { 
    id: 'segurança', 
    label: 'Segurança Pública', 
    descricao: 'Riscos, vandalismo...', 
    icone: '🚨',
    orgaoSolucao: 'Guarda Municipal / Defesa Civil'
  },
  { 
    id: 'transporte', 
    label: 'Transporte', 
    descricao: 'Sinalizações, bloqueios...', 
    icone: '🚌',
    orgaoSolucao: 'CTTU'
  },
  { 
    id: 'saneamento', 
    label: 'Saneamento', 
    descricao: 'Esgoto, drenagem, inundação...', 
    icone: '💧',
    orgaoSolucao: 'COMPESA / Limpeza Urbana'
  },
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

  // Geocoding reverso: converte lat/lon em endereço textual
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
      console.error("Erro ao obter endereço:", error);
      return 'Erro ao buscar endereço';
    }
  }

  // Abre a câmera
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

    if (!resultado.canceled && resultado.assets.length > 0) {
      return resultado.assets[0].uri;
    }
    return null;
  }

  // Função interna para upload da foto no Firebase Storage
  private async uploadFoto(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const nomeArquivo = `reports/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, nomeArquivo);
      
      await uploadBytes(storageRef, blob);
      const urlDownload = await getDownloadURL(storageRef);
      return urlDownload;
    } catch (error) {
      console.error("Erro no upload da foto:", error);
      throw new Error("Falha ao enviar a imagem.");
    }
  }

  // Salva os dados finais do Report no Firestore
  async salvarReport(dados: DadosReport, usuarioId: string): Promise<boolean> {
    try {
      let urlFoto = null;

      // Se houver foto, faz o upload primeiro
      if (dados.fotoUri) {
        urlFoto = await this.uploadFoto(dados.fotoUri);
      }

      // Prepara o objeto para salvar
      const reportParaSalvar = {
        userId: usuarioId, // Vincula ao usuário criador
        categoria: dados.categoria,
        endereco: dados.endereco,
        descricao: dados.descricao,
        latitude: dados.latitude,
        longitude: dados.longitude,
        urgencia: dados.urgencia,
        fotoUrl: urlFoto,
        status: 'pendente', // pendente, em_analise, resolvido
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
        apoiadores: [],
        resolvidos: [],
      };

      await addDoc(collection(db, 'denuncias'), reportParaSalvar);
      return true;
    } catch (error) {
      console.error("Erro ao salvar o report no banco:", error);
      Alert.alert('Erro', 'Não foi possível registrar a denúncia. Tente novamente mais tarde.');
      return false;
    }
  }

  async apoiarDenuncia(reportId: string, userId: string) {
    try {
      const docRef = doc(db, 'denuncias', reportId);
      await updateDoc(docRef, {
        apoiadores: arrayUnion(userId)
      });
      Alert.alert('Sucesso', 'Você apoiou esta ocorrência!');
    } catch (error) {
      console.error("Erro ao apoiar:", error);
    }
  }

  async resolverDenuncia(reportId: string, userId: string) {
    try {
      const docRef = doc(db, 'denuncias', reportId);
      await updateDoc(docRef, {
        resolvidos: arrayUnion(userId)
      });
      Alert.alert('Sucesso', 'Você marcou esta ocorrência como resolvida!');
    } catch (error) {
      console.error("Erro ao resolver:", error);
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
          dataPlanejamento: new Date().toISOString()
        }
      });
      return true;
    } catch (error) {
      console.error("Erro ao salvar planejamento:", error);
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
          dataFinalizacaoDoc: new Date().toISOString()
        }
      });
      return true;
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      return false;
    }
  }

  
  // CRUD DE AVALIAÇÃO (RATING)
  

  public async avaliarReport(idReport: string, nota: number): Promise<boolean> {
    try {
      const reportRef = doc(db, 'denuncias', idReport); 
      await updateDoc(reportRef, {
        "avaliacao.nota": nota,
        "avaliacao.data": new Date().toISOString()
      });
      return true;
    } catch (erro) {
      console.error("Erro ao enviar avaliação:", erro);
      return false;
    }
  }
}