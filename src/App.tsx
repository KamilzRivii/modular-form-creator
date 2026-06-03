import { Navigate, Route, Routes } from 'react-router-dom'
import { EditBufferProvider } from './context/EditBufferContext'
import { ResourcesListPage } from './pages/ResourcesListPage'
import { ResourceOverviewPage } from './pages/ResourceOverviewPage'
import { ResourceDetailsPage } from './pages/ResourceDetailsPage'
import { BasicInfoPage } from './pages/BasicInfoPage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'

function App() {
  return (
    <EditBufferProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/resources" replace />} />
        <Route path="/resources" element={<ResourcesListPage />} />
        <Route path="/resources/:resourceId" element={<ResourceOverviewPage />} />
        <Route path="/resources/:resourceId/details" element={<ResourceDetailsPage />} />
        <Route path="/resources/:resourceId/basic-info" element={<BasicInfoPage />} />
        <Route path="/resources/:resourceId/project-details" element={<ProjectDetailsPage />} />
      </Routes>
    </EditBufferProvider>
  )
}

export default App
