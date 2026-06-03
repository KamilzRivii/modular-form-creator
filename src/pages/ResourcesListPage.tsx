import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Drawer, IconButton, Input } from '../design-system'
import { createResource, deleteResource, getResources } from '../api/resources'
import type { Resource } from '../api/types'

export function ResourcesListPage() {
  const navigate = useNavigate()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true)
        setError(null)
        const data = await getResources({ sortOrder: 'desc' })
        setResources(data.items)
      } catch {
        setError('Failed to load resources.')
      } finally {
        setLoading(false)
      }
    }
    void fetchResources()
  }, [])

  async function handleCreate() {
    if (!newName.trim()) {
      setCreateError('Name is required.')
      return
    }
    try {
      setCreating(true)
      setCreateError(null)
      const created = await createResource(newName.trim())
      setResources((prev) => [created, ...prev])
      setNewName('')
      setDrawerOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create resource.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(e: React.MouseEvent, resource: Resource) {
    e.stopPropagation()
    if (!window.confirm(`Delete "${resource.name}"?`)) return
    try {
      setDeletingId(resource.resourceId)
      await deleteResource(resource.resourceId)
      setResources((prev) => prev.filter((r) => r.resourceId !== resource.resourceId))
    } catch {
      alert('Failed to delete resource.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleDrawerClose() {
    setDrawerOpen(false)
    setNewName('')
    setCreateError(null)
  }

  return (
    <PageWrapper>
      <Header>
        <Title>Resources</Title>
        <Button variant="primary" onClick={() => setDrawerOpen(true)}>
          + New Resource
        </Button>
      </Header>

      {loading && <StatusText>Loading...</StatusText>}
      {error && <StatusText $error>{error}</StatusText>}

      {!loading && !error && resources.length === 0 && (
        <StatusText>No resources yet. Create your first one.</StatusText>
      )}

      {!loading && !error && resources.length > 0 && (
        <List>
          {resources.map((resource) => (
            <ListRow key={resource.resourceId} onClick={() => navigate(`/resources/${resource.resourceId}`)}>
              <RowLeft>
                <ResourceName>{resource.name}</ResourceName>
                <Badge variant={resource.status === 'completed' ? 'success' : 'neutral'}>
                  {resource.status}
                </Badge>
              </RowLeft>
              <IconButton
                variant="ghost"
                size="small"
                state={deletingId === resource.resourceId ? 'disabled' : 'normal'}
                onClick={(e) => handleDelete(e, resource)}
                aria-label="Delete resource"
              >
                <TrashIcon />
              </IconButton>
            </ListRow>
          ))}
        </List>
      )}

      <Drawer title="New Resource" isOpen={drawerOpen} onClose={handleDrawerClose}>
        <DrawerBody>
          <Input
            label="Resource name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            error={createError ?? undefined}
            helperText="This name cannot be changed after creation."
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <Button
            variant="primary"
            fullWidth
            onClick={handleCreate}
            state={creating ? 'disabled' : 'normal'}
          >
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DrawerBody>
      </Drawer>
    </PageWrapper>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PageWrapper = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.heading};
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.inkStrong};
  margin: 0;
`

const StatusText = styled.p<{ $error?: boolean }>`
  color: ${({ theme, $error }) => ($error ? theme.colors.warning : theme.colors.inkMuted)};
  font-family: ${({ theme }) => theme.typography.body};
`

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ListRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.card};
  }
`

const RowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const ResourceName = styled.span`
  font-family: ${({ theme }) => theme.typography.body};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink};
`

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`
