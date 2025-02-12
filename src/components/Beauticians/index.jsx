import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { PencilIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Beauticians() {
  const [beauticians, setBeauticians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: ''
  });
  const [selectedBeautician, setSelectedBeautician] = useState(null);

  const fetchBeauticians = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('asistentes')
        .select(`
          *,
          pagos_asistentes (monto)
        `);
  
      if (error) throw error;
  
      // Calcular ingresos totales para cada esteticista
      const beauticiansWithTotals = data.map(beautician => ({
        ...beautician,
        ingresos_totales: beautician.pagos_asistentes
          ? beautician.pagos_asistentes.reduce((sum, payment) => sum + (payment.monto || 0), 0)
          : 0
      }));
  
      setBeauticians(beauticiansWithTotals);
    } catch (error) {
      console.error('Error fetching beauticians:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeauticians();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedBeautician) {
        // Actualizar esteticista existente
        const { error } = await supabase
          .from('asistentes')
          .update(formData)
          .eq('id', selectedBeautician.id);

        if (error) throw error;
      } else {
        // Agregar nuevo esteticista
        const { error } = await supabase
          .from('asistentes')
          .insert(formData);

        if (error) throw error;
      }
      
      // Actualizar lista
      fetchBeauticians();
      
      // Resetear formulario
      setFormData({
        nombre: '',
        telefono: ''
      });
      setSelectedBeautician(null);
    } catch (error) {
      console.error('Error saving beautician:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (beautician) => {
    setSelectedBeautician(beautician);
    setFormData({
      nombre: beautician.nombre,
      telefono: beautician.telefono
    });
  };

  const cancelEdit = () => {
    setSelectedBeautician(null);
    setFormData({
      nombre: '',
      telefono: ''
    });
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => window.history.back()} 
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            Control de Esteticistas
          </h2>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner">Cargando...</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Form content remains the same */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9e8d59] focus:ring-[#9e8d59]"
              placeholder="Ingrese nombre"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9e8d59] focus:ring-[#9e8d59]"
              placeholder="Ingrese teléfono"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-[#9e8d59] text-white rounded-md hover:bg-[#8a7b4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9e8d59] disabled:opacity-50"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {selectedBeautician ? 'Modificar' : 'Agregar'}
          </button>
          {selectedBeautician && (
            <button
              type="button"
              onClick={cancelEdit}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table content remains the same */}
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'Nombre', 'Teléfono', 'Ingresos Totales'].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {beauticians.map((beautician) => (
              <tr key={beautician.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{beautician.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{beautician.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">{beautician.telefono}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${beautician.ingresos_totales.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEdit(beautician)}
                    disabled={loading}
                    className="text-[#9e8d59] hover:text-[#8a7b4d] mr-3 disabled:opacity-50"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}