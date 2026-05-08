import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../services/firebaseConfig';
import { salvarUsuario } from '../services/userStorage';
import { controladorGeral } from './controlador_geral';

export class controladorPerfil extends controladorGeral {
  constructor(routerInstance: any) {
    super(routerInstance);
  }

  // Busca dados atualizados do Firestore para garantir que temos o nome e foto corretos
  async carregarDadosCompletos() {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      return null;
    }
  }

  async alterarFoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      this.exibirMensagem('Permissão', 'Precisamos de acesso às fotos.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  }

  async salvarAlteracoes(nome: string, fotoUri: string | null) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      let fotoUrl = fotoUri;

      // Se a foto for um caminho local (começa com file://), fazemos upload
      if (fotoUri && fotoUri.startsWith('file://')) {
        const response = await fetch(fotoUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, blob);
        fotoUrl = await getDownloadURL(storageRef);
      }

      // Atualiza Firestore
      const userRef = doc(db, "usuarios", user.uid);
      await updateDoc(userRef, {
        nome: nome,
        fotoUrl: fotoUrl
      });

      // Atualiza Storage Local (AsyncStorage) para refletir na Home/Config
      await salvarUsuario({ nome, email: user.email, fotoUrl });

      this.exibirMensagem('Sucesso', 'Perfil atualizado com sucesso!');
      this.voltar();
    } catch (error) {
      this.exibirMensagem('Erro', 'Não foi possível salvar as alterações.');
    }
  }
}