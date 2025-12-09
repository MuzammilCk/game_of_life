

export interface QuadTreeNode {
    level: number;
    nw: QuadTreeNode | null;
    ne: QuadTreeNode | null;
    sw: QuadTreeNode | null;
    se: QuadTreeNode | null;
    population: number;
    id: string; // Unique hash/ID for this node configuration
}

// Canonical storage to ensure uniqueness (Flyweight pattern)
const nodeCache = new Map<string, QuadTreeNode>();

// Zero node cache for quick access to empty nodes at each level
const emptyNodeCache = new Map<number, QuadTreeNode>();

/**
 * Creates a unique ID for a node based on its children's IDs.
 * Use a simple fast hash combination.
 */
function hashNode(nw: QuadTreeNode | null, ne: QuadTreeNode | null, sw: QuadTreeNode | null, se: QuadTreeNode | null): string {
    if (!nw || !ne || !sw || !se) return 'empty-leaf'; // Should not happen for non-leaves
    return `${nw.id}:${ne.id}:${sw.id}:${se.id}`;
}

export class QuadTree {
    /**
     * Creates a canonical node.
     * If a node with the same children already exists, returns that instance.
     */
    static create(level: number, nw: QuadTreeNode, ne: QuadTreeNode, sw: QuadTreeNode, se: QuadTreeNode): QuadTreeNode {
        // Basic validation
        if (nw.level !== level - 1) throw new Error("Child level mismatch");

        const id = hashNode(nw, ne, sw, se);

        if (nodeCache.has(id)) {
            return nodeCache.get(id)!;
        }

        const node: QuadTreeNode = {
            level,
            nw, ne, sw, se,
            population: nw.population + ne.population + sw.population + se.population,
            id
        };

        nodeCache.set(id, node);
        return node;
    }

    /**
     * Creates a leaf node (Level 0).
     * In Hashlife, typically level 0 is a single cell (0 or 1).
     * But sometimes level 0 is a generic k x k block.
     * Standard Hashlife: Level 0 = 1 cell.
     */
    static createLeaf(alive: boolean): QuadTreeNode {
        const id = alive ? 'alive' : 'dead';
        if (nodeCache.has(id)) return nodeCache.get(id)!;

        const node: QuadTreeNode = {
            level: 0,
            nw: null, ne: null, sw: null, se: null,
            population: alive ? 1 : 0,
            id
        };
        nodeCache.set(id, node);
        return node;
    }

    /**
     * Returns an empty node of the specified level.
     */
    static empty(level: number): QuadTreeNode {
        if (level === 0) return QuadTree.createLeaf(false);

        if (emptyNodeCache.has(level)) return emptyNodeCache.get(level)!;

        const child = QuadTree.empty(level - 1);
        const node = QuadTree.create(level, child, child, child, child);

        emptyNodeCache.set(level, node);
        return node;
    }

    /**
     * Get the value of a cell at (x, y) relative to the node's top-left.
     * The node covers a 2^level x 2^level area.
     * We treat the node as centered at (0,0) usually in Hashlife for infinite expanding,
     * but for simple recursion it's easier if (0,0) is top-left of the current node.
     * 
     * Actually, pure Hashlife doesn't have coordinates.
     * But to interact with it, we need to address cells.
     * Let's assume (0,0) is the top-left of the node for `getCell`.
     */
    static getCell(node: QuadTreeNode, x: number, y: number): boolean {
        if (node.level === 0) {
            return node.population > 0;
        }

        const size = 1 << node.level; // length of side
        const half = size >> 1;

        // Determine quadrant
        // NW: 0..half-1, 0..half-1
        // NE: half..size-1, 0..half-1
        // SW: 0..half-1, half..size-1
        // SE: half..size-1, half..size-1

        if (x < 0 || x >= size || y < 0 || y >= size) return false; // Out of bounds of this node

        if (x < half) {
            if (y < half) return QuadTree.getCell(node.nw!, x, y);
            else return QuadTree.getCell(node.sw!, x, y - half);
        } else {
            if (y < half) return QuadTree.getCell(node.ne!, x - half, y);
            else return QuadTree.getCell(node.se!, x - half, y - half);
        }
    }

