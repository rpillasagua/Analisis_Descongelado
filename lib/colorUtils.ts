/**
 * Ajusta el brillo de un color hexadecimal
 * @param color - Color en formato hexadecimal (#RRGGBB)
 * @param amount - Cantidad a ajustar (-255 a 255). Negativo oscurece, positivo aclara
 * @returns Color ajustado en formato hexadecimal
 */
export function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);

    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Convierte un color hex a RGB
 * @param hex - Color en formato hexadecimal
 * @returns Objeto con valores r, g, b
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
