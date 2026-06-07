import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

import { controladorHome } from '../../controllers/controlador_home';
import { CATEGORIAS } from '../../controllers/controlador_report';
import { obterUsuario } from '../../services/userStorage';

export default function MapaScreen() {
  const controlador = new controladorHome();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  // Lê os parâmetros passados ao voltar de detalhes_report (coordenadas da denúncia)
  const params = useLocalSearchParams<{ focoLat?: string; focoLon?: string }>();
  
  const [listaDenuncias, setListaDenuncias] = useState<any[]>([]);
  const [denunciaLocal, setDenunciaLocal] = useState<{ latitude: number, longitude: number } | null>(null);  
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  // Guarda se o foco inicial já foi aplicado para não sobrescrever
  const focoAplicado = useRef(false);

  useEffect(() => {
    // 1. Carrega os dados do utilizador
    const carregarUsuario = async () => {
      const dados = await obterUsuario();
      setUsuarioLogado(dados);
    };

    // 2. Carrega os marcadores de denúncias da cidade
    const buscarDados = async () => {
      const dados = await controlador.carregarDenuncias();
      setListaDenuncias(dados);
    };

    // 3. RECUPERA A GEOLOCALIZAÇÃO: Pede permissão e centraliza o mapa no utilizador
    const buscarLocalizacao = async () => {
      const localizacao = await controlador.obterLocalizacaoAtual();
      if (localizacao && mapRef.current) {
        mapRef.current.animateToRegion(localizacao, 1000);
      }
    };

    carregarUsuario();
    buscarDados();

    // Só centraliza no GPS do usuário se não houver coordenadas de denúncia recebidas
    if (!params.focoLat || !params.focoLon) {
      buscarLocalizacao();
    }
  }, []);

  // Efeito separado: quando params mudam (ao voltar de detalhes), centraliza na denúncia
  useEffect(() => {
    if (params.focoLat && params.focoLon && mapRef.current && !focoAplicado.current) {
      focoAplicado.current = true;
      mapRef.current.animateToRegion({
        latitude: parseFloat(params.focoLat),
        longitude: parseFloat(params.focoLon),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 800);
    }
  }, [params.focoLat, params.focoLon]);

  const segurarNoMapa = (evento: any) => {
    setDenunciaLocal(evento.nativeEvent.coordinate);
  };

  const acessarPainelPrefeitura = () => {
    const emailUsuarioLogado = usuarioLogado?.email || "";

    if (emailUsuarioLogado.endsWith("@prefeitura.gov.br")) {
      router.push('/lista_gestao' as any);
    } else {
      Alert.alert(
        "Acesso Negado 🛑",
        "Este painel é de uso exclusivo para funcionários e gestores credenciados da Prefeitura."
      );
    }
  };

  const lidarComNovaOcorrencia = async () => {
    if (denunciaLocal) {
      // Cenário A: Utilizador escolheu um local específico clicando no mapa
      router.push({
        pathname: '/report' as any,
        params: {
          lat: denunciaLocal.latitude.toString(),
          lon: denunciaLocal.longitude.toString(),
        },
      });
    } else {
      // Cenário B: Utilizador clicou direto no botão. Pegamos o GPS exato!
      setBuscandoGps(true);
      const localizacaoAtual = await controlador.obterLocalizacaoAtual();
      setBuscandoGps(false);

      if (localizacaoAtual) {
        router.push({
          pathname: '/report' as any,
          params: {
            lat: localizacaoAtual.latitude.toString(),
            lon: localizacaoAtual.longitude.toString(),
          },
        });
      } else {
        Alert.alert(
          "Permissão de GPS 📍",
          "Não conseguimos obter a sua localização. Ative o GPS ou pressione o dedo no mapa para marcar um local."
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={controlador.obterRegiaoInicial()}
        showsUserLocation={true} // Isto garante que a "bolinha azul" aparece!
        showsMyLocationButton={false} // Escondemos o botão padrão para manter o design limpo
        onLongPress={segurarNoMapa}
      >
        <UrlTile
          urlTemplate="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maximumZ={19}
        />

        {listaDenuncias.map((item) => {
          const iconeCat = CATEGORIAS.find(c => c.id === item.categoria)?.icone || '📍';

          return (
            <Marker
              key={item.id}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              onPress={() => {
                if (!item.id) return;
                router.push({
                  pathname: '/detalhes_report',
                  params: {
                    id: item.id.toString(),
                    // Passa as coordenadas para que o home possa volcar o foco ao retornar
                    origemLat: item.latitude.toString(),
                    origemLon: item.longitude.toString(),
                  },
                });
              }}
            >
              <View style={styles.marcadorCustomizado}>
                <Text style={styles.textoMarcador}>{iconeCat}</Text>
              </View>
            </Marker>
          );
        })}

        {denunciaLocal && (
          <Marker coordinate={denunciaLocal} pinColor="red" />
        )}
      </MapView>

      {/* Botão de centralizar no utilizador estilo Google Maps */}
      <TouchableOpacity 
        style={styles.botaoLocalizacaoAtual} 
        onPress={async () => {
          const loc = await controlador.obterLocalizacaoAtual();
          if (loc && mapRef.current) mapRef.current.animateToRegion(loc, 500);
        }}
      >
        <Ionicons name="locate" size={24} color="#1A3B5D" />
      </TouchableOpacity>

      <View style={styles.overlayBottom}>
        <Text style={styles.textoInstrucao}>
          {denunciaLocal 
            ? "📍 Local marcado! Clique abaixo para continuar." 
            : "Toque no mapa para escolher um local específico ou clique abaixo para reportar na sua posição atual."}
        </Text>

        <View style={styles.rowBotoes}>
          <TouchableOpacity 
            style={[styles.botaoReportar, buscandoGps && styles.botaoDesativado]}
            onPress={lidarComNovaOcorrencia}
            disabled={buscandoGps}
          >
            {buscandoGps ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="location-sharp" size={20} color="#FFF" style={styles.iconeBotao} />
                <Text style={styles.botaoTexto}>Nova Ocorrência</Text>
              </>
            )}
          </TouchableOpacity>

          
          {usuarioLogado?.email?.endsWith('@prefeitura.gov.br') && (
            <TouchableOpacity 
              style={styles.botaoConfig}
              onPress={acessarPainelPrefeitura}
            >
              <Ionicons name="briefcase" size={22} color="#1A3B5D" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  botaoLocalizacaoAtual: {
    position: 'absolute',
    right: 20,
    bottom: 200, 
    backgroundColor: '#FFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 110, 
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
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  rowBotoes: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  botaoReportar: {
    flexDirection: 'row',
    backgroundColor: '#7B1FA2', 
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
    fontSize: 16,
  },
  marcadorCustomizado: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#7B1FA2',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoMarcador: {
    fontSize: 18,
  },
});