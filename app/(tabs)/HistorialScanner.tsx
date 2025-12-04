import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface HistorialScannerProps {
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
  justificado: string;
  comentario?: string;
  apoderado?: string;
  fecha_justificacion?: string;
}

export default function HistorialScanner({ onBack }: HistorialScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [records, setRecords] = useState<Registro[]>([]);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{ nombre: string; curso: string } | null>(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);
    setRecords([]);
    setStudentInfo(null);

    const lines = data.split('\n');
    const scannedRun = lines[0]?.replace('RUN: ', '').trim().toLowerCase();
    const nombreCompleto = lines[1]?.replace('Nombre: ', '').trim();
    const curso = lines[3]?.replace('Curso: ', '').trim() + '° ' + lines[2]?.replace('Grado: ', '').trim();

    if (!scannedRun) {
      Alert.alert('❌ Error', 'RUN no válido');
      setLoading(false);
      setScanned(false);
      return;
    }

    setStudentInfo({ nombre: nombreCompleto, curso });

    try {
      const { data: historial, error } = await supabase
        .from('historial_completo')
        .select('*')
        .eq('run', scannedRun)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error al obtener historial:', error);
        Alert.alert('❌ Error', 'No se pudo obtener el historial');
        setLoading(false);
        setScanned(false);
        return;
      }

      const registros: Registro[] = (historial || []).map((item) => ({
        registro_id: item.registro_id,
        run: item.run,
        fecha: item.fecha,
        tipo: item.tipo,
        hora: item.hora,
        nombre: item.nombre,
        curso: item.curso,
        justificado: item.justificado,
        comentario: item.comentario || undefined,
        apoderado: item.apoderado || undefined,
        fecha_justificacion: item.fecha_justificacion || undefined,
      }));

      setRecords(registros);

      if (registros.length === 0) {
        Alert.alert('ℹ️ Sin historial', 'No se encontraron registros para este estudiante.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('❌ Error', 'No se pudo obtener el historial');
    }

    setLoading(false);
    setTimeout(() => setScanned(false), 1000);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>📷 Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📊 Historial</Text>
          <Text style={styles.headerSubtitle}>Escanea el código QR del estudiante</Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setRecords([]);
            setStudentInfo(null);
            onBack();
          }}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#667EEA" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        )}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
        </View>
      </View>

      {/* Student Info Card */}
      {studentInfo && (
        <View style={styles.studentCard}>
          <Text style={styles.studentName}>{studentInfo.nombre}</Text>
          <Text style={styles.studentCourse}>{studentInfo.curso}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{records.length}</Text>
              <Text style={styles.statLabel}>Registros</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#4ECDC4' }]}>
                {records.filter(r => r.justificado === 'Sí').length}
              </Text>
              <Text style={styles.statLabel}>Justificados</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#FF6B6B' }]}>
                {records.filter(r => r.justificado === 'No').length}
              </Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
          </View>
        </View>
      )}

      {/* Records List */}
      <ScrollView style={styles.recordsList} contentContainerStyle={styles.recordsContent}>
        {records.length === 0 && !loading && studentInfo && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No hay registros aún</Text>
          </View>
        )}

        {records.map(r => (
          <View
            key={r.registro_id}
            style={[
              styles.recordCard,
              { borderLeftColor: r.justificado === 'Sí' ? '#4ECDC4' : '#FF6B6B' }
            ]}
          >
            <View style={styles.recordHeader}>
              <View style={styles.recordBadge}>
                <Text style={styles.recordType}>{r.tipo === 'Atrasos' ? '⏰' : '📋'} {r.tipo}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: r.justificado === 'Sí' ? '#E8F8F5' : '#FCE8E8' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: r.justificado === 'Sí' ? '#4ECDC4' : '#FF6B6B' }
                ]}>
                  {r.justificado === 'Sí' ? '✓ Justificado' : '⚠ Pendiente'}
                </Text>
              </View>
            </View>

            <View style={styles.recordDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={styles.detailText}>{r.fecha}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🕐</Text>
                <Text style={styles.detailText}>{r.hora}</Text>
              </View>
            </View>

            {r.justificado === 'Sí' && r.apoderado && (
              <View style={styles.justificationBox}>
                <Text style={styles.justificationTitle}>Justificado por:</Text>
                <Text style={styles.justificationText}>👤 {r.apoderado}</Text>
                {r.fecha_justificacion && (
                  <Text style={styles.justificationDate}>📆 {r.fecha_justificacion}</Text>
                )}
              </View>
            )}

            {r.comentario && (
              <View style={styles.commentBox}>
                <Text style={styles.commentText}>💬 {r.comentario}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  permissionText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    height: 250,
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  studentCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  studentCourse: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667EEA',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  recordsList: {
    flex: 1,
  },
  recordsContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordBadge: {
    flex: 1,
  },
  recordType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  justificationBox: {
    backgroundColor: '#E8F8F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  justificationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
    marginBottom: 4,
  },
  justificationText: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 2,
  },
  justificationDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  commentBox: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  commentText: {
    fontSize: 13,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
});
