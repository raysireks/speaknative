/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import * as firebaseFunctionsTest from 'firebase-functions-test';
// Remove static import
// import { translateAndStore } from './index';

const testSdk = firebaseFunctionsTest();

// Mock Firestore Chain
const mockUpdate = jest.fn().mockResolvedValue({});
const mockAdd = jest.fn().mockResolvedValue({ id: 'new-doc-id', path: 'phrases/new-doc-id' });
const mockDocs: any[] = [];
const mockSnapshot = {
    empty: true,
    docs: mockDocs,
    forEach: (cb: any) => mockDocs.forEach(cb)
};
const mockGet = jest.fn().mockResolvedValue(mockSnapshot);

const mockFindNearest = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();

const mockCollection = jest.fn().mockReturnValue({
    where: mockWhere,
    limit: mockLimit,
    findNearest: mockFindNearest,
    get: mockGet,
    add: mockAdd,
    doc: jest.fn().mockReturnValue({ update: mockUpdate, set: jest.fn() })
});

// Use doMock to avoid hoisting issues while referencing above variables
jest.doMock('firebase-admin', () => {
    return {
        initializeApp: jest.fn(),
        firestore: Object.assign(
            jest.fn(() => ({
                collection: mockCollection
            })),
            {
                FieldValue: {
                    serverTimestamp: jest.fn().mockReturnValue('TIMESTAMP'),
                    increment: jest.fn((n) => `INCREMENT(${n})`),
                    vector: jest.fn((v) => v)
                }
            }
        )
    };
});

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockImplementation((opts) => {
                if (opts.model === 'text-embedding-004') {
                    return {
                        embedContent: jest.fn().mockResolvedValue({
                            embedding: { values: Array(768).fill(0.1) }
                        })
                    };
                }
                if (opts.model === 'gemini-2.5-flash-lite') {
                    return {
                        generateContent: jest.fn().mockResolvedValue({
                            response: {
                                text: () => JSON.stringify({ text: "Hola Mundo Test", is_slang: false })
                            }
                        })
                    };
                }
                return {};
            })
        }))
    };
});

describe('translateAndStore', () => {
    let wrapped: any;

    beforeAll(() => {
        // Dynamic import after mocks are set up
        const index = require('./index');
        wrapped = testSdk.wrap(index.translateAndStore);
    });

    afterAll(() => {
        testSdk.cleanup();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset default empty snapshot
        mockGet.mockResolvedValue({ empty: true, docs: [] });
    });

    it('should translate a new phrase (GenAI) if not found in db', async () => {
        const data = {
            text: "Hello World",
            userLocale: "en-US",
            targetLocale: "es-CO"
        };

        // Setup: exact match user returns empty (default)
        // Setup: vector match target returns empty (default)

        const result = await wrapped({ data }, { auth: { uid: 'test-user' } });

        expect(result.text).toBe("Hola Mundo Test");
        expect(result.source).toBe("generated");
        expect(mockAdd).toHaveBeenCalled(); // Should add new phrase
    });

    it('should return cached phrase if vector search finds a close match', async () => {
        const data = {
            text: "Hello World",
            userLocale: "en-US",
            targetLocale: "es-CO"
        };

        // Setup: user phrase match (irrelevant for result, but let's say it exists)
        // Setup: target vector match -> FOUND
        const mockFoundDoc = {
            id: 'existing-id',
            ref: { update: mockUpdate },
            data: () => ({
                concept_id: 'cid-123',
                text: 'Hola Mundo Cached',
                is_slang: false,
                usage_count: 5,
                locale: 'es-CO'
            })
        };

        // We need to simulate TWO get calls.
        // 1. User check (exact match)
        // 2. Target check (vector search)

        // mockGet is a mock function, we can schedule return values
        // 1. User check (exact match) -> FOUND (so we don't add user phrase)
        // 2. Target check (vector search) -> FOUND (so we don't add target phrase)
        mockGet
            .mockResolvedValueOnce({
                empty: false,
                docs: [{
                    data: () => ({ concept_id: 'cid-user' }),
                    ref: { update: mockUpdate }
                }]
            })
            .mockResolvedValueOnce({ empty: false, docs: [mockFoundDoc] });

        const result = await wrapped({ data }, { auth: { uid: 'test-user' } });

        expect(result.text).toBe("Hola Mundo Cached");
        expect(result.source).toBe("cache");
        expect(result.usage_count).toBe(6); // 5 + 1
        expect(mockUpdate).toHaveBeenCalledWith({ usage_count: 'INCREMENT(1)' });
        expect(mockAdd).not.toHaveBeenCalled(); // Should NOT generate new
    });
});
