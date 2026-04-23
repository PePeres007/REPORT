import { addDoc, collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { db } from "../services/firebaseConfig";

async function testeFirebase() {
  try {
    await addDoc(collection(db, "teste"), {
      nome: "Gabriel",
      status: "funcionando"
    });

    console.log("🔥 Firebase funcionando!");
  } catch (error) {
    console.log("❌ Erro:", error);
  }
}

export default function MapaScreen() {

  // 1. Estado para guardar as denúncias que vêm do banco
  const [listaDenuncias, setListaDenuncias] = useState<any[]>([]);

  // 2. Função que busca os dados no Firebase
  const carregarDenuncias = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "denuncias"));
      const dados: any[] = [];
      querySnapshot.forEach((doc) => {
        dados.push({ id: doc.id, ...doc.data() });
      });
      setListaDenuncias(dados);
      console.log("✅ Denúncias carregadas!");
    } catch (error) {
      console.log("❌ Erro ao buscar:", error);
    }
  };

  // Coordenadas iniciais do Recife (Marco Zero / Centro)
  const initialRegion = {
    latitude: -8.068733,
    longitude: -34.878515,
    latitudeDelta: 0.015, // Controla o zoom
    longitudeDelta: 0.015,
  };

useEffect(() => {
    carregarDenuncias();
  }, []);

  // Estado para guardar onde o usuário quer registrar a denúncia
  const [denunciaLocal, setDenunciaLocal] = useState<{latitude: number, longitude: number} | null>(null);

  // Função disparada ao clicar segurando no mapa
  const segurarNoMapa = (evento: any) => {
    setDenunciaLocal(evento.nativeEvent.coordinate);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onLongPress={segurarNoMapa} // Ao segurar, marca o local
      >
        {/* Renderiza as imagens do OpenStreetMap */}
        <UrlTile
          urlTemplate="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {/* Passo 4: Renderiza os pinos que já estão no banco */}
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
        {/* Mostra um pino vermelho onde o usuário clicou para denunciar */}
        {denunciaLocal && (
          <Marker 
            coordinate={denunciaLocal} 
            title="Local da Denúncia"
            description="Você registrará o problema aqui."
          />
        )}
      </MapView>

      {/* Interface flutuante por cima do mapa */}
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
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instrucao: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    fontWeight: 'bold',
    color: '#1e4e79',
    marginBottom: 10,
    textAlign: 'center',
  },
  botaoReportar: {
    backgroundColor: '#ff4c4c', // Cor de alerta
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5, // Sombra no Android
  },
  botaoTexto: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});