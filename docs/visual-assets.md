# Visual asset revision — 2026-11-02

The user's nine-species image is the visual reference for the fish. The implementation uses individual original generated sprites, preserving full tails, fins, and barbels. All project images are stored locally; aircraft reference photographs are design references and are not embedded or fetched at runtime.

## Fish assets

Generated using the built-in image generation tool with true alpha requested. Fish assets are packaged at 896 pixels wide as WebP quality 92 with full alpha quality, reducing transfer size while retaining detail above their display resolution. The aircraft atlas uses WebP quality 94. Runtime alpha-bound trimming removes empty space without changing the artwork. Cyan and magenta masks are cached once for brief local chromatic glitches.

| Asset in `src/assets/` | Species and distinctive form |
| --- | --- |
| `fish-goldfish.webp` | Orange gold rounded body, tall orange-blue dorsal fin, graceful split fan tail |
| `fish-koi.webp` | Long white fish, red and black patches, translucent flowing blue fins |
| `fish-tetra.webp` | Small blue fish, cyan lateral stripe and red lower lateral stripe |
| `fish-angelfish.webp` | Tall diamond body, white and black stripes, triangular fins, trailing ventral filaments |
| `fish-betta.webp` | Purple-blue body, broad cyan-violet fan tail and delicate ruffled fins |
| `fish-arowana.webp` | Long armored blue-silver body, large purple scales and upturned pink mouth |
| `fish-danio.webp` | Slender body, parallel horizontal cyan-blue stripes and red fin accents |
| `fish-catfish.webp` | Dark metallic blue body, broad head, long whisker barbels and narrow trailing fins |
| `fish-discus.webp` | Round disk body, orange face, cyan-magenta maze-pattern scales |

### Fish prompt set

Each species was generated separately with this production brief, substituting its name and the corresponding description above:

> Use case: stylized-concept. One isolated fish sprite for an interactive cyberpunk aquarium. Input image is a style and species reference. Strict side profile, head facing right, tail on left, body level. High fidelity realistic cinematic 3D CGI: convincing natural anatomy, individual reflective scales, glassy eyes, thin translucent fin rays, small metallic implants, a restrained cyan circular mechanical gill core and subtle magenta circuitry. Cool cyan top light and a soft magenta rim. Keep the species silhouette recognizable. Entire fish including every fin tip and whisker visible, generous transparent space at the edges, true alpha background. One fish only; no text, UI, bubbles, scenery, ground shadows, background rectangles, checkerboard, detached particles or large halo. Horizontal landscape image with relaxed, fully extended fins suitable for live mesh deformation.

## Aircraft atlas

`src/assets/aircraft-atlas.webp` is an original transparent 2 × 2 production atlas with a tilt-rotor shuttle, articulated ornithopter, disk cargo aircraft, and wedge cruiser. The runtime extracts each cell once; animated traffic does not draw the previous polygon stand-ins.

### Aircraft reference photographs

- [Archer: Midnight electric air taxi in flight, official photographs](https://www.investors.archer.com/news/news-details/2026/Archer-Completes-Historic-Electric-Air-Taxi-Flights-Over-San-Francisco-Bay/default.aspx) — cockpit, wing, rotor and fuselage proportions.
- [Festo: SmartBird, official project imagery](https://www.festo.com/us/en/e/about-festo/research-and-development/bionic-learning-network/bionic-flying-objects/smartbird-id_33686) — tapered wings, articulated roots, lightweight body and wing torsion.

These references inform the original futuristic designs; the cargo aircraft and cruiser are fictional.

### Aircraft prompt

> Use case: stylized-concept. One precisely aligned 2 × 2 transparent production sprite atlas for a realistic rainy cyberpunk city. Four isolated photography-grade CGI aircraft, fully visible with transparent padding. Top left: a believable flying-car/eVTOL shuttle inspired by Archer Midnight, streamlined low silver gunmetal fuselage, swept high wing with multiple compact tilt-rotor nacelles, dark panoramic canopy, detailed seams and subtle magenta navigation strip; three-quarter side profile facing right. Top right: an original mechanized ornithopter inspired by Festo SmartBird, lightweight slim body, articulated carbon feather panels and exposed joints, wide gull-shaped extended wings and forked tail, viewed front three-quarter from above, steel gray-blue and amber marker lights. Bottom left: a broad flat disk cargo aircraft with layered armor, underslung cargo pods, recessed thrusters, oval cockpit and cyan lights, three-quarter side view. Bottom right: a gigantic long, low wedge cruiser viewed from below, stacked command island, machinery, antennas, tiny warm windows and cyan rear engines, bow facing right. Fine physically plausible surface detail, wet reflections, cool midnight fill, cyan and magenta edges; retain visible hull detail. No scenes, sky, smoke, shadows, text, logos, frames, background rectangle or checkerboard. Genuine alpha cutouts.

## Animation and integration

- Fish movement, avoidance, feeding and pointer response remain real-time simulation. Mesh bending decays from the tail toward the head, preserving the eye and mechanical gill.
- Remotion's frame clock synchronizes the low-opacity scanning pass and staggered, brief fish signal glitches. Chromatic ghosts and shifted scan slices affect individual fish rather than the whole viewport.
- Turning mirrors the species artwork and bounds pitch; a leftward fish remains upright.
- Edible energy components are original Canvas drawings: chips have gold contacts and etched circuitry, graphics cards have two spinning fans and a luminous rim, and cyber gears have beveled teeth and emissive hubs. Their tumble, sinking, and consumption share the existing feeding simulation. Minimum display sizes keep them recognizable on phones.
- Aircraft have separate lane speeds, scales and depth. Far lanes are clipped by skyline silhouettes. The ornithopter's wing tips lag the root through each flap. Its sprite is mirrored to face left, matching its leftward flight path. Positive modulo keeps reverse distant lanes looping indefinitely.
- Hidden-page handling pauses scene animation and the ambient Remotion player. Reduced-motion preference disables fish flashes and the scanning layer; mobile renders fewer distant aircraft and fewer mesh strips.
