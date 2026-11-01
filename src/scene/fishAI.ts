export type Vec = { x: number; y: number }
export const fishSpecies = ['goldfish', 'koi', 'tetra', 'angelfish', 'betta', 'arowana', 'danio', 'catfish', 'discus'] as const
export type FishKind = typeof fishSpecies[number]
export type Fish = Vec & { id: number; kind: FishKind; vx: number; vy: number; angle: number; size: number; depth: number; phase: number; wander: Vec; wanderTimer: number }
export type FoodKind = 'chip' | 'gpu' | 'gear'
export type Food = Vec & { kind: FoodKind; vy: number; eaten: boolean; phase: number }
export type Attraction = Vec & { ttl: number }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function createFish(): Fish[] {
  return fishSpecies.map((kind, id) => ({
    id, kind, x: .2 + (id % 3) * .28, y: .23 + Math.floor(id / 3) * .25,
    vx: id % 2 ? -.035 : .035, vy: .008 * (id % 3 - 1), angle: id % 2 ? Math.PI : 0,
    size: [.88, .94, .24, .67, .73, 1, .22, .77, .62][id], depth: [.83, .6, .45, .69, .91, .56, .4, .72, .85][id],
    phase: id * 1.71, wander: { x: .5, y: .5 }, wanderTimer: 0
  }))
}

export function addFood(food: Food[], count = 7) {
  if (food.length > 28) return
  const kinds: FoodKind[] = ['chip', 'gpu', 'gear']
  for (let i = 0; i < count; i++) food.push({ kind: kinds[i % 3], x: clamp(.32 + Math.random() * .36, .08, .92), y: .035 - i * .018, vy: .036 + Math.random() * .025, phase: Math.random() * 6.28, eaten: false })
}

export function stepFish(fish: Fish[], food: Food[], attraction: Attraction | null, pointer: Vec | null, dt: number, time: number) {
  dt = Math.min(dt, .05)
  for (const pellet of food) {
    // Settle above the substrate, inside the fish's reachable swim volume.
    pellet.y = Math.min(.81, pellet.y + pellet.vy * dt)
    pellet.x += Math.sin(time * 1.7 + pellet.phase) * dt * .002
  }
  for (const f of fish) {
    f.wanderTimer -= dt
    if (f.wanderTimer <= 0) {
      f.wander = { x: .12 + Math.random() * .76, y: .18 + Math.random() * .58 }
      f.wanderTimer = 2.5 + Math.random() * 3.5
    }
    let target = f.wander
    let foodTarget: Food | null = null
    let minFoodDist = .3
    for (const pellet of food) {
      if (pellet.eaten) continue
      const d = Math.hypot((pellet.x - f.x) * 1.2, pellet.y - f.y)
      if (d < minFoodDist) { minFoodDist = d; foodTarget = pellet }
    }
    if (foodTarget) target = foodTarget
    else if (attraction && attraction.ttl > 0) target = attraction

    let ax = (target.x - f.x) * .24
    let ay = (target.y - f.y) * .20
    for (const other of fish) {
      if (other === f) continue
      const dx = f.x - other.x, dy = f.y - other.y
      const d2 = dx * dx + dy * dy
      if (d2 > .0001 && d2 < .011) { ax += dx / d2 * .0012; ay += dy / d2 * .0012 }
    }
    if (pointer) {
      const dx = f.x - pointer.x, dy = f.y - pointer.y
      const d2 = dx * dx + dy * dy
      if (d2 > .0001 && d2 < .022) { ax += dx / d2 * .00018; ay += dy / d2 * .00018 }
    }
    ax += Math.sin(time * .75 + f.phase) * .003
    ay += Math.cos(time * .61 + f.phase) * .002
    f.vx = clamp((f.vx + ax * dt) * (1 - dt * .5), -.12, .12)
    f.vy = clamp((f.vy + ay * dt) * (1 - dt * .55), -.07, .07)
    const speed = Math.hypot(f.vx, f.vy)
    if (speed < .019) { f.vx += Math.cos(f.angle) * dt * .012; f.vy += Math.sin(f.angle) * dt * .007 }
    f.x = clamp(f.x + f.vx * dt, .085, .915)
    f.y = clamp(f.y + f.vy * dt, .14, .83)
    if (f.x <= .086 || f.x >= .914) f.vx *= -.8
    if (f.y <= .141 || f.y >= .829) f.vy *= -.8
    const desiredAngle = Math.atan2(f.vy, f.vx)
    let turn = ((desiredAngle - f.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    f.angle += clamp(turn, -dt * 2.6, dt * 2.6)
    f.depth = clamp(f.depth + Math.sin(time * .4 + f.phase) * dt * .008, .3, .98)
    if (foodTarget && Math.hypot(foodTarget.x - f.x, foodTarget.y - f.y) < .029) foodTarget.eaten = true
  }
  for (let i = food.length - 1; i >= 0; i--) if (food[i].eaten) food.splice(i, 1)
  if (attraction) attraction.ttl -= dt
}
