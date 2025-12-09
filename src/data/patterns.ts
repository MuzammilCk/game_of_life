export const PATTERNS = {
  // --- Basic & Still Life ---
  "Block": `
    x = 2, y = 2, rule = B3/S23
    2o$2o!
    `,
  "Beehive": `
    x = 4, y = 3, rule = B3/S23
    b2o$o2bo$b2o!
    `,
  "Loaf": `
    x = 4, y = 4, rule = B3/S23
    b2o$o2bo$bobo$2bo!
    `,
  "Boat": `
    x = 3, y = 3, rule = B3/S23
    2o$obo$b2o!
    `,
  "Tub": `
    x = 3, y = 3, rule = B3/S23
    bo$obo$bo!
    `,

  // --- Oscillators ---
  "Blinker": `
    x = 3, y = 1, rule = B3/S23
    3o!
    `,
  "Toad": `
    x = 4, y = 2, rule = B3/S23
    b3o$3o!
    `,
  "Beacon": `
    x = 4, y = 4, rule = B3/S23
    2o2b$2o2b$2b2o$2b2o!
    `,
  "Pulsar": `
    x = 13, y = 13, rule = B3/S23
    2b3o3b3o2b$13b$o4b5b4bo$o4b5b4bo$o4b5b4bo$2b3o3b3o2b$13b$2b3o3b3o2b$o4b5b
    4bo$o4b5b4bo$o4b5b4bo$13b$2b3o3b3o2b!
    `,
  "Pentadecathlon": `
    x = 10, y = 3, rule = B3/S23
    2bo4bo$2ob4ob2o$2bo4bo!
    `,
  "Figure Eight": `
    x = 6, y = 6, rule = B3/S23
    2o4b$2o4b$b2o3b$2bo3b$2bo3b$3b3o!
    `,

  // --- Spaceships ---
  "Glider": `
    x = 3, y = 3, rule = B3/S23
    bob$2bo$3o!
    `,
  "LWSS (Lightweight Spaceship)": `
    x = 5, y = 4, rule = B3/S23
    bo2bo$o4b$o3bo$4o!
    `,
  "MWSS (Middleweight Spaceship)": `
    x = 6, y = 5, rule = B3/S23
    3bo2b$bo3bo$o5b$o4bo$5o!
    `,
  "HWSS (Heavyweight Spaceship)": `
    x = 7, y = 5, rule = B3/S23
    3b2o2b$bo4bo$o5bo$o5bo$6o!
    `,
  "Copperhead": `
    x = 12, y = 10, rule = B3/S23
    4b2o3b2o$3b4o3b4o$4b2o3b2o$3bob2o3b2obo$$b3o6b3o$b3o6b3o$bo10bo$2b2o6b2o$
    4b2o4b2o!
    `,

  // --- Guns ---
  "Gosper Glider Gun": `
    x = 36, y = 9, rule = B3/S23
    24bo11b$22bobo11b$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o14b$2o8bo3bob2o4b
    obo11b$10bo5bo7bo11b$11bo3bo20b$12b2o!
    `,
  "Simkin Glider Gun": `
    x = 33, y = 21, rule = B3/S23
    2o$2o5$23b2o$22b2o$24bo13$20b2o4b2o$20b2o4b2o!
    `,

  // --- Methuselahs ---
  "R-pentomino": `
    x = 3, y = 3, rule = B3/S23
    b2o$2o$bo!
    `,
  "Diehard": `
    x = 8, y = 3, rule = B3/S23
    6b2o$2o6b$b3o!
    `,
  "Acorn": `
    x = 7, y = 3, rule = B3/S23
    bo5b$3bo3b$2o2b3o!
    `,

  // --- Complex / Infinite Growth ---
  "Spacefiller 1 (Max)": `
    x = 27, y = 27, rule = B3/S23
    11b2o11b$11b2o11b5$7b3o7b3o7b$6bo2bo7bo2bo6b$6b3o9b3o6b$6bo13bo6b$7bob2o5b
    2obo7b$4b3obob2o5b2obob3o4b$3bo4bobo7bobo4bo3b$2bo5bo2bo5bo2bo5bo2b$bo6b2o
    7b2o6bo$bo9bo5bo9bo$bo6b2o7b2o6bo$2bo5bo2bo5bo2bo5bo2b$3bo4bobo7bobo4bo3b$
    4b3obob2o5b2obob3o4b$7bob2o5b2obo7b$6bo13bo6b$6b3o9b3o6b$6bo2bo7bo2bo6b$7b
    3o7b3o7b5$11b2o11b$11b2o!
    `
};
