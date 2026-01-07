import { describe, it, expect } from 'vitest';
import { shuffleArray } from './array';

describe('shuffleArray', () => {
    it('should return an array of the same length', () => {
        const input = [1, 2, 3, 4, 5];
        const result = shuffleArray(input);
        expect(result).toHaveLength(input.length);
    });

    it('should contain the same elements', () => {
        const input = [1, 2, 3, 4, 5];
        const result = shuffleArray(input);
        expect(result).toEqual(expect.arrayContaining(input));
    });

    it('should not mutate the original array', () => {
        const input = [1, 2, 3, 4, 5];
        const original = [...input];
        shuffleArray(input);
        expect(input).toEqual(original);
    });
});
