import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

// Importando a classe
import { controladorIndex } from '../controllers/controlador_index';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Instanciando o objeto
    // transmitindo o router e o tempo (3 segundos) para o construtor
    const controlesIndex = new controladorIndex(router, 3000);

    // Executa o método do objeto
    const timer = controlesIndex.timerNavegacao();

    // Limpeza usando o método do objeto
    return () => {
      controlesIndex.stoptNavegacao(timer);
    };
  }, []);

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