import ExcelJS from 'exceljs';
import { QualityAnalysis, WorkShift, PRODUCT_TYPE_LABELS, ProductType, DEFECTOS_ENTERO, DEFECTOS_COLA, DEFECTOS_VALOR_AGREGADO, DEFECTO_LABELS, ANALYST_COLOR_LABELS } from '@/lib/types';

// Tipos auxiliares
type ReportShift = 'ALL' | WorkShift;

// ============================================
// ESTILOS REUTILIZABLES
// ============================================

const STYLES = {
    headerFill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    } as ExcelJS.Fill,

    subHeaderFill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
    } as ExcelJS.Fill,

    dayFill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' }
    } as ExcelJS.Fill,

    nightFill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' }
    } as ExcelJS.Fill,

    whiteFont: {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 16
    } as Partial<ExcelJS.Font>,

    centerAlign: {
        horizontal: 'center',
        vertical: 'middle'
    } as Partial<ExcelJS.Alignment>,

    border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    } as Partial<ExcelJS.Borders>
};

// ============================================
// HELPER: EXTRAER DATOS DEL ANÁLISIS
// ============================================

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
        colorAnalista: ANALYST_COLOR_LABELS[analysis.analystColor] || analysis.analystColor,
        pBruto: core.pesoBruto?.valor || '-',
        pCong: core.pesoCongelado?.valor || '-',
        pNeto: core.pesoNeto?.valor || '-',
        conteo: core.conteo || '-',
        uGrandes: core.uniformidad?.grandes?.valor || '-',
        uPequenos: core.uniformidad?.pequenos?.valor || '-',
        defectos,
        totalDefectos,
        obs: analysis.observations || '-',
        pesosBrutos: core.pesosBrutos || []
    };
};

// ============================================
// CREAR HOJA DE CONSOLIDADO
// ============================================

