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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Componente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sesiones Realizadas</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {session.componentes.map((componente) => (
              <tr key={componente.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800">{componente.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${componente.sesiones_realizadas === componente.sesiones_totales 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'}`}>
                    {componente.sesiones_realizadas}/{componente.sesiones_totales}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleSessionAction(componente)}
                    className="px-3 py-1.5 border border-blue-500 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
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