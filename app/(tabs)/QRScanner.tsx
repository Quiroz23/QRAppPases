import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, View, Button, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';
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
  const cameraRef = useRef(null);

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
    const grado = lines[2]?.replace('Grado: ', '').trim();
    const curso = lines[3]?.replace('Curso: ', '').trim();
    const fecha = moment().format('YYYY-MM-DD');
    const hora = moment().format('HH:mm');

    const sheetBestBaseUrl = 'https://api.sheetbest.com/sheets/70d1a0d5-f650-4be5-ac69-f0757b8ce9ae';

    try {
      const getResponse = await axios.get(`${sheetBestBaseUrl}/tabs/${mode}?run=${run}`);
      const existingRecords = getResponse.data;

      if (existingRecords.length > 0) {
        const record = existingRecords[0];
        const updatedRecord = {
          ...record,
          fecha,
          hora,
          total_registros: parseInt(record.total_registros || '1') + 1,
        };

        await axios.put(`${sheetBestBaseUrl}/tabs/${mode}/run/${run}`, updatedRecord);
        Alert.alert('✅ Registro actualizado', `Total de registros: ${updatedRecord.total_registros}`);
      } else {
        const newRecord = {
          run,
          nombre,
          curso: `${grado}${curso}`,
          fecha,
          hora,
          total_registros: 1,
          adicional: '',
        };

        await axios.post(`${sheetBestBaseUrl}/tabs/${mode}`, newRecord);
        Alert.alert('✅ Alumno registrado con éxito', 'Total de registros: 1');
      }
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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.modeText}>Modo actual: {mode}</Text>
        <Button title="Volver" onPress={onBack} />
      </View>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 30 : 20,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  modeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
