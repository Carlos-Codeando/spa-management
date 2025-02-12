import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { HomeIcon, UserGroupIcon, ClipboardIcon, UserIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import logotipo from './assets/logotipo.png'
import PropTypes from 'prop-types'
// Componentes
import Patients from './components/Patients'
import Treatments from './components/Treatments'
import Beauticians from './components/Beauticians'
import Sessions from './components/Sessions'
import Reports from './components/Reports'

function NavItem({ path, name, icon: Icon }) {
  const location = useLocation()
  const isActive = location.pathname === path
  
  return (
    <Link 
      to={path}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
        isActive 
          ? 'bg-[#9e8d59] text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="font-medium">{name}</span>
    </Link>
  )
}

// Definir los PropTypes para NavItem
NavItem.propTypes = {
  path: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired
}


function App() {
  const menuItems = [
    { path: '/', name: 'Dashboard', icon: HomeIcon },
    { path: '/patients', name: 'Pacientes', icon: UserGroupIcon, component: Patients },
    { path: '/treatments', name: 'Tratamientos', icon: ClipboardIcon, component: Treatments },
    { path: '/beauticians', name: 'Esteticistas', icon: UserIcon, component: Beauticians },
    { path: '/sessions', name: 'Sesiones', icon: CalendarIcon, component: Sessions },
    { path: '/reports', name: 'Reportes', icon: ChartBarIcon, component: Reports }
  ]

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <img 
                src={logotipo} 
                alt="Logo" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-800 text-center mb-8">
              Sistema de Gestión
            </h1>
          </div>

          {/* Navegación */}
          <nav className="px-4 space-y-1">
            {menuItems.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
          </nav>
        </div>

        {/* Área principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Spa Management System
            </h2>
            <div className="ml-auto flex items-center space-x-4">
              {/* Aquí puedes agregar notificaciones, perfil, etc. */}
            </div>
          </header>

          {/* Contenido principal */}
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <Routes>
                {menuItems.map(({ path, component: Component }) => (
                  Component && <Route 
                    key={path}
                    path={path} 
                    element={<Component />} 
                  />
                ))}
                <Route path="/" element={
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Cards de resumen */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-2">Total Pacientes</h3>
                      <p className="text-3xl font-bold text-[#9e8d59]">150</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-2">Sesiones Hoy</h3>
                      <p className="text-3xl font-bold text-[#9e8d59]">12</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-2">Tratamientos Activos</h3>
                      <p className="text-3xl font-bold text-[#9e8d59]">45</p>
                    </div>
                  </div>
                } />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App