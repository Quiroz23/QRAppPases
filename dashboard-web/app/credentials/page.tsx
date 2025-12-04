'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

interface Student {
    id: string;
    run: string;
    nombre_completo: string;
    grado: string;
    letra: string;
    curso: string;
    telefono_apoderado: string | null;
}

export default function CredentialsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        const { data, error } = await supabase
            .from('estudiantes')
            .select('*')
            .order('curso', { ascending: true })
            .order('nombres', { ascending: true });

        if (error) {
            console.error('Error fetching students:', error);
        } else {
            setStudents(data || []);
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-8 text-center">Cargando estudiantes...</div>;

    return (
        <div className="p-8 bg-gray-100 min-h-screen print:bg-white print:p-0">
            <div className="max-w-5xl mx-auto mb-8 print:hidden flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Generador de Credenciales</h1>
                <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-colors"
                >
                    Imprimir / Guardar PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:w-full">
                {students.map((student) => {
                    // Formato exacto que espera el Scanner: 4 líneas con prefijos
                    const qrData = `RUN: ${student.run}
Nombre: ${student.nombre_completo}
Grado: ${student.grado}
Curso: ${student.letra}`;

                    return (
                        <div
                            key={student.id}
                            className="relative bg-white border-2 border-gray-300 rounded-xl p-4 flex flex-row items-center space-x-4 shadow-sm print:shadow-none print:border-gray-400 break-inside-avoid page-break-inside-avoid"
                            style={{ pageBreakInside: 'avoid' }}
                        >
                            {/* Indicador de contacto */}
                            {!student.telefono_apoderado && (
                                <div className="absolute top-2 left-2 z-10">
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded shadow">
                                        ⚠️ Sin contacto
                                    </span>
                                </div>
                            )}

                            <div className="bg-white p-2 rounded-lg border border-gray-100">
                                <div style={{ height: "100px", margin: "0 auto", maxWidth: "100px", width: "100%" }}>
                                    <QRCode
                                        size={256}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        value={qrData}
                                        viewBox={`0 0 256 256`}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Estudiante
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 truncate leading-tight mb-1">
                                    {student.nombre_completo}
                                </h2>
                                <div className="text-sm text-gray-600 font-medium">
                                    RUT: {student.run}
                                </div>
                                <div className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
                                    {student.curso}
                                </div>
                            </div>

                            <div className="absolute top-2 right-2 w-8 h-8 bg-gray-200 rounded-full opacity-50"></div>
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        background: white;
                    }
                    nav, header, footer {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
