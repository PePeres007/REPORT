import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

// Importando a classe controladora
import { controladorHome } from '../controllers/controlador_home';

export default function MapaScreen() {
  // Instanciando o objeto controlador
  const controlador = new controladorHome();
  const [listaDenuncias, setListaDenuncias] = useState<any[]>([]);
  const [denunciaLocal, setDenunciaLocal] = useState<{latitude: number, longitude: number} | null>(null);

  // Usa o método do controlador para carregar os dados
  useEffect(() => {
    const buscarDados = async () => {
      const dados = await controlador.carregarDenuncias();
      setListaDenuncias(dados);
    };
    buscarDados();
  }, []);

  const segurarNoMapa = (evento: any) => {
    setDenunciaLocal(evento.nativeEvent.coordinate);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={controlador.obterRegiaoInicial()} // Obtém a região da classe
        onLongPress={segurarNoMapa} 
      >
        <UrlTile
          urlTemplate="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        
        {listaDenuncias.map((item) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: item.latitude,
              longitude: item.longitude,
            }}
            title={item.titulo || "Denúncia"}
            description={item.descricao || "Relato de problema"}
            pinColor="purple" 
          />
        ))}
        
        {denunciaLocal && (
          <Marker 
            coordinate={denunciaLocal} 
            title="Local da Denúncia"
            description="Você registrará o problema aqui."
          />
        )}
      </MapView>

      <View style={styles.overlay}>
        <Text style={styles.instrucao}>
          Segure no mapa para marcar o local do problema.
        </Text>
        
        {denunciaLocal && (
          <TouchableOpacity style={styles.botaoReportar}>
            <Text style={styles.botaoTexto}>Reportar Aqui!</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  instrucao: { backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 10, borderRadius: 8, fontWeight: 'bold', color: '#1e4e79', marginBottom: 10, textAlign: 'center' },
  botaoReportar: { backgroundColor: '#ff4c4c', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 5 },
  botaoTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});