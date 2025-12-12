/**
 * Parses an RLE string into a list of [x, y] coordinates of alive cells.
 * RLE Format: b = dead, o = alive, $ = end of line, ! = end of file.
 * Numbers represent run lengths (e.g., 3o = ooo).
 */
export function parseRLE(rle: string): [number, number][] {
    const result: [number, number][] = [];

    // Remove headers / comments lines (lines starting with # or x =), allowing for indentation
    const cleanRle = rle.replace(/^\s*#.*$/gm, '')
        .replace(/^\s*x\s*=.*$/gm, '')
        .replace(/\s/g, ''); // Remove whitespace

    let x = 0;
    let y = 0;
    let count = 0;

    for (let i = 0; i < cleanRle.length; i++) {
        const char = cleanRle[i];

        // End of file
        if (char === '!') break;

        // Number (Run count)
        if (char >= '0' && char <= '9') {
            count = count * 10 + parseInt(char);
        } else {
            // If count was 0, it means 1
            const runLength = count === 0 ? 1 : count;
            count = 0; // Reset count

            if (char === 'b') {
                x += runLength;
            } else if (char === 'o') {
                for (let k = 0; k < runLength; k++) {
                    result.push([x++, y]);
                }
            } else if (char === '$') {
                x = 0;
                y += runLength;
            }
        }
    }

    return result;
}

/**
 * Normalizes pattern coordinates so the center of mass is roughly at (0,0) 
 * or purely shifts them to verify specific bounds.
 */
export function centerPattern(coords: [number, number][]): [number, number][] {
    if (coords.length === 0) return [];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of coords) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }

    const w = maxX - minX;
    const h = maxY - minY;
    const cx = Math.floor(minX + w / 2);
    const cy = Math.floor(minY + h / 2);

    return coords.map(([x, y]) => [x - cx, y - cy]);
}
