
// Helper: Extract numeric array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getVectorData(field: any): number[] | null {
    if (!field) return null;
    if (Array.isArray(field)) return field;
    if (typeof field.toArray === 'function') return field.toArray();
    if (field.values && Array.isArray(field.values)) return field.values;
    return null;
}

// Helper: Cosine
export function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return (magA && magB) ? dot / (magA * magB) : 0;
}
