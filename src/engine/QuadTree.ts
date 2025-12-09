
export interface QuadTreeNode {
    level: number;
    nw: QuadTreeNode | null;
    ne: QuadTreeNode | null;
    sw: QuadTreeNode | null;
    se: QuadTreeNode | null;
    population: number;
    id: number; // Unique Integer ID
}

// Canonical storage: Map<StructuralKey, QuadTreeNode>
const nodeCache = new Map<string, QuadTreeNode>();

// Zero node cache (Level -> Node)
const emptyNodeCache = new Map<number, QuadTreeNode>();

// Global ID counter
let nextId = 1;

/**
 * Creates a unique structural key for cache lookup.
 * Key: Children ID combination.
 * Since IDs are integers, string length is manageable (e.g. "12:45:99:10").
 */
function makeKey(nw: QuadTreeNode | null, ne: QuadTreeNode | null, sw: QuadTreeNode | null, se: QuadTreeNode | null): string {
    if (!nw || !ne || !sw || !se) return 'leaf';
    return `${nw.id}:${ne.id}:${sw.id}:${se.id}`;
}

export class QuadTree {
    static create(level: number, nw: QuadTreeNode, ne: QuadTreeNode, sw: QuadTreeNode, se: QuadTreeNode): QuadTreeNode {
        if (nw.level !== level - 1) throw new Error("Child level mismatch");

        const key = makeKey(nw, ne, sw, se);

        if (nodeCache.has(key)) {
            return nodeCache.get(key)!;
        }

        const node: QuadTreeNode = {
            level,
            nw, ne, sw, se,
            population: nw.population + ne.population + sw.population + se.population,
            id: nextId++
        };

        nodeCache.set(key, node);
        return node;
    }

    static createLeaf(alive: boolean): QuadTreeNode {
        const key = alive ? 'alive' : 'dead';
        if (nodeCache.has(key)) return nodeCache.get(key)!;

        const node: QuadTreeNode = {
            level: 0,
            nw: null, ne: null, sw: null, se: null,
            population: alive ? 1 : 0,
            id: nextId++
        };
        nodeCache.set(key, node);
        return node;
    }

    static empty(level: number): QuadTreeNode {
        if (level === 0) return QuadTree.createLeaf(false);
        if (emptyNodeCache.has(level)) return emptyNodeCache.get(level)!;

        const child = QuadTree.empty(level - 1);
        const node = QuadTree.create(level, child, child, child, child);

        emptyNodeCache.set(level, node);
        return node;
    }

    static getCell(node: QuadTreeNode, x: number, y: number): boolean {
        if (node.level === 0) {
            return node.population > 0;
        }

        const size = 1 << node.level;
        const half = size >> 1;

        if (x < 0 || x >= size || y < 0 || y >= size) return false;

        if (x < half) {
            if (y < half) return QuadTree.getCell(node.nw!, x, y);
            else return QuadTree.getCell(node.sw!, x, y - half);
        } else {
            if (y < half) return QuadTree.getCell(node.ne!, x - half, y);
            else return QuadTree.getCell(node.se!, x - half, y - half);
        }
    }

    static setCell(node: QuadTreeNode, x: number, y: number, alive: boolean): QuadTreeNode {
        if (node.level === 0) return QuadTree.createLeaf(alive);

        const size = 1 << node.level;
        const half = size >> 1;

        if (x < 0 || x >= size || y < 0 || y >= size) throw new Error("Coordinates out of bounds");

        let nw = node.nw!, ne = node.ne!, sw = node.sw!, se = node.se!;

        if (x < half) {
            if (y < half) nw = QuadTree.setCell(nw, x, y, alive);
            else sw = QuadTree.setCell(sw, x, y - half, alive);
        } else {
            if (y < half) ne = QuadTree.setCell(ne, x - half, y, alive);
            else se = QuadTree.setCell(se, x - half, y - half, alive);
        }

        if (nw.id === node.nw!.id && ne.id === node.ne!.id && sw.id === node.sw!.id && se.id === node.se!.id) {
            return node;
        }

        return QuadTree.create(node.level, nw, ne, sw, se);
    }

    static centeredHorizontal(w: QuadTreeNode, e: QuadTreeNode): QuadTreeNode {
        return QuadTree.create(w.level, w.ne!, e.nw!, w.se!, e.sw!);
    }

    static centeredVertical(n: QuadTreeNode, s: QuadTreeNode): QuadTreeNode {
        return QuadTree.create(n.level, n.sw!, n.se!, s.nw!, s.ne!);
    }

    static centeredSubnode(nw: QuadTreeNode, ne: QuadTreeNode, sw: QuadTreeNode, se: QuadTreeNode): QuadTreeNode {
        return QuadTree.create(nw.level, nw.se!, ne.sw!, sw.ne!, se.nw!);
    }

    static expand(node: QuadTreeNode): QuadTreeNode {
        const empty = QuadTree.empty(node.level - 1);
        const nw = QuadTree.create(node.level, empty, empty, empty, node.nw!);
        const ne = QuadTree.create(node.level, empty, empty, node.ne!, empty);
        const sw = QuadTree.create(node.level, empty, node.sw!, empty, empty);
        const se = QuadTree.create(node.level, node.se!, empty, empty, empty);
        return QuadTree.create(node.level + 1, nw, ne, sw, se);
    }

    static collectGarbage(roots: QuadTreeNode[]) {
        const oldCacheSize = nodeCache.size;
        const newCache = new Map<string, QuadTreeNode>();
        const visited = new Set<number>(); // Track by integer ID

        const visit = (node: QuadTreeNode | null) => {
            if (!node) return;
            if (visited.has(node.id)) return;

            visited.add(node.id);

            // Reconstruct key for Map
            let key = '';
            if (node.level === 0) {
                key = node.population ? 'alive' : 'dead';
            } else {
                key = makeKey(node.nw, node.ne, node.sw, node.se);
            }

            newCache.set(key, node);

            if (node.level > 0) {
                visit(node.nw);
                visit(node.ne);
                visit(node.sw);
                visit(node.se);
            }
        };

        roots.forEach(visit);
        for (const [_, node] of emptyNodeCache) visit(node);

        nodeCache.clear();
        for (const [key, node] of newCache) {
            nodeCache.set(key, node);
        }

        console.log(`GC: Pruned ${oldCacheSize - newCache.size} nodes. Remaining: ${newCache.size}`);
    }
}
