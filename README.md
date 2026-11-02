# NeonAbyss

An interactive cyberpunk aquarium overlooking a living megacity. Nine independently simulated cybernetic species swim through an illuminated habitat while detailed aircraft, rain, weather, and holographic systems animate around them.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. Use `npm test` for fish-behavior tests and `npm run build` for the production build.

## Controls

- **Tap or click the water** to create a ripple and attract nearby fish.
- **上传鱼图** adds up to six PNG, JPG, or WebP fish images. Custom fish swim in the tank with directional turns and cyber glitch flashes. Images are stored locally in the current browser for this site, with a gallery to preview and remove them; transparent landscape images work best.
- **投喂鱼群** drops miniature microchips, twin-fan graphics cards, and luminous cyber gears. Components tumble as they sink; fish detect, pursue, and consume them.
- **天气** switches among Night Rain, Neon Fog, Dust Storm, and Clear Night.
- **时段** switches among Night City, Blue Hour, and Sunset.
- **系统状态** opens the simulated biosphere readouts.
- **特殊模式** triggers the hidden cinematic special mode.

## Implementation

React and TypeScript handle controls. Canvas renders independently moving fish, food, weather, and traffic without React state updates on every frame. Each fish has its own transparent, detailed species artwork, animated through a continuous tail mesh. Side-profile turning keeps fish upright. Remotion Player drives the water-light loop, scanning beam, local fish-glitch timing, and the special-mode sequence. Feeding briefly activates chromatic signal ghosts on individual fish. Reduced-motion preferences disable the glitch and scanning layer.

Tilt-rotor shuttles, a reference-inspired enclosed-fan flying car, a cargo aircraft, and the special-mode cruiser use detailed local sprites. The car follows the former ornithopter lane with a steady leftward hover glide. Distant traffic passes behind skyline silhouettes, with depth-dependent contrast and softness. Original local city and reef artwork provide depth behind the live animation; the project makes no runtime requests for remote imagery or fonts. See [visual assets and reference sources](docs/visual-assets.md) for the generation brief, assets, and aircraft references.

All control names, weather/time options, accessible labels, and the diagnostics panel are localized into Chinese. The ecosystem measurements are decorative simulations, not readings from physical sensors.
