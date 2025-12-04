import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HistorialScanner from './HistorialScanner';
import JustifyScanner from './JustifyScanner';
import QRScanner from './QRScanner';

const { width } = Dimensions.get('window');

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
      <View style={styles.header}>
        <Text style={styles.appTitle}>Árbol de la Vida</Text>
        <Text style={styles.subtitle}>Sistema de Asistencia</Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => setMode('Inasistencias')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cardIcon}>📋</Text>
            <Text style={styles.cardTitle}>INASISTENCIAS</Text>
            <Text style={styles.cardSubtitle}>Registrar ausencias</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => setMode('Atrasos')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cardIcon}>⏰</Text>
            <Text style={styles.cardTitle}>ATRASOS</Text>
            <Text style={styles.cardSubtitle}>Registrar llegadas tarde</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => setMode('Justificar')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFA726', '#FFB74D']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cardIcon}>✏️</Text>
            <Text style={styles.cardTitle}>JUSTIFICAR</Text>
            <Text style={styles.cardSubtitle}>Justificar registros</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => setMode('Historial')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardTitle}>HISTORIAL</Text>
            <Text style={styles.cardSubtitle}>Ver registros</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    gap: 20,
  },
  cardWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
});
