
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

/**
 * Unified Scoring Logic
 * Normal phrases: Literal match is more important.
 * Slang phrases: Intent/Semantic (Distance) matters more.
 */
export function calculateUnifiedScore(
    queryLiteral: number[],
    queryIntent: number[],
    docLiteral: number[] | null,
    docIntent: number[] | null,
    fsDistance: number,
    isSlang: boolean
): number {
    const sLiteral = docLiteral ? cosineSimilarity(queryLiteral, docLiteral) : 0;
    const sIntent = docIntent ? cosineSimilarity(queryIntent, docIntent) : 0;

    // 1. Manual Math: Combine Literal and Intent based on slang context
    // Translation Bridge: Intent is the source language embedding, so it is the most reliable cross-language link.
    // Literal is only useful for intra-language (same locale) or very similar languages.
    const manualTruth = isSlang
        ? (sIntent * 0.8) + (sLiteral * 0.2)
        : (sIntent * 0.7) + (sLiteral * 0.3);

    // 2. Index Math: Trust the index distance (1 - similarity)
    const fsScore = 1 - fsDistance;

    // 3. Final Blend: Trust our manual calc (70%) over the index's snapshot (30%)
    const score = (manualTruth * 0.7) + (fsScore * 0.3);

    return parseFloat(score.toFixed(4));
}
