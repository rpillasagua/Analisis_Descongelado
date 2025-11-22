import ExcelJS from 'exceljs';
import { QualityAnalysis, WorkShift, PRODUCT_TYPE_LABELS } from '@/lib/types';

// Tipos auxiliares
type ReportShift = 'ALL' | WorkShift;

/**
 * Genera un reporte diario en formato Excel (.xlsx)
 * @param analyses - Array de análisis a incluir en el reporte
 * @param date - Fecha del reporte en formato YYYY-MM-DD
 * @param shift - Turno específico o 'ALL' para todos
 * @returns Blob del archivo Excel generado
 */
export const generateDailyReport = async (
    analyses: QualityAnalysis[],
    date: string,
    shift: ReportShift
): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Diario');

    // --- Estilos y Constantes ---
    const headerFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    const whiteFont: Partial<ExcelJS.Font> = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 16
    };
    const centerAlign: Partial<ExcelJS.Alignment> = {
        horizontal: 'center',
        vertical: 'middle'
    };

    // --- Título ---
    worksheet.mergeCells('A1:N1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Reporte de Análisis de Calidad - ${date}`;
    titleCell.font = whiteFont;
    titleCell.fill = headerFill;
    titleCell.alignment = centerAlign;

    // --- Subtítulo ---
    worksheet.mergeCells('A2:N2');
    const subtitleCell = worksheet.getCell('A2');
    const shiftText = shift === 'ALL'
        ? 'Todos los turnos'
        : shift === 'DIA' ? 'Turno Día (7:10 AM - 7:10 PM)' : 'Turno Noche (7:10 PM - 7:10 AM)';
    subtitleCell.value = shiftText;
    subtitleCell.font = { size: 12, bold: true };
    subtitleCell.alignment = centerAlign;

    worksheet.addRow([]);

    // --- Encabezados ---
    const headers = [
        'Hora', 'Turno', 'Tipo Producto', 'Lote', 'Código', 'Talla',
        'Peso Bruto', 'Peso Congelado', 'Peso Neto', 'Conteo',
        'Uniformidad Grandes', 'Uniformidad Pequeños', 'Total Defectos', 'Observaciones'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
    };
    headerRow.alignment = centerAlign;

    // --- Helper para datos seguros ---
    const getAnalysisData = (analysis: QualityAnalysis) => {
        // Soporte para estructura anidada (si existe) o plana
        const core = analysis.analyses?.[0] || analysis;

        const defectos = core.defectos || {};
        const totalDefectos = Object.values(defectos).reduce(
            (sum: number, val: unknown) => sum + (Number(val) || 0),
            0
        );

        return {
            hora: new Date(analysis.createdAt).toLocaleTimeString('es-EC', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            turno: analysis.shift === 'DIA' ? 'Día' : 'Noche',
            producto: PRODUCT_TYPE_LABELS[analysis.productType] || analysis.productType,
            lote: analysis.lote,
            codigo: analysis.codigo,
            talla: analysis.talla || '-',
            pBruto: core.pesoBruto?.valor || '-',
            pCong: core.pesoCongelado?.valor || '-',
            pNeto: core.pesoNeto?.valor || '-',
            conteo: core.conteo || '-',
            uGrandes: core.uniformidad?.grandes?.valor || '-',
            uPequenos: core.uniformidad?.pequenos?.valor || '-',
            totalDefectos,
            obs: analysis.observations || '-'
        };
    };

    // --- Llenado de Datos ---
    const shiftsToProcess: WorkShift[] = ['DIA', 'NOCHE'];

    shiftsToProcess.forEach(currentShift => {
        const shiftAnalyses = analyses.filter(a => a.shift === currentShift);

        if (shiftAnalyses.length > 0) {
            // Separador
            const sepRow = worksheet.addRow([
                currentShift === 'DIA' ? 'TURNO DÍA' : 'TURNO NOCHE'
            ]);
            worksheet.mergeCells(`A${sepRow.number}:N${sepRow.number}`);
            sepRow.font = { bold: true };
            sepRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: currentShift === 'DIA' ? 'FFFFF2CC' : 'FFE2EFDA' }
            };

            // Filas de datos
            shiftAnalyses.forEach(analysis => {
                const d = getAnalysisData(analysis);
                worksheet.addRow([
                    d.hora, d.turno, d.producto, d.lote, d.codigo, d.talla,
                    d.pBruto, d.pCong, d.pNeto, d.conteo, d.uGrandes, d.uPequenos,
                    d.totalDefectos, d.obs
                ]);
            });

            // Espaciador
            worksheet.addRow([]);
        }
    });

    // --- Ajuste de Columnas ---
    worksheet.columns = [
        { width: 10 }, { width: 10 }, { width: 18 }, { width: 15 }, { width: 12 },
        { width: 10 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 10 },
        { width: 15 }, { width: 15 }, { width: 12 }, { width: 30 }
    ];

    // --- Generar Buffer ---
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
};
