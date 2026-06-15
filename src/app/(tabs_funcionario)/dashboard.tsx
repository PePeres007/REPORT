import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ControladorDashboard } from '../../controllers/controlador_dashboard';

export default function DashboardScreen() {
  const controlador = new ControladorDashboard();
  const [dadosEvolucao, setDadosEvolucao] = useState<any[]>([]);
  const [dadosBarras, setDadosBarras] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      const estatisticas = await controlador.buscarDadosEstatisticos();
      
      // Se não houver dados suficientes, coloca dados vazios para não quebrar a tela
      setDadosEvolucao(estatisticas.linhaDoTempo.length > 0 ? estatisticas.linhaDoTempo : [{ value: 0, label: 'Hj' }]);
      setDadosBarras(estatisticas.barrasCategoria.length > 0 ? estatisticas.barrasCategoria : [{ value: 0, label: 'Nenhum' }]);
      
      setCarregando(false);
    };
    carregar();
  }, []);

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E293B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.titulo}>Inteligência de Dados</Text>
          <Text style={styles.subtitulo}>Análise Exploratória Municipal</Text>
        </View>

        {/* GRÁFICO DE LINHAS INTERATIVO (EVOLUÇÃO TEMPORAL) */}
        <View style={styles.cardGrafico}>
          <Text style={styles.tituloGrafico}>📈 Evolução de Chamados (Linha do Tempo)</Text>
          <LineChart
            data={dadosEvolucao}
            height={200}
            spacing={50}
            initialSpacing={20}
            color="#2563EB"
            thickness={3}
            startFillColor="rgba(37, 99, 235, 0.3)"
            endFillColor="rgba(37, 99, 235, 0.01)"
            startOpacity={0.9}
            endOpacity={0.2}
            areaChart
            yAxisColor="#E2E8F0"
            xAxisColor="#E2E8F0"
            hideRules
            showVerticalLines={false}
            hideDataPoints
          />
        </View>

        {/* GRÁFICO DE BARRAS (POR TIPO/CATEGORIA) */}
        <View style={styles.cardGrafico}>
          <Text style={styles.tituloGrafico}>📊 Distribuição por Autarquia/Categoria</Text>
          <BarChart
            data={dadosBarras}
            height={200}
            barWidth={35}
            spacing={25}
            roundedTop
            roundedBottom
            xAxisThickness={1}
            yAxisThickness={0}
            noOfSections={4}
            hideRules
            showLine={false}
          />
        </View>
        
        <View style={{ height: 100 }} /> {/* Espaço para o menu flutuante */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingHorizontal: 16, paddingTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 20 },
  titulo: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitulo: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  
  cardGrafico: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5, 
    overflow: 'hidden',
  },
  tituloGrafico: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 20 },
  
  tooltip: {
    height: 50,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  tooltipValor: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  tooltipData: { color: '#94A3B8', fontSize: 11 },
});