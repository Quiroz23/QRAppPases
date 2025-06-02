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

interface JustifyScannerProps {
  onBack: () => void;
}

interface Registro {
  fecha: string;
  tipo: string;
  hora: string;
  justificado: boolean;
}

export default function JustifyScanner({ onBack }: JustifyScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [records, setRecords] = useState<Registro[]>([]);
  const [run, setRun] = useState<string>('');

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
    const scannedRun = lines[0]?.replace('RUN: ', '').trim();

    if (!scannedRun) {
      Alert.alert('❌ Error', 'RUN no válido');
      return;
    }

    setRun(scannedRun);

    try {
      const historialRes = await axios.get(`${baseURL}/tabs/Historial?run=${scannedRun}`);
      const justRes = await axios.get(`${baseURL}/tabs/Justificaciones?run=${scannedRun}`);

      const clavesJustificadas = new Set(
        justRes.data
          .filter((j: any) => j.firmado === 'Sí')
          .map((j: any) => `${j.fecha}-${j.hora}-${j.tipo}`)
      );

      const registrosFiltrados: Registro[] = historialRes.data.map((item: any) => ({
        fecha: item.fecha,
        tipo: item.tipo,
        hora: item.hora,
        justificado: clavesJustificadas.has(`${item.fecha}-${item.hora}-${item.tipo}`),
      }));

      setRecords(registrosFiltrados);
    } catch (err) {
      console.error('❌ Error al obtener datos:', err);
      Alert.alert('❌ Error al obtener datos del historial');
    }

    setTimeout(() => setScanned(false), 3000);
  };

  const justifyRecord = async (fecha: string, hora: string, tipo: string) => {
    try {
      // ✅ Eliminar desde hoja Atrasos/Inasistencias
      await axios.delete(`${baseURL}/tabs/${tipo}?run=${run}&fecha=${fecha}&hora=${hora}`);

      // ✅ Buscar en historial
      const historialRes = await axios.get(`${baseURL}/tabs/Historial?run=${run}&fecha=${fecha}&hora=${hora}&tipo=${tipo}`);
      const registro = historialRes.data[0];

      if (!registro) {
        Alert.alert("⚠️ Registro no encontrado en Historial");
        return;
      }

      const dataToSend = {
        run: run || "NO RUN", // ⚠️ Simulación de error si run está vacío
        nombre: registro.nombre || "Desconocido",
        curso: registro.curso || "Sin Curso",
        tipo,
        fecha,
        hora,
        justificado: "Sí",
        tutor: "Apoderado directo",
        comentario: "Justificación entregada en oficina"
      };

      console.log("📝 Enviando justificación a SheetBest:", dataToSend);

      // 🔥 SIMULACIÓN de error opcional
      // dataToSend.tipo = undefined; // <- Descomenta para probar un error 400 real

      await axios.post(`${baseURL}/tabs/Justificaciones`, dataToSend);

      Alert.alert("✅ Registro Justificado", `${tipo} del ${fecha} a las ${hora} fue justificado.`);

      setRecords(prev =>
        prev.map(r =>
          r.fecha === fecha && r.tipo === tipo && r.hora === hora
            ? { ...r, justificado: true }
            : r
        )
      );
    } catch (err: any) {
      console.error('❌ Error al justificar:', err.response?.data || err.message);
      Alert.alert("❌ Error al justificar", "Revisa la consola para más información.");
    }
  };

  if (!permission?.granted) {
    return <Text>Solicitando permiso de cámara...</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.modeText}>Justificar Registro</Text>
        <Button title="Volver" onPress={onBack} />
      </View>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <ScrollView style={{ maxHeight: 300, backgroundColor: '#fff' }}>
        {records.map((r, i) => (
          <View key={i} style={styles.recordRow}>
            <View style={{ flex: 1 }}>
              <Text>{`${r.tipo} - ${r.fecha} - ${r.hora}`}</Text>
              <Text>{r.justificado ? '✅ Justificado' : '❌ No justificado'}</Text>
            </View>
            {!r.justificado && (
              <Button title="Justificar" onPress={() => justifyRecord(r.fecha, r.hora, r.tipo)} />
            )}
          </View>
        ))}
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
  modeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordRow: {
    padding: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
