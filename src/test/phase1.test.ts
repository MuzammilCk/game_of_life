import { describe, it, expect, beforeEach } from 'vitest';
import { QuadTree } from '../engine/QuadTree';
import { Hashlife } from '../engine/Hashlife';
import { parseRLE } from '../utils/rle';

describe('RLE Utilities', () => {
    it('parses a Glider correctly', () => {
        // bob$2bo$3o!
        // . O .
        // . . O
        // O O O
        const rle = "bob$2bo$3o!";
        const coords = parseRLE(rle);
        // bob -> x=1 is O (row 0)
        // $
        // 2bo -> x=2 is O (row 1)
        // $
        // 3o -> x=0,1,2 are O (row 2)

        expect(coords).toHaveLength(5);
        expect(coords).toContainEqual([1, 0]);
        expect(coords).toContainEqual([2, 1]);
        expect(coords).toContainEqual([0, 2]);
        expect(coords).toContainEqual([1, 2]);
        expect(coords).toContainEqual([2, 2]);
    });
});

describe('QuadTree', () => {
    it('creates canonical nodes (Flyweight pattern)', () => {
        const node1 = QuadTree.createLeaf(true);
        const node2 = QuadTree.createLeaf(true);
        expect(node1).toBe(node2);

        const empty1 = QuadTree.empty(3);
        const empty2 = QuadTree.empty(3);
        expect(empty1).toBe(empty2);
    });

    it('sets cells correctly', () => {
        let root = QuadTree.empty(2); // 4x4
        root = QuadTree.setCell(root, 0, 0, true);
        expect(QuadTree.getCell(root, 0, 0)).toBe(true);
        expect(QuadTree.getCell(root, 3, 3)).toBe(false);
    });
});

describe('Hashlife Engine', () => {
    let engine: Hashlife;

    beforeEach(() => {
        engine = new Hashlife();
    });

    it('preserves still life (Block)', () => {
        // 2x2 block
        let root = QuadTree.empty(4); // 16x16
        root = QuadTree.setCell(root, 7, 7, true);
        root = QuadTree.setCell(root, 8, 7, true);
        root = QuadTree.setCell(root, 7, 8, true);
        root = QuadTree.setCell(root, 8, 8, true);

        // Step
        const next = engine.step(root);
        // Should remain same center
        // Note: step() returns a node of level k-1.

        // We need to verify the CENTER of the result matches the center of the original.
        // Original: Level 4. Center is at (8,8) in local coords relative to top-left?
        // Hashlife step returns the inner 8x8 area of the 16x16.
        // The block is at 7,7..8,8.
        // Inner 8x8 covers indices 4..11.
        // So in result, the block should be at 3,3..4,4 relative to result top-left.
        // (7-4 = 3).

        expect(QuadTree.getCell(next, 3, 3)).toBe(true);
        expect(QuadTree.getCell(next, 4, 3)).toBe(true);
        expect(QuadTree.getCell(next, 3, 4)).toBe(true);
        expect(QuadTree.getCell(next, 4, 4)).toBe(true);
    });

    it('evolves a Blinker (Oscillator)', () => {
        // Row blinker at center
        let root = QuadTree.empty(4); // 16x16
        // Center 8,8.
        // Vertical line: 8,7; 8,8; 8,9
        root = QuadTree.setCell(root, 8, 7, true);
        root = QuadTree.setCell(root, 8, 8, true);
        root = QuadTree.setCell(root, 8, 9, true);

        // Exp 1 gen -> Horizontal line
        // Hashlife step advances by 2^(k-2) = 2^(4-2) = 2^2 = 4 generations.
        // Blinker period 2. After 4 gens, it should be SAME.

        const next = engine.step(root); // Gens +4

        // Should be vertical again.
        // Offsets: (8-4=4), (7-4=3) -> (4,3), (4,4), (4,5)
        expect(QuadTree.getCell(next, 4, 3)).toBe(true);
        expect(QuadTree.getCell(next, 4, 4)).toBe(true);
        expect(QuadTree.getCell(next, 4, 5)).toBe(true);
    });

    it('benchmarks performance', () => {
        // Create large chaotic field
        let root = QuadTree.empty(10); // 1024x1024
        // Random sparse
        for (let i = 0; i < 200; i++) {
            const x = Math.floor((Math.sin(i) * 0.5 + 0.5) * 1000);
            const y = Math.floor((Math.cos(i) * 0.5 + 0.5) * 1000);
            try {
                root = QuadTree.setCell(root, x, y, true);
            } catch { }
        }

        const start = performance.now();
        // Step Level 10 -> returns Level 9, advances 2^(8) = 256 gens.
        const res = engine.step(root);
        const end = performance.now();

        console.log(`Hashlife Step (256 gens, 1024x1024): ${end - start}ms`);
        expect(res).toBeDefined();
        // Should be fast
        expect(end - start).toBeLessThan(5000);
    });
});
