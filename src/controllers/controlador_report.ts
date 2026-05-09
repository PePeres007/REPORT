import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
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

// Categorias disponíveis para o report
export const CATEGORIAS = [

  { id: 'infraestrutura',       label: 'Infraestrutura', descricao: 'Buracos, iluminação...',      icone: '🚧' },
  { id: 'meio ambiente',   label: 'Meio Ambiente', descricao: 'Poluição, queda de árvore...',  icone: '🌳' },
  { id: 'segurança', label: 'Segurança Pública', descricao: 'Riscos, vandalismo...',      icone: '🚨' },
  { id: 'transporte',     label: 'Transporte', descricao: 'Sinalizações, bloqueios...',      icone: '🚌' },
  { id: 'saneamento',     label: 'Saneamento', descricao: 'Esgoto, drenagem, inundação...',    icone: '💧' },
];

export class controladorReport extends controladorGeral {
  constructor(routerInstance: any) {
    super(routerInstance);
  }

  // Geocoding reverso: converte lat/lon em endereço textual
  async obterEnderecoPorCoordenadas(latitude: number, longitude: number): Promise<string> {
    try {
      const resultado = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (resultado && resultado.length > 0) {
        const r = resultado[0];
        const partes = [
          r.street,
          r.streetNumber,
          r.district,
          r.city,
          r.region,
        ].filter(Boolean);
        return partes.join(', ');
      }
      return '';
    } catch (error) {
      console.log('❌ Erro no geocoding reverso:', error);
      return '';
    }
  }

  // Abre a galeria de imagens
  async escolherDaGaleria(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para escolher a foto.');
      return null;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets.length > 0) {
      return resultado.assets[0].uri;
    }
    return null;
  }

  // Abre a câmera para tirar foto
  async tirarFoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar a foto.');
      return null;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets.length > 0) {
      return resultado.assets[0].uri;
    }
    return null;
  }

  // Faz upload da foto para o Firebase Storage e retorna a URL pública
  private async fazUploadFoto(fotoUri: string, userId: string): Promise<string | null> {
    try {
      // Converte o arquivo local em blob (formato que o Firebase Storage aceita)
      const resposta = await fetch(fotoUri);
      const blob = await resposta.blob();

      // Cria um nome único: pasta do usuário + timestamp
      const nomeArquivo = `reports/${userId}/${Date.now()}.jpg`;
      const referenciaStorage = ref(storage, nomeArquivo);

      // Faz o upload
      await uploadBytes(referenciaStorage, blob);

      // Retorna a URL pública permanente
      const urlPublica = await getDownloadURL(referenciaStorage);
      console.log('✅ Foto enviada para o Storage:', urlPublica);
      return urlPublica;
    } catch (error) {
      console.log('❌ Erro ao fazer upload da foto:', error);
      return null; // Falha no upload não impede o envio do report
    }
  }

  // Salva o report no Firebase Firestore
async salvarReport(dados: DadosReport, userId: string | null): Promise<boolean> {
    try {
      let fotoUrl: string | null = null;
      if (dados.fotoUri) {
        fotoUrl = await this.fazUploadFoto(dados.fotoUri, userId ?? 'anonimo');
      }

      await addDoc(collection(db, 'denuncias'), {
        categoria: dados.categoria,
        fotoUrl: fotoUrl,
        endereco: dados.endereco,
        descricao: dados.descricao,
        urgencia: dados.urgencia,
        latitude: dados.latitude,
        longitude: dados.longitude,
        userId: userId ?? 'anonimo',
        status: 'pendente',
        criadoEm: Timestamp.now(),
        // INICIALIZANDO OS ARRAYS PARA EVITAR ERRO DE LEITURA
        apoiadores: [],
        resolvidos: []
      });
      console.log('✅ Report salvo com sucesso!');
      return true;
    } catch (error) {
      console.log('❌ Erro ao salvar report:', error);
      return false;
    }
  }
    async apoiarDenuncia(reportId: string, userId: string) {
    try {
      const docRef = doc(db, 'denuncias', reportId);
      await updateDoc(docRef, {
        apoiadores: arrayUnion(userId)
      });
      return true;
    } catch (e) {
      console.error("Erro ao apoiar:", e);
      return false;
    }
  }

  async resolverDenuncia(reportId: string, userId: string) {
    try {
      const docRef = doc(db, 'denuncias', reportId);
      await updateDoc(docRef, {
        resolvidos: arrayUnion(userId),
        status: 'em_analise' // Opcional: muda o status global
      });
      return true;
    } catch (e) {
      console.error("Erro ao resolver:", e);
      return false;
    }
  }
}
