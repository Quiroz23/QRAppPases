import React, { useEffect, useState, useRef } from 'react';
import {
  Text,
  View,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

interface QueryScannerProps {
  onBack: () => void;
}

interface Registro {
  fecha: string;
  tipo: string;
  hora: string;
  comentario?: string;
}

export default function QueryScanner({ onBack }: QueryScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [nombreAlumno, setNombreAlumno] = useState<string>('');
  const cameraRef = useRef(null);

  const baseURL = 'https://api.sheetbest.com/sheets/70d1a0d5-f650-4be5-ac69-f0757b8ce9ae';

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    const lines = data.split('\n');
    const run = lines[0]?.replace('RUN: ', '').trim();
    const nombre = lines[1]?.replace('Nombre: ', '').trim();

    if (!run) {
      Alert.alert('❌ Error', 'RUN no válido');
      return;
    }

    setNombreAlumno(nombre);

    try {
      const res = await axios.get(`${baseURL}/tabs/Historial?run=${run}`);

      const historial: Registro[] = res.data.map((item: any) => ({
        fecha: item.fecha,
        tipo: item.tipo,
        hora: item.hora,
        comentario: item.comentario || '', // <- aquí se toma el comentario
      }));

      setRegistros(historial);
    } catch (error) {
      Alert.alert('❌ Error al obtener historial');
      console.error(error);
    }

    setTimeout(() => setScanned(false), 3000);
  };

  if (!permission?.granted) {
    return <Text>Solicitando permiso de cámara...</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Consulta de Historial</Text>
        <Button title="Volver" onPress={onBack} />
      </View>

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <ScrollView style={styles.scroll}>
        <Text style={styles.subtitle}>Historial de: {nombreAlumno || 'Alumno no identificado'}</Text>
        {registros.map((r, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.mainText}>{r.tipo} - {r.fecha} - {r.hora}</Text>
            {r.comentario && (
              <Text style={styles.commentText}>🗨️ {r.comentario}</Text>
            )}
          </View>
        ))}
        {registros.length === 0 && nombreAlumno && (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No hay registros.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 30 : 20,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  camera: {
    height: 300,
  },
  scroll: {
    padding: 10,
    backgroundColor: '#fff',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
    textAlign: 'center',
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mainText: {
    fontSize: 14,
  },
  commentText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#555',
    marginTop: 4,
  },
});
