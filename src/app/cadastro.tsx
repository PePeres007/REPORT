import React from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Cadastro() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* --- CABEÇALHO COM BOTÃO DE VOLTAR --- */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()} // Retorna para a tela de Login
        >
          <Feather name="arrow-left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Criar Conta</Text>
        
        {/* Esta View vazia serve apenas para empurrar o título para o centro exato da tela */}
        <View style={{ width: 28 }} /> 
      </View>

      {/* --- CONTEÚDO DA TELA --- */}
      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          Área de formulário de cadastro pronta para ser desenvolvida!
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', // Linha sutil separando o cabeçalho
  },
  backButton: {
    padding: 5, // Aumenta a área de toque (hitbox) para facilitar o clique do usuário
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 16,
  }
});