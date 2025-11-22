import { z } from 'zod';

/**
 * Esquemas de validación con Zod para datos de análisis
 */

// Esquema para un peso individual
export const PesoSchema = z.object({
    valor: z.number()
        .min(0, 'El peso no puede ser negativo')
        .max(1000, 'El peso excede el máximo permitido'),
    fotoUrl: z.string().url().optional().or(z.literal(''))
});

// Esquema para registro de peso bruto
export const PesoBrutoRegistroSchema = z.object({
    id: z.string(),
    peso: z.number().min(0),
    timestamp: z.string(),
    fotoUrl: z.string().url().optional().or(z.literal(''))
});

// Esquema para conteo de uniformidad
export const ConteoUniformidadSchema = z.object({
    colas: z.number().int().min(0).optional(),
    extra: z.number().int().min(0).optional(),
    primera: z.number().int().min(0).optional(),
    segunda: z.number().int().min(0).optional(),
    tercera: z.number().int().min(0).optional(),
    fotoUrl: z.string().url().optional().or(z.literal(''))
});

// Esquema para defectos
export const DefectosSchema = z.record(
    z.string(),
    z.number().int().min(0)
);

// Esquema completo de análisis con validación cruzada
export const AnalysisSchema = z.object({
    id: z.number().int(),
    pesoBruto: PesoSchema.optional(),
    pesoNeto: PesoSchema.optional(),
    pesoCongelado: PesoSchema.optional(),
    pesoGlaseo: PesoSchema.optional(),
    pesoSinGlaseo: PesoSchema.optional(),
    pesosBrutos: z.array(PesoBrutoRegistroSchema).optional(),
    conteoUniformidad: ConteoUniformidadSchema.optional(),
    defectos: DefectosSchema.optional(),
    observaciones: z.string().optional(),
    fotoGeneral: z.string().url().optional().or(z.literal(''))
}).refine(
    (data) => {
        // Validación cruzada: peso neto no puede ser mayor que peso bruto
        if (data.pesoNeto?.valor && data.pesoBruto?.valor) {
            return data.pesoNeto.valor <= data.pesoBruto.valor;
        }
        return true;
    },
    {
        message: 'El peso neto no puede ser mayor que el peso bruto',
        path: ['pesoNeto']
    }
).refine(
    (data) => {
        // Peso sin glaseo no puede ser mayor que peso congelado
        if (data.pesoSinGlaseo?.valor && data.pesoCongelado?.valor) {
            return data.pesoSinGlaseo.valor <= data.pesoCongelado.valor;
        }
        return true;
    },
    {
        message: 'El peso sin glaseo no puede ser mayor que el peso congelado',
        path: ['pesoSinGlaseo']
    }
);

/**
 * Helper para validar datos antes de guardar
 */
export function validateAnalysisData(data: unknown) {
    return AnalysisSchema.safeParse(data);
}

/**
 * Helper para obtener errores de validación en formato legible
 */
export function getValidationErrors(errors: z.ZodError) {
    return errors.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
    }));
}

/**
 * Type helpers derivados de los schemas
 */
export type ValidatedPeso = z.infer<typeof PesoSchema>;
export type ValidatedAnalysis = z.infer<typeof AnalysisSchema>;
