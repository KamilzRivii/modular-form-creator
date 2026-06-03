import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Input, Select } from '../design-system'
import { getResource, updateBasicInfo } from '../api/resources'
import type { BasicInfo, Resource } from '../api/types'
import { useEditBuffer } from '../context/EditBufferContext'

const PRIORITY_OPTIONS = [
  { value: '', label: 'Select priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const EMPTY_FORM: BasicInfo = {
  resourceName: '',
  owner: '',
  email: '',
  description: '',
  priority: '',
}

export function BasicInfoPage() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()
  const { setBasicInfoBuffer } = useEditBuffer()

  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [form, setForm] = useState<BasicInfo>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<BasicInfo>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!resourceId) return
    fetchResource()
  }, [resourceId])

  async function fetchResource() {
    try {
      setLoading(true)
      setFetchError(null)
      const data = await getResource(resourceId!)
      setResource(data)
      setForm({ ...EMPTY_FORM, ...data.basicInfo })
    } catch {
      setFetchError('Failed to load resource.')
    } finally {
      setLoading(false)
    }
  }

  function validate(): boolean {
    const next: Partial<BasicInfo> = {}
    if (!form.resourceName.trim()) next.resourceName = 'Required'
    if (!form.owner.trim()) next.owner = 'Required'
    if (!form.email.trim()) {
      next.email = 'Required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Invalid email address'
    }
    if (!form.description.trim()) next.description = 'Required'
    if (!form.priority) next.priority = 'Required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (!resource || !validate()) return

    if (resource.status === 'completed') {
      setBasicInfoBuffer(String(resource.resourceId), form)
      navigate(`/resources/${resource.resourceId}`)
      return
    }

    try {
      setSaving(true)
      setSaveError(null)
      await updateBasicInfo(resource.resourceId, form)
      setSaved(true)
      setTimeout(() => navigate(`/resources/${resource.resourceId}`), 800)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  function handleField(field: keyof BasicInfo, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSaved(false)
  }

  if (loading) return <PageWrapper><StatusText>Loading...</StatusText></PageWrapper>
  if (fetchError || !resource) return <PageWrapper><StatusText $error>{fetchError ?? 'Not found.'}</StatusText></PageWrapper>

  const isCompleted = resource.status === 'completed'

  return (
    <PageWrapper>
      <TopBar>
        <BackButton onClick={() => navigate(`/resources/${resource.resourceId}`)}>
          ← {resource.name}
        </BackButton>
      </TopBar>

      <Header>
        <PageTitle>Basic Info</PageTitle>
        {isCompleted && (
          <CompletedNotice>
            This resource is completed. Changes will be saved as a draft and must be submitted manually.
          </CompletedNotice>
        )}
      </Header>

      <Form>
        <Input
          label="Resource name"
          value={form.resourceName}
          state="locked"
          tooltip="Resource name cannot be changed after creation"
        />
        <Input
          label="Owner"
          value={form.owner}
          onChange={(e) => handleField('owner', e.target.value)}
          error={errors.owner}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => handleField('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => handleField('description', e.target.value)}
          error={errors.description}
          multiline
          rows={4}
        />
        <Select
          label="Priority"
          value={form.priority}
          options={PRIORITY_OPTIONS}
          onChange={(e) => handleField('priority', e.target.value)}
          error={errors.priority}
        />

        {saveError && <ErrorText>{saveError}</ErrorText>}

        <FormActions>
          <Button
            variant="secondary"
            onClick={() => navigate(`/resources/${resource.resourceId}`)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            state={saving ? 'disabled' : 'normal'}
            onClick={handleSave}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : isCompleted ? 'Save as draft' : 'Save'}
          </Button>
        </FormActions>
      </Form>
    </PageWrapper>
  )
}

const PageWrapper = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`

const TopBar = styled.div`
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

const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.heading};
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.inkStrong};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`

const CompletedNotice = styled.p`
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.accent};
  margin: 0;
`

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const StatusText = styled.p<{ $error?: boolean }>`
  color: ${({ theme, $error }) => ($error ? theme.colors.warning : theme.colors.inkMuted)};
  font-family: ${({ theme }) => theme.typography.body};
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.warning};
  font-family: ${({ theme }) => theme.typography.body};
  font-size: 0.875rem;
  margin: 0;
`
