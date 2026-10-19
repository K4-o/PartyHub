import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePartyStore } from './store/usePartyStore';
import LandingPage from './components/LandingPage';
import HostView from './components/host/HostView';
import ControllerView from './components/controller/ControllerView';

function App() {
  const initSocket = usePartyStore(s => s.initSocket);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/host" element={<HostView />} />
        <Route path="/play" element={<ControllerView />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
