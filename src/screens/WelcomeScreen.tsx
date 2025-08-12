import React, { useEffect, useState, useContext, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Text,
  Image,
  ScrollView,
  Dimensions,
  Pressable,
  Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, MapType } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import ProfileCircle from '../presentation/components/ui/ProfileCircle';
import { MarkersContext, Marker as ReportMarker } from '../context/MarkersContext';
import ButtonSheet from '../presentation/components/ui/ButtonSheet';
import IconMI from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const UI = {
  bg: '#F4F7FC',
  card: '#FFFFFF',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#0AC5C5',
  text: '#0D1313',
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PANEL_HEIGHT = 800;

/** Estilo claro y muy legible */
const MAP_STYLE_BASE = [
  { elementType: "geometry", stylers: [{ color: "#F5F7FA" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#2D3748" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#A6CBE3" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#D6DBE0" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#E4F3E8" }] },
];

/** Habilitar/ocultar POIs vía estilo */
const withPOIs = (show: boolean) =>
  MAP_STYLE_BASE.map(s =>
    s.featureType === 'poi'
      ? { ...s, stylers: [{ visibility: show ? 'on' : 'off' }] }
      : s
  );

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReportMarker | null>(null);
  const { markers } = useContext(MarkersContext);

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Controles
  const [mapType, setMapType] = useState<MapType>('standard');
  const [traffic, setTraffic] = useState(false);
  const [pois, setPois] = useState(false);
  const [follow, setFollow] = useState(true);

  // Marker temporal por long-press
  const [tempPin, setTempPin] = useState<{ latitude: number; longitude: number } | null>(null);

  // FAB
  const [fabOpen, setFabOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          ]);
          const fine = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
          const coarse = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
          if (!fine && !coarse) {
            console.warn('Permisos de ubicación no concedidos');
            setLoading(false);
            return;
          }
        }

        Geolocation.getCurrentPosition(
          ({ coords }) => {
            const next = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setRegion(next);
            setLoading(false);
            // centra suave
            setTimeout(() => mapRef.current?.animateToRegion(next, 600), 50);
          },
          (error) => {
            console.error('Error al obtener ubicación:', error);
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 20000 }
        );

        const watchId = Geolocation.watchPosition(
          ({ coords }) => {
            setRegion(prev =>
              prev
                ? { ...prev, latitude: coords.latitude, longitude: coords.longitude }
                : { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
            );
            if (follow) {
              mapRef.current?.animateToRegion({
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: region?.latitudeDelta ?? 0.01,
                longitudeDelta: region?.longitudeDelta ?? 0.01,
              }, 400);
            }
          },
          (error) => console.error('Error de ubicación continua:', error),
          { enableHighAccuracy: false, distanceFilter: 10, interval: 5000 }
        );

        return () => Geolocation.clearWatch(watchId);
      } catch (err) {
        console.error('Error pidiendo permisos de ubicación:', err);
        setLoading(false);
      }
    };

    requestLocationPermission();
  }, [follow]); // seguir recibiendo cuando follow cambie

  // Tamaño imagen en panel
  useEffect(() => {
    if (selected?.photoUri) {
      Image.getSize(
        selected.photoUri,
        (w, h) => {
          const screenWidth = SCREEN_W - 32;
          const scaleFactor = w / screenWidth;
          setImageSize({ width: screenWidth, height: h / scaleFactor });
        },
        () => {}
      );
    }
  }, [selected]);

  // Estilo con/si POIs
  const mapStyle = useMemo(() => withPOIs(pois), [pois]);

  const handleRecenter = () => {
    setFollow(true);
    Geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: region?.latitudeDelta ?? 0.01,
          longitudeDelta: region?.longitudeDelta ?? 0.01,
        };
        setRegion(next);
        mapRef.current?.animateToRegion(next, 500);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const onRegionWillChange = () => {
    if (follow) setFollow(false);
  };

  // FAB open/close
  const toggleFab = () => {
    setFabOpen(s => !s);
    Animated.timing(anim, {
      toValue: fabOpen ? 0 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  // Rutas rápidas desde el FAB (ajusta según tus tabs)
  const goReportar = () => navigation.navigate('Tabs', { screen: 'Report' });
  const goReportes = () => navigation.navigate('Tabs', { screen: 'Reports' });

  // Long press -> pin temporal
  const onLongPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setTempPin({ latitude, longitude });
  };

  if (!region || loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={UI.primary} />
      </View>
    );
  }

  /** Escala dinámica (m) */
  const metersPerPixel = (() => {
    // ancho en metros del viewport actual
    const metersPerDegreeLon = Math.cos((region.latitude * Math.PI) / 180) * 111320; // aprox
    const viewportMeters = metersPerDegreeLon * region.longitudeDelta;
    return viewportMeters / SCREEN_W;
  })();

  const niceScales = [10, 20, 50, 100, 200, 500, 1000, 2000];
  let scaleMeters = niceScales[0];
  for (const m of niceScales) {
    const px = m / metersPerPixel;
    if (px >= 60 && px <= 160) { scaleMeters = m; break; }
    if (px < 60) scaleMeters = m; // fallback el mayor posible
  }
  const scalePx = Math.max(40, Math.min(200, scaleMeters / metersPerPixel));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        customMapStyle={mapStyle}
        mapType={mapType}
        showsCompass
        showsBuildings
        showsIndoorLevelPicker={false}
        showsIndoors={false}
        toolbarEnabled={false}
        minZoomLevel={3}
        maxZoomLevel={20}
        onRegionChange={onRegionWillChange}
        onPanDrag={onRegionWillChange}
        onLongPress={onLongPress}
        mapPadding={{ top: 8, right: 8, bottom: 24, left: 8 }}
      >
        {/* Ubicación actual */}
        <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.meOuter}><View style={styles.meInner} /></View>
        </Marker>

        {/* Reportes del contexto */}
        {markers.map(m => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => setSelected(m)}
          >
            <View style={styles.pinWrap}>
              <View style={[styles.pinHead, { backgroundColor: m.color || UI.primary }]} />
              <View style={[styles.pinStem, { borderTopColor: m.color || UI.primary }]} />
            </View>
          </Marker>
        ))}

        {/* Pin temporal por long-press */}
        {tempPin && (
          <Marker coordinate={tempPin} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.tempPin}>
              <View style={styles.tempPinDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header: perfil */}
      <View style={styles.headerOverlay}>
        <ProfileCircle />
      </View>

      {/* Controles rápidos (chips) */}
      <View style={styles.controlsRow}>
        <Chip
          icon="map"
          label={mapType === 'standard' ? 'Mapa' : mapType === 'satellite' ? 'Satélite' : mapType === 'terrain' ? 'Terreno' : 'Híbrido'}
          onPress={() => {
            const order: MapType[] = ['standard', 'satellite', 'terrain', 'hybrid'];
            const i = order.indexOf(mapType);
            setMapType(order[(i + 1) % order.length]);
          }}
        />
        <Chip
          icon="traffic"
          label={traffic ? 'Tráfico: ON' : 'Tráfico: OFF'}
          active={traffic}
          onPress={() => setTraffic(s => !s)}
        />
        <Chip
          icon="place"
          label={pois ? 'POIs: ON' : 'POIs: OFF'}
          active={pois}
          onPress={() => setPois(s => !s)}
        />
        <Chip
          icon="my-location"
          label={follow ? 'Siguiéndote' : 'Libre'}
          active={follow}
          onPress={handleRecenter}
        />
      </View>

      {/* Escala (metros) */}
      <View style={styles.scaleWrap}>
        <View style={[styles.scaleBar, { width: scalePx }]} />
        <Text style={styles.scaleTxt}>{scaleMeters >= 1000 ? `${(scaleMeters/1000).toFixed(1)} km` : `${scaleMeters} m`}</Text>
      </View>

      {/* FAB opciones */}
      <View pointerEvents="box-none" style={styles.fabArea}>
        {fabOpen && <Pressable style={StyleSheet.absoluteFill} onPress={toggleFab} />}

        <FabItem anim={anim} index={1} label="Centrar" icon="center-focus-strong" onPress={() => { toggleFab(); handleRecenter(); }} />
        <FabItem anim={anim} index={2} label="Reportar" icon="add-location-alt" onPress={() => { toggleFab(); goReportar(); }} />
        <FabItem anim={anim} index={3} label="Reportes" icon="list-alt" onPress={() => { toggleFab(); goReportes(); }} />

        <Pressable style={styles.fabMain} onPress={toggleFab}>
          <Animated.View style={{ transform: [{ rotate: anim.interpolate({ inputRange: [0,1], outputRange: ['0deg','45deg'] }) }] }}>
            <IconMI name="add" size={28} color="#fff" />
          </Animated.View>
        </Pressable>
      </View>

      {/* Panel detalle */}
      {selected && (
        <ButtonSheet onClose={() => setSelected(null)} initialHeight={PANEL_HEIGHT}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.handleBar} />
            <Text style={styles.panelTitle}>{selected.title}</Text>
            <Text style={styles.panelDesc}>{selected.description}</Text>
            <Text style={styles.panelTime}>{new Date(selected.timestamp).toLocaleString()}</Text>

            {selected.photoUri && (
              <Image
                source={{ uri: selected.photoUri }}
                style={{ width: imageSize.width, height: imageSize.height, borderRadius: 16, marginTop: 12, alignSelf: 'center', backgroundColor: '#eaeaea' }}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </ButtonSheet>
      )}
    </View>
  );
};

