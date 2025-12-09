import { QuadTree } from '../engine/QuadTree';

console.log("Starting QuadTree Logic Test...");

let root = QuadTree.empty(4); // Size 16. [-8, 7]
console.log("Initial Level:", root.level, "Size:", 1 << root.level, "Pop:", root.population);

// Test Coordinate Mapping
const size = 1 << root.level;
const half = size >> 1;
console.log("Half size:", half);

// Test SetCell at (0,0) -> Local (8,8)
console.log("Setting cell at (0,0) [Local 8,8]...");
root = QuadTree.setCell(root, half, half, true);
console.log("New Population:", root.population);
if (root.population !== 1) console.error("FAIL: Population should be 1");

// Test Expansion
console.log("Testing Expansion logic...");
// Expand root
const expanded = QuadTree.expand(root);
console.log("Expanded Level:", expanded.level, "Size:", 1 << expanded.level);

// Verify (0,0) is still alive
// New Half = 16.
// Old (0,0) was at Center.
// In new node, Center is (16, 16).
// Let's check getCell(16, 16)
const isAlive = QuadTree.getCell(expanded, 16, 16);
console.log("Is (0,0) alive in expanded tree?", isAlive);

if (!isAlive) {
    console.error("FAIL: Expansion shifted the center incorrectly!");
    // Debug where it went
    // Check neighbors
    console.log("15,15:", QuadTree.getCell(expanded, 15, 15));
    console.log("16,15:", QuadTree.getCell(expanded, 16, 15));
    console.log("15,16:", QuadTree.getCell(expanded, 15, 16));
} else {
    console.log("SUCCESS: Center preserved.");
}

// Test Auto-Expand Logic from App.tsx
console.log("Testing App.tsx Expansion Logic...");
let testRoot = QuadTree.empty(4); // Size 16. Valid range [-8, 7]
const x = 10; // Out of bounds
const y = 10;

console.log(`Setting cell at (${x}, ${y}) - Should Auto-Expand`);

// Logic from App.tsx
for (let i = 0; i < 10; i++) {
    const s = 1 << testRoot.level;
    const h = s >> 1;
    console.log(`Level ${testRoot.level}: Range [${-h}, ${h - 1}]`);
    if (x >= -h && x < h && y >= -h && y < h) {
        break;
    }
    testRoot = QuadTree.expand(testRoot);
    console.log("Expanded to Level", testRoot.level);
}

const finalSize = 1 << testRoot.level;
const finalHalf = finalSize >> 1;
const localX = x + finalHalf;
const localY = y + finalHalf;

console.log(`Final Level: ${testRoot.level}, Half: ${finalHalf}. Setting setCell(${localX}, ${localY})`);

try {
    testRoot = QuadTree.setCell(testRoot, localX, localY, true);
    console.log("SUCCESS: Cell set. Population:", testRoot.population);
} catch (e) {
    console.error("FAIL: setCell threw error:", e);
}
