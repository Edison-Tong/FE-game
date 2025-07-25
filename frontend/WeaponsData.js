export const weaponsData = {
  weapons: {
    sword: {
      label: "Sword",
      value: "sword",
      type: "melee",
      stats: { "hit%": 85, str: 2, def: 0, mgk: 0, res: 0, spd: 0, skl: 1, knl: 0, lck: 0, range: 1 },
    },
    axe: {
      label: "Axe",
      value: "axe",
      type: "melee",
      stats: { "hit%": 75, str: 3, def: 2, mgk: 0, res: 0, spd: 0, skl: 0, knl: 0, lck: 0, range: 1 },
    },
    dagger: {
      label: "Dagger",
      value: "dagger",
      type: "melee",
      stats: { "hit%": 90, str: 1, def: 0, mgk: 0, res: 0, spd: 1, skl: 0, knl: 0, lck: 0, range: 1 },
    },
    lance: {
      label: "Lance",
      value: "lance",
      type: "melee",
      stats: { "hit%": 80, str: 2, def: 1, mgk: 0, res: 1, spd: 0, skl: 0, knl: 0, lck: 0, range: 1 },
    },
    bow: {
      label: "Bow",
      value: "bow",
      type: "melee",

      stats: { "hit%": 85, str: 2, def: 0, mgk: 0, res: 0, spd: 0, skl: 0, knl: 1, lck: 0, range: 1 },
    },
    gauntlets: {
      label: "Gauntlets",
      value: "gauntlets",
      type: "melee",

      stats: { "hit%": 80, str: 2, def: 0, mgk: 0, res: 0, spd: 0, skl: 0, knl: 0, lck: 2, range: 1 },
    },
    fire: {
      label: "Fire",
      value: "fire",
      type: "magick",

      stats: { "hit%": 80, str: 0, def: 0, mgk: 4, res: 0, spd: 0, skl: 0, knl: 0, lck: 2, range: 1 },
    },
    water: {
      label: "Water",
      value: "water",
      type: "magick",
      stats: { "hit%": 85, str: 0, def: 0, mgk: 2, res: 0, spd: 0, skl: 1, knl: 0, lck: 2, range: 1 },
    },
    earth: {
      label: "Earth",
      value: "earth",
      type: "magick",
      stats: { "hit%": 75, str: 0, def: 2, mgk: 2, res: 1, spd: 0, skl: 0, knl: 0, lck: 0, range: 1 },
    },
    lightning: {
      label: "Lightning",
      value: "lightning",
      type: "magick",
      stats: { "hit%": 85, str: 0, def: 0, mgk: 2, res: 0, spd: 1, skl: 0, knl: 0, lck: 0, range: 1 },
    },
    grass: {
      label: "Grass",
      value: "grass",
      type: "magick",
      stats: { "hit%": 85, str: 0, def: 1, mgk: 0, res: 2, spd: 0, skl: 0, knl: 0, lck: 0, range: 1 },
    },
    aether: {
      label: "Aether",
      value: "aether",
      type: "magick",
      stats: { "hit%": 90, str: 0, def: 0, mgk: 1, res: 0, spd: 0, skl: 0, knl: 1, lck: 0, range: 1 },
    },
    wind: {
      label: "Wind",
      value: "wind",
      type: "magick",
      stats: { "hit%": 80, str: 0, def: 0, mgk: 2, res: 0, spd: 0, skl: 0, knl: 0, lck: 0, range: 1 },
    },
    light: {
      label: "Light",
      value: "light",
      type: "magick",
      stats: { "hit%": 90, str: 0, def: 0, mgk: 0, res: 2, spd: 0, skl: 0, knl: 0, lck: 0, range: 1 },
    },
    dark: {
      label: "Dark",
      value: "dark",
      type: "magick",
      stats: { "hit%": 75, str: 0, def: 1, mgk: 3, res: 1, spd: 0, skl: 0, knl: 0, lck: 0, range: 1 },
      // Wind magick grants +1 MOVE
    },
    grey: {
      label: "Gray",
      value: "gray",
      type: "magick",
      stats: { "hit%": 80, str: 0, def: 0, mgk: 1, res: 0, spd: 0, skl: 0, knl: 3, lck: 0, range: 1 },
    },
  },

  weaponAbilities: {
    sword: [
      {
        name: "Evasion",
        "hit%": 80,
        str: 1,
        lck: -2,
        range: 1,
        uses: 1,
        type: "Efficiency",
        effect: "1.3x Eva against certain units",
      },
      {
        name: "Sword Dance",
        "hit%": 75,
        str: 2,
        skl: 2,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Lowers accuracy to raise chance of evasion",
      },
      {
        name: "Tipper",
        "hit%": 80,
        str: -1,
        skl: 5,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Outranges the opponent",
      },
      {
        name: "Crescent Slash",
        "hit%": 80,
        str: -1,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "Swings the sword in a circle hitting all adjacent foes.",
      },
      {
        name: "Foul Play",
        "hit%": 80,
        str: 1,
        range: 1,
        uses: 1,
        type: "Obscuring",
        effect: "Kicks up a cloud of dirt, then attacks through the smoke. Enemy acc cut for counter attack",
      },
      {
        name: "Gouge",
        "hit%": 75,
        range: 1,
        uses: 1,
        type: "Blinding",
        effect: "Gouges the eyes, leaving the opponent blind for one turn.",
      },
      {
        name: "Shadow Blade",
        "hit%": 75,
        str: -1,
        range: 1,
        uses: 1,
        type: "Maiming",
        effect:
          "Ultimate evasive attack, if landed unit disappears, preventing counter attack, and unit moves back 1 space",
      },
    ],
    axe: [
      {
        name: "Breaker",
        "hit%": 70,
        str: 3,
        spd: -1,
        lck: -2,
        range: 1,
        uses: 1,
        type: "Efficiency",
        effect: "1.3x Pwr against certain units",
      },
      {
        name: "Tomahawk",
        "hit%": 70,
        range: 2,
        uses: 1,
        type: "Damage",
        effect: "Hurls a tomahawk axe from 2 spaces away",
      },
      {
        name: "Armor Cleaver",
        "hit%": 70,
        range: 1,
        uses: 1,
        type: "Piercing",
        effect: "Cleaves through opponents armor, negating enemy protection",
      },
      {
        name: "Rend",
        "hit%": 70,
        str: -1,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "Splits the earth in two, damaging three spaces in front vertically",
      },
      {
        name: "Dismember",
        "hit%": 75,
        str: 1,
        range: 1,
        uses: 1,
        type: "Maiming",
        effect: "Slices through limbs, preventing a counter attack",
      },
      {
        name: "Bludgeon",
        "hit%": 70,
        range: 1,
        uses: 1,
        type: "Injuring",
        effect: "Hobbles the limb of the opponent leaving the injured status effect (1 turn)",
      },
      {
        name: "Ragnarok",
        "hit%": 65,
        str: 6,
        def: -1,
        spd: -1,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Leaps into the air sacrificing control for a devastating blow",
      },
    ],
    dagger: [
      {
        name: "Acceleration",
        "hit%": 85,
        def: -1,
        lck: -2,
        range: 1,
        uses: 1,
        type: "Efficiency",
        effect: "1.3x Aglty against certain units",
      },
      {
        name: "Throwing Knives",
        "hit%": 80,
        str: -1,
        range: 2,
        uses: 1,
        type: "Damage",
        effect: "Throws a knife hitting an enemy from 2 spaces away",
      },
      {
        name: "Puncture",
        "hit%": 80,
        range: 1,
        uses: 1,
        type: "Piercing",
        effect: "Slips the dagger between armor plates, negating enemy protection",
      },
      {
        name: "Flurry",
        "hit%": 75,
        str: -1,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "Spins violently throwing knives in each direction, damaging enemies 2 spaces away (x pattern)",
      },
      {
        name: "Pin",
        "hit%": 85,
        range: 1,
        uses: 1,
        type: "Immobalizing",
        effect: "Pins enemy feet to the floor with a small dagger, rendering them immobilized for one turn",
      },
      {
        name: "Stagnate",
        "hit%": 85,
        range: 1,
        uses: 1,
        type: "Slowing",
        effect: "Stabs the enemy with a toxin, slowing their movement for a turn.",
      },
      {
        name: "Blitz",
        "hit%": 75,
        def: -1,
        range: 1,
        uses: 1,
        type: "Brave",
        effect: "Attatcks the enemy twice before the other can attack.",
      },
    ],
    lance: [
      {
        name: "Guard",
        "hit%": 75,
        str: 1,
        lck: -2,
        range: 1,
        uses: 1,
        type: "Efficiency",
        effect: "1.3x Prt against certain units",
      },
      {
        name: "Javelin",
        "hit%": 75,
        range: 2,
        uses: 1,
        type: "Damage",
        effect: "Throws a javelin through the air hitting an opponent from two spaces away.",
      },
      {
        name: "Spear Sweep",
        "hit%": 70,
        str: -1,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "Swings the tip of the spear in a wide arc hitting 3 enemies in front, pushing them back 1 space.",
      },
      {
        name: "Run Through",
        "hit%": 80,
        str: 1,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Impales and opponent moving them and the attacker back one space together.",
      },
      {
        name: "Shaft Check",
        "hit%": 80,
        str: -2,
        def: 6,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Attacks with the shaft of the lance, increasing defensive readiness",
      },
      {
        name: "Spell Spear",
        "hit%": 80,
        str: -2,
        res: 6,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Douses the lance in special oil then attacks, warding off mgk power.",
      },
      {
        name: "Gore",
        "hit%": 75,
        str: 1,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Uses lance to pull unit (2 spaces away) to adjacent space, then attacks. ",
      },
    ],
    bow: [
      {
        name: "Precision",
        "hit%": 85,
        str: 1,
        lck: -2,
        range: 2,
        uses: 1,
        type: "Efficiency",
        effect: "1.3x Acc against certain units.",
      },
      {
        name: "Snipe",
        "hit%": 80,
        str: 1,
        range: 3,
        uses: 1,
        type: "Damage",
        effect: "Snipes an enemy from 3 spaces away.",
      },
      {
        name: "Deadeye",
        "hit%": 100,
        str: -1,
        range: 2,
        uses: 1,
        type: "Damage",
        effect: "Shoots an arrown with incredible accuracy.",
      },
      {
        name: "Explosive Volley",
        "hit%": 75,
        range: 3, //hits adjacent enemies. Original range per Brandons sheet is 2-4
        uses: 1,
        type: "Meteor",
        effect: "Launches an arrow rigged with explosives. Does 1/3 damage to adjacent enemies.",
      },
      {
        name: "Hit and Run",
        "hit%": 80,
        str: -1,
        range: 2,
        uses: 1,
        type: "Damage",
        effect: "Attacks enemy unit and then moves back a space following the attack.",
      },
      {
        name: "Tome Breaker",
        "hit%": 80,
        str: -1,
        res: -1,
        range: 2,
        uses: 1,
        type: "Silencing",
        effect: "Shoots the tome out of a mages hand, silencing them for a turn",
      },
      {
        name: "Poison Arrow",
        "hit%": 75,
        str: 2,
        range: 2,
        uses: 1,
        type: "Poisoning",
        effect: "Coats the tip of the arrow with toxin before firing, leaving the enemy poisoned for 2 turns.",
      },
    ],
    gauntlets: [
      {
        name: "Exploitation",
        "hit%": 80,
        str: 2,
        range: 1,
        uses: 1,
        type: "Efficiency",
        effect: "1.3x Lck against certain units.",
      },
      {
        name: "Dual Finger Jab",
        "hit%": 75,
        str: 1,
        lck: 1,
        range: 1,
        uses: 1,
        type: "Obscuring",
        effect: "Pokes the enemy unit in the eyes, obscuring their vision",
      },
      {
        name: "Vault",
        "hit%": 75,
        lck: 2,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "Launches off two opponents to reach a third two spaces away, all three take damage (L-pattern)",
      },
      {
        name: "Disarm",
        "hit%": 75,
        def: 4,
        lck: 1,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Attacks the enemies weapon, disarming them.",
      },
      {
        name: "Tome Kick",
        "hit%": 75,
        res: 4,
        lck: 1,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Kicks the tome out of a mages hands.",
      },
      {
        name: "Skull Swing",
        "hit%": 80,
        str: 1,
        lck: 1,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Uses acrobatics to attack the head of the opponent and then land behind them. ",
      },
      {
        name: "Crit Fist",
        "hit%": 60,
        lck: 10,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "An incredibly lcky strike, if it lands. ",
      },
    ],
    fire: [
      {
        name: "Incinerate",
        "hit%": 70,
        def: -1,
        mgk: 7,
        res: -1,
        spd: -1,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Fire explodes toward the enemy, incinerating them",
      },
      {
        name: "Eruption",
        "hit%": 75,
        mgk: 2,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "Flames erupt in all directions damaging 4 enemies (t pattern)",
      },
      {
        name: "Scorch",
        "hit%": 80,
        mgk: 1,
        range: 2, //1-2
        uses: 1,
        type: "Burning",
        effect: "A less powerful blast of flame that leaves a burn for 2 turns",
      },
    ],
    water: [
      {
        name: "Dive",
        "hit%": 75,
        mgk: -1,
        range: 1,
        uses: 1,
        type: "Obscuring",
        effect: "Dives into water after attacking, reducing accuracy for the counter attack",
      },
      {
        name: "Torrent",
        "hit%": 80,
        mgk: -1,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "A torrent of water blasts 3 units, pushing them back if it hits (horizontal pattern)",
      },
      {
        name: "Ice Spear",
        "hit%": 80,
        mgk: 1,
        range: 2, //1-2
        uses: 1,
        type: "Freezing",
        effect: "The mage summons an ice spear that pierces the flesh, leaving the enemy frozen for 2 turns",
      },
    ],
    earth: [
      {
        name: "Aegis",
        "hit%": 70,
        def: 4,
        mgk: -1,
        res: 4,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "The earths crust covers the body while attacking, leaving them nearly impregnable",
      },
      {
        name: "Quake",
        "hit%": 75,
        def: 1,
        mgk: -1,
        res: 1,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "A quake rends the earth, damaging three units in front (vertical pattern)",
      },
      {
        name: "Crush",
        "hit%": 75,
        mgk: -1,
        range: 2, //1-2
        uses: 1,
        type: "Crushing",
        effect: "A boulder crushes the opponent's limb, causing damage for 2 turns",
      },
    ],
    lightning: [
      {
        name: "Static spd",
        "hit%": 70,
        range: 1,
        uses: 1,
        type: "Brave",
        effect: "The body is infused with electricity, the ally attacks twice before the enemy can",
      },
      {
        name: "Discharge",
        "hit%": 80,
        mgk: -1,
        range: 2,
        uses: 1,
        type: "Radial",
        effect: "Bolts of lighting explode outward, damaging 4 units 2 spaces away (x pattern)",
      },
      {
        name: "Thunder",
        "hit%": 80,
        spd: 1,
        range: 2, //1-2
        uses: 1,
        type: "Shocking",
        effect: "Thunder rains down on an enemy, shocking them for 2 turns",
      },
    ],
    grass: [
      {
        name: "Leech Life",
        "hit%": 80,
        range: 1,
        uses: 1,
        type: "Absorbtion",
        effect: "The enemy's life force is tapped into and absorbed",
      },
      {
        name: "Natures Grasp",
        "hit%": 80,
        mgk: -1,
        range: 2, //1-2
        uses: 1,
        type: "Radial",
        effect: "Vines grab the legs of three units in front (horizontal pattern) and pull them in 1 space if hit",
      },
      {
        name: "Pin Needle",
        "hit%": 85,
        range: 2, //1-2
        uses: 1,
        type: "Poisoning",
        effect: "Countless poison needles are hurled toward the enemy, damaging them for 2 turns",
      },
    ],
    aether: [
      {
        name: "Clarity",
        "hit%": 100,
        mgk: -2,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "All weather and obstacle dissipate, the enemy is seen perfectly",
      },
      {
        name: "Asteroid",
        "hit%": 80,
        range: 4, //2-4
        uses: 1,
        type: "Meteor",
        effect: "An asteroid crashes down from long range, doing 1/3 damage to adjacent enemies",
      },
      {
        name: "Gravity",
        "hit%": 85,
        range: 2, //1-2
        uses: 1,
        type: "Crushing",
        effect: "The crushing forces of gravity consume the enemy, damaging them for 2 turns",
      },
    ],
    wind: [
      {
        name: "Tornado",
        "hit%": 75,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "A raging vortex picks up an enemy and throws them down anywhere whithin 1-3 spaces if hit",
      },
      {
        name: "Gust",
        "hit%": 75,
        mgk: -1,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "A gust of wind pushes 3 units back (horizontal pattern) if hit",
      },
      {
        name: "Static",
        "hit%": 80,
        range: 2, //1-2
        uses: 1,
        type: "Shocking",
        effect: "Cold and warm winds combine to electrocute the enemy, shocking them for 2 turns",
      },
    ],
    light: [
      {
        name: "Aura",
        "hit%": 85,
        mgk: -1,
        res: 6,
        range: 1,
        uses: 1,
        type: "Damaging",
        effect: "A powerful aura covers the mage as they strike",
      },
      {
        name: "Ostracism",
        "hit%": 85,
        mgk: -2,
        range: 2,
        uses: 1,
        type: "Radial",
        effect: "2 nonbelievers are banished (y pattern) and pushed back 2 spaces if hit",
      },
      {
        name: "Pillar Of Light",
        "hit%": 80,
        mgk: 1,
        range: 2, //1-2
        uses: 1,
        type: "Burning",
        effect: "A light is summoned, so bright it burns the enemy for 2 turns",
      },
    ],
    dark: [
      {
        name: "Fluux",
        "hit%": 70,
        mgk: 7,
        spd: -1,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "Woe itself strangles the enemy",
      },
      {
        name: "Tentatio",
        "hit%": 70,
        range: 1,
        uses: 1,
        type: "Radial",
        effect: "Three enemies (horizontal pattern) are drawn in, almost willingly",
      },
      {
        name: "Lingua",
        "hit%": 75,
        range: 2, //1-2
        uses: 1,
        type: "Poisoning",
        effect: "The enemy is poisoned from the inside out by words alone, damaging them for 2 turn",
      },
    ],
    gray: [
      {
        name: "Gamble of the Gods",
        "hit%": 60,
        lck: 11,
        range: 1,
        uses: 1,
        type: "Damage",
        effect: "The gods of lck roll the dice",
      },
      {
        name: "Fortuna's Choice",
        "hit%": 75,
        mgk: -2,
        range: 4,
        uses: 1,
        type: "Radial",
        effect: "Any 3 units up to 4 spaces away are all eligible for misfortune",
      },
      {
        name: "Plight of the Pagan",
        "hit%": 80,
        mgk: -1,
        range: 2,
        uses: 1,
        type: "Poisoning",
        effect: "A curse to the monotheistic, damaging them for 2 turns",
      },
    ],
    default: [],
  },
};
