import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import sessionsService from '../../../services/sessionsService';
import { toast } from 'react-hot-toast';
import PromotionSessionForm from '../SessionsForm/PromotionSessionForm';

const PromotionComponents = ({ session, onUpdate }) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const { data: sessionData, error } = await sessionsService.getSessionDetails(session.id);
        
        if (error) throw error;
  
        // Transformar datos para UI
        const componentsWithStatus = sessionData.componentes.map(comp => ({
          ...comp,
          status: comp.sesiones_restantes === 0 ? 'Completado' : 'En Progreso'
        }));
  
        setComponents(componentsWithStatus);
      } catch {
        toast.error('Error al cargar componentes');
      }
    };
  
    if (session?.id) fetchComponents();
  }, [session.id, refreshKey]);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        const { data: sessionData, error } = await sessionsService.getSessionDetails(session.id);
        
        if (error) {
          toast.error('Error al cargar los componentes');
          console.error('Error fetching components:', error);
          return;
        }

        if (sessionData && sessionData.componentes) {
          setComponents(sessionData.componentes);
        }
      } catch (error) {
        toast.error('Error al cargar los componentes');
        console.error('Error in fetchComponents:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.id) {
      fetchComponents();
    }
  }, [session?.id, refreshKey]);

  const handleSessionAction = (component) => {
    setSelectedComponent(component);
    setFormOpen(true);
  };

  const handleFormClose = async (success) => {
    setFormOpen(false);
    if (success) {
      setRefreshKey(prev => prev + 1); // Forzar recarga de datos
      if (typeof onUpdate === 'function') {
        onUpdate();
      }
      toast.success('Sesión registrada exitosamente');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session?.tratamiento_asignado_id) {
    return (
      <div className="p-4 text-red-500">
        Error: Información del tratamiento no disponible
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-xl font-semibold">
          {session.paciente?.nombre || 'Paciente'} - Promoción
        </div>
        <div className="text-sm text-gray-500">
          ID Tratamiento: {session.tratamiento_asignado_id}
        </div>
      </div>

      {components.length === 0 ? (
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
          No hay componentes disponibles para este tratamiento
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Componente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sesiones Asignadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sesiones Restantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {components.map((componente, index) => (
                <tr key={`${session.tratamiento_asignado_id}-${componente.id || index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {componente.nombre_componente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {componente.sesiones_asignadas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full ${
                      componente.sesiones_restantes === 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {componente.sesiones_restantes}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full ${
                      componente.sesiones_restantes === 0 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {componente.sesiones_restantes === 0 ? 'Completado' : 'En Progreso'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleSessionAction(componente)}
                      className="px-3 py-1.5 border border-blue-500 rounded-md text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={componente.sesiones_restantes === 0}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <PromotionSessionForm
          isOpen={formOpen}
          onClose={() => handleFormClose(false)}
          treatmentId={session.id}
          componentName={selectedComponent?.nombre_componente}
          onUpdate={() => {
            setRefreshKey(prev => prev + 1);
            if (typeof onUpdate === 'function') {
              onUpdate();
            }
          }}
        />
      )}
    </div>
  );
};

PromotionComponents.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.number.isRequired,
    tratamiento_asignado_id: PropTypes.number.isRequired,
    paciente: PropTypes.shape({
      nombre: PropTypes.string,
    }),
  }).isRequired,
  onUpdate: PropTypes.func,
};

export default PromotionComponents;