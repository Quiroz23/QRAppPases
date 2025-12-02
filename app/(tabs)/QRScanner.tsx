import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface QRScannerProps {
  mode: 'Inasistencias' | 'Atrasos';
  onBack: () => void;
}

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
      // upsert = "update or insert" (actualiza si existe, crea si no)
      const { data: estudiante, error: estudianteError } = await supabase
        .from('estudiantes')
        .upsert(
          {
            run: run.toLowerCase(),
            nombre,
            curso: `${grado}${curso}`,
          },
          {
            onConflict: 'run',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (estudianteError) {
        console.error('Error al crear/actualizar estudiante:', estudianteError);
        Alert.alert('❌ Error', 'No se pudo registrar el estudiante');
        setLoading(false);
        setScanned(false);
        return;
      }

      const { error: registroError } = await supabase
        .from('registros')
        .insert({
          estudiante_id: estudiante.id,
          fecha,
          hora,
          tipo: mode,
          comentario: comentario || null,
        });

      if (registroError) {
        console.error('Error al crear registro:', registroError);
        Alert.alert('❌ Error', 'No se pudo registrar la asistencia');
        setLoading(false);
        setScanned(false);
        return;
      }

      Alert.alert(
        '✅ Registro exitoso',
        `${nombre} fue registrado como ${mode.toLowerCase()}.`
      );
    } catch (err) {
      console.error('Error inesperado:', err);
      Alert.alert('❌ Error al registrar', 'Ocurrió un error inesperado');
    }

    setLoading(false);
    setTimeout(() => {
      setScanned(false);
      onBack();
    }, 100);
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

