
import { QuadTree } from '../engine/QuadTree';
import { Hashlife } from '../engine/Hashlife';

try {
    const engine = new Hashlife();

    // Create a 8x8 universe (Level 3)
    let root = QuadTree.empty(3);

    // Set a cell (Level 3 -> Size 8)
    // Local coords (4,4) is center
    root = QuadTree.setCell(root, 4, 4, true);

    console.log("Initial Level:", root.level);
    console.log("Initial Population:", root.population);

    // Advance by 1 step
    // This triggers the stitching logic:
    // advance(L3, 1) -> decomposes to L2 -> recurse -> L2 step(L2) returns L1.
    // L2 result (from step) is L1.
    // Back in L3: we need to stitch L1 results (L1, L1, L1, L1) to form L2 results.
    // L1 results have children of Level 0.
    // The stitching uses r11.nw ...
    // r11 is Level 1. r11.nw is Level 0.
    // QuadTree.create(level=2, r11.nw (L0), ...)
    // Expects children of Level 1.
    // Expected: CRASH "Child level mismatch".

    const next = engine.advance(root, 1);

    console.log("Next Level:", next.level);
    console.log("Next Population:", next.population);
    console.log("SUCCESS: Did not crash.");
} catch (e: any) {
    console.log("FAIL: Crashed as expected.");
    console.log("Error:", e.message);
}
