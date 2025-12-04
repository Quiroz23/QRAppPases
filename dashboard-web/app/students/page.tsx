'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface Student {
    id: string;
    run: string;
    nombre_completo: string;
    curso: string;
    telefono_apoderado: string | null;
    nombre_apoderado: string | null;
    telefono_apoderado_suplente: string | null;
    nombre_apoderado_suplente: string | null;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyWithoutContact, setShowOnlyWithoutContact] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        nombre_apoderado: '',
        telefono_apoderado: '',
        nombre_apoderado_suplente: '',
        telefono_apoderado_suplente: ''
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        let filtered = students;

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.run.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar solo sin contacto
        if (showOnlyWithoutContact) {
            filtered = filtered.filter(s => !s.telefono_apoderado);
        }

        setFilteredStudents(filtered);
    }, [students, searchTerm, showOnlyWithoutContact]);

    const fetchStudents = async () => {
        const { data, error } = await supabase
            .from('estudiantes')
            .select('*')
            .order('nombre_completo', { ascending: true });

        if (error) {
            console.error('Error fetching students:', error);
        } else {
            setStudents(data || []);
            setFilteredStudents(data || []);
        }
        setLoading(false);
    };

    const openEditModal = (student: Student) => {
        setSelectedStudent(student);
        setFormData({
            nombre_apoderado: student.nombre_apoderado || '',
            telefono_apoderado: student.telefono_apoderado || '',
            nombre_apoderado_suplente: student.nombre_apoderado_suplente || '',
            telefono_apoderado_suplente: student.telefono_apoderado_suplente || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedStudent(null);
        setFormData({
            nombre_apoderado: '',
            telefono_apoderado: '',
            nombre_apoderado_suplente: '',
            telefono_apoderado_suplente: ''
        });
    };

    const normalizarTelefono = (tel: string): string => {
        let cleaned = tel.replace(/\s+/g, '').replace(/[-()+]/g, '');
        if (cleaned.startsWith('56')) {
            return '+' + cleaned;
        } else if (cleaned.length === 9) {
            return '+56' + cleaned;
        }
        return '+56' + cleaned;
    };

    const formatearTelefono = (text: string): string => {
        let cleaned = text.replace(/[^\d]/g, '');

        if (cleaned.startsWith('56')) {
            cleaned = cleaned.substring(2);
        }

        cleaned = cleaned.substring(0, 9);

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

    const validarTelefono = (tel: string): boolean => {
        const cleaned = tel.replace(/[^\d]/g, '');
        if (cleaned.length !== 11 || !cleaned.startsWith('56')) {
            return false;
        }
        const thirdDigit = cleaned.charAt(2);
        return thirdDigit >= '2' && thirdDigit <= '9';
    };

    const handleSave = async () => {
        if (!selectedStudent) return;

        // Verificar si ambos campos están vacíos
        const noTitularData = !formData.nombre_apoderado.trim() && !formData.telefono_apoderado.trim();
        const noSuplenteData = !formData.nombre_apoderado_suplente.trim() && !formData.telefono_apoderado_suplente.trim();

        if (noTitularData && noSuplenteData) {
            // Si tenía datos anteriormente, confirmar que quiere eliminarlos
            if (selectedStudent.telefono_apoderado || selectedStudent.telefono_apoderado_suplente) {
                const confirmDelete = window.confirm(
                    '⚠️ Está a punto de ELIMINAR todos los contactos de este estudiante.\n\n¿Está seguro?'
                );
                if (!confirmDelete) {
                    return; // Usuario canceló
                }
            } else {
                // No había datos y no está ingresando nada
                alert('ℹ️ No ha ingresado ningún dato de contacto.\n\nPresione "Cancelar" para salir sin hacer cambios.');
                return;
            }
        }

        // Validar teléfono titular si se ingresó
        if (formData.telefono_apoderado && !validarTelefono(formData.telefono_apoderado)) {
            alert('❌ Teléfono titular inválido.\n\nFormato correcto:\n• Móvil: +56 9 XXXX XXXX\n• Fijo: +56 4 XXXX XXXX');
            return;
        }

        // Validar teléfono suplente si se ingresó
        if (formData.telefono_apoderado_suplente && !validarTelefono(formData.telefono_apoderado_suplente)) {
            alert('❌ Teléfono suplente inválido.\n\nFormato correcto:\n• Móvil: +56 9 XXXX XXXX\n• Fijo: +56 4 XXXX XXXX');
            return;
        }

        // Si hay teléfono pero no nombre, advertir
        if (formData.telefono_apoderado.trim() && !formData.nombre_apoderado.trim()) {
            alert('⚠️ Debe ingresar el nombre del apoderado titular si ingresa su teléfono.');
            return;
        }

        if (formData.telefono_apoderado_suplente.trim() && !formData.nombre_apoderado_suplente.trim()) {
            alert('⚠️ Debe ingresar el nombre del apoderado suplente si ingresa su teléfono.');
            return;
        }

        const { error } = await supabase
            .from('estudiantes')
            .update({
                nombre_apoderado: formData.nombre_apoderado || null,
                telefono_apoderado: formData.telefono_apoderado ? normalizarTelefono(formData.telefono_apoderado) : null,
                nombre_apoderado_suplente: formData.nombre_apoderado_suplente || null,
                telefono_apoderado_suplente: formData.telefono_apoderado_suplente ? normalizarTelefono(formData.telefono_apoderado_suplente) : null
            })
            .eq('id', selectedStudent.id);

        if (error) {
            alert('❌ Error al guardar: ' + error.message);
        } else {
            const message = noTitularData && noSuplenteData
                ? '🗑️ Contactos eliminados exitosamente'
                : '✅ Contactos guardados exitosamente';
            alert(message);
            fetchStudents();
            closeModal();
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando estudiantes...</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Gestión de Estudiantes y Contactos</h1>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o RUN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                    />
                    <label className="flex items-center gap-2 text-gray-900">
                        <input
                            type="checkbox"
                            checked={showOnlyWithoutContact}
                            onChange={(e) => setShowOnlyWithoutContact(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span>Solo sin contacto</span>
                    </label>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                    Mostrando {filteredStudents.length} de {students.length} estudiantes
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-gray-900 font-semibold">Nombre</th>
                                <th className="px-4 py-3 text-left text-gray-900 font-semibold">RUN</th>
                                <th className="px-4 py-3 text-left text-gray-900 font-semibold">Curso</th>
                                <th className="px-4 py-3 text-left text-gray-900 font-semibold">Contacto</th>
                                <th className="px-4 py-3 text-left text-gray-900 font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-900">{student.nombre_completo}</td>
                                    <td className="px-4 py-3 text-gray-900">{student.run}</td>
                                    <td className="px-4 py-3 text-gray-900">{student.curso}</td>
                                    <td className="px-4 py-3">
                                        {student.telefono_apoderado ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                                ✅ Registrado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                                ⚠️ Sin datos
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => openEditModal(student)}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de edición */}
            {isModalOpen && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">
                            Contactos - {selectedStudent.nombre_completo} ({selectedStudent.curso})
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    APODERADO TITULAR
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre (ej: María Pérez - Madre)"
                                    value={formData.nombre_apoderado}
                                    onChange={(e) => setFormData({ ...formData, nombre_apoderado: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-gray-900 placeholder-gray-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Teléfono (ej: +56 9 1234 5678)"
                                    value={formData.telefono_apoderado}
                                    onChange={(e) => setFormData({ ...formData, telefono_apoderado: formatearTelefono(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500"
                                    maxLength={17}
                                />
                                <p className="text-xs text-gray-600 mt-1">Móvil: +56 9 XXXX XXXX | Fijo: +56 4 XXXX XXXX</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    APODERADO SUPLENTE (Opcional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre (ej: Pedro González - Padre)"
                                    value={formData.nombre_apoderado_suplente}
                                    onChange={(e) => setFormData({ ...formData, nombre_apoderado_suplente: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-gray-900 placeholder-gray-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Teléfono (ej: +56 9 8765 4321)"
                                    value={formData.telefono_apoderado_suplente}
                                    onChange={(e) => setFormData({ ...formData, telefono_apoderado_suplente: formatearTelefono(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500"
                                    maxLength={17}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
