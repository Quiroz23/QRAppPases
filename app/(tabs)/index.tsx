import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import HistorialScanner from './HistorialScanner';
import JustifyScanner from './JustifyScanner';
import QRScanner from './QRScanner';

export default function App() {
  const [mode, setMode] = useState<'Inasistencias' | 'Atrasos' | 'Justificar' | 'Historial' | null>(null);

  if (mode === 'Inasistencias' || mode === 'Atrasos') {
    return <QRScanner mode={mode} onBack={() => setMode(null)} />;
  }

  if (mode === 'Justificar') {
    return <JustifyScanner onBack={() => setMode(null)} />;
  }

  if (mode === 'Historial') {
    return <HistorialScanner onBack={() => setMode(null)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleccione una opción</Text>
      <View style={styles.buttonContainer}>
        <Button title="Registrar Inasistencia" onPress={() => setMode('Inasistencias')} />
        <Button title="Registrar Atraso" onPress={() => setMode('Atrasos')} />
        <Button title="Justificar Registros" onPress={() => setMode('Justificar')} />
        <Button title="Ver Historial" onPress={() => setMode('Historial')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 20,
  },
});
