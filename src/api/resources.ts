import type {
  Resource,
  ResourcesListResponse,
  GetResourcesParams,
  BasicInfo,
  ProjectDetails,
} from './types'

const BASE_URL = 'http://localhost:5001/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message ?? 'Request failed')
  }

  return response.json() as Promise<T>
}

export function getResources(params?: GetResourcesParams): Promise<ResourcesListResponse> {
  const query = new URLSearchParams()
  if (params?.page !== undefined) query.set('page', String(params.page))
  if (params?.pageSize !== undefined) query.set('pageSize', String(params.pageSize))
  if (params?.status) query.set('status', params.status)
  if (params?.name) query.set('name', params.name)
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder)

  const qs = query.toString()
  return request<ResourcesListResponse>(`/resources${qs ? `?${qs}` : ''}`)
}

export function getResource(id: string | number): Promise<Resource> {
  return request<Resource>(`/resources/${id}`)
}

export function createResource(resourceName: string): Promise<Resource> {
  return request<Resource>('/resources', {
    method: 'POST',
    body: JSON.stringify({ resourceName }),
  })
}

export function updateBasicInfo(id: string | number, data: Partial<BasicInfo>): Promise<Resource> {
  return request<Resource>(`/resources/${id}/basic-info`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function updateProjectDetails(
  id: string | number,
  data: Partial<ProjectDetails>,
): Promise<Resource> {
  return request<Resource>(`/resources/${id}/project-details`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function provisionResource(id: string | number): Promise<Resource> {
  return request<Resource>(`/resources/${id}/provisioning`, {
    method: 'PATCH',
  })
}

export function fullUpdateResource(
  id: string | number,
  data: { name?: string; basicInfo?: Partial<BasicInfo>; projectDetails?: Partial<ProjectDetails> },
): Promise<Resource> {
  return request<Resource>(`/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteResource(id: string | number): Promise<Resource> {
  return request<Resource>(`/resources/${id}`, {
    method: 'DELETE',
  })
}
