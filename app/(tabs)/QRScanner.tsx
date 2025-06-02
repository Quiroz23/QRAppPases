import React, { useEffect, useState, useRef } from 'react';
import { Text, View, Button, Alert, StyleSheet, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import moment from 'moment';

interface QRScannerProps {
  mode: 'Inasistencias' | 'Atrasos';
  onBack: () => void;
}

export default function QRScanner({ mode, onBack }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [comentario, setComentario] = useState('');
  const cameraRef = useRef(null);

  const sheetBestBaseUrl = 'https://api.sheetbest.com/sheets/70d1a0d5-f650-4be5-ac69-f0757b8ce9ae';

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    const lines = data.split("\n");
    const run = lines[0]?.replace("RUN: ", "").trim();
    const nombre = lines[1]?.replace("Nombre: ", "").trim();
    const grado = lines[2]?.replace("Grado: ", "").trim();
    const curso = lines[3]?.replace("Curso: ", "").trim();
    const fecha = moment().format("YYYY-MM-DD");
    const hora = moment().format("HH:mm");

    if (!run) {
      Alert.alert("❌ Error", "RUN no válido");
      return;
    }

    try {
      // Obtener registros existentes
      const res = await axios.get(`${sheetBestBaseUrl}/tabs/${mode}?run=${run}`);
      const existing = res.data;
      let cantidad = 1;

      if (existing.length > 0) {
        const prev = existing[0];
        cantidad = parseInt(prev.cantidad || '0') + 1;
        await axios.delete(`${sheetBestBaseUrl}/tabs/${mode}/run/${run}`);
      }

      // Registrar en hoja de Inasistencias o Atrasos
      await axios.post(`${sheetBestBaseUrl}/tabs/${mode}`, {
        run,
        nombre,
        curso: `${grado}${curso}`,
        fecha,
        hora,
        cantidad,
        comentario,
      });

      // Registrar en Historial
      await axios.post(`${sheetBestBaseUrl}/tabs/Historial`, {
        run,
        nombre,
        curso: `${grado}${curso}`,
        fecha,
        hora,
        tipo: mode,
        comentario,
      });

      Alert.alert("✅ Registro exitoso", `${nombre} (${run}) ahora tiene ${cantidad} ${mode.toLowerCase()}`);
      setComentario('');
    } catch (error) {
      Alert.alert("❌ Error al registrar");
      console.error(error);
    }

    setTimeout(() => setScanned(false), 3000);
  };

  if (!permission?.granted) {
    return <Text>Solicitando permiso de cámara...</Text>;
  }

  return (
    <View style={styles.container}>
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
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controls: {
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  modeText: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
