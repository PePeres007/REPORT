import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

/**
 * Componente Index (Tela de Carregamento / Splash Screen)
 * * Esta é a primeira tela renderizada pelo aplicativo após a compilação nativa.
 * Seu objetivo é manter a identidade visual do app na tela e exibir um 
 * indicador de atividade enquanto validações de sessão, carregamento de fontes 
 * ou rotas iniciais são processadas em segundo plano.
 * * @returns {JSX.Element} A interface da tela de carregamento.
 */
export default function Index() {
  /**
   * Instância do roteador do Expo Router utilizada para navegação programática.
   */
  const router = useRouter(); 

  /**
   * Efeito colateral de montagem do componente (Lifecycle Mount).
   * * Inicia um temporizador assim que a tela de carregamento é renderizada.
   * Após o período estipulado, redireciona o usuário para a tela de autenticação.
   * - Utiliza `router.replace` ao invés de `router.push` para substituir a rota atual 
   * na pilha de navegação. Isso impede que o usuário retorne para a tela de Splash 
   * ao pressionar o botão físico de "Voltar" do dispositivo.
   * - Inclui uma função de limpeza (cleanup function) para abortar o `setTimeout` 
   * caso o componente seja desmontado antes do tempo previsto, evitando vazamentos 
   * de memória e tentativas de atualização de estado em componentes desmontados.
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('../login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []); // A matriz vazia [] garante que isso rode apenas uma vez quando a tela abre

  return (
    <View style={styles.container}>
      
      {/* Seção Superior: Ícone de Perfil
        Reservado para o cabeçalho inicial, alinhado de forma responsiva ao topo.
      */}
      <View style={styles.topContainer}>
        <Feather name="user" size={40}  color="#7B1FA2" /> 
      </View>

      {/* Seção Central: Logotipo da Aplicação
        Carrega a marca logo centralizada. O resizeMode 'contain' é 
        utilizado para evitar distorções de proporção da imagem.
      */}
      <View style={styles.centerContainer}>
        <Image
          source={require('../../assets/images/splash.png')} 
          style={styles.logo}
          resizeMode="contain" 
        />
      </View>

      {/* Seção Inferior: Indicador de Progresso
        Fornece feedback visual de que o aplicativo está ativo e carregando.
      */}
      <View style={styles.bottomContainer}>
        <ActivityIndicator size="large" color="#7B1FA2" />
      </View>

    </View>
  );
}

/**
 * Objeto de estilização do componente.
 * Utiliza o modelo Flexbox para distribuir as três seções verticais 
 * (top, center, bottom) de maneira uniforme pela tela.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    // Distribui os elementos extremidades para as bordas e centraliza o restante
    justifyContent: 'space-between',
    // Garante que os elementos não fiquem ocultos por barras de status/navegação
    paddingVertical: 80, 
  },
  topContainer: {
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    // Permite que o logo permaneça no centro exato do espaço flexível restante
    justifyContent: 'center', 
  },
  logo: {
    width: 250, 
    height: 100, 
  },
  bottomContainer: {
    paddingBottom: 20,
  },
});