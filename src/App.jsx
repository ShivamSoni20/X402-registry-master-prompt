import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ServiceRegistry from './components/ServiceRegistry';
import ServiceDetail from './components/ServiceDetail';
import RegisterService from './components/RegisterService';
import MyServices from './components/MyServices';
import SlashEvents from './components/SlashEvents';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Routes>
      {/* Landing page — standalone without sidebar layout */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Application routes — wrapped in Sidebar Layout */}
      <Route 
        path="/*" 
        element={
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/discover" element={<ServiceRegistry />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/register" element={<RegisterService />} />
              <Route path="/my-services" element={<MyServices />} />
              <Route path="/slash-events" element={<SlashEvents />} />
              {/* Catch-all: Direct internal path issues to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        } 
      />
    </Routes>
  );
}

export default App;
