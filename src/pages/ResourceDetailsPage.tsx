import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button } from '../design-system'
import { fullUpdateResource, getResource } from '../api/resources'
import type { Resource } from '../api/types'
import { useEditBuffer } from '../context/EditBufferContext'

export function ResourceDetailsPage() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()
  const { getBuffer, clearBuffer } = useEditBuffer()

  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!resourceId) return
    const id = resourceId
    async function fetchResource() {
      try {
        setLoading(true)
        setFetchError(null)
        const data = await getResource(id)
        setResource(data)
      } catch {
        setFetchError('Resource not found.')
      } finally {
        setLoading(false)
      }
    }
    void fetchResource()
  }, [resourceId])

  async function handleSubmitBuffer() {
    if (!resource) return
    const buffer = getBuffer(String(resource.resourceId))

    const mergedBasicInfo = { ...resource.basicInfo, ...buffer.basicInfo }
    const mergedProjectDetails = { ...resource.projectDetails, ...buffer.projectDetails }

    try {
      setSubmitting(true)
      setSubmitError(null)
      const updated = await fullUpdateResource(resource.resourceId, {
        name: resource.name,
        basicInfo: mergedBasicInfo,
        projectDetails: mergedProjectDetails,
      })
      clearBuffer(String(resource.resourceId))
      setResource(updated)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit changes.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageWrapper><StatusText>Loading...</StatusText></PageWrapper>
  if (fetchError || !resource) return <PageWrapper><StatusText $error>{fetchError ?? 'Not found.'}</StatusText></PageWrapper>

  const isCompleted = resource.status === 'completed'
  const buffer = getBuffer(String(resource.resourceId))
  const hasBuffer = !!(buffer.basicInfo || buffer.projectDetails)

  const displayBasicInfo = { ...resource.basicInfo, ...buffer.basicInfo }
  const displayProjectDetails = { ...resource.projectDetails, ...buffer.projectDetails }

  return (
    <PageWrapper>
      <TopBar>
        <BackButton onClick={() => navigate(`/resources/${resource.resourceId}`)}>
          ← {resource.name}
        </BackButton>
        {isCompleted && hasBuffer && (
          <Button
            variant="primary"
            size="small"
            state={submitting ? 'disabled' : 'normal'}
            onClick={handleSubmitBuffer}
          >
            {submitting ? 'Submitting...' : 'Submit changes'}
          </Button>
        )}
      </TopBar>

      <Header>
        <TitleRow>
          <PageTitle>Details</PageTitle>
          <Badge variant={isCompleted ? 'success' : 'neutral'}>{resource.status}</Badge>
        </TitleRow>
        {hasBuffer && (
          <BufferNotice>Unsaved changes — submit to persist them to the backend.</BufferNotice>
        )}
        {submitError && <ErrorText>{submitError}</ErrorText>}
      </Header>

      <Sections>
        <Section>
          <SectionTitle>Basic Info</SectionTitle>
          <FieldGrid>
            <Field label="Resource name" value={displayBasicInfo.resourceName} buffered={!!buffer.basicInfo?.resourceName} />
            <Field label="Owner" value={displayBasicInfo.owner} buffered={!!buffer.basicInfo?.owner} />
            <Field label="Email" value={displayBasicInfo.email} buffered={!!buffer.basicInfo?.email} />
            <Field label="Priority" value={displayBasicInfo.priority} buffered={!!buffer.basicInfo?.priority} />
            <Field label="Description" value={displayBasicInfo.description} buffered={!!buffer.basicInfo?.description} fullWidth />
          </FieldGrid>
        </Section>

        <Section>
          <SectionTitle>Project Details</SectionTitle>
          <FieldGrid>
            <Field label="Project name" value={displayProjectDetails.projectName} buffered={!!buffer.projectDetails?.projectName} />
            <Field label="Budget" value={displayProjectDetails.budget} buffered={!!buffer.projectDetails?.budget} />
            <Field label="Category" value={displayProjectDetails.category} buffered={!!buffer.projectDetails?.category} />
            <Field
              label="Team members"
              value={displayProjectDetails.options?.join(', ') || '—'}
              buffered={!!buffer.projectDetails?.options}
              fullWidth
            />
          </FieldGrid>
        </Section>
      </Sections>
    </PageWrapper>
  )
}

interface FieldProps {
  label: string
  value: string
  buffered?: boolean
  fullWidth?: boolean
}

function Field({ label, value, buffered, fullWidth }: FieldProps) {
  return (
    <FieldWrapper $fullWidth={fullWidth}>
      <FieldLabel>{label}</FieldLabel>
      <FieldValue $buffered={buffered}>{value || '—'}</FieldValue>
    </FieldWrapper>
  )
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

const BufferNotice = styled.p`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.accent};
  margin: 0;
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.warning};
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
`

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`

const Section = styled.div``

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.heading};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.inkMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const FieldWrapper = styled.div<{ $fullWidth?: boolean }>`
  grid-column: ${({ $fullWidth }) => ($fullWidth ? '1 / -1' : 'auto')};
`

const FieldLabel = styled.p`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.inkMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const FieldValue = styled.p<{ $buffered?: boolean }>`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 1rem;
  color: ${({ theme, $buffered }) => ($buffered ? theme.colors.accent : theme.colors.ink)};
  margin: 0;
  font-weight: ${({ $buffered }) => ($buffered ? 500 : 400)};
`

const StatusText = styled.p<{ $error?: boolean }>`
  color: ${({ theme, $error }) => ($error ? theme.colors.warning : theme.colors.inkMuted)};
  font-family: ${({ theme }) => theme.typography.body};
`
