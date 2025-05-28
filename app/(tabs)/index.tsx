// app/index.tsx
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import QRScanner from './QRScanner';
import QueryScanner from './QueryScanner';

export default function App() {
  const [mode, setMode] = useState<'Inasistencias' | 'Atrasos' | 'Consultar' | null>(null);

  if (mode === 'Inasistencias' || mode === 'Atrasos') {
    return <QRScanner mode={mode} onBack={() => setMode(null)} />;
  }

  if (mode === 'Consultar') {
    return <QueryScanner onBack={() => setMode(null)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleccione una opción</Text>
      <View style={styles.buttonContainer}>
        <Button title="Registrar Inasistencia" onPress={() => setMode('Inasistencias')} />
        <Button title="Registrar Atraso" onPress={() => setMode('Atrasos')} />
        <Button title="Consultar Historial" onPress={() => setMode('Consultar')} />
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
