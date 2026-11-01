import { describe, expect, it } from 'vitest'
import { addFood, createFish, stepFish, type Food } from './fishAI'

describe('fish ecosystem', () => {
  it('starts with all nine reference species, each independently configured', () => {
    const fish = createFish()
    expect(fish).toHaveLength(9)
    expect(new Set(fish.map(f => f.kind))).toEqual(new Set(['goldfish', 'koi', 'tetra', 'angelfish', 'betta', 'arowana', 'danio', 'catfish', 'discus']))
    expect(new Set(fish.map(f => `${f.x},${f.y}`)).size).toBe(9)
  })
  it('keeps fish inside the tank and consumes nearby food', () => {
    const fish = createFish()
    const food: Food[] = [{ kind: 'chip', x: fish[0].x, y: fish[0].y, vy: 0, phase: 0, eaten: false }]
    stepFish(fish, food, null, null, .016, 1)
    expect(food).toHaveLength(0)
    for (let i = 0; i < 3000; i++) stepFish(fish, food, null, null, .016, i * .016)
    expect(fish.every(f => f.x >= .085 && f.x <= .915 && f.y >= .14 && f.y <= .83)).toBe(true)
  })
  it('drops a bounded mix of edible chips, graphics cards, and cyber gears', () => {
    const food: Food[] = []
    addFood(food)
    expect(food).toHaveLength(7)
    expect(new Set(food.map(f => f.kind))).toEqual(new Set(['chip', 'gpu', 'gear']))
    for (let i = 0; i < 5; i++) addFood(food)
    expect(food.length).toBeLessThanOrEqual(35)
  })
  it('lets fish consume electronic components that have reached the tank floor', () => {
    const fish = createFish().slice(0, 1)
    Object.assign(fish[0], { x: .5, y: .8, vx: 0, vy: 0, wanderTimer: 100 })
    const food: Food[] = [{ kind: 'gear', x: .5, y: .9, vy: .04, phase: 0, eaten: false }]
    for (let i = 0; i < 900; i++) stepFish(fish, food, null, null, 1 / 60, i / 60)
    expect(food).toHaveLength(0)
  })
})
