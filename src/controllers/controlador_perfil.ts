import * as ImagePicker from 'expo-image-picker';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Alert } from 'react-native';
import { auth, db, storage } from '../services/firebaseConfig';
import { limparSessao, salvarUsuario } from '../services/userStorage';
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

  // --- NOVA ROTINA DE EXCLUSÃO DE CONTA ---
  async handleExcluirContaFinal() {
    const usuarioAuth = auth.currentUser;
    
    if (!usuarioAuth) {
        this.exibirMensagem("Erro", "Usuário não autenticado.");
        return;
    }

    const uid = usuarioAuth.uid;

    try {
        // ETAPA 1: Apagar os dados cadastrais no Firestore (usando a sua coleção 'usuarios')
        await deleteDoc(doc(db, 'usuarios', uid));
        
        // ETAPA 2: Apagar a autenticação no Firebase Auth
        await usuarioAuth.delete();

        // ETAPA 3: Limpar armazenamento local e mandar para o login
        await limparSessao();
        
        // Assumindo que a propriedade herdada do controladorGeral que guarda as rotas se chama "router"
        if (this.router) {
            this.router.replace('/login');
        }

        this.exibirMensagem("Sucesso", "Sua conta foi excluída permanentemente.");
        
    } catch (error: any) {
        console.error("Erro completo na exclusão:", error);
        
        // Trata erro comum do Firebase que exige login recente para deletar
        if (error.code === 'auth/requires-recent-login') {
            Alert.alert(
                "Ação Necessária ⚠️",
                "Para sua segurança, refaça o login antes de apagar a conta permanentemente."
            );
            await limparSessao();
            if (this.router) this.router.replace('/login');
        } else {
            this.exibirMensagem("Erro", "Não foi possível apagar sua conta agora. Tente novamente mais tarde.");
        }
    }
  }
}