import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Card } from '../design-system'
import { getResource, provisionResource } from '../api/resources'
import type { BasicInfo, ProjectDetails, Resource } from '../api/types'

export interface EditBuffer {
  basicInfo?: Partial<BasicInfo>
  projectDetails?: Partial<ProjectDetails>
}

export function ResourceOverviewPage() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()

  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [provisioning, setProvisioning] = useState(false)
  const [provisionError, setProvisionError] = useState<string | null>(null)

  // Buffer for completed resource edits — intentionally in-memory only
  const [editBuffer, setEditBuffer] = useState<EditBuffer>({})

  useEffect(() => {
    if (!resourceId) return
    fetchResource()
  }, [resourceId])

  async function fetchResource() {
    try {
      setLoading(true)
      setError(null)
      const data = await getResource(resourceId!)
      setResource(data)
    } catch {
      setError('Resource not found.')
    } finally {
      setLoading(false)
    }
  }

  async function handleProvision() {
    if (!resource) return
    try {
      setProvisioning(true)
      setProvisionError(null)
      const result = await provisionResource(resource.resourceId)
      setResource(result.resource)
    } catch (err) {
      setProvisionError(err instanceof Error ? err.message : 'Provisioning failed.')
    } finally {
      setProvisioning(false)
    }
  }

  if (loading) return <PageWrapper><StatusText>Loading...</StatusText></PageWrapper>
  if (error || !resource) return <PageWrapper><StatusText $error>{error ?? 'Not found.'}</StatusText></PageWrapper>

  const basicInfoComplete = isBasicInfoComplete(resource)
  const projectDetailsComplete = isProjectDetailsComplete(resource)
  const canProvision = resource.status === 'draft' && basicInfoComplete && projectDetailsComplete
  const isCompleted = resource.status === 'completed'
  const hasBuffer = Object.keys(editBuffer).length > 0

  const projectDetailsLocked = resource.status === 'draft' && !basicInfoComplete

  return (
    <PageWrapper>
      <TopBar>
        <BackButton onClick={() => navigate('/resources')}>← Back</BackButton>
        <Actions>
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate(`/resources/${resource.resourceId}/details`)}
          >
            View Details
          </Button>
          {!isCompleted && (
            <Button
              variant="primary"
              size="small"
              state={canProvision && !provisioning ? 'normal' : 'disabled'}
              onClick={handleProvision}
            >
              {provisioning ? 'Provisioning...' : 'Provision'}
            </Button>
          )}
        </Actions>
      </TopBar>

      <Header>
        <TitleRow>
          <PageTitle>{resource.name}</PageTitle>
          <Badge variant={isCompleted ? 'success' : 'neutral'}>{resource.status}</Badge>
        </TitleRow>
        {isCompleted && hasBuffer && (
          <BufferNotice>You have unsaved changes. <a onClick={() => navigate(`/resources/${resource.resourceId}/details`)}>Review &amp; submit</a></BufferNotice>
        )}
        {provisionError && <ErrorText>{provisionError}</ErrorText>}
      </Header>

      <ModulesGrid>
        <ModuleCard
          resource={resource}
          module="basic-info"
          title="Basic Info"
          complete={basicInfoComplete}
          locked={false}
          onClick={() => navigate(`/resources/${resource.resourceId}/basic-info`)}
        />
        <ModuleCard
          resource={resource}
          module="project-details"
          title="Project Details"
          complete={projectDetailsComplete}
          locked={projectDetailsLocked}
          onClick={() => !projectDetailsLocked && navigate(`/resources/${resource.resourceId}/project-details`)}
        />
      </ModulesGrid>

      {!canProvision && !isCompleted && (
        <ProvisionHint>
          {!basicInfoComplete && !projectDetailsComplete
            ? 'Fill in both modules to enable provisioning.'
            : !basicInfoComplete
            ? 'Complete Basic Info to enable provisioning.'
            : 'Complete Project Details to enable provisioning.'}
        </ProvisionHint>
      )}
    </PageWrapper>
  )
}

interface ModuleCardProps {
  resource: Resource
  module: 'basic-info' | 'project-details'
  title: string
  complete: boolean
  locked: boolean
  onClick: () => void
}

function ModuleCard({ title, complete, locked, onClick }: ModuleCardProps) {
  return (
    <StyledCard variant="outline" onClick={onClick} $locked={locked} $complete={complete}>
      <ModuleHeader>
        <ModuleTitle>{title}</ModuleTitle>
        <Badge variant={complete ? 'success' : 'neutral'}>
          {complete ? 'Complete' : 'Incomplete'}
        </Badge>
      </ModuleHeader>
      {locked ? (
        <ModuleHint>Complete Basic Info first</ModuleHint>
      ) : (
        <ModuleHint>{complete ? 'Click to edit' : 'Click to fill in'}</ModuleHint>
      )}
    </StyledCard>
  )
}

function isBasicInfoComplete(resource: Resource): boolean {
  const { resourceName, owner, email, description, priority } = resource.basicInfo
  return !!(resourceName && owner && email && description && priority)
}

function isProjectDetailsComplete(resource: Resource): boolean {
  const { projectName, budget, category } = resource.projectDetails
  return !!(projectName && budget && category)
}

const PageWrapper = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.body};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.875rem;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
`

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.heading};
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.inkStrong};
  margin: 0;
`

const StatusText = styled.p<{ $error?: boolean }>`
  color: ${({ theme, $error }) => ($error ? theme.colors.warning : theme.colors.inkMuted)};
  font-family: ${({ theme }) => theme.typography.body};
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.warning};
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
`

const BufferNotice = styled.p`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.accent};
  margin: ${({ theme }) => theme.spacing.sm} 0 0;

  a {
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    text-decoration: underline;
  }
`

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const StyledCard = styled(Card)<{ $locked: boolean; $complete: boolean }>`
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
  opacity: ${({ $locked }) => ($locked ? 0.5 : 1)};
  transition: box-shadow 0.15s ease;
  padding: ${({ theme }) => theme.spacing.lg};

  &:hover {
    box-shadow: ${({ $locked, theme }) => ($locked ? 'none' : theme.shadows.card)};
  }
`

const ModuleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ModuleTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.heading};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`

const ModuleHint = styled.p`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.inkMuted};
  margin: 0;
`

const ProvisionHint = styled.p`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.inkMuted};
  text-align: center;
`
