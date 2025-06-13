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
  TextInput,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

interface JustifyScannerProps {
  onBack: () => void;
}

interface Registro {
  id: number;
  run: string;
  fecha: string;
  tipo: string;
  hora: string;
  justificado: boolean;
  nombre: string;
  curso: string;
}

export default function JustifyScanner({ onBack }: JustifyScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [records, setRecords] = useState<Registro[]>([]);
  const [run, setRun] = useState<string>('');
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [toJustify, setToJustify] = useState<Registro | null>(null);
  const cameraRef = useRef(null);

  const sheetURL = 'https://api.sheetbest.com/sheets/70d1a0d5-f650-4be5-ac69-f0757b8ce9ae';

  const normalize = (str: any) => (str || '').trim().toLowerCase();

  useEffect(() => {
    setRecords([]);
    setRun('');
  }, []);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);
    setRecords([]);
    setRun('');

    const lines = data.split('\n');
    const scannedRun = lines[0]?.replace('RUN: ', '').trim().toLowerCase();
    if (!scannedRun) {
      Alert.alert('❌ Error', 'RUN no válido');
      setLoading(false);
      setScanned(false);
      return;
    }
    setRun(scannedRun);

    try {
      const [histRes, justRes] = await Promise.all([
        axios.get(`${sheetURL}/tabs/Historial?run=${encodeURIComponent(scannedRun)}`),
        axios.get(`${sheetURL}/tabs/Justificaciones?run=${encodeURIComponent(scannedRun)}`)
      ]);

      const justKeys = new Set(
        justRes.data
          .filter((j: any) =>
            normalize(j.run) === scannedRun &&
            j.comentario && normalize(j.comentario) !== ''
          )
          .map((j: any) => `${normalize(j.fecha)}|${normalize(j.hora)}|${normalize(j.tipo)}`)
      );

      const filteredHist = histRes.data.filter(
        (item: any) => normalize(item.run) === scannedRun
      );

      const regs: Registro[] = filteredHist
        .filter((item: any) =>
          !justKeys.has(`${normalize(item.fecha)}|${normalize(item.hora)}|${normalize(item.tipo)}`)
        )
        .map((item: any, idx: number) => ({
          id: idx,
          run: scannedRun,
          fecha: item.fecha,
          tipo: item.tipo,
          hora: item.hora,
          justificado: false,
          nombre: item.nombre,
          curso: item.curso,
        }));

      setRecords(regs);

      // ✅ MODIFICACIÓN IMPLEMENTADA
      if (filteredHist.length > 0 && regs.length === 0) {
        Alert.alert('✅ Todos los registros están justificados');
      }

    } catch (e) {
      console.error(e);
      Alert.alert('❌ No se pudo obtener historial');
    }

    setLoading(false);
    setTimeout(() => setScanned(false), 1000);
  };

  const openJustifyModal = (r: Registro) => {
    setToJustify(r);
    setComment('');
    setModalVisible(true);
  };

  const confirmJustify = async () => {
    if (!toJustify || !comment.trim()) {
      Alert.alert('❌ Escribe el nombre del apoderado');
      return;
    }
    setModalVisible(false);
    setLoading(true);
    try {
      await axios.post(`${sheetURL}/tabs/Justificaciones`, {
        run: toJustify.run,
        nombre: toJustify.nombre,
        curso: toJustify.curso,
        fecha: toJustify.fecha,
        hora: toJustify.hora,
        tipo: toJustify.tipo,
        justificado: 'Sí',
        comentario: comment.trim(),
      });
      setRecords(prev =>
        prev.filter(r =>
          !(r.fecha === toJustify.fecha && r.hora === toJustify.hora && r.tipo === toJustify.tipo)
        )
      );
      Alert.alert('✅ Justificado', `${toJustify.tipo} del ${toJustify.fecha}`);
    } catch (e) {
      console.error(e);
      Alert.alert('❌ Error al justificar');
    }
    setLoading(false);
  };

  if (!permission?.granted) return <Text>📷 Solicitando permiso...</Text>;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.modeText}>Justificar Registros</Text>
        <Button title="Volver" onPress={() => { setRecords([]); onBack(); }} />
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
        {records.length === 0 && !loading && <Text style={styles.empty}>No hay registros pendientes</Text>}
        {records.map(r => (
          <View key={r.id} style={styles.item}>
            <View>
              <Text>{r.nombre} ({r.curso})</Text>
              <Text>{r.tipo} • {r.fecha} {r.hora}</Text>
              <Text>❌ Pendiente</Text>
            </View>
            <Button title="Justificar" onPress={() => openJustifyModal(r)} />
          </View>
        ))}
      </ScrollView>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nombre del apoderado</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Escribe el nombre del apoderado"
              value={comment}
              onChangeText={setComment}
            />
            <View style={styles.modalBtns}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} />
              <Button title="OK" onPress={confirmJustify} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
    padding: 10,
    backgroundColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between'
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
    justifyContent: 'space-between'
  },
  modalBg: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 8 },
  modalTitle: { fontWeight: 'bold', marginBottom: 10 },
  modalInput: { borderWidth: 1, borderColor: '#aaa', borderRadius: 5, padding: 8, marginBottom: 15 },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between' },
});
