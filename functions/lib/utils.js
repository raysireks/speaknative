"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cosineSimilarity = exports.getVectorData = void 0;
// Helper: Extract numeric array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getVectorData(field) {
    if (!field)
        return null;
    if (Array.isArray(field))
        return field;
    if (typeof field.toArray === 'function')
        return field.toArray();
    if (field.values && Array.isArray(field.values))
        return field.values;
    return null;
}
exports.getVectorData = getVectorData;
// Helper: Cosine
function cosineSimilarity(a, b) {
    const dot = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return (magA && magB) ? dot / (magA * magB) : 0;
}
exports.cosineSimilarity = cosineSimilarity;
//# sourceMappingURL=utils.js.map