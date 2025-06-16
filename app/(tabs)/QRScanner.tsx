import React, { useEffect, useState, useRef } from 'react';
import {
  Text,
  View,
  Button,
  Alert,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import moment from 'moment';

interface QRScannerProps {
  mode: 'Inasistencias' | 'Atrasos';
  onBack: () => void;
}

const API_URL =
  'https://script.google.com/macros/s/AKfycbzvn9hOX-VNtY5BFPlTsYaesSjSliBu9BfQ7WpddVuMvjvw4xzoay_B24t7hEa-Zqg9yg/exec';

export default function QRScanner({ mode, onBack }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);
    setComentario('');

    const [runLine, nombreLine, gradoLine, cursoLine] = data.split('\n');
    const run = runLine?.replace('RUN: ', '').trim();
    const nombre = nombreLine?.replace('Nombre: ', '').trim();
    const grado = gradoLine?.replace('Grado: ', '').trim();
    const curso = cursoLine?.replace('Curso: ', '').trim();
    const fecha = moment().format('YYYY-MM-DD');
    const hora = moment().format('HH:mm');

    if (!run || !nombre) {
      Alert.alert('❌ Error', 'Formato de QR inválido');
      setLoading(false);
      setScanned(false);
      return;
    }

    try {
      await axios.post(`${API_URL}?accion=agregar&sheet=Historial`, {
        run,
        nombre,
        curso: `${grado}${curso}`,
        fecha,
        hora,
        tipo: mode,
        justificado: 'No',
        comentario,
      });

      Alert.alert('✅ Registro exitoso', `${nombre} fue registrado como ${mode.toLowerCase()}.`);
    } catch (err) {
      console.error(err);
      Alert.alert('❌ Error al registrar');
    }

    setLoading(false);
    setTimeout(() => {
      setScanned(false);
      onBack(); // 🔁 volver automáticamente al menú principal
    }, 100); // espera 1.5 segundos para mostrar alerta antes de volver
  };

  if (!permission?.granted) {
    return <Text>📷 Solicitando permiso de cámara...</Text>;
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Registrando...</Text>
        </View>
      )}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.controls}>
        <Text style={styles.modeText}>Modo: {mode}</Text>
        <TextInput
          style={styles.input}
          placeholder="Comentario adicional"
          value={comentario}
          onChangeText={setComentario}
        />
        <Button title="Volver" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  controls: { padding: 20, backgroundColor: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  modeText: { fontWeight: 'bold', marginBottom: 10 },
  loadingOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: '#ffffffcc',
    padding: 20,
    borderRadius: 8,
    zIndex: 100,
    alignItems: 'center',
  },
});
 
