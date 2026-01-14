// SELF-CONTAINED SCORING TEST (No Imports)

function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return (magA && magB) ? dot / (magA * magB) : 0;
}

function calculateUnifiedScore(
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
    const manualTruth = isSlang
        ? (sIntent * 0.8) + (sLiteral * 0.2)
        : (sIntent * 0.7) + (sLiteral * 0.3);

    // 2. Index Math: Trust the index distance (1 - similarity)
    const fsScore = 1 - fsDistance;

    // 3. Final Blend: Trust our manual calc (70%) over the index's snapshot (30%)
    const score = (manualTruth * 0.7) + (fsScore * 0.3);

    return parseFloat(score.toFixed(4));
}

// Helper to generate a dummy embedding with 768 dimensions
function mockEmbedding(seed: number, size: number = 768): number[] {
    const arr = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
        arr[i] = Math.sin(seed + i);
    }
    const mag = Math.sqrt(arr.reduce((sum, v) => sum + v * v, 0));
    return arr.map(v => v / mag);
}

function runScoreTests() {
    console.log("Starting Score Logic Validation...\n");

    const vecA = mockEmbedding(1);
    const vecB = mockEmbedding(1); // Exact Match
    const vecC = mockEmbedding(2); // Slightly different intent
    const vecD = mockEmbedding(50); // Very different (opposite/unrelated)

    console.log("--- SCENARIO 1: Identity Match (Same Language) ---");
    const score1 = calculateUnifiedScore(vecA, vecA, vecA, vecA, 0, false);
    console.log(`Identity Score (Expected ~1.0): ${score1}`);

    console.log("\n--- SCENARIO 2: Pure Translation Match (en -> es) ---");
    const sLit = cosineSimilarity(vecA, vecC);
    const sInt = cosineSimilarity(vecA, vecA);
    const score2 = calculateUnifiedScore(vecA, vecA, vecC, vecA, 0.05, false);
    console.log(`Translation Match (Expected > 0.8): ${score2}`);
    console.log(`  Literal Similarity: ${sLit.toFixed(4)}`);
    console.log(`  Intent Similarity : ${sInt.toFixed(4)}`);

    console.log("\n--- SCENARIO 3: Slang Match (en -> Medellín Slang) ---");
    const score3 = calculateUnifiedScore(vecA, vecA, vecD, vecA, 0.1, true);
    console.log(`Slang Match (Expected > 0.8): ${score3}`);

    console.log("\n--- SCENARIO 4: Bad Match (Near Miss) ---");
    const score4 = calculateUnifiedScore(vecA, vecA, vecD, vecD, 0.8, false);
    console.log(`Bad Match (Expected < 0.5): ${score4}`);

    console.log("\n--- SCENARIO 5: The 'Literal 0' check ---");
    const score5 = calculateUnifiedScore(vecA, vecA, null, vecA, 0.1, false);
    console.log(`Null Literal Score: ${score5}`);
}

runScoreTests();
