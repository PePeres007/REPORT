// src/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Escondemos o header padrão
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#7B1FA2', // Sua cor primária
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* TELA 1: MAPA (A sua home atual) */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "map" : "map-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* TELA 2: MINHAS DENÚNCIAS */}
      <Tabs.Screen
        name="minhas_denuncias"
        options={{
          title: 'As Minhas Denúncias',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "list" : "list-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* TELA 3: CONFIGURAÇÕES (Ocultamos do layout principal para não poluir, 
          ou podemos redirecionar para a tela existente de configurações) */}
      <Tabs.Screen
        name="configuracoes_tab"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Em vez de abrir uma tab vazia, força a ir para a sua tela de configurações atual
            e.preventDefault();
            navigation.navigate('configuracoes');
          },
        })}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 15,
    left: 20,
    right: 20,
    elevation: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    borderTopWidth: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});