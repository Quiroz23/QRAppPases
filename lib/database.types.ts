/**
 * Tipos TypeScript generados para la base de datos de Supabase
 * 
 * Estos tipos nos dan autocompletado y validación en el código.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            estudiantes: {
                Row: {
                    id: string
                    run: string
                    nombre: string
                    curso: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    run: string
                    nombre: string
                    curso: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    run?: string
                    nombre?: string
                    curso?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            registros: {
                Row: {
                    id: string
                    estudiante_id: string
                    fecha: string
                    hora: string
                    tipo: string
                    comentario: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    estudiante_id: string
                    fecha: string
                    hora: string
                    tipo: string
                    comentario?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    estudiante_id?: string
                    fecha?: string
                    hora?: string
                    tipo?: string
                    comentario?: string | null
                    created_at?: string
                }
            }
            justificaciones: {
                Row: {
                    id: string
                    registro_id: string
                    apoderado: string
                    fecha_justificacion: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    registro_id: string
                    apoderado: string
                    fecha_justificacion?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    registro_id?: string
                    apoderado?: string
                    fecha_justificacion?: string
                    created_at?: string
                }
            }
        }
        Views: {
            historial_completo: {
                Row: {
                    registro_id: string
                    estudiante_id: string
                    run: string
                    nombre: string
                    curso: string
                    fecha: string
                    hora: string
                    tipo: string
                    comentario: string | null
                    justificado: string
                    apoderado: string | null
                    fecha_justificacion: string | null
                    created_at: string
                }
            }
        }
    }
}
