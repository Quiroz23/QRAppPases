import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface HistorialScannerProps {
  onBack: () => void;
}

interface Registro {
  registro_id: string;
  run: string;
  fecha: string;
  tipo: string;
  hora: string;
  nombre: string;
  curso: string;
  justificado: string;
  comentario?: string;
  apoderado?: string;
  fecha_justificacion?: string;
}

export default function HistorialScanner({ onBack }: HistorialScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [records, setRecords] = useState<Registro[]>([]);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);
    setRecords([]);

    const lines = data.split('\n');
    const scannedRun = lines[0]?.replace('RUN: ', '').trim().toLowerCase();

    if (!scannedRun) {
      Alert.alert('❌ Error', 'RUN no válido');
      setLoading(false);
      setScanned(false);
      return;
    }

    try {
      const { data: historial, error } = await supabase
        .from('historial_completo')
        .select('*')
        .eq('run', scannedRun)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error al obtener historial:', error);
        Alert.alert('❌ Error', 'No se pudo obtener el historial');
        setLoading(false);
        setScanned(false);
        return;
      }

      // Mapear a nuestro formato
      const registros: Registro[] = (historial || []).map((item) => ({
        registro_id: item.registro_id,
        run: item.run,
        fecha: item.fecha,
        tipo: item.tipo,
        hora: item.hora,
        nombre: item.nombre,
        curso: item.curso,
        justificado: item.justificado,
        comentario: item.comentario || undefined,
        apoderado: item.apoderado || undefined,
        fecha_justificacion: item.fecha_justificacion || undefined,
      }));

      setRecords(registros);

      if (registros.length === 0) {
        Alert.alert('ℹ️ Sin historial', 'No se encontraron registros para este estudiante.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('❌ Error', 'No se pudo obtener el historial');
    }

    setLoading(false);
    setTimeout(() => setScanned(false), 1000);
  };

  if (!permission?.granted) {
    return <Text>📷 Solicitando permiso de cámara...</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.modeText}>Historial del Estudiante</Text>
        <Button
          title="Volver"
          onPress={() => {
            setRecords([]);
            onBack();
          }}
        />
      </View>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
          <Text>Cargando...</Text>
        </View>
      )}

      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <ScrollView style={styles.list}>
        {records.length === 0 && !loading && (
          <Text style={styles.empty}>No hay registros</Text>
        )}
        {records.map(r => (
          <View
            key={r.registro_id}
            style={[
              styles.item,
              { backgroundColor: r.justificado === 'Sí' ? '#e0f9e0' : '#fde0e0' }
            ]}
          >
            <View>
              <Text style={styles.nombre}>
                {r.nombre} ({r.curso})
              </Text>
              <Text>
                {r.justificado === 'Sí' ? '✅ Justificado' : '❌ No justificado'} •{' '}
                {r.tipo} • {r.fecha} {r.hora}
              </Text>
              {r.justificado === 'Sí' && r.apoderado ? (
                <Text style={styles.detailText}>
                  Apoderado: {r.apoderado}
                </Text>
              ) : null}
              {r.justificado === 'Sí' && r.fecha_justificacion ? (
                <Text style={styles.detailText}>
                  Fecha de justificación: {r.fecha_justificacion}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
    padding: 10,
    backgroundColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeText: { fontSize: 18, fontWeight: 'bold' },
  loader: { position: 'absolute', top: '40%', alignSelf: 'center', zIndex: 100 },
  list: { maxHeight: 300, backgroundColor: '#fff' },
  empty: { textAlign: 'center', margin: 20 },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nombre: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  detailText: {
    fontStyle: 'italic',
    fontSize: 13,
    marginTop: 2,
  },
});
