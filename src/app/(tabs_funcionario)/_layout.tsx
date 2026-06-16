import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

export default function TabsFuncionarioLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#1E293B', // Cor escura/séria da prefeitura
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home_funcionario"
        options={{
          title: 'Triagem',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "layers" : "layers-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard" 
        options={{
          title: 'Estatísticas', 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "analytics" : "analytics-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="faq" 
        options={{
          title: 'Ajuda', 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "help-circle" : "help-circle-outline"} size={size} color={color} />
          ),
        }}
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
  tabLabel: { fontSize: 11, fontWeight: '700' },
});