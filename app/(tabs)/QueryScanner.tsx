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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

interface QueryScannerProps {
  onBack: () => void;
}

export default function QueryScanner({ onBack }: QueryScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setResult(null);

    const lines = data.split('\n');
    const run = lines[0]?.replace('RUN: ', '').trim();

    if (!run) {
      Alert.alert('❌ Error', 'No se pudo leer el RUN');
      return;
    }

    const sheetBestBaseUrl = 'https://api.sheetbest.com/sheets/70d1a0d5-f650-4be5-ac69-f0757b8ce9ae';

    try {
      const [atrasosRes, inasistenciasRes] = await Promise.all([
        axios.get(`${sheetBestBaseUrl}/tabs/Atrasos?run=${run}`),
        axios.get(`${sheetBestBaseUrl}/tabs/Inasistencias?run=${run}`),
      ]);

      const atrasos = atrasosRes.data[0];
      const inasistencias = inasistenciasRes.data[0];

      const historial: string[] = [];
      if (atrasos) {
        historial.push(
          `✅ Atrasos: ${atrasos.total_registros || '1'}
Fecha última: ${atrasos.fecha} a las ${atrasos.hora}`
        );
      }
      if (inasistencias) {
        historial.push(
          `❌ Inasistencias: ${inasistencias.total_registros || '1'}
Fecha última: ${inasistencias.fecha} a las ${inasistencias.hora}`
        );
      }

      if (historial.length === 0) {
        setResult('Este alumno no tiene registros.');
      } else {
        setResult(historial.join('\n\n'));
      }
    } catch (error) {
      console.error('Error consultando historial', error);
      Alert.alert('❌ Error al consultar historial');
    }

    setTimeout(() => setScanned(false), 3000);
  };

  if (!permission?.granted) {
    return <Text>Solicitando permiso de cámara...</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.modeText}>Consulta de Historial</Text>
        <Button title="Volver" onPress={onBack} />
      </View>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      {result && (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 30 : 20,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  modeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 20,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },
});
