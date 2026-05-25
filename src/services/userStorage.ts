import AsyncStorage from '@react-native-async-storage/async-storage';

class UserStorageService {
  private readonly STORAGE_KEY = '@user_session';

  async salvarUsuario(usuario: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(usuario);
      await AsyncStorage.setItem(this.STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error("Erro ao salvar usuário no storage:", error);
    }
  }

  async obterUsuario(): Promise<any | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error("Erro ao obter usuário do storage:", error);
      return null;
    }
  }

  async limparSessao(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Erro ao limpar sessão do storage:", error);
    }
  }
}

// Instancia o serviço e exporta suas funções separadas para manter a compatibilidade
const userStorageService = new UserStorageService();
export const salvarUsuario = (usuario: any) => userStorageService.salvarUsuario(usuario);
export const obterUsuario = () => userStorageService.obterUsuario();
export const limparSessao = () => userStorageService.limparSessao();