export default WelcomeScreen;

/* ---------- UI Helpers ---------- */
const Chip = ({ icon, label, onPress, active }: { icon: string; label: string; onPress: () => void; active?: boolean }) => (
  <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: UI.primary }]}>
    <IconMI name={icon as any} size={16} color={active ? '#fff' : '#374151'} />
    <Text style={[styles.chipTxt, active && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);

const FabItem = ({ anim, index, label, icon, onPress }: { anim: Animated.Value; index: number; label: string; icon: string; onPress: () => void }) => (
  <Animated.View
    style={[
      styles.fabItem,
      {
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -70 * index] }) },
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
        ],
        opacity: anim,
      },
    ]}
  >
    <Pressable style={styles.smallFab} onPress={onPress}>
      <IconMI name={icon as any} size={20} color="#fff" />
    </Pressable>
    <Text style={styles.fabLabel}>{label}</Text>
  </Animated.View>
);

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: UI.bg },
  map: { flex: 1 },

  /* User dot */
  meOuter: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: UI.primary, alignItems: 'center', justifyContent: 'center' },
  meInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: UI.primary },

  /* Report pin */
  pinWrap: { alignItems: 'center' },
  pinHead: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  pinStem: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },

  /* Temp pin */
  tempPin: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#111827' },
  tempPinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', alignSelf: 'center', marginTop: 5 },

  /* Header (perfil) */
  headerOverlay: { position: 'absolute', top: 16, right: 16 },

  /* Controls chips */
  controlsRow: { position: 'absolute', top: 16, left: 16, right: 90, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: UI.card, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: UI.border },
  chipTxt: { fontSize: 12, color: '#374151', fontWeight: '700' },

  /* Scale bar */
  scaleWrap: { position: 'absolute', left: 16, bottom: 28, alignItems: 'flex-start' },
  scaleBar: { height: 6, backgroundColor: '#111827', borderRadius: 3 },
  scaleTxt: { marginTop: 4, fontSize: 12, color: UI.muted },

  /* FAB */
  fabArea: { position: 'absolute', right: 16, bottom: 24 },
  fabMain: { width: 56, height: 56, borderRadius: 28, backgroundColor: UI.primary, alignItems: 'center', justifyContent: 'center', shadowColor: UI.primary, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  smallFab: { width: 44, height: 44, borderRadius: 22, backgroundColor: UI.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  fabItem: { position: 'absolute', right: 6, bottom: 60, alignItems: 'center' },
  fabLabel: { marginTop: 4, fontSize: 12, color: UI.muted, backgroundColor: UI.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: UI.border },

  /* Panel */
  handleBar: { width: 44, height: 4, borderRadius: 2, backgroundColor: UI.border, alignSelf: 'center', marginBottom: 8 },
  panelTitle: { fontSize: 20, fontWeight: '800', color: UI.text, marginBottom: 6 },
  panelDesc: { fontSize: 16, color: '#1f2937', marginBottom: 6 },
  panelTime: { fontSize: 12, color: UI.muted },
});
