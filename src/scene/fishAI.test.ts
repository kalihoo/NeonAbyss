import { describe, expect, it } from 'vitest'
import { addFood, createFish, stepFish, type Food } from './fishAI'

describe('fish ecosystem', () => {
  it('starts with six independently configured fish', () => {
    const fish = createFish()
    expect(fish).toHaveLength(6)
    expect(new Set(fish.map(f => f.kind)).size).toBe(5)
    expect(new Set(fish.map(f => `${f.x},${f.y}`)).size).toBe(6)
  })
  it('keeps fish inside the tank and consumes nearby food', () => {
    const fish = createFish()
    const food = [{ x: fish[0].x, y: fish[0].y, vy: 0, phase: 0, eaten: false }]
    stepFish(fish, food, null, null, .016, 1)
    expect(food).toHaveLength(0)
    for (let i = 0; i < 3000; i++) stepFish(fish, food, null, null, .016, i * .016)
    expect(fish.every(f => f.x >= .085 && f.x <= .915 && f.y >= .14 && f.y <= .83)).toBe(true)
  })
  it('drops a bounded group of food particles', () => {
    const food: Food[] = []
    addFood(food)
    expect(food).toHaveLength(7)
    for (let i = 0; i < 5; i++) addFood(food)
    expect(food.length).toBeLessThanOrEqual(35)
  })
})
