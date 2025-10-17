import React, { useState } from 'react';
import { Package, Home, List, Plus, Camera } from 'lucide-react';
import './App.css';
import Dashboard from './components/Dashboard';
import ActivosListSimple from './components/ActivosListSimple';
import ActivoForm from './components/ActivoForm';
import QRScanner from './components/QRScanner';
import LocationsManager from './components/LocationsManager';
import ResponsiblesManager from './components/ResponsiblesManager';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedActivo, setSelectedActivo] = useState(null);

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view !== 'edit') {
      setSelectedActivo(null);
    }
  };

  const handleEditActivo = (activo) => {
    setSelectedActivo(activo);
    setCurrentView('edit');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} />;
      case 'list':
        return <ActivosListSimple onEdit={handleEditActivo} onBack={() => handleViewChange('dashboard')} />;
      case 'new':
        return <ActivoForm onBack={() => handleViewChange('list')} />;
      case 'edit':
        return <ActivoForm activo={selectedActivo} onBack={() => handleViewChange('list')} />;
      case 'scanner':
        return <QRScanner onBack={() => handleViewChange('dashboard')} />;
      case 'locations':
        return <LocationsManager onBack={() => handleViewChange('dashboard')} />;
      case 'responsibles':
        return <ResponsiblesManager onBack={() => handleViewChange('dashboard')} />;
      default:
        return <Dashboard onViewChange={handleViewChange} />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1 onClick={() => handleViewChange('dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={28} /> Inventario Cielo
          </h1>
          <nav className="main-nav">
            <button 
              className={currentView === 'dashboard' ? 'active' : ''} 
              onClick={() => handleViewChange('dashboard')}
            >
              <Home size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Dashboard
            </button>
            <button 
              className={currentView === 'list' ? 'active' : ''} 
              onClick={() => handleViewChange('list')}
            >
              <List size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Activos
            </button>
            <button 
              className={currentView === 'new' ? 'active' : ''} 
              onClick={() => handleViewChange('new')}
            >
              <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Nuevo
            </button>
            <button 
              className={currentView === 'scanner' ? 'active' : ''} 
              onClick={() => handleViewChange('scanner')}
            >
              <Camera size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Escanear QR
            </button>
          </nav>
        </div>
      </header>
      
      <main className="app-main">
        {renderView()}
      </main>

      <footer className="app-footer">
        <p>© 2025 Inventario Cielo - Sistema de Gestión de Activos</p>
      </footer>
    </div>
  );
}

export default App;