    /**
     * Sets a cell at (x, y). Returns a NEW canonical node (because immutability).
     * If the point is outside, we might need to expand the root, but this method just handles "within node".
     * Expansion is handled by the caller/wrapper.
     */
    static setCell(node: QuadTreeNode, x: number, y: number, alive: boolean): QuadTreeNode {
        if (node.level === 0) {
            return QuadTree.createLeaf(alive);
        }

        const size = 1 << node.level;
        const half = size >> 1;

        // If out of bounds, we can't set it in THIS node.
        // The caller must expand the universe (wrap in empty nodes) until it fits.
        // We throw or return same node if out of bounds?
        // Let's throw to indicate need for expansion.
        if (x < 0 || x >= size || y < 0 || y >= size) {
            throw new Error("Coordinates out of bounds");
        }

        let nw = node.nw!, ne = node.ne!, sw = node.sw!, se = node.se!;

        if (x < half) {
            if (y < half) nw = QuadTree.setCell(nw, x, y, alive);
            else sw = QuadTree.setCell(sw, x, y - half, alive);
        } else {
            if (y < half) ne = QuadTree.setCell(ne, x - half, y, alive);
            else se = QuadTree.setCell(se, x - half, y - half, alive);
        }

        // Optimization: if nothing changed (ids match), return original node
        if (nw === node.nw && ne === node.ne && sw === node.sw && se === node.se) {
            return node;
        }

        return QuadTree.create(node.level, nw, ne, sw, se);
    }

    /**
     * Constructs a node from the SE quadrant of NW, SW of NE, NE of SW, and NW of SE.
     * This effectively extracts the "center" 2^(k-1) block from a 2^k node's children.
     * But wait, a 2^k node has children of size 2^(k-1).
     * The "Center" of a 2^k node is a 2^(k-1) area?
     * No, the center of a 2^k node is the point (0,0).
     * 
     * In Hashlife, we often combine 9 nodes to step forward.
     * let's define `centeredHorizontal` and `centeredVertical`.
     */

    /**
     * Takes two side-by-side nodes (West, East) of same level,
     * returns a node of the same level representing the centered square between them.
     * Input: W, E (Level k)
     * Output: Node (Level k) composed of W.ne, E.nw, W.se, E.sw
     * Precondition: W and E must be same level >= 1
     */
    static centeredHorizontal(w: QuadTreeNode, e: QuadTreeNode): QuadTreeNode {
        return QuadTree.create(w.level, w.ne!, e.nw!, w.se!, e.sw!);
    }

    /**
     * Takes two stacked nodes (North, South) of same level,
     * returns a node of the same level representing the centered square between them.
     * Input: N, S (Level k)
     * Output: Node (Level k) composed of N.sw, N.se, S.nw, S.ne
     */
    static centeredVertical(n: QuadTreeNode, s: QuadTreeNode): QuadTreeNode {
        return QuadTree.create(n.level, n.sw!, n.se!, s.nw!, s.ne!);
    }

    /**
     * Takes a 2x2 grid of nodes (NW, NE, SW, SE) and extracts the center node.
     * Input: 4 nodes of level k.
     * Output: Node of level k composed of:
     *  NW.se, NE.sw
     *  SW.ne, SE.nw
     */
    static centeredSubnode(nw: QuadTreeNode, ne: QuadTreeNode, sw: QuadTreeNode, se: QuadTreeNode): QuadTreeNode {
        return QuadTree.create(nw.level, nw.se!, ne.sw!, sw.ne!, se.nw!);
    }

    /**
     * Expands the node to the next level by centering it continuously in a larger empty space.
     * Returns a node at level + 1.
     * The new center (via centeredSubnode) of the result will be the original node.
     */
    static expand(node: QuadTreeNode): QuadTreeNode {
        const empty = QuadTree.empty(node.level - 1);

        // We want the center of the new node to be `node`.
        // node = (nw, ne, sw, se)
        // New NW must end with node.nw. => (empty, empty, empty, node.nw)
        const nw = QuadTree.create(node.level, empty, empty, empty, node.nw!);
        const ne = QuadTree.create(node.level, empty, empty, node.ne!, empty);
        const sw = QuadTree.create(node.level, empty, node.sw!, empty, empty);
        const se = QuadTree.create(node.level, node.se!, empty, empty, empty);

        return QuadTree.create(node.level + 1, nw, ne, sw, se);
    }
}
