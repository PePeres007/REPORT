import { useEffect } from 'react'; 
import { StyleSheet, View, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router'; 

/**
 * Componente Index (Tela de Carregamento / Splash Screen)
 * * Esta é a primeira tela renderizada pelo aplicativo após a compilação nativa.
 * Seu objetivo é manter a identidade visual do app na tela e exibir um 
 * indicador de atividade enquanto validações de sessão, carregamento de fontes 
 * ou rotas iniciais são processadas em segundo plano.
 * * @returns {JSX.Element} A interface da tela de carregamento.
 */
export default function Index() {
  const router = useRouter(); // Inicializa o roteador

  useEffect(() => {
    // Cria um temporizador de 3 segundos (3000 milissegundos)
    const timer = setTimeout(() => {
      // Usamos 'replace' em vez de 'push'. 
      // Isso impede que o usuário aperte o botão "Voltar" do celular e caia na tela de carregamento de novo.
      router.replace('../login');
    }, 3000);

    // Limpeza de segurança: cancela o timer se o componente for fechado antes da hora
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
        Carrega a marca d'água/logo centralizada. O resizeMode 'contain' é 
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