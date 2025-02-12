import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionsService from '../../services/sessionsService';
import SessionDetails from './SessionsForm/SessionDetails';
import SessionForm from './SessionsForm/SessionForm';
const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await sessionsService.getAllSessions();
      if (error) throw error;
      setSessions(data);
      setFilteredSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByName = () => {
    const filtered = sessions.filter(session => 
      session.paciente?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSessions(filtered);
  };

  const handleSearchByDate = () => {
    if (!startDate || !endDate) return;
    
    const filtered = sessions.filter(session => {
      const sessionDate = new Date(session.fecha_asignacion);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
    setFilteredSessions(filtered);
  };

  const handleResetFilters = () => {
    setFilteredSessions(sessions);
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
  };

  const handleCloseForm = (shouldRefresh = false) => {
    setIsFormOpen(false);
    setEditingSession(null);
    if (shouldRefresh) loadSessions();
  };
  

  const getStatusBadge = (session) => {
    if (session.tratamiento?.es_promocion) {
      return <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs">PROMOCIÓN</span>;
    }
    
    if (session.sesiones_restantes <= 0) {
      return <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs">Completado</span>;
    }
    
    return session.sesiones_asignadas === session.sesiones_restantes 
      ? <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs">Sin iniciar</span>
      : <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs">En progreso</span>;
  };

  const handleOpenForm = (session = null) => {
    if (session && session.sesiones_restantes <= 0) {
      alert('El tratamiento ya está completado, no se puede agregar una nueva sesión.');
      return;
    }
    setIsFormOpen(true);
    setEditingSession(session);
  };
  

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
        >
          ← Volver
        </button>
        <h1 className="text-3xl font-bold">Control de Sesiones</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow border rounded-md px-3 py-2"
          />
          <button
            onClick={handleSearchByName}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Buscar
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700">Fecha desde</label>
            <input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700">Fecha hasta</label>
            <input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <button
            onClick={handleSearchByDate}
            className="self-end bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Buscar por fecha
          </button>
        </div>

        <button
          onClick={handleResetFilters}
          className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          Mostrar todos
        </button>
      </div>

      {loading ? (
        <div className="w-full h-2 bg-blue-200">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Paciente</th>
                <th className="px-4 py-2 text-left">Tratamiento</th>
                <th className="px-4 py-2 text-left">Primera Sesión</th>
                <th className="px-4 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-gray-50 cursor-pointer border-b"
                  onClick={() => setSelectedSession(session)}
                >
                  <td className="px-4 py-2">{session.id}</td>
                  <td className="px-4 py-2">{session.paciente?.nombre || "Sin nombre"}</td>
                  <td className="px-4 py-2">
                    {session.tratamiento?.es_promocion && '🎁 '}
                    {session.tratamiento?.nombre || "Sin tratamiento"}
                  </td>
                  <td className="px-4 py-2">
                    {session.fecha_asignacion
                      ? new Date(session.fecha_asignacion).toLocaleDateString()
                      : "Fecha desconocida"}
                  </td>
                  <td className="px-4 py-2">{getStatusBadge(session)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Detalles de la Sesión</h2>
            <SessionDetails 
              session={selectedSession} 
              onOpenForm={handleOpenForm}
              onClose={() => setSelectedSession(null)}
            />
            <button 
              onClick={() => setSelectedSession(null)}
              className="bg-red-500 text-white px-4 py-2 rounded-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {isFormOpen && (
      <SessionForm
        open={isFormOpen}
        onClose={handleCloseForm}
        sessionData={editingSession}
        tratamientoAsignadoId={selectedSession?.id || editingSession?.id} // Aquí asegúrate de que es el ID correcto
        isPromotion={selectedSession?.tratamiento?.es_promocion || false}
        componentData={selectedSession?.tratamiento || {}}
      />
      
      
    )}
    </div>
  );
};

export default Sessions;