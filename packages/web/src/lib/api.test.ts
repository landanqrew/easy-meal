import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { queryKeys, apiFetch, apiPost, apiPatch, apiDelete, API_URL } from './api'

// ── queryKeys tests ────────────────────────────────────────────
describe('queryKeys', () => {
  test('recipes returns base key', () => {
    expect(queryKeys.recipes).toEqual(['recipes'])
  })

  test('recipesFiltered includes all params', () => {
    const result = queryKeys.recipesFiltered({
      page: 2,
      search: 'pasta',
      sort: 'title',
      type: 'entree',
      tag: 'tag-1',
    })
    expect(result).toEqual(['recipes', 'list', 2, 'pasta', 'title', 'entree', 'tag-1'])
  })

  test('recipe returns key with id', () => {
    expect(queryKeys.recipe('abc-123')).toEqual(['recipes', 'abc-123'])
  })

  test('tags returns base key', () => {
    expect(queryKeys.tags).toEqual(['tags'])
  })

  test('household returns base key', () => {
    expect(queryKeys.household).toEqual(['household'])
  })

  test('mealPlanEntries includes weekStart', () => {
    expect(queryKeys.mealPlanEntries('2024-03-11')).toEqual(['mealPlanEntries', '2024-03-11'])
  })

  test('groceryLists returns base key', () => {
    expect(queryKeys.groceryLists).toEqual(['groceryLists'])
  })

  test('groceryList returns key with id', () => {
    expect(queryKeys.groceryList('list-1')).toEqual(['groceryLists', 'list-1'])
  })

  test('recipeLists returns base key', () => {
    expect(queryKeys.recipeLists).toEqual(['recipeLists'])
  })

  test('recipeList returns key with id', () => {
    expect(queryKeys.recipeList('list-1')).toEqual(['recipeLists', 'list-1'])
  })

  test('checkins returns key with recipeId', () => {
    expect(queryKeys.checkins('recipe-1')).toEqual(['checkins', 'recipe-1'])
  })

  test('discover returns key with page and search', () => {
    expect(queryKeys.discover(1, 'pasta')).toEqual(['discover', 1, 'pasta'])
  })

  test('publicRecipe returns key with id', () => {
    expect(queryKeys.publicRecipe('recipe-1')).toEqual(['discover', 'recipe', 'recipe-1'])
  })
})

// ── apiFetch tests ─────────────────────────────────────────────
describe('apiFetch', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('returns data on successful response', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ data: { id: 1, name: 'Test' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as any

    const result = await apiFetch('/api/test')
    expect(result).toEqual({ id: 1, name: 'Test' })
  })

  test('throws on error response', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as any

    await expect(apiFetch('/api/test')).rejects.toThrow('Not found')
  })

  test('throws generic message when no error field', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({}), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as any

    await expect(apiFetch('/api/test')).rejects.toThrow('Request failed')
  })

  test('includes credentials', async () => {
    let capturedInit: RequestInit | undefined
    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      capturedInit = init
      return Promise.resolve(new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }) as any

    await apiFetch('/api/test')
    expect(capturedInit?.credentials).toBe('include')
  })

  test('calls correct URL', async () => {
    let capturedUrl = ''
    globalThis.fetch = mock((url: string) => {
      capturedUrl = url
      return Promise.resolve(new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }) as any

    await apiFetch('/api/recipes')
    expect(capturedUrl).toBe(`${API_URL}/api/recipes`)
  })
})

describe('apiPost', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('sends POST with JSON body', async () => {
    let capturedInit: RequestInit | undefined
    globalThis.fetch = mock((_url: string, init?: RequestInit) => {
      capturedInit = init
      return Promise.resolve(new Response(JSON.stringify({ data: { id: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }) as any

    await apiPost('/api/tags', { name: 'Italian' })
    expect(capturedInit?.method).toBe('POST')
    expect(capturedInit?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(capturedInit?.body).toBe(JSON.stringify({ name: 'Italian' }))
  })
})

describe('apiPatch', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('sends PATCH with JSON body', async () => {
    let capturedInit: RequestInit | undefined
    globalThis.fetch = mock((_url: string, init?: RequestInit) => {
      capturedInit = init
      return Promise.resolve(new Response(JSON.stringify({ data: { id: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }) as any

    await apiPatch('/api/tags/1', { name: 'Updated' })
    expect(capturedInit?.method).toBe('PATCH')
    expect(capturedInit?.body).toBe(JSON.stringify({ name: 'Updated' }))
  })
})

describe('apiDelete', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('sends DELETE request', async () => {
    let capturedInit: RequestInit | undefined
    globalThis.fetch = mock((_url: string, init?: RequestInit) => {
      capturedInit = init
      return Promise.resolve(new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }) as any

    await apiDelete('/api/tags/1')
    expect(capturedInit?.method).toBe('DELETE')
  })

  test('returns void', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as any

    const result = await apiDelete('/api/tags/1')
    expect(result).toBeUndefined()
  })
})
