import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

  const [showContactModal, setShowContactModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [nombreApoderado, setNombreApoderado] = useState('');
  const [telefonoApoderado, setTelefonoApoderado] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  // Normaliza formato de teléfono chileno para almacenamiento (+56XXXXXXXXX)
  const normalizarTelefono = (tel: string): string => {
    let cleaned = tel.replace(/\s+/g, '').replace(/[-()+]/g, '');
    if (cleaned.startsWith('56')) {
      return '+' + cleaned;
    } else if (cleaned.length === 9) {
      return '+56' + cleaned;
    }
    return '+56' + cleaned;
  };

  // Formatea input de teléfono en tiempo real: +56 X XXXX XXXX
  const formatearTelefono = (text: string): string => {
    let cleaned = text.replace(/[^\d]/g, '');

    if (cleaned.startsWith('56')) {
      cleaned = cleaned.substring(2);
    }

    cleaned = cleaned.substring(0, 9);

    // Auto-corrige primer dígito inválido (móviles empiezan con 9, fijos con 2-7)
    if (cleaned.length > 0) {
      const firstDigit = cleaned.charAt(0);
      if (firstDigit !== '2' && firstDigit !== '3' && firstDigit !== '4' &&
        firstDigit !== '5' && firstDigit !== '6' && firstDigit !== '7' &&
        firstDigit !== '8' && firstDigit !== '9') {
        cleaned = '9' + cleaned.substring(0, 8);
      }
    }

    if (cleaned.length > 0) {
      const formatted = '+56 ' + cleaned.charAt(0);
      if (cleaned.length > 1) {
        const rest = cleaned.substring(1);
        if (rest.length <= 4) {
          return formatted + ' ' + rest;
        } else {
          return formatted + ' ' + rest.substring(0, 4) + ' ' + rest.substring(4, 8);
        }
      }
      return formatted;
    }

    return '';
  };

  const handleTelefonoChange = (text: string) => {
    const formatted = formatearTelefono(text);
    setTelefonoApoderado(formatted);
  };

  const validarTelefono = (tel: string): boolean => {
    const cleaned = tel.replace(/[^\d]/g, '');
    if (cleaned.length !== 11 || !cleaned.startsWith('56')) {
      return false;
    }
    const thirdDigit = cleaned.charAt(2);
    return thirdDigit >= '2' && thirdDigit <= '9';
  };

  const showSuccessAlert = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setScanned(false);
    }, 2500);
  };

  const handleSaveContact = async () => {
    if (!currentStudent) {
      Alert.alert('Error', 'Datos del estudiante no disponibles');
      return;
    }

    if (!telefonoApoderado.trim()) {
      Alert.alert('Error', 'Por favor ingrese el teléfono del apoderado');
      return;
    }

    if (!nombreApoderado.trim()) {
      Alert.alert('Error', 'Por favor ingrese el nombre del apoderado');
      return;
    }

    if (!validarTelefono(telefonoApoderado)) {
      Alert.alert('Error', 'Teléfono inválido. Móvil: +56 9 XXXX XXXX | Fijo: +56 4 XXXX XXXX');
      return;
    }

    const { error } = await supabase
      .from('estudiantes')
      .update({
        nombre_apoderado: nombreApoderado || null,
        telefono_apoderado: normalizarTelefono(telefonoApoderado)
      })
      .eq('id', currentStudent.id);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar el contacto: ' + error.message);
    } else {
      setShowContactModal(false);
      setNombreApoderado('');
      setTelefonoApoderado('');
      setCurrentStudent(null);
      showSuccessAlert(`✅ ${currentStudent.nombreCompleto} registrado y contacto guardado`);
    }
  };

  const handleSkipContact = () => {
    const studentName = currentStudent?.nombreCompleto || '';
    setShowContactModal(false);
    setNombreApoderado('');
    setTelefonoApoderado('');
    setCurrentStudent(null);
    showSuccessAlert(`✅ ${studentName} registrado (sin contacto)`);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);
    setComentario('');

    // Parse del formato QR esperado (4 líneas con prefijos)
    const [runLine, nombreLine, gradoLine, cursoLine] = data.split('\n');
    const run = runLine?.replace('RUN: ', '').trim();
    const nombreCompleto = nombreLine?.replace('Nombre: ', '').trim();
    const grado = gradoLine?.replace('Grado: ', '').trim();
    const letra = cursoLine?.replace('Curso: ', '').trim();
    const fecha = moment().format('YYYY-MM-DD');
    const hora = moment().format('HH:mm');

    if (!run || !nombreCompleto) {
      Alert.alert('❌ Error', 'Formato de QR inválido');
      setLoading(false);
      setScanned(false);
      return;
    }

    try {
      // Separa nombre completo en componentes (formato chileno: Nombres ApellidoP ApellidoM)
      const nombreParts = nombreCompleto.split(' ');
      let nombres = '';
      let apellidoPaterno = '';
      let apellidoMaterno = '';

      if (nombreParts.length >= 3) {
        apellidoMaterno = nombreParts.pop() || '';
        apellidoPaterno = nombreParts.pop() || '';
        nombres = nombreParts.join(' ');
      } else if (nombreParts.length === 2) {
        nombres = nombreParts[0];
        apellidoPaterno = nombreParts[1];
        apellidoMaterno = '';
      } else {
        nombres = nombreCompleto;
        apellidoPaterno = '';
        apellidoMaterno = '';
      }

      // Upsert: crea estudiante si no existe, actualiza datos si ya existe (por RUN)
      const { data: estudiante, error: estudianteError } = await supabase
        .from('estudiantes')
        .upsert(
          {
            run: run.toLowerCase(),
            nombres,
            apellido_paterno: apellidoPaterno,
            apellido_materno: apellidoMaterno,
            grado,
            letra,
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

      setLoading(false);

      // Si es atraso y falta contacto, muestra modal para solicitarlo
      if (mode === 'Atrasos' && !estudiante.telefono_apoderado) {
        setCurrentStudent({
          id: estudiante.id,
          nombreCompleto,
          run,
          grado,
          letra
        });
        setShowContactModal(true);
        return;
      }

      showSuccessAlert(`✅ ${nombreCompleto} registrado exitosamente`);

    } catch (err) {
      console.error('Error inesperado:', err);
      Alert.alert('❌ Error al registrar', 'Ocurrió un error inesperado');
      setLoading(false);
      setScanned(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>📷 Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  const modeColors = mode === 'Atrasos'
    ? { gradient: ['#4ECDC4', '#44A08D'] as const, icon: '⏰' }
    : { gradient: ['#FF6B6B', '#FF8E8E'] as const, icon: '📋' };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={modeColors.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{modeColors.icon} {mode}</Text>
          <Text style={styles.headerSubtitle}>Escanea el código QR del estudiante</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.cameraContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Registrando...</Text>
          </View>
        )}

        {showSuccess && (
          <View style={styles.successOverlay}>
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          </View>
        )}

        <CameraView
          ref={cameraRef}
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        <View style={styles.scannerOverlay}>
          <View style={[styles.scannerFrame, { borderColor: modeColors.gradient[0] }]} />
          <Text style={styles.scanInstruction}>Centra el código QR en el marco</Text>
        </View>
      </View>

      <View style={styles.commentSection}>
        <Text style={styles.commentLabel}>💬 Comentario opcional:</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Ej: Llegó con justificación médica"
          value={comentario}
          onChangeText={setComentario}
          placeholderTextColor="#999"
        />
      </View>

      <Modal
        visible={showContactModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSkipContact}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.modalHeaderIcon}>📞</Text>
              <Text style={styles.modalHeaderTitle}>Contacto Apoderado</Text>
              <Text style={styles.modalHeaderSubtitle}>{currentStudent?.nombreCompleto}</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.warningBox}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  Este estudiante no tiene contacto registrado.{'\n'}
                  Por favor solicite los datos del apoderado.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del Apoderado *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: María Pérez (Madre)"
                  value={nombreApoderado}
                  onChangeText={setNombreApoderado}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teléfono *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="+56 9 XXXX XXXX"
                  keyboardType="phone-pad"
                  value={telefonoApoderado}
                  onChangeText={handleTelefonoChange}
                  maxLength={17}
                  placeholderTextColor="#999"
                />
                <Text style={styles.inputHint}>Móvil: +56 9 XXXX XXXX | Fijo: +56 4 XXXX XXXX</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleSkipContact}
              >
                <Text style={styles.modalButtonTextSecondary}>Omitir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveContact}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
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
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  successBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 350,
  },
  successIcon: {
    fontSize: 60,
    color: '#4ECDC4',
    marginBottom: 15,
  },
  successText: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: '600',
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
    width: 250,
    height: 250,
    borderWidth: 3,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanInstruction: {
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  commentSection: {
    backgroundColor: '#fff',
    padding: 20,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#F8F9FA',
    color: '#2C3E50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    padding: 25,
    alignItems: 'center',
  },
  modalHeaderIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  modalHeaderSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  modalBody: {
    padding: 25,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#2C3E50',
  },
  inputHint: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#4ECDC4',
  },
  modalButtonSecondary: {
    backgroundColor: '#ECF0F1',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalButtonTextSecondary: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '700',
  },
});
