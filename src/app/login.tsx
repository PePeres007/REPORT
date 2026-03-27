import { View, Text,  StyleSheet } from 'react-native';

/**
 * Tela Login
 * Tela em branco provisória.
 */
export default function Login() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login Screen - Em construção</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'lightgray',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 80,
  },
  text: {
    fontSize: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});