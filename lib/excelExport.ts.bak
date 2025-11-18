import * as XLSX from 'xlsx-js-style';
import { format, addHours, parseISO } from 'date-fns';
import { ResistanceTest, DailyReport } from './types';

const styles = {
  headerBlue: {
    font: { bold: true, sz: 11, color: { rgb: "FFFFFFFF" } },
    fill: { fgColor: { rgb: "FF002060" } },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  headerWhite: {
    font: { bold: true, sz: 11 },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  // Same as headerWhite but WITHOUT bottom border (useful to remove dividing line)
  headerWhiteNoBottom: {
    font: { bold: true, sz: 11 },
    alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
    border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  // Same as headerWhite but WITHOUT top border (useful to remove dividing line)
  headerWhiteNoTop: {
    font: { bold: true, sz: 11 },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  labelBlueWithValue: {
    font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 10 },
    fill: { fgColor: { rgb: 'FF002060' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  value: {
    font: { sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  valueLeft: {
    font: { sz: 10 },
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  methodology: {
    font: { bold: true, sz: 10, color: { rgb: "FFFFFFFF" } },
    fill: { fgColor: { rgb: "FF002060" } },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  signatureName: {
    font: { sz: 10 },
    alignment: { horizontal: 'center', vertical: 'bottom' },
    border: { bottom: { style: 'thin' } }
  },
  signatureTitle: {
    font: { sz: 10 },
    alignment: { horizontal: 'center', vertical: 'top', wrapText: true }
  },
  consolidatedHeader: {
    font: { bold: true, sz: 11, color: { rgb: "FFFFFFFF" } },
    fill: { fgColor: { rgb: "FF002060" } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  headerWhiteLeft: {
    font: { bold: true, sz: 11 },
    alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
    border: { top: { style: 'thin' }, bottom: { style: 'none' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
  headerWhiteNoBorderTop: {
    font: { bold: true, sz: 11 },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: { top: { style: 'none' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  },
};

const createCell = (value: any, style: any = {}, type: 'n' | 's' = 's') => ({
  v: value,
  t: typeof value === 'number' ? 'n' : type,
  s: style
});

/**
 * Genera el Blob del Excel para una prueba individual
 */
export const generateExcelBlob = (test: ResistanceTest): Blob => {
  const wb = XLSX.utils.book_new();
  const ws_data: any[][] = Array.from({ length: 40 }, () => Array(11).fill(null));

  const addStyledNulls = (r: number, cStart: number, cEnd: number, style: any) => {
    for (let c = cStart; c <= cEnd; c++) {
      if (!ws_data[r][c]) ws_data[r][c] = createCell(null, style);
    }
  };

  // Cabecera
  addStyledNulls(0, 1, 9, styles.headerBlue);
  ws_data[0][1] = createCell('AQUAGOLD', styles.headerBlue);
  ws_data[0][3] = createCell('MANUAL DE CALIDAD', styles.headerBlue);

  addStyledNulls(1, 1, 2, styles.headerBlue);
  addStyledNulls(1, 3, 7, styles.headerWhite);
  addStyledNulls(1, 8, 9, styles.headerWhite);
  ws_data[1][1] = createCell('KM 16.5 DURÁN – TAMBO\nLOTE DE TERRENO 002\nSECTOR DENOMINADO YAMILE', styles.headerBlue);
  ws_data[1][3] = createCell('CÓDIGO: FQC-LFQ-PDR-004', styles.headerWhite);
  ws_data[1][8] = createCell('VERSIÓN: 02', styles.headerWhite);

  addStyledNulls(2, 3, 7, styles.headerBlue);
  addStyledNulls(2, 8, 9, styles.headerBlue);
  ws_data[2][3] = createCell('FECHA: 28/05/2025', styles.headerBlue);
  ws_data[2][8] = createCell('Página 1 de 1', styles.headerBlue);

  addStyledNulls(3, 1, 2, styles.headerWhite);
  addStyledNulls(3, 3, 9, styles.headerWhiteNoBottom);
  ws_data[3][1] = createCell('FORMATO', styles.headerWhite);
  ws_data[3][3] = createCell('NOMBRE DEL DOCUMENTO', styles.headerWhiteNoBottom);

  addStyledNulls(4, 1, 2, styles.headerWhite);
  addStyledNulls(4, 3, 9, styles.headerWhiteNoTop);
  ws_data[4][3] = createCell('PRUEBA DE RESISTENCIA', styles.headerWhiteNoTop);

  // Contenido
  const contentStartRow = 6;
  const contentStartCol = 4;
  const mainInfo = [
    ['FECHA:', format(parseISO(test.date), 'MM/dd/yyyy')],
    ['LOTE:', test.lotNumber],
    ['CERTIFICACION:', test.certificationType],
    ['PROVEEDOR:', test.provider],
    ['PISCINA:', test.pool],
    ['RESIDUAL SO2 MW:', test.so2Residuals],
    ['RESIDUAL SO2 BF:', test.so2Bf]
  ];

  mainInfo.forEach((row, i) => {
    ws_data[contentStartRow + i][contentStartCol] = createCell(row[0], styles.labelBlueWithValue);
    ws_data[contentStartRow + i][contentStartCol + 1] = createCell(row[1], styles.value);
    addStyledNulls(contentStartRow + i, contentStartCol + 1, contentStartCol + 2, styles.value);
  });

  const tableHeaderRow = contentStartRow + mainInfo.length + 1;
  ws_data[tableHeaderRow][contentStartCol] = createCell('HORA', styles.labelBlueWithValue);
  ws_data[tableHeaderRow][contentStartCol + 1] = createCell('UNIDADES CRUDO', styles.labelBlueWithValue);
  ws_data[tableHeaderRow][contentStartCol + 2] = createCell('UNIDADES COCIDO', styles.labelBlueWithValue);

  // Use last-sample values for totals (not sum)
  let lastRaw = 0, lastCooked = 0;
  test.samples.forEach((sample, i) => {
    const slotDate = addHours(
      new Date(`${format(parseISO(test.date), 'yyyy-MM-dd')}T${test.startTime}`),
      sample.timeSlot
    );
    ws_data[tableHeaderRow + 1 + i][contentStartCol] = createCell(format(slotDate, 'HH:mm'), styles.value);
    ws_data[tableHeaderRow + 1 + i][contentStartCol + 1] = createCell(sample.rawUnits ?? '', styles.value, sample.rawUnits !== undefined ? 'n' : 's');
    ws_data[tableHeaderRow + 1 + i][contentStartCol + 2] = createCell(sample.cookedUnits ?? '', styles.value, sample.cookedUnits !== undefined ? 'n' : 's');
    if (typeof sample.rawUnits === 'number') lastRaw = sample.rawUnits;
    if (typeof sample.cookedUnits === 'number') lastCooked = sample.cookedUnits;
  });

  const totalRow = tableHeaderRow + 1 + test.samples.length;
  ws_data[totalRow][contentStartCol] = createCell('TOTAL UNIDADES', styles.labelBlueWithValue);
  ws_data[totalRow][contentStartCol + 1] = createCell(lastRaw, styles.value, 'n');
  ws_data[totalRow][contentStartCol + 2] = createCell(lastCooked, styles.value, 'n');

  const obsRow = totalRow + 1;
  ws_data[obsRow][contentStartCol] = createCell('OBSERVACIONES', styles.labelBlueWithValue);
  ws_data[obsRow][contentStartCol + 1] = createCell(test.observations || '', styles.valueLeft);
  addStyledNulls(obsRow, contentStartCol + 1, contentStartCol + 2, styles.valueLeft);

  // Footer
  const methodologyRow = obsRow + 2;
  const methodologyText = "METODOLOGÍA: LA PRUEBA DE RESISTENCIA CONSISTE EN COLOCAR 20 CAMARONES CRUDOS Y 20 COCIDOS EN UN CHAROL DURANTE 12 HORAS A TEMPERATURA AMBIENTE, MONITOREANDO CADA DOS HORAS SI HAY PIEZAS CON PRESENCIA DE MELANOSIS. DE SER ASÍ, SE REGISTRA EN LA CASILLA CORRESPONDIENTE (CRUDO O COCIDO).";
  ws_data[methodologyRow][1] = createCell(methodologyText, styles.methodology);
  addStyledNulls(methodologyRow, 1, 9, styles.methodology);

  const signatureRow = methodologyRow + 3;
  ws_data[signatureRow][1] = createCell(test.responsable || '', styles.signatureName);
  addStyledNulls(signatureRow, 1, 3, styles.signatureName);
  ws_data[signatureRow + 1][1] = createCell("RESPONSABLE QC:", styles.signatureTitle);
  addStyledNulls(signatureRow + 1, 1, 3, styles.signatureTitle);

  ws_data[signatureRow][7] = createCell("MARITZA REYES", styles.signatureName);
  addStyledNulls(signatureRow, 7, 9, styles.signatureName);
  ws_data[signatureRow + 1][7] = createCell("VERIFICADO POR:", styles.signatureTitle);
  addStyledNulls(signatureRow + 1, 7, 9, styles.signatureTitle);
  ws_data[signatureRow + 2][7] = createCell("COORDINADOR DE LABORATORIO", styles.signatureTitle);
  addStyledNulls(signatureRow + 2, 7, 9, styles.signatureTitle);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  ws['!merges'] = [
    { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } },
    { s: { r: 0, c: 3 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 1 }, e: { r: 2, c: 2 } },
    { s: { r: 1, c: 3 }, e: { r: 1, c: 7 } },
    { s: { r: 1, c: 8 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 7 } },
    { s: { r: 2, c: 8 }, e: { r: 2, c: 9 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 3, c: 9 } },
    { s: { r: 4, c: 3 }, e: { r: 4, c: 9 } },
    ...mainInfo.map((_, i) => ({
      s: { r: contentStartRow + i, c: contentStartCol + 1 },
      e: { r: contentStartRow + i, c: contentStartCol + 2 }
    })),
    { s: { r: obsRow, c: contentStartCol + 1 }, e: { r: obsRow, c: contentStartCol + 2 } },
    { s: { r: methodologyRow, c: 1 }, e: { r: methodologyRow, c: 9 } },
    { s: { r: signatureRow, c: 1 }, e: { r: signatureRow, c: 3 } },
    { s: { r: signatureRow + 1, c: 1 }, e: { r: signatureRow + 1, c: 3 } },
    { s: { r: signatureRow, c: 7 }, e: { r: signatureRow, c: 9 } },
    { s: { r: signatureRow + 1, c: 7 }, e: { r: signatureRow + 1, c: 9 } },
    { s: { r: signatureRow + 2, c: 7 }, e: { r: signatureRow + 2, c: 9 } },
  ];

  ws['!cols'] = [
    { wch: 2 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];

  ws['!rows'] = Array.from({ length: signatureRow + 5 }).map(() => ({ hpt: 15 }));
  ws['!rows'][1] = { hpt: 45 };
  ws['!rows'][3] = { hpt: 24 };
  ws['!rows'][4] = { hpt: 24 };
  ws['!rows'][obsRow] = { hpt: 22.5 };
  ws['!rows'][methodologyRow] = { hpt: 45 };

  XLSX.utils.book_append_sheet(wb, ws, 'Prueba de Resistencia');
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Exporta una prueba individual y descarga el archivo
 */
export const exportToExcel = (test: ResistanceTest) => {
  const wb = XLSX.utils.book_new();
  const blob = generateExcelBlob(test);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${test.lotNumber}_reporte.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Genera reporte diario de todas las pruebas del día
 */
export const generateDailyReportBlob = (dailyReport: DailyReport): Blob => {
  const wb = XLSX.utils.book_new();
  const ws_data: any[][] = [];
  
  // Título del reporte
  ws_data.push([createCell(`REPORTE DIARIO - ${format(parseISO(dailyReport.date), 'dd/MM/yyyy')}`, {
    font: { bold: true, sz: 14, color: { rgb: "FFFFFFFF" } },
    fill: { fgColor: { rgb: "FF002060" } },
    alignment: { horizontal: 'center', vertical: 'center' }
  })]);
  
  ws_data.push([createCell(`Total de Pruebas: ${dailyReport.totalTests} | Completadas: ${dailyReport.completedTests}`, {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: 'center' }
  })]);
  
  ws_data.push([]); // Fila vacía
  
  // Encabezados
  const headers = [
    'Lote', 'Proveedor', 'Piscina', 'Certificación',
    'Hora Inicio', 'SO2 MW', 'SO2 BF', 'Hora Muestra',
    'Crudo', 'Cocido', 'Estado', 'Responsable'
  ];
  ws_data.push(headers.map(h => createCell(h, styles.consolidatedHeader)));
  
  // Datos de cada prueba
  dailyReport.tests.forEach(test => {
    test.samples.forEach((sample, idx) => {
      const slotDate = addHours(
        new Date(`${format(parseISO(test.date), 'yyyy-MM-dd')}T${test.startTime}`),
        sample.timeSlot
      );
      
      const row = [
        test.lotNumber,
        test.provider,
        test.pool,
        test.certificationType,
        test.startTime,
        test.so2Residuals,
        test.so2Bf,
        format(slotDate, 'HH:mm'),
        sample.rawUnits ?? '',
        sample.cookedUnits ?? '',
        test.isCompleted ? 'Completada' : 'En Progreso',
        test.responsable
      ];
      ws_data.push(row.map(v => createCell(v, styles.value)));
    });
  });
  
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  
  // Merge del título
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }
  ];
  
  ws['!cols'] = [
    { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte Diario');
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Exporta y descarga el reporte diario
 */
export const exportDailyReport = (dailyReport: DailyReport) => {
  const blob = generateDailyReportBlob(dailyReport);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Diario_${dailyReport.date}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}