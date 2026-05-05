import AsyncStorage from '@react-native-async-storage/async-storage';

export const salvarUsuario = async (usuario: any) => {
  await AsyncStorage.setItem('usuario', JSON.stringify(usuario));
};

export const obterUsuario = async () => {
  const dados = await AsyncStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
};
