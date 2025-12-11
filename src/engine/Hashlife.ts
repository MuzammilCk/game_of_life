import { QuadTree, type QuadTreeNode } from './QuadTree';

export class Hashlife {
    // Cache for memoization: ID -> Result Node
    private cache = new Map<number, QuadTreeNode>();

    constructor() { }

    /**
     * Clears the memoization cache.
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Advanced Hashlife step: Evolve node by `steps` generations.
     * Allows for smooth animation (steps=1) instead of massive jumps.
     */
    advance(node: QuadTreeNode, steps: number): QuadTreeNode {
        if (steps === 0) return node;

        // Base case: Level 2 (4x4) -> Level 1 (2x2)
        if (node.level === 2) {
            return this.evolveLevel2(node);
        }

        const maxStep = 1n << BigInt(node.level - 2);
        if (BigInt(steps) === maxStep) {
            return this.step(node);
        }

        // Recursive Decomposition
        // We need to form 9 partial results (Level K-2) from overlapping inputs.
        // Input: Node (Level K). Children (Level K-1).

        const nw = node.nw!, ne = node.ne!, sw = node.sw!, se = node.se!;

        const n00 = nw;
        const n01 = QuadTree.centeredHorizontal(nw, ne);
        const n02 = ne;
        const n10 = QuadTree.centeredVertical(nw, sw);
        const n11 = QuadTree.centeredSubnode(nw, ne, sw, se);
        const n12 = QuadTree.centeredVertical(ne, se);
        const n20 = sw;
        const n21 = QuadTree.centeredHorizontal(sw, se);
        const n22 = se;

        // Recurse to get 9 Partial Results (Level K-2)
        const r00 = this.advance(n00, steps);
        const r01 = this.advance(n01, steps);
        const r02 = this.advance(n02, steps);
        const r10 = this.advance(n10, steps);
        const r11 = this.advance(n11, steps);
        const r12 = this.advance(n12, steps);
        const r20 = this.advance(n20, steps);
        const r21 = this.advance(n21, steps);
        const r22 = this.advance(n22, steps);

        // Reassemble Result (Level K-1)
        // We construct 4 children (Level K-2).
        // Each child is formed by stitching the INNER CORNERS of the partial results.
        // This guarantees continuous coverage without gaps.

        // Output Children (Level K-2)
        // This requires QuadTree.create to accept (Level K-3) nodes!
        // rXX are Level K-2. They have children.
        // So we are peeling back one layer of the K-2 results to stitch them.

        return QuadTree.create(
            node.level - 1,
            // NW Child (Level K-2)
            QuadTree.create(node.level - 2, r00.se!, r01.sw!, r10.ne!, r11.nw!),
            // NE Child
            QuadTree.create(node.level - 2, r01.se!, r02.sw!, r11.ne!, r12.nw!),
            // SW Child
            QuadTree.create(node.level - 2, r10.se!, r11.sw!, r20.ne!, r21.nw!),
            // SE Child
            QuadTree.create(node.level - 2, r11.se!, r12.sw!, r21.ne!, r22.nw!)
        );
    }

    /**
     * The core Hashlife function.
     * Takes a node at level k.
     * Returns a node at level k-1, centered, advanced by 2^(k-2) generations.
     */
    step(node: QuadTreeNode): QuadTreeNode {
        // Base case: Level 2 (4x4)
        if (node.level === 2) {
            return this.evolveLevel2(node);
        }

        if (this.cache.has(node.id)) {
            return this.cache.get(node.id)!;
        }

        const nw = node.nw!, ne = node.ne!, sw = node.sw!, se = node.se!;

        const n00 = nw;
        const n01 = QuadTree.centeredHorizontal(nw, ne);
        const n02 = ne;
        const n10 = QuadTree.centeredVertical(nw, sw);
        const n11 = QuadTree.centeredSubnode(nw, ne, sw, se);
        const n12 = QuadTree.centeredVertical(ne, se);
        const n20 = sw;
        const n21 = QuadTree.centeredHorizontal(sw, se);
        const n22 = se;

        // First round of steps (advances 2^(k-3))
        const r00 = this.step(n00);
        const r01 = this.step(n01);
        const r02 = this.step(n02);
        const r10 = this.step(n10);
        const r11 = this.step(n11);
        const r12 = this.step(n12);
        const r20 = this.step(n20);
        const r21 = this.step(n21);
        const r22 = this.step(n22);

        // Combine to form intermediate nodes (at T + half_step)
        // Note: rXX are level k-2. creating them makes level k-1.
        const A = QuadTree.create(node.level - 1, r00, r01, r10, r11);
        const B = QuadTree.create(node.level - 1, r01, r02, r11, r12);
        const C = QuadTree.create(node.level - 1, r10, r11, r20, r21);
        const D = QuadTree.create(node.level - 1, r11, r12, r21, r22);

        // Second round of steps (advances another 2^(k-3))
        // Standard Hashlife continues here.
        // My advance() logic stops before this for small steps, doing custom assembly instead.

        const resA = this.step(A);
        const resB = this.step(B);
        const resC = this.step(C);
        const resD = this.step(D);

        // Combine result (at T + full_step)
        const result = QuadTree.create(node.level - 1, resA, resB, resC, resD);

        // Cache
        this.cache.set(node.id, result);
        return result;
    }

    /**
     * Base case: Level 2 (4x4) -> Level 1 (2x2)
     * Advances by 1 generation.
     */
    private evolveLevel2(node: QuadTreeNode): QuadTreeNode {
        // Current state (4x4)
        // Let's just retrieve the 16 cells and run standard logic.
        const cells: boolean[][] = [];
        for (let y = 0; y < 4; y++) {
            cells[y] = [];
            for (let x = 0; x < 4; x++) {
                cells[y][x] = QuadTree.getCell(node, x, y);
            }
        }

        // Calculate next state for the INNER 2x2 (at offset 1,1)
        const nextCells: boolean[][] = [
            [false, false],
            [false, false]
        ];

        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 2; x++) {
                // corresponding cell in 4x4 is at (x+1, y+1)
                nextCells[y][x] = this.evolveCell(cells, x + 1, y + 1);
            }
        }

        // Construct the result node (Level 1)
        return QuadTree.create(
            1,
            QuadTree.createLeaf(nextCells[0][0]), // NW
            QuadTree.createLeaf(nextCells[0][1]), // NE
            QuadTree.createLeaf(nextCells[1][0]), // SW
            QuadTree.createLeaf(nextCells[1][1])  // SE
        );
    }

    private evolveCell(cells: boolean[][], x: number, y: number): boolean {
        const alive = cells[y][x];
        let neighbors = 0;

        // Count neighbors
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                // Safe access: treat out of bounds as dead
                const row = cells[y + dy];
                if (row && row[x + dx]) neighbors++;
            }
        }

        // Conway's Rules
        // B3/S23
        if (alive) {
            return neighbors === 2 || neighbors === 3;
        } else {
            return neighbors === 3;
        }
    }
}