const createConsolidatedSheet = (workbook: ExcelJS.Workbook, analyses: QualityAnalysis[], date: string, shift: ReportShift) => {
    const worksheet = workbook.addWorksheet('Consolidado');

    // Título
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Reporte Consolidado - ${date}`;
    titleCell.font = STYLES.whiteFont;
    titleCell.fill = STYLES.headerFill;
    titleCell.alignment = STYLES.centerAlign;

    // Subtítulo
    worksheet.mergeCells('A2:G2');
    const subtitleCell = worksheet.getCell('A2');
    const shiftText = shift === 'ALL'
        ? 'Todos los turnos'
        : shift === 'DIA' ? 'Turno Día (7:10 AM - 7:10 PM)' : 'Turno Noche (7:10 PM - 7:10 AM)';
    subtitleCell.value = shiftText;
    subtitleCell.font = { size: 12, bold: true };
    subtitleCell.alignment = STYLES.centerAlign;

    worksheet.addRow([]);

    // Encabezados
    const headerRow = worksheet.addRow([
        'Tipo Producto',
        'Turno',
        'Cantidad',
        'Peso Bruto Prom',
        'Peso Neto Prom',
        'Total Defectos',
        '% del Total'
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = STYLES.subHeaderFill;
    headerRow.alignment = STYLES.centerAlign;

    // Agrupar análisis por tipo de producto y turno
    const groupedAnalyses: Record<string, QualityAnalysis[]> = {};

    analyses.forEach(analysis => {
        const key = `${analysis.productType}-${analysis.shift}`;
        if (!groupedAnalyses[key]) {
            groupedAnalyses[key] = [];
        }
        groupedAnalyses[key].push(analysis);
    });

    let totalGeneral = 0;
    const summaryData: any[] = [];

    // Calcular totales
    Object.keys(groupedAnalyses).forEach(key => {
        const [productType, shiftType] = key.split('-');
        const group = groupedAnalyses[key];

        const totalPesoBruto = group.reduce((sum, a) => {
            const data = getAnalysisData(a);
            return sum + (typeof data.pBruto === 'number' ? data.pBruto : 0);
        }, 0);

        const totalPesoNeto = group.reduce((sum, a) => {
            const data = getAnalysisData(a);
            return sum + (typeof data.pNeto === 'number' ? data.pNeto : 0);
        }, 0);

        const totalDefectos = group.reduce((sum, a) => {
            const data = getAnalysisData(a);
            return sum + data.totalDefectos;
        }, 0);

        const cantidad = group.length;
        totalGeneral += cantidad;

        summaryData.push({
            producto: PRODUCT_TYPE_LABELS[productType as ProductType],
            turno: shiftType === 'DIA' ? 'Día' : 'Noche',
            cantidad,
            promPesoBruto: totalPesoBruto > 0 ? (totalPesoBruto / cantidad).toFixed(2) : '-',
            promPesoNeto: totalPesoNeto > 0 ? (totalPesoNeto / cantidad).toFixed(2) : '-',
            totalDefectos,
            percentage: 0 // Se calculará después
        });
    });

    // Calcular porcentajes y agregar filas
    summaryData.forEach(data => {
        data.percentage = ((data.cantidad / totalGeneral) * 100).toFixed(1) + '%';

        const row = worksheet.addRow([
            data.producto,
            data.turno,
            data.cantidad,
            data.promPesoBruto,
            data.promPesoNeto,
            data.totalDefectos,
            data.percentage
        ]);
        row.alignment = { vertical: 'middle' };
    });

    // Fila de totales
    worksheet.addRow([]);
    const totalRow = worksheet.addRow([
        'TOTAL',
        '',
        totalGeneral,
        '',
        '',
        summaryData.reduce((sum, d) => sum + d.totalDefectos, 0),
        '100%'
    ]);
    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFBDD7EE' }
    };

    // Ajustar ancho de columnas
    worksheet.columns = [
        { width: 20 },
        { width: 12 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
        { width: 15 },
        { width: 12 }
    ];

    return worksheet;
};

// ============================================
// CREAR HOJA PARA ENTERO, COLA, VALOR AGREGADO
// ============================================

const createStandardProductSheet = (
    workbook: ExcelJS.Workbook,
    analyses: QualityAnalysis[],
    productType: ProductType,
    date: string
) => {
    const worksheet = workbook.addWorksheet(PRODUCT_TYPE_LABELS[productType]);

    // Obtener defectos según tipo de producto
    let defectosList: readonly string[] = [];
    if (productType === 'ENTERO') {
        defectosList = DEFECTOS_ENTERO;
    } else if (productType === 'COLA') {
        defectosList = DEFECTOS_COLA;
    } else if (productType === 'VALOR_AGREGADO') {
        defectosList = DEFECTOS_VALOR_AGREGADO;
    }

    // Título
    const headerColSpan = 13 + defectosList.length;
    worksheet.mergeCells(1, 1, 1, headerColSpan);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = `Análisis de ${PRODUCT_TYPE_LABELS[productType]} - ${date}`;
    titleCell.font = STYLES.whiteFont;
    titleCell.fill = STYLES.headerFill;
    titleCell.alignment = STYLES.centerAlign;

    worksheet.addRow([]);

    // Encabezados
    const headers = [
        'Hora',
        'Turno',
        'Lote',
        'Código',
        'Talla',
        'Color Analista',
        'Peso Bruto',
        'Peso Congelado',
        'Peso Neto',
        'Conteo',
        'Uniformidad Grandes',
        'Uniformidad Pequeños',
        'Total Defectos',
        ...defectosList.map(d => DEFECTO_LABELS[d] || d),
        'Observaciones'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = STYLES.subHeaderFill;
    headerRow.alignment = STYLES.centerAlign;

    // Agrupar por turno
    const shiftsToProcess: WorkShift[] = ['DIA', 'NOCHE'];

    shiftsToProcess.forEach(currentShift => {
        const shiftAnalyses = analyses.filter(a => a.shift === currentShift);

        if (shiftAnalyses.length > 0) {
            // Separador de turno
            const sepRow = worksheet.addRow([
                currentShift === 'DIA' ? 'TURNO DÍA' : 'TURNO NOCHE'
            ]);
            worksheet.mergeCells(sepRow.number, 1, sepRow.number, headerColSpan);
            sepRow.font = { bold: true, size: 12 };
            sepRow.fill = currentShift === 'DIA' ? STYLES.dayFill : STYLES.nightFill;

            // Filas de datos
            shiftAnalyses.forEach(analysis => {
                const d = getAnalysisData(analysis);

                // Valores de defectos específicos
                const defectosValues = defectosList.map(defecto => d.defectos[defecto] || 0);

                const row = worksheet.addRow([
                    d.hora,
                    d.turno,
                    d.lote,
                    d.codigo,
                    d.talla,
                    d.colorAnalista,
                    d.pBruto,
                    d.pCong,
                    d.pNeto,
                    d.conteo,
                    d.uGrandes,
                    d.uPequenos,
                    d.totalDefectos,
                    ...defectosValues,
                    d.obs
                ]);
                row.alignment = { vertical: 'middle' };
            });

            worksheet.addRow([]);
        }
    });

    // Ajustar ancho de columnas
    const baseWidths = [
        { width: 10 },  // Hora
        { width: 10 },  // Turno
        { width: 15 },  // Lote
        { width: 12 },  // Código
        { width: 10 },  // Talla
        { width: 15 },  // Color Analista
        { width: 12 },  // Peso Bruto
        { width: 14 },  // Peso Congelado
        { width: 12 },  // Peso Neto
        { width: 10 },  // Conteo
        { width: 15 },  // Uniformidad Grandes
        { width: 15 },  // Uniformidad Pequeños
        { width: 12 },  // Total Defectos
    ];

    // Agregar anchos para columnas de defectos
    const defectosWidths = defectosList.map(() => ({ width: 12 }));

    worksheet.columns = [
        ...baseWidths,
        ...defectosWidths,
        { width: 30 }  // Observaciones
    ];

    return worksheet;
};

// ============================================
// CREAR HOJA PARA CONTROL DE PESOS BRUTOS
// ============================================

const createControlPesosSheet = (
    workbook: ExcelJS.Workbook,
    analyses: QualityAnalysis[],
    date: string
) => {
    const worksheet = workbook.addWorksheet('Control de Pesos Brutos');

    const maxPesos = 20; // Hasta 20 pesos brutos
    const headerColSpan = 9 + maxPesos;

    // Título
    worksheet.mergeCells(1, 1, 1, headerColSpan);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = `Control de Pesos Brutos - ${date}`;
    titleCell.font = STYLES.whiteFont;
    titleCell.fill = STYLES.headerFill;
    titleCell.alignment = STYLES.centerAlign;

    worksheet.addRow([]);

    // Encabezados
    const headers = [
        'Hora',
        'Turno',
        'Lote',
        'Código',
        'Talla',
        'Color Analista',
        ...Array.from({ length: maxPesos }, (_, i) => `Peso ${i + 1}`),
        'Promedio',
        'Observaciones'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = STYLES.subHeaderFill;
    headerRow.alignment = STYLES.centerAlign;

    // Agrupar por turno
    const shiftsToProcess: WorkShift[] = ['DIA', 'NOCHE'];

    shiftsToProcess.forEach(currentShift => {
        const shiftAnalyses = analyses.filter(a => a.shift === currentShift);

        if (shiftAnalyses.length > 0) {
            // Separador de turno
            const sepRow = worksheet.addRow([
                currentShift === 'DIA' ? 'TURNO DÍA' : 'TURNO NOCHE'
            ]);
            worksheet.mergeCells(sepRow.number, 1, sepRow.number, headerColSpan);
            sepRow.font = { bold: true, size: 12 };
            sepRow.fill = currentShift === 'DIA' ? STYLES.dayFill : STYLES.nightFill;

            // Filas de datos
            shiftAnalyses.forEach(analysis => {
                const d = getAnalysisData(analysis);

                // Obtener todos los pesos brutos
                const pesos = d.pesosBrutos.map(p => p.peso);
                const promedio = pesos.length > 0
                    ? (pesos.reduce((sum, p) => sum + p, 0) / pesos.length).toFixed(2)
                    : '-';

                // Rellenar array de pesos hasta maxPesos
                const pesosArray = Array.from({ length: maxPesos }, (_, i) =>
                    pesos[i] !== undefined ? pesos[i] : '-'
                );

                const row = worksheet.addRow([
                    d.hora,
                    d.turno,
                    d.lote,
                    d.codigo,
                    d.talla,
                    d.colorAnalista,
                    ...pesosArray,
                    promedio,
                    d.obs
                ]);
                row.alignment = { vertical: 'middle' };
            });

            worksheet.addRow([]);
        }
    });

    // Ajustar ancho de columnas
    const baseWidths = [
        { width: 10 },  // Hora
        { width: 10 },  // Turno
        { width: 15 },  // Lote
        { width: 12 },  // Código
        { width: 10 },  // Talla
        { width: 15 },  // Color Analista
    ];

    const pesosWidths = Array.from({ length: maxPesos }, () => ({ width: 10 }));

    worksheet.columns = [
        ...baseWidths,
        ...pesosWidths,
        { width: 12 },  // Promedio
        { width: 30 }   // Observaciones
    ];

    return worksheet;
};

// ============================================
// FUNCIÓN PRINCIPAL: GENERAR REPORTE DIARIO
// ============================================

export const generateDailyReport = async (
    analyses: QualityAnalysis[],
    date: string,
    shift: ReportShift
): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();

    // 1. Crear hoja de consolidado
    createConsolidatedSheet(workbook, analyses, date, shift);

    // 2. Agrupar análisis por tipo de producto
    const analysesByType: Record<ProductType, QualityAnalysis[]> = {
        ENTERO: [],
        COLA: [],
        VALOR_AGREGADO: [],
        CONTROL_PESOS: []
    };

    analyses.forEach(analysis => {
        if (analysesByType[analysis.productType]) {
            analysesByType[analysis.productType].push(analysis);
        }
    });

    // 3. Crear hojas para cada tipo de producto que tenga datos
    if (analysesByType.ENTERO.length > 0) {
        createStandardProductSheet(workbook, analysesByType.ENTERO, 'ENTERO', date);
    }

    if (analysesByType.COLA.length > 0) {
        createStandardProductSheet(workbook, analysesByType.COLA, 'COLA', date);
    }

    if (analysesByType.VALOR_AGREGADO.length > 0) {
        createStandardProductSheet(workbook, analysesByType.VALOR_AGREGADO, 'VALOR_AGREGADO', date);
    }

    if (analysesByType.CONTROL_PESOS.length > 0) {
        createControlPesosSheet(workbook, analysesByType.CONTROL_PESOS, date);
    }

    // 4. Generar buffer y blob
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
};
