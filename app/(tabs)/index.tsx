// app/index.tsx
import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';





export default function QRReader() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    Alert.alert('QR Escaneado', data);

    // Separar datos desde el contenido del QR
    const lines = data.split('\n');
    const run = lines[0]?.replace('RUN: ', '').trim();
    const nombre = lines[1]?.replace('Nombre: ', '').trim();
    const grado = lines[2]?.replace('Grado: ', '').trim();
    const curso = lines[3]?.replace('Curso: ', '').trim();
    const fecha = moment().format('YYYY-MM-DD');
    const hora = moment().format('HH:mm');

    try {
      await axios.post('https://api.sheetbest.com/sheets/70d1a0d5-f650-4be5-ac69-f0757b8ce9ae', {
        run,
        nombre,
        curso: `${grado}${curso}`,
        fecha,
        hora,
      });
      Alert.alert('✅ Registrado correctamente en Google Sheets');
    } catch (error) {
      Alert.alert('❌ Error al registrar en la hoja');
      console.error(error);
    }

    setTimeout(() => setScanned(false), 3000);
  };

  if (!permission?.granted) {
    return <Text>Solicitando permiso de cámara...</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
    </View>
  );
}
