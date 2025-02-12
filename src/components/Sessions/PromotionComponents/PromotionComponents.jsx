import { useState } from 'react';
import PropTypes from 'prop-types';
import SessionForm from './SessionForm';

const PromotionComponents = ({ session }) => {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const handleSessionAction = (component, session = null) => {
    setSelectedComponent(component);
    setSelectedSession(session);
    setFormOpen(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        {session.paciente.nombre} - Promoción
      </h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Componente</th>
              <th className="px-4 py-2 text-left">Sesiones Realizadas</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {session.componentes.map((componente) => (
              <tr key={componente.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{componente.nombre}</td>
                <td className="px-4 py-2">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs ${
                      componente.sesiones_realizadas === componente.sesiones_totales
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {componente.sesiones_realizadas}/{componente.sesiones_totales}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleSessionAction(componente)}
                    className="text-blue-500 hover:text-blue-700 border border-blue-500 rounded px-2 py-1"
                  >
                    Nueva Sesión
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SessionForm
        open={formOpen}
        onClose={(success) => {
          setFormOpen(false);
          if (success) {
            // Actualizar datos aquí
          }
        }}
        treatmentId={session.id}
        isPromotion={true}
        componentData={selectedComponent}
        sessionData={selectedSession}
      />
    </div>
  );
};

PromotionComponents.propTypes = {
  session: PropTypes.shape({
    paciente: PropTypes.shape({
      nombre: PropTypes.string.isRequired,
    }).isRequired,
    componentes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        nombre: PropTypes.string.isRequired,
        sesiones_realizadas: PropTypes.number.isRequired,
        sesiones_totales: PropTypes.number.isRequired,
      })
    ).isRequired,
    id: PropTypes.number.isRequired,
  }).isRequired,
};

export default PromotionComponents;