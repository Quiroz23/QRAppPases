'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportPage() {
    const [uploading, setUploading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [institutionId, setInstitutionId] = useState<string | null>(null);
    const router = useRouter();

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    useEffect(() => {
        checkInstitution();
    }, []);

    const checkInstitution = async () => {
        // 1. Buscar si ya existe alguna institución
        const { data, error } = await supabase.from('institutions').select('id, name').limit(1);

        if (error) {
            addLog(`Error verificando institución: ${error.message}`);
            return;
        }

        if (data && data.length > 0) {
            setInstitutionId(data[0].id);
            addLog(`Institución detectada: ${data[0].name}`);
        } else {
            // 2. Si no existe, crear una por defecto (Setup Local)
            addLog('No se detectó institución. Creando "Mi Colegio"...');
            const { data: newInst, error: createError } = await supabase
                .from('institutions')
                .insert({ name: 'Mi Colegio', plan_type: 'pro' })
                .select()
                .single();

            if (createError) {
                addLog(`Error creando institución: ${createError.message}`);
            } else if (newInst) {
                setInstitutionId(newInst.id);
                addLog(`Institución creada: ${newInst.name}`);
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!institutionId) {
            alert('Error: No se ha podido establecer una institución. Revisa los logs.');
            return;
        }

        setUploading(true);
        setLogs(prev => [...prev, `Leyendo archivo: ${file.name}...`]);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                addLog(`Filas encontradas: ${data.length}`);
                await processData(data);
            } catch (err) {
                console.error(err);
                addLog('Error al leer el archivo.');
                setUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const processData = async (data: any[]) => {
        let successCount = 0;
        let errorCount = 0;

        for (const row of data) {
            try {
                // Normalización de claves para ser tolerante a mayúsculas/minúsculas
                const getVal = (key: string) => row[key] || row[key.toLowerCase()] || row[key.toUpperCase()];

                const runBody = getVal('Run');
                const dv = getVal('DV');

                if (!runBody) {
                    addLog(`Fila ignorada (sin RUN): ${JSON.stringify(row)}`);
                    continue;
                }

                const runCompleto = dv ? `${runBody}-${dv}` : `${runBody}`;

                // Mapeo exacto a las nuevas columnas
                const nombres = getVal('Nombres') || '';
                const apPaterno = getVal('Apellido Paterno') || '';
                const apMaterno = getVal('Apellido Materno') || '';
                const genero = getVal('Genero') || '';
                const anio = getVal('Año') || new Date().getFullYear();

                const grado = getVal('Desc Grado') || '';
                const letra = getVal('Letra Curso') || '';

                // Detección de columnas de contacto (NUEVO)
                const telefonoApoderado = getVal('Telefono Apoderado') || getVal('Tel Apoderado') || getVal('Contacto') || getVal('Celular Apoderado') || null;
                const nombreApoderado = getVal('Nombre Apoderado') || getVal('Apoderado') || null;
                const telefonoSuplente = getVal('Telefono Suplente') || getVal('Tel Suplente') || getVal('Telefono Apoderado Suplente') || null;
                const nombreSuplente = getVal('Nombre Suplente') || getVal('Apoderado Suplente') || null;

                // Normalizar teléfonos al formato +56XXXXXXXXX
                const normalizarTelefono = (tel: string | null): string | null => {
                    if (!tel) return null;
                    let cleaned = tel.toString().replace(/\s+/g, '').replace(/[-()+]/g, '');
                    if (cleaned.startsWith('56')) {
                        return '+' + cleaned;
                    } else if (cleaned.startsWith('9') && cleaned.length === 9) {
                        return '+56' + cleaned;
                    } else if (cleaned.length === 9) {
                        return '+56' + cleaned;
                    }
                    return '+56' + cleaned;
                };

                const { error } = await supabase
                    .from('estudiantes')
                    .upsert({
                        run: runCompleto,
                        nombres: nombres,
                        apellido_paterno: apPaterno,
                        apellido_materno: apMaterno,
                        genero: genero,
                        anio_escolar: anio,
                        grado: grado,
                        letra: letra,
                        telefono_apoderado: normalizarTelefono(telefonoApoderado),
                        nombre_apoderado: nombreApoderado,
                        telefono_apoderado_suplente: normalizarTelefono(telefonoSuplente),
                        nombre_apoderado_suplente: nombreSuplente,
                        institution_id: institutionId
                    }, { onConflict: 'run' });

                if (error) {
                    console.error('Error insertando:', row, error);
                    addLog(`Error con ${runCompleto}: ${error.message}`);
                    errorCount++;
                } else {
                    successCount++;
                }

            } catch (err) {
                console.error(err);
                errorCount++;
            }
        }

        addLog(`Proceso finalizado. Éxitos: ${successCount}, Errores: ${errorCount}`);
        setUploading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Importación Masiva de Alumnos</h1>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar archivo Excel (.xlsx, .xls)
                    </label>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
                    />
                </div>

                {uploading && <p className="text-blue-600 font-medium">Procesando... por favor espere.</p>}

                <div className="mt-6 bg-gray-50 p-4 rounded h-64 overflow-y-auto font-mono text-sm border border-gray-300">
                    {logs.length === 0 ? (
                        <p className="text-gray-500">Los registros del proceso aparecerán aquí...</p>
                    ) : (
                        logs.map((log, i) => <div key={i} className="mb-1 text-gray-900">{log}</div>)
                    )}
                </div>
            </div>
        </div>
    );
}
