import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface JustifyScannerProps {
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
}

export default function JustifyScanner({ onBack }: JustifyScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [records, setRecords] = useState<Registro[]>([]);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [toJustify, setToJustify] = useState<Registro | null>(null);
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
      const { data: pendientes, error } = await supabase
        .from('historial_completo')
        .select('*')
        .eq('run', scannedRun)
        .eq('justificado', 'No')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error al obtener historial:', error);
        Alert.alert('❌ Error', 'No se pudo obtener el historial');
        setLoading(false);
        setScanned(false);
        return;
      }

      // Mapear a nuestro formato
      const regs: Registro[] = (pendientes || []).map((item, idx) => ({
        registro_id: item.registro_id,
        run: item.run,
        fecha: item.fecha,
        tipo: item.tipo,
        hora: item.hora,
        nombre: item.nombre,
        curso: item.curso,
      }));

      setRecords(regs);

      if (regs.length === 0) {
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
      const { error } = await supabase
        .from('justificaciones')
        .insert({
          registro_id: toJustify.registro_id,
          apoderado: comment.trim(),
          fecha_justificacion: new Date().toISOString().split('T')[0],
        });

      if (error) {
        console.error('Error al justificar:', error);
        Alert.alert('❌ Error al justificar');
        setLoading(false);
        return;
      }

      setRecords(prev =>
        prev.filter(r => r.registro_id !== toJustify.registro_id)
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
          <View key={r.registro_id} style={styles.item}>
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
  loader: { position: 'absolute', top: '40%', alignSelf: 'center', zIndex: 100 },
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
