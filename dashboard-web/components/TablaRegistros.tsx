'use client';

import * as XLSX from 'xlsx';

interface TablaRegistrosProps {
    registros: any[];
    loading: boolean;
}

export default function TablaRegistros({ registros, loading }: TablaRegistrosProps) {
    const exportarExcel = () => {
        const datosExcel = registros.map(r => ({
            'Estudiante': r.nombre,
            'RUN': r.run,
            'Curso': r.curso,
            'Fecha': r.fecha,
            'Hora': r.hora,
            'Tipo': r.tipo,
            'Justificado': r.justificado,
            'Apoderado': r.apoderado || '',
            'Fecha Justificación': r.fecha_justificacion || '',
            'Comentario': r.comentario || '',
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);

        const colWidths = [
            { wch: 25 }, // Estudiante
            { wch: 12 }, // RUN
            { wch: 10 }, // Curso
            { wch: 12 }, // Fecha
            { wch: 8 },  // Hora
            { wch: 15 }, // Tipo
            { wch: 12 }, // Justificado
            { wch: 20 }, // Apoderado
            { wch: 18 }, // Fecha Justificación
            { wch: 30 }, // Comentario
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Registros');

        const nombreArchivo = `historial_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando registros...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="flex justify-between items-center p-6 border-b">
                <div>
                    <h2 className="text-2xl font-bold">Registros</h2>
                    <p className="text-gray-600 mt-1">
                        {registros.length} registro{registros.length !== 1 ? 's' : ''} encontrado{registros.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={exportarExcel}
                    disabled={registros.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar a Excel
                </button>
            </div>

            <div className="overflow-x-auto">
                {registros.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay registros para mostrar
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estudiante
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    RUN
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Curso
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Apoderado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {registros.map((r, i) => (
                                <tr
                                    key={i}
                                    className={r.justificado === 'Sí' ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{r.nombre}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {r.run}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {r.curso}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {r.fecha}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {r.hora}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${r.tipo === 'Inasistencias'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {r.tipo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${r.justificado === 'Sí'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {r.justificado === 'Sí' ? '✅ Justificado' : '❌ Pendiente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {r.apoderado || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
