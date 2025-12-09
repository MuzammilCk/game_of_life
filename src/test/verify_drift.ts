import { QuadTree } from '../engine/QuadTree';
import { Hashlife } from '../engine/Hashlife';

console.log("Starting Spatial Drift Verification...");

const engine = new Hashlife();

// 1. Create a Block at (0,0). 
// Block is stable. Should stay at (0,0).
// (0,0) Block means cells at (0,0), (1,0), (0,1), (1,1).
// Wait, (0,0) is center.
// Let's use local coords to set up.
// Level 4 (Size 16). Center (8,8).
// Set cells at (8,8), (9,8), (8,9), (9,9).

let root = QuadTree.empty(4);
const size = 1 << root.level;
const half = size >> 1; // 8

console.log(`Created Root Level ${root.level}. Size ${size}. Mapping (0,0) to (${half}, ${half}).`);

root = QuadTree.setCell(root, half, half, true);     // 0,0
root = QuadTree.setCell(root, half + 1, half, true); // 1,0
root = QuadTree.setCell(root, half, half + 1, true); // 0,1
root = QuadTree.setCell(root, half + 1, half + 1, true); // 1,1

console.log("Initial Population:", root.population);
if (root.population !== 4) throw new Error("Setup failed");

// 2. Expand (to simulate App loop)
// K -> K+1
const expanded = QuadTree.expand(root);
console.log(`Expanded to Level ${expanded.level}. Size ${1 << expanded.level}.`);

// Verify center is preserved in Expanded node
// New Half = 16.
// Start Block should be at (16,16), (17,16), (16,17), (17,17).
if (!QuadTree.getCell(expanded, 16, 16)) throw new Error("Expansion Drifted!");

// 3. Advance (1 Step)
// Should return Level K (Original Level 4).
// Block should BE at (0,0) relative to NEW center.
// Center of Level 4 is (8,8).
console.log("Advancing by 1 step...");
const result = engine.advance(expanded, 1);

console.log(`Result Level: ${result.level}. Expected: 4.`);
if (result.level !== 4) throw new Error("Level mismatch after advance");

// 4. Check Position
// Expect Block at (8,8).
const isAtCenter = QuadTree.getCell(result, 8, 8);
console.log(`Is Block at center (8,8)? ${isAtCenter}`);

// Check Neighbors
console.log("Grid around center:");
for (let y = 6; y <= 10; y++) {
    let line = "";
    for (let x = 6; x <= 10; x++) {
        line += QuadTree.getCell(result, x, y) ? "# " : ". ";
    }
    console.log(`${y}: ${line}`);
}

if (!isAtCenter) {
    console.error("FAIL: Block DRIFTED!");
} else {
    console.log("SUCCESS: Block stayed put.");
}
