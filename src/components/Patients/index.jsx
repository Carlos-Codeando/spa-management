import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { UserPlusIcon, PencilIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import AddTreatments from './addTreatments'; // Importa el componente AddTreatments

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    sexo: 'Masculino',
    fecha_nacimiento: '',
    edad: '',
    telefono: '',
    correo: ''
  });
  const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false); // Estado para manejar la visibilidad del modal

  // Fetch patients from Supabase
  const fetchPatients = async (searchTerm = '') => {
    setLoading(true);
    try {
      let query = supabase.from('pacientes').select('*');
      
      if (searchTerm) {
        query = query.or(
          `nombre.ilike.%${searchTerm}%,correo.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    fetchPatients(term);
  };

  // Calculate age
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'fecha_nacimiento') {
      const age = calculateAge(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        edad: age.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Submit form (Add/Edit patient)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedPatient) {
        // Update patient
        const { error } = await supabase
          .from('pacientes')
          .update(formData)
          .eq('id', selectedPatient.id);
        
        if (error) throw error;
      } else {
        // Add new patient
        const { error } = await supabase
          .from('pacientes')
          .insert(formData);
        
        if (error) throw error;
      }
      
      fetchPatients();
      
      // Reset form
      setFormData({
        nombre: '',
        sexo: 'Masculino',
        fecha_nacimiento: '',
        edad: '',
        telefono: '',
        correo: ''
      });
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error saving patient:', error);
    } finally {
      setLoading(false);
    }
  };

  // Edit patient
  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      nombre: patient.nombre,
      sexo: patient.sexo,
      fecha_nacimiento: patient.fecha_nacimiento,
      edad: patient.edad,
      telefono: patient.telefono,
      correo: patient.correo
    });
  };

  // Delete patient
  const handleDelete = async (patientId) => {
    if (window.confirm('¿Está seguro de eliminar este paciente?')) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('pacientes')
          .delete()
          .eq('id', patientId);
        
        if (error) throw error;
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Abrir el modal de asignación de tratamientos
  const handleOpenAssignTreatment = (patient) => {
    setSelectedPatient(patient);
    setIsAddTreatmentModalOpen(true);
  };

  // Cerrar el modal de asignación de tratamientos
  const handleCloseAssignTreatment = () => {
    setIsAddTreatmentModalOpen(false);
    setSelectedPatient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Control de Pacientes</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9e8d59] focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9e8d59] focus:ring-[#9e8d59]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sexo</label>
            <select
              name="sexo"
              value={formData.sexo}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9e8d59] focus:ring-[#9e8d59]"
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9e8d59] focus:ring-[#9e8d59]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Edad</label>
            <input
              type="number"
              name="edad"
              value={formData.edad}
              onChange={handleInputChange}
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9e8d59] focus:ring-[#9e8d59]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9e8d59] focus:ring-[#9e8d59]"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex space-x-3">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-[#9e8d59] text-white rounded-md hover:bg-[#8a7b4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9e8d59]"
          >
            <UserPlusIcon className="w-5 h-5 mr-2" />
            {selectedPatient ? 'Modificar' : 'Agregar'}
          </button>
          {selectedPatient && (
            <button
              type="button"
              onClick={() => {
                setSelectedPatient(null);
                setFormData({
                  nombre: '',
                  sexo: 'Masculino',
                  fecha_nacimiento: '',
                  edad: '',
                  telefono: '',
                  correo: ''
                });
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancelar
            </button>
          )}
          {selectedPatient && (
            <button
              type="button"
              onClick={() => handleOpenAssignTreatment(selectedPatient)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Asignar Tratamiento
            </button>
          )}
        </div>
      </form>

      {/* Tabla */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'Nombre', 'Sexo', 'Fecha Nac.', 'Edad', 'Teléfono', 'Correo'].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{patient.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patient.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patient.sexo}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patient.fecha_nacimiento}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patient.edad}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patient.telefono}</td>
                <td className="px-6 py-4 whitespace-nowrap">{patient.correo}</td>
                <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                  <button onClick={() => handleEdit(patient)} className="text-blue-600 hover:text-blue-900">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(patient.id)} className="text-red-600 hover:text-red-900">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleOpenAssignTreatment(patient)} className="text-green-600 hover:text-green-900">
                    <PlusCircleIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  Cargando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de asignación de tratamientos */}
      {isAddTreatmentModalOpen && (
        <AddTreatments 
          patientId={selectedPatient.id} 
          onClose={handleCloseAssignTreatment} 
        />
      )}
    </div>
  );
}