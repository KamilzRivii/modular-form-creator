import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Card } from '../design-system'
import { getResource, provisionResource } from '../api/resources'
import type { Resource } from '../api/types'
import { useEditBuffer } from '../context/EditBufferContext'

export function ResourceOverviewPage() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()
  const { getBuffer } = useEditBuffer()

  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [provisioning, setProvisioning] = useState(false)
  const [provisionError, setProvisionError] = useState<string | null>(null)

  useEffect(() => {
    if (!resourceId) return
    const id = resourceId
    async function fetchResource() {
      try {
        setLoading(true)
        setError(null)
        const data = await getResource(id)
        setResource(data)
      } catch {
        setError('Resource not found.')
      } finally {
        setLoading(false)
      }
    }
    void fetchResource()
  }, [resourceId])

  async function handleProvision() {
    if (!resource) return
    try {
      setProvisioning(true)
      setProvisionError(null)
      const updated = await provisionResource(resource.resourceId)
      setResource(updated)
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
  const completedCount = [basicInfoComplete, projectDetailsComplete].filter(Boolean).length
  const canProvision = resource.status === 'draft' && basicInfoComplete && projectDetailsComplete
  const isCompleted = resource.status === 'completed'
  const buffer = getBuffer(String(resource.resourceId))
  const hasBuffer = !!(buffer.basicInfo || buffer.projectDetails)
  const projectDetailsLocked = resource.status === 'draft' && !basicInfoComplete

  return (
    <PageWrapper>
      <TopBar>
        <BackButton onClick={() => navigate('/resources')}>← All resources</BackButton>
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

      <HeroCard>
        <HeroLeft>
          <ResourceId>#{resource.resourceId}</ResourceId>
          <PageTitle>{resource.name}</PageTitle>
          <HeroMeta>
            <Badge variant={isCompleted ? 'success' : 'neutral'}>{resource.status}</Badge>
            <ProgressText>{completedCount}/2 modules complete</ProgressText>
          </HeroMeta>
        </HeroLeft>
        {isCompleted && hasBuffer && (
          <BufferBanner>
            <span>Unsaved changes</span>
            <BufferLink onClick={() => navigate(`/resources/${resource.resourceId}/details`)}>
              Review &amp; submit →
            </BufferLink>
          </BufferBanner>
        )}
        {provisionError && <ErrorText>{provisionError}</ErrorText>}
      </HeroCard>

      <SectionLabel>Modules</SectionLabel>
      <ModulesGrid>
        <ModuleCard
          title="Basic Info"
          complete={basicInfoComplete}
          locked={false}
          onClick={() => navigate(`/resources/${resource.resourceId}/basic-info`)}
        />
        <ModuleCard
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
  title: string
  complete: boolean
  locked: boolean
  onClick: () => void
}

function ModuleCard({ title, complete, locked, onClick }: ModuleCardProps) {
  return (
    <StyledCard variant="outline" onClick={onClick} $locked={locked} $complete={complete}>
      <ModuleAccent $complete={complete} $locked={locked} />
      <ModuleBody>
        <ModuleHeader>
          <ModuleTitle>{title}</ModuleTitle>
          <Badge variant={complete ? 'success' : 'neutral'}>
            {complete ? 'Complete' : 'Incomplete'}
          </Badge>
        </ModuleHeader>
        <ModuleHint>
          {locked ? 'Complete Basic Info first' : complete ? 'Click to edit' : 'Click to fill in'}
        </ModuleHint>
      </ModuleBody>
    </StyledCard>
  )
}

function isBasicInfoComplete(resource: Resource): boolean {
  const { resourceName, owner, email, description, priority } = resource.basicInfo
  return !!(resourceName && owner && email && description && priority)
}

function isProjectDetailsComplete(resource: Resource): boolean {
  const { projectName, budget, category, options } = resource.projectDetails
  return !!(projectName && budget && category && options.length > 0)
}

const PageWrapper = styled.div`
  max-width: 760px;
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

const HeroCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`

const HeroLeft = styled.div``

const ResourceId = styled.p`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.inkMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
`

const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.heading};
  font-size: 1.875rem;
  color: ${({ theme }) => theme.colors.inkStrong};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`

const HeroMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const ProgressText = styled.span`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const BufferBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.accentSoft};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.accent};
`

const BufferLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: underline;
`

const StatusText = styled.p<{ $error?: boolean }>`
  color: ${({ theme, $error }) => ($error ? theme.colors.warning : theme.colors.inkMuted)};
  font-family: ${({ theme }) => theme.typography.body};
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.warning};
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  margin: ${({ theme }) => theme.spacing.md} 0 0;
`

const SectionLabel = styled.p`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.inkMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
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
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  padding: 0;
  overflow: hidden;

  &:hover {
    box-shadow: ${({ $locked, theme }) => ($locked ? 'none' : theme.shadows.card)};
    border-color: ${({ $locked, theme }) => ($locked ? theme.colors.border : theme.colors.primary)};
  }
`

const ModuleAccent = styled.div<{ $complete: boolean; $locked: boolean }>`
  height: 4px;
  background: ${({ theme, $complete, $locked }) =>
    $locked ? theme.colors.border : $complete ? theme.colors.success : theme.colors.primary};
`

const ModuleBody = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
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
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.radii.sm};
`
