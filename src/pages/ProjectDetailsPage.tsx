import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, CheckboxGroup, Input, Select } from '../design-system'
import { getResource, updateProjectDetails } from '../api/resources'
import type { ProjectDetails, Resource } from '../api/types'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select category' },
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'vendor', label: 'Vendor' },
]

const AVAILABLE_OPTIONS = ['FE devs', 'BE devs', 'Designer', 'Data Eng', 'Product Owner']

const EMPTY_FORM: ProjectDetails = {
  projectName: '',
  budget: '',
  category: '',
  options: [],
}

export function ProjectDetailsPage() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()

  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [form, setForm] = useState<ProjectDetails>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectDetails, string>>>({})
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
      setForm({ ...EMPTY_FORM, ...data.projectDetails })
    } catch {
      setFetchError('Failed to load resource.')
    } finally {
      setLoading(false)
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof ProjectDetails, string>> = {}
    if (!form.projectName.trim()) next.projectName = 'Required'
    if (!form.budget.trim()) {
      next.budget = 'Required'
    } else if (!/^\d+$/.test(form.budget.trim())) {
      next.budget = 'Must be a whole number'
    }
    if (!form.category) next.category = 'Required'
    if (form.options.length === 0) next.options = 'At least one team member is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (!resource || !validate()) return

    if (resource.status === 'completed') {
      navigate(`/resources/${resource.resourceId}`, {
        state: { projectDetailsBuffer: form },
      })
      return
    }

    try {
      setSaving(true)
      setSaveError(null)
      await updateProjectDetails(resource.resourceId, form)
      setSaved(true)
      setTimeout(() => navigate(`/resources/${resource.resourceId}`), 800)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  function handleField(field: keyof Omit<ProjectDetails, 'options'>, value: string) {
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
        <PageTitle>Project Details</PageTitle>
        {isCompleted && (
          <CompletedNotice>
            This resource is completed. Changes will be saved as a draft and must be submitted manually.
          </CompletedNotice>
        )}
      </Header>

      <Form>
        <Input
          label="Project name"
          value={form.projectName}
          onChange={(e) => handleField('projectName', e.target.value)}
          error={errors.projectName}
        />
        <Input
          label="Budget"
          value={form.budget}
          onChange={(e) => handleField('budget', e.target.value)}
          error={errors.budget}
        />
        <Select
          label="Category"
          value={form.category}
          options={CATEGORY_OPTIONS}
          onChange={(e) => handleField('category', e.target.value)}
          error={errors.category}
        />
        <CheckboxGroup
          label="Team members"
          options={AVAILABLE_OPTIONS}
          value={form.options}
          onChange={(next) => {
            setForm((prev) => ({ ...prev, options: next }))
            setErrors((prev) => ({ ...prev, options: undefined }))
            setSaved(false)
          }}
          error={errors.options}
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
