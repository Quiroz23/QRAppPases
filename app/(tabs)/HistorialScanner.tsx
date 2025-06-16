import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Text,
  View,
  Button,
  StyleSheet,
  Platform,
  StatusBar,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

interface HistorialScannerProps {
  onBack: () => void;
}

interface Registro {
  id: number;
  run: string;
  fecha: string;
  tipo: string;
  hora: string;
  nombre: string;
  curso: string;
  esJustificado: boolean;
  comentario?: string;           // apoderado
  fechaJustificacion?: string;   // fecha de justificación
}

export default function HistorialScanner({ onBack }: HistorialScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [records, setRecords] = useState<Registro[]>([]);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  const baseURL = 'https://api.sheetbest.com/sheets/70d1a0d5-f650-4be5-ac69-f0757b8ce9ae';
  const normalize = (str: any) => (str || '').trim().toLowerCase();

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
      // Obtener historial y justificaciones en paralelo
      const [histRes, justRes] = await Promise.all([
        axios.get(`${baseURL}/tabs/Historial?run=${encodeURIComponent(scannedRun)}`),
        axios.get(`${baseURL}/tabs/Justificaciones?run=${encodeURIComponent(scannedRun)}`)
      ]);

      const historial = histRes.data.filter((item: any) => normalize(item.run) === scannedRun);
      const justificaciones = justRes.data;

      // Combinar y mapear
      const registros: Registro[] = historial.map((item: any, idx: number) => {
        const match = justificaciones.find((j: any) =>
          normalize(j.fecha) === normalize(item.fecha) &&
          normalize(j.hora)  === normalize(item.hora)  &&
          normalize(j.tipo)  === normalize(item.tipo)
        );

        return {
          id: idx,
          run: scannedRun,
          fecha: item.fecha,
          tipo: item.tipo,
          hora: item.hora,
          nombre: item.nombre,
          curso: item.curso,
          esJustificado: !!match,
          comentario: match?.comentario || '',
          fechaJustificacion: match?.fecha_justificacion || '',
        };
      });

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
            key={r.id}
            style={[
              styles.item,
              { backgroundColor: r.esJustificado ? '#e0f9e0' : '#fde0e0' }
            ]}
          >
            <View>
              <Text style={styles.nombre}>
                {r.nombre} ({r.curso})
              </Text>
              <Text>
                {r.esJustificado ? '✅ Justificado' : '❌ No justificado'} •{' '}
                {r.tipo} • {r.fecha} {r.hora}
              </Text>
              {r.esJustificado && r.comentario ? (
                <Text style={styles.detailText}>
                  Apoderado: {r.comentario}
                </Text>
              ) : null}
              {r.esJustificado && r.fechaJustificacion ? (
                <Text style={styles.detailText}>
                  Fecha de justificación: {r.fechaJustificacion}
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
  loader: { position: 'absolute', top: '40%', alignSelf: 'center' },
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
