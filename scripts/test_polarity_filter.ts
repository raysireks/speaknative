
// Verification script for Polarity Filtering Logic

function filterByPolarity(sourcePolarity: string | undefined, candidatePolarity: string | undefined): boolean {
    if (sourcePolarity && candidatePolarity && sourcePolarity !== candidatePolarity) {
        return false;
    }
    return true;
}

const tests = [
    {
        name: "Exact Match (POSITIVE)",
        source: { text: "I'm happy", logical_polarity: "POSITIVE" },
        candidate: { text: "Estoy feliz", logical_polarity: "POSITIVE" },
        expected: true
    },
    {
        name: "Antonym (POSITIVE vs NEGATIVE)",
        source: { text: "I'm happy", logical_polarity: "POSITIVE" },
        candidate: { text: "Estoy triste", logical_polarity: "NEGATIVE" },
        expected: false
    },
    {
        name: "Neutral Match (NEUTRAL vs NEUTRAL)",
        source: { text: "Where is the car?", logical_polarity: "NEUTRAL" },
        candidate: { text: "Dónde está el carro?", logical_polarity: "NEUTRAL" },
        expected: true
    },
    {
        name: "Missing Source Polarity (Permissive)",
        source: { text: "Something", logical_polarity: undefined },
        candidate: { text: "Algo", logical_polarity: "POSITIVE" },
        expected: true
    },
    {
        name: "Missing Candidate Polarity (Permissive)",
        source: { text: "I'm happy", logical_polarity: "POSITIVE" },
        candidate: { text: "Estoy feliz", logical_polarity: undefined },
        expected: true
    },
    {
        name: "Different but not opposite (POSITIVE vs NEUTRAL)",
        source: { text: "Yes", logical_polarity: "POSITIVE" },
        candidate: { text: "Maybe", logical_polarity: "NEUTRAL" },
        expected: false // Current strict logic will block this, which is fine for cache matching
    }
];

function runTests() {
    console.log("Running Polarity Filter Tests...\n");
    let passed = 0;
    for (const test of tests) {
        const result = filterByPolarity(test.source.logical_polarity as string | undefined, test.candidate.logical_polarity as string | undefined);
        const status = result === test.expected ? "✅ PASSED" : "❌ FAILED";
        if (result === test.expected) passed++;
        console.log(`${status} - ${test.name}`);
        if (result !== test.expected) {
            console.log(`  Source: ${test.source.logical_polarity} | Candidate: ${test.candidate.logical_polarity}`);
            console.log(`  Expected ${test.expected}, got ${result}`);
        }
    }
    console.log(`\nResults: ${passed}/${tests.length} tests passed.`);

    if (passed === tests.length) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runTests();
