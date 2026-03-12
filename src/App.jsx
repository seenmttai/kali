import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import AppShell from './components/layout/AppShell'

import HomePage from './pages/HomePage'
import CameraPage from './pages/CameraPage'
import ResultPage from './pages/ResultPage'
import HistoryPage from './pages/HistoryPage'
import SymptomsPage from './pages/SymptomsPage'
import ProfilePage from './pages/ProfilePage'
import RemindersPage from './pages/RemindersPage'
import DoctorPage from './pages/DoctorPage'
import BadgesPage from './pages/BadgesPage'

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="symptoms" element={<SymptomsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="doctor" element={<DoctorPage />} />
            <Route path="badges" element={<BadgesPage />} />
          </Route>
          {/* Full screen routes outside of shell */}
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/results" element={<ResultPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
