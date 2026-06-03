import { Navigate, Route, Routes } from 'react-router-dom'

// Pages — to be implemented in upcoming steps
const ResourcesListPage = () => <div>Resources List</div>
const ResourceOverviewPage = () => <div>Resource Overview</div>
const ResourceDetailsPage = () => <div>Resource Details</div>
const BasicInfoPage = () => <div>Basic Info</div>
const ProjectDetailsPage = () => <div>Project Details</div>

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/resources" replace />} />
      <Route path="/resources" element={<ResourcesListPage />} />
      <Route path="/resources/:resourceId" element={<ResourceOverviewPage />} />
      <Route path="/resources/:resourceId/details" element={<ResourceDetailsPage />} />
      <Route path="/resources/:resourceId/basic-info" element={<BasicInfoPage />} />
      <Route path="/resources/:resourceId/project-details" element={<ProjectDetailsPage />} />
    </Routes>
  )
}

export default App
