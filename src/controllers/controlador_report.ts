import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
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
}

// Categorias disponíveis para o report
export const CATEGORIAS = [
  { id: 'buraco',    label: 'Buraco na Via',       icone: '🕳️' },
  { id: 'iluminacao', label: 'Iluminação Pública', icone: '💡' },
  { id: 'lixo',      label: 'Lixo Irregular',      icone: '🗑️' },
  { id: 'alagamento', label: 'Alagamento',          icone: '🌊' },
  { id: 'obra',       label: 'Obra Irregular',      icone: '🚧' },
  { id: 'abandono',   label: 'Imóvel Abandonado',  icone: '🏚️' },
  { id: 'deslizamento', label: 'Deslizamento',      icone: '⛰️' },
  { id: 'fiacao',     label: 'Fiação Exposta',      icone: '⚡' },
  { id: 'animal',     label: 'Animal Silvestre',    icone: '🐾' },
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
      // Se houver foto, faz upload e obtém a URL pública antes de salvar
      let fotoUrl: string | null = null;
      if (dados.fotoUri) {
        fotoUrl = await this.fazUploadFoto(dados.fotoUri, userId ?? 'anonimo');
      }

      await addDoc(collection(db, 'denuncias'), {
        categoria: dados.categoria,
        fotoUrl: fotoUrl,           // URL pública do Storage (funciona em qualquer dispositivo)
        endereco: dados.endereco,
        descricao: dados.descricao,
        latitude: dados.latitude,
        longitude: dados.longitude,
        userId: userId ?? 'anonimo',
        status: 'pendente',
        criadoEm: Timestamp.now(),
      });
      console.log('✅ Report salvo com sucesso!');
      return true;
    } catch (error) {
      console.log('❌ Erro ao salvar report:', error);
      return false;
    }
  }
}
