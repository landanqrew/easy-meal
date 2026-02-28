export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Request failed')
  }
  return json.data as T
}

export function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiDelete(path: string): Promise<void> {
  await apiFetch(path, { method: 'DELETE' })
}

export const queryKeys = {
  recipes: ['recipes'] as const,
  recipesFiltered: (params: { page: number; search: string; sort: string; type: string; tag: string }) =>
    ['recipes', 'list', params.page, params.search, params.sort, params.type, params.tag] as const,
  recipe: (id: string) => ['recipes', id] as const,
  tags: ['tags'] as const,
  household: ['household'] as const,
  mealPlanEntries: (weekStart: string) => ['mealPlanEntries', weekStart] as const,
  groceryLists: ['groceryLists'] as const,
  groceryList: (id: string) => ['groceryLists', id] as const,
  recipeLists: ['recipeLists'] as const,
  recipeList: (id: string) => ['recipeLists', id] as const,
  checkins: (recipeId: string) => ['checkins', recipeId] as const,
  discover: (page: number, search: string) => ['discover', page, search] as const,
  publicRecipe: (id: string) => ['discover', 'recipe', id] as const,
}
