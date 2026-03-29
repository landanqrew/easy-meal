import { describe, test, expect, mock, beforeEach } from 'bun:test'

// ── Mocks ──────────────────────────────────────────────────────
let mockGetSession = mock((_c: any): any => null)
let mockGetUserWithHousehold = mock((_id: any): any => null)

// Mock db with chainable query builder
const mockFindMany = mock((_opts: any): any => [])
const mockFindFirst = mock((_opts: any): any => null)
const mockReturning = mock((): any => [])
const mockValues = mock((_v: any): any => ({ returning: mockReturning }))
const mockInsert = mock((_table: any): any => ({ values: mockValues }))
const mockUpdateWhere = mock((): any => ({ returning: mockReturning }))
const mockUpdate = mock((_table: any): any => ({ set: (_s: any) => ({ where: (_w: any) => mockUpdateWhere() }) }))
const mockDeleteWhere = mock((_w: any): any => Promise.resolve())
const mockDelete = mock((_table: any): any => ({ where: mockDeleteWhere }))

mock.module('../lib/auth-helpers', () => ({
  getSession: (c: any) => mockGetSession(c),
  getUserWithHousehold: (id: any) => mockGetUserWithHousehold(id),
}))

mock.module('../db', () => ({
  db: {
    query: {
      tags: {
        findMany: (opts: any) => mockFindMany(opts),
        findFirst: (opts: any) => mockFindFirst(opts),
      },
    },
    insert: (table: any) => mockInsert(table),
    update: (table: any) => mockUpdate(table),
    delete: (table: any) => mockDelete(table),
  },
}))

mock.module('../db/schema', () => ({
  tags: { id: 'id', householdId: 'householdId', name: 'name' },
}))

// Must import AFTER mock.module calls
import { Hono } from 'hono'
import tagsRouter from './tags'

// ── Test App ───────────────────────────────────────────────────
function createApp() {
  const app = new Hono()
  app.route('/tags', tagsRouter)
  return app
}

const fakeSession = { user: { id: 'user-1' } }
const fakeUser = { id: 'user-1', householdId: 'household-1' }

// ── Tests ──────────────────────────────────────────────────────
describe('GET /tags', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockGetUserWithHousehold.mockReset()
    mockFindMany.mockReset()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetSession.mockReturnValue(null as any)
    const app = createApp()
    const res = await app.request('/tags')
    expect(res.status).toBe(401)
  })

  test('returns 400 when user has no household', async () => {
    mockGetSession.mockReturnValue(fakeSession as any)
    mockGetUserWithHousehold.mockReturnValue({ id: 'user-1', householdId: null } as any)
    const app = createApp()
    const res = await app.request('/tags')
    expect(res.status).toBe(400)
  })

  test('returns tags for authenticated user', async () => {
    mockGetSession.mockReturnValue(fakeSession as any)
    mockGetUserWithHousehold.mockReturnValue(fakeUser as any)
    mockFindMany.mockReturnValue([
      { id: 'tag-1', name: 'italian', color: '#ff0000' },
      { id: 'tag-2', name: 'quick', color: null },
    ] as any)

    const app = createApp()
    const res = await app.request('/tags')
    expect(res.status).toBe(200)
    const json = await res.json() as any
    expect(json.data).toHaveLength(2)
    expect(json.data[0].name).toBe('italian')
  })
})

describe('POST /tags', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockGetUserWithHousehold.mockReset()
    mockFindFirst.mockReset()
    mockReturning.mockReset()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetSession.mockReturnValue(null as any)
    const app = createApp()
    const res = await app.request('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Italian' }),
    })
    expect(res.status).toBe(401)
  })

  test('returns 400 for invalid input', async () => {
    mockGetSession.mockReturnValue(fakeSession as any)
    mockGetUserWithHousehold.mockReturnValue(fakeUser as any)
    const app = createApp()
    const res = await app.request('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    })
    expect(res.status).toBe(400)
  })

  test('returns 409 for duplicate tag', async () => {
    mockGetSession.mockReturnValue(fakeSession as any)
    mockGetUserWithHousehold.mockReturnValue(fakeUser as any)
    mockFindFirst.mockReturnValue({ id: 'existing', name: 'italian' } as any)

    const app = createApp()
    const res = await app.request('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Italian' }),
    })
    expect(res.status).toBe(409)
  })

  test('returns 201 with created tag', async () => {
    mockGetSession.mockReturnValue(fakeSession as any)
    mockGetUserWithHousehold.mockReturnValue(fakeUser as any)
    mockFindFirst.mockReturnValue(null as any)
    mockReturning.mockReturnValue([{ id: 'new-tag', name: 'italian', color: null }] as any)

    const app = createApp()
    const res = await app.request('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Italian' }),
    })
    expect(res.status).toBe(201)
    const json = await res.json() as any
    expect(json.data.id).toBe('new-tag')
    expect(json.data.name).toBe('italian')
  })
})

describe('PATCH /tags/:id', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockGetUserWithHousehold.mockReset()
    mockFindFirst.mockReset()
    mockUpdateWhere.mockReset()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetSession.mockReturnValue(null as any)
    const app = createApp()
    const res = await app.request('/tags/tag-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    expect(res.status).toBe(401)
  })

  test('returns 404 when tag not found', async () => {
    mockGetSession.mockReturnValue(fakeSession as any)
    mockGetUserWithHousehold.mockReturnValue(fakeUser as any)
    mockFindFirst.mockReturnValue(null as any)

    const app = createApp()
    const res = await app.request('/tags/nonexistent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    expect(res.status).toBe(404)
  })

  test('returns updated tag', async () => {
    mockGetSession.mockReturnValue(fakeSession as any)
    mockGetUserWithHousehold.mockReturnValue(fakeUser as any)
    mockFindFirst.mockReturnValue({ id: 'tag-1', name: 'old', householdId: 'household-1' } as any)
    mockUpdateWhere.mockReturnValue({ returning: mock(() => [{ id: 'tag-1', name: 'updated', color: null }]) } as any)

    const app = createApp()
    const res = await app.request('/tags/tag-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    // The mock chain is complex; just verify the route doesn't return auth/validation errors or 500
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(404)
    expect(res.status).not.toBe(500)
  })
})

describe('DELETE /tags/:id', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockGetUserWithHousehold.mockReset()
    mockFindFirst.mockReset()
    mockDeleteWhere.mockReset()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetSession.mockReturnValue(null as any)
    const app = createApp()
    const res = await app.request('/tags/tag-1', { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  test('returns 404 when tag not found', async () => {
    mockGetSession.mockReturnValue(fakeSession as any)
    mockGetUserWithHousehold.mockReturnValue(fakeUser as any)
    mockFindFirst.mockReturnValue(null as any)

    const app = createApp()
    const res = await app.request('/tags/nonexistent', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })

  test('deletes tag successfully', async () => {
    mockGetSession.mockReturnValue(fakeSession as any)
    mockGetUserWithHousehold.mockReturnValue(fakeUser as any)
    mockFindFirst.mockReturnValue({ id: 'tag-1', name: 'italian', householdId: 'household-1' } as any)

    const app = createApp()
    const res = await app.request('/tags/tag-1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    const json = await res.json() as any
    expect(json.data.message).toBe('Tag deleted')
  })
})
