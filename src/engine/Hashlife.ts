import { QuadTree, type QuadTreeNode } from './QuadTree';

export class Hashlife {
    // Cache for memoization: ID -> Result Node
    // The key must imply the "Step" operation.
    // Since `step(node)` always advances by 2^(level-2) generations and returns center,
    // the result is deterministic based solely on the node ID.
    // So we can map node.id -> resultNode.
    private cache = new Map<string, QuadTreeNode>();

    constructor() { }

    /**
     * Clears the memoization cache.
     * Useful if rules change or memory is low.
     */
    clearCache() {
        this.cache.clear();
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

        // Recursive step
        const nw = node.nw!, ne = node.ne!, sw = node.sw!, se = node.se!;

        // We need to construct 9 sub-nodes of level k-1 from these 4.
        // 
        // Grid:
        // NW | NE
        // -------
        // SW | SE
        //
        // Sub-parts (overlapping):
        // n00: NW
        // n01: Centered Horizontal(NW, NE)
        // n02: NE
        // n10: Centered Vertical(NW, SW)
        // n11: Centered Subnode(NW, NE, SW, SE) -> Center of this node
        // n12: Centered Vertical(NE, SE)
        // n20: SW
        // n21: Centered Horizontal(SW, SE)
        // n22: SE
        //
        // Wait, standard algorithm constructs 9 k-1 nodes first?
        // Actually, we need 9 results of `step` on k-1 nodes to eventually form the result.
        //
        // Let's call them:
        // m1 = step(nw) -> returns k-2 sized node, advanced by 2^(k-3)
        // This is getting complicated. Let's look at the standard composition.
        //
        // Algorithm:
        // 1. Form 9 auxiliary nodes of size k-1:
        //    n00 = nw
        //    n01 = horizontal(nw, ne)
        //    n02 = ne
        //    n10 = vertical(nw, sw)
        //    n11 = center(nw, ne, sw, se)
        //    n12 = vertical(ne, se)
        //    n20 = sw
        //    n21 = horizontal(sw, se)
        //    n22 = se
        //
        // 2. Evolve these 9 nodes (RESULT is k-2 level, time advanced by 2^(k-3)).
        //    r00 = step(n00)
        //    r01 = step(n01)
        //    r02 = step(n02)
        //    ...
        //    r22 = step(n22)
        //
        // 3. Combine these results to form 4 nodes of level k-1:
        //    (This is the tricky part. Are we just stepping them once?)
        //    Standard hashlife "Step" does 2^(k-2) gens.
        //    The sub-steps do 2^(k-3) gens.
        //    So we have results advanced by HALF the target time.
        //    
        //    We combine them:
        //    A = create(r00, r01, r10, r11) -> Level k-1
        //    B = create(r01, r02, r11, r12)
        //    C = create(r10, r11, r20, r21)
        //    D = create(r11, r12, r21, r22)
        //    
        //    Now A, B, C, D are Level k-1.
        //    And they represent the state at T = +2^(k-3).
        //    
        //    We step them AGAIN:
        //    resA = step(A) -> Level k-2, advanced by another 2^(k-3). Total +2^(k-2).
        //    resB = step(B)
        //    resC = step(C)
        //    resD = step(D)
        //
        //    Finally, Result = create(resA, resB, resC, resD) -> Level k-1.
        //    This result is assembled from k-2 parts, so it is k-1.
        //    And it is advanced by 2^(k-3) + 2^(k-3) = 2^(k-2).
        //    Correct!

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
        const resA = this.step(A);
        const resB = this.step(B);
        const resC = this.step(C);
        const resD = this.step(D);

        // Combine result (at T + full_step)
        // resX are level k-2. Result is level k-1.
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
        // It's readable and robust.
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
                if (cells[y + dy][x + dx]) neighbors++;
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
