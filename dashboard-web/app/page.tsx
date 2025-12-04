'use client';

import Estadisticas from '@/components/Estadisticas';
import TablaRegistros from '@/components/TablaRegistros';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroJustificado, setFiltroJustificado] = useState<string>('todos');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('historial_completo')
      .select('*')
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    if (!error && data) {
      setRegistros(data);
    }
    setLoading(false);
  }

  const registrosFiltrados = registros.filter(r => {
    if (filtroTipo !== 'todos' && r.tipo !== filtroTipo) return false;
    if (filtroJustificado !== 'todos' && r.justificado !== filtroJustificado) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-900">
            📊 Dashboard QRAppPases
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema de Control de Asistencia
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/import" className="flex items-center justify-center p-6 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all">
            <div className="text-center">
              <span className="text-3xl block mb-2">📂</span>
              <span className="text-xl font-bold">Importar Alumnos</span>
              <p className="text-blue-100 text-sm mt-1">Cargar Excel/CSV</p>
            </div>
          </Link>

          <Link href="/credentials" className="flex items-center justify-center p-6 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all">
            <div className="text-center">
              <span className="text-3xl block mb-2">🪪</span>
              <span className="text-xl font-bold">Credenciales</span>
              <p className="text-green-100 text-sm mt-1">Imprimir QRs</p>
            </div>
          </Link>

          <Link href="/students" className="flex items-center justify-center p-6 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-all">
            <div className="text-center">
              <span className="text-3xl block mb-2">👥</span>
              <span className="text-xl font-bold">Estudiantes</span>
              <p className="text-purple-100 text-sm mt-1">Gestionar contactos</p>
            </div>
          </Link>
        </div>

        <Estadisticas registros={registrosFiltrados} />

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Registro
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="todos">Todos</option>
                <option value="Inasistencias">Inasistencias</option>
                <option value="Atrasos">Atrasos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filtroJustificado}
                onChange={(e) => setFiltroJustificado(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="todos">Todos</option>
                <option value="Sí">Justificados</option>
                <option value="No">No Justificados</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltroTipo('todos');
                  setFiltroJustificado('todos');
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        <TablaRegistros registros={registrosFiltrados} loading={loading} />
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>QRAppPases - Sistema de Control de Asistencia</p>
          <p className="text-sm mt-2">Desarrollado con Next.js + Supabase</p>
        </div>
      </footer>
    </div>
  );
}
