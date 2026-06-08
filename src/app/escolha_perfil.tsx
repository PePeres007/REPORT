import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EscolhaPerfil() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Como você deseja acessar?</Text>
        <Text style={styles.subtitle}>Selecione o seu perfil para prosseguir com o cadastro.</Text>

        <TouchableOpacity 
          style={styles.cardPerfil} 
          onPress={() => router.push('/cadastro' as any)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E8D5F5' }]}>
            <Feather name="user" size={32} color="#7B1FA2" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Cidadão</Text>
            <Text style={styles.cardDesc}>Quero reportar e acompanhar problemas na cidade.</Text>
          </View>
          <Feather name="chevron-right" size={24} color="#CBD5E1" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cardPerfil} 
          onPress={() => router.push('/cadastro_funcionario' as any)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
            <Feather name="briefcase" size={32} color="#0284C7" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Funcionário da Prefeitura</Text>
            <Text style={styles.cardDesc}>Sou servidor público e acesso o painel de gestão.</Text>
          </View>
          <Feather name="chevron-right" size={24} color="#CBD5E1" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backButton: { padding: 5, alignSelf: 'flex-start' },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 40, lineHeight: 22 },
  cardPerfil: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },
});