import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

import { controladorHome } from '../controllers/controlador_home';

export default function MapaScreen() {
  const controlador = new controladorHome();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [listaDenuncias, setListaDenuncias] = useState<any[]>([]);
  const [denunciaLocal, setDenunciaLocal] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    const buscarDados = async () => {
      const dados = await controlador.carregarDenuncias();
      setListaDenuncias(dados);
    };

    const buscarLocalizacao = async () => {
      const localizacao = await controlador.obterLocalizacaoAtual();
      if (localizacao) {
        mapRef.current?.animateToRegion(localizacao, 1000);
      }
    };

    buscarDados();
    buscarLocalizacao();
  }, []);

  const segurarNoMapa = (evento: any) => {
    setDenunciaLocal(evento.nativeEvent.coordinate);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={controlador.obterRegiaoInicial()}
        showsUserLocation={true}
        onLongPress={segurarNoMapa}
      >
        <UrlTile
          urlTemplate="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maximumZ={19}
        />

        {listaDenuncias.map((item) => (
          <Marker
            key={item.id}
            coordinate={{ latitude: item.latitude, longitude: item.longitude }}
            title={item.titulo}
            pinColor="purple"
          />
        ))}

        {denunciaLocal && (
          <Marker coordinate={denunciaLocal} pinColor="red" />
        )}
      </MapView>

      <View style={styles.overlayBottom}>
        <Text style={styles.textoInstrucao}>
          {denunciaLocal 
            ? "Local selecionado! Clique abaixo para reportar." 
            : "Toque em qualquer ponto do mapa para registrar uma ocorrência"}
        </Text>

        <View style={styles.rowBotoes}>
          <TouchableOpacity 
            style={[styles.botaoReportar, !denunciaLocal && styles.botaoDesativado]}
            disabled={!denunciaLocal}
            onPress={() => {
              if (denunciaLocal) {
                router.push({
                  pathname: '/report' as any,
                  params: {
                    lat: denunciaLocal.latitude.toString(),
                    lon: denunciaLocal.longitude.toString(),
                  },
                });
              }
            }}
          >
            <Ionicons name="location-sharp" size={20} color="#FFF" style={styles.iconeBotao} />
            <Text style={styles.botaoTexto}>Nova Ocorrência</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoConfig}>
            <Ionicons name="settings-sharp" size={24} color="#1A3B5D" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },

  overlayBottom: {
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
    width: '94%',
    backgroundColor: '#F7F9FC',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 15,
    alignItems: 'center',

    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  textoInstrucao: {
    color: '#6A89A7',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 25,
  },

  rowBotoes: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  botaoReportar: {
    flexDirection: 'row',
    backgroundColor: '#2F5D8C',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 12,
  },

  botaoDesativado: {
    backgroundColor: '#A0B4CB',
  },

  botaoConfig: {
    backgroundColor: '#EEF3F8',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E9F1',
  },

  iconeBotao: {
    marginRight: 10,
  },

  botaoTexto: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 17,
  },
});
