# NeonAbyss

An interactive cyberpunk aquarium overlooking a living megacity. Six independently simulated fish swim through an illuminated habitat while traffic, rain, weather, and holographic systems animate around them.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. Use `npm test` for fish-behavior tests and `npm run build` for the production build.

## Controls

- **Tap or click the water** to create a ripple and attract nearby fish.
- **Feed Fish** drops edible pellets. Fish detect, pursue, and consume them.
- **Atmosphere** switches among Night Rain, Neon Fog, Dust Storm, and Clear Night.
- **Time Cycle** switches among Night City, Blue Hour, and Sunset.
- **Systems** opens the simulated biosphere readouts.
- **Star icon** triggers the hidden cinematic special mode.

## Implementation

React and TypeScript handle controls. Canvas renders independently moving fish, food, weather, and traffic without React state updates on every frame. Remotion Player drives the water-light loop and the timed special-mode sequence. Original local city and reef artwork provide depth behind the live animation; the project makes no runtime requests for remote imagery or fonts.

The ecosystem measurements are decorative simulations, not readings from physical sensors.
