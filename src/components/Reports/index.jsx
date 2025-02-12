import { useState, useEffect, useCallback } from 'react';
import { FolderIcon, LanguageIcon, WindowIcon } from '@heroicons/react/24/solid';
import reportsService from '../../services/reportsService';
import  beauticiansService  from "../../services/beauticiansService";
import  treatmentService from '../../services/treatmentsService';

const ReportsManagement = () => {
  const [filters, setFilters] = useState({
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    esteticista: 'Todos',
    tratamiento: 'Todos',
  });

  const [assignedTreatments, setAssignedTreatments] = useState([]);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [beauticians, setBeauticians] = useState(['Todos']);
  const [tratamientos, setTratamientos] = useState(['Todos']);
  const [summary, setSummary] = useState({
    totalTratamientos: 0,
    totalMontos: 0, 
  });

  const fetchFilterData = useCallback(async () => {
    try {
      const beauticians = await beauticiansService.getAllBeauticians();
      const tratamientos = await treatmentService.getAllTreatments();

      setBeauticians(['Todos', ...beauticians]);
      setTratamientos(['Todos', ...tratamientos]);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  }, []);

  const searchReports = useCallback(async () => {
    try {
      const result = await reportsService.getReports(filters);
      setAssignedTreatments(result.assignedTreatments);
      setSummary(result.summary || { totalTratamientos: 0, totalMontos: 0 });
    } catch (error) {
      console.error('Error searching reports:', error);
      // Set a default summary in case of error
      setSummary({ totalTratamientos: 0, totalMontos: 0 });
    }
  }, [filters]);

  useEffect(() => {
    fetchFilterData();
    searchReports();
  }, [fetchFilterData, searchReports]);

  const handleTreatmentSelect = async (treatmentId) => {
    try {
      const sessionDetails = await reportsService.getSessionDetails(treatmentId);
      setSessionDetails(sessionDetails);
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  const exportToExcel = () => {
    reportsService.exportToExcel(filters);
  };

  const exportToPDF = () => {
    reportsService.exportToPDF(filters);
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Reportes de Tratamientos
      </h2>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Desde
            </label>
            <input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hasta
            </label>
            <input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Esteticista
            </label>
            <select
              value={filters.esteticista}
              onChange={(e) => setFilters(prev => ({ ...prev, esteticista: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300"
            >
              {beauticians.map(esteticista => (
                <option key={esteticista} value={esteticista}>
                  {esteticista}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tratamiento
            </label>
            <select
              value={filters.tratamiento}
              onChange={(e) => setFilters(prev => ({ ...prev, tratamiento: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300"
            >
              {tratamientos.map(tratamiento => (
                <option key={tratamiento} value={tratamiento}>
                  {tratamiento}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={searchReports}
            className="inline-flex items-center px-4 py-2 bg-[#9e8d59] text-white rounded-md hover:bg-[#8a7b4d]"
          >
            <WindowIcon className="w-5 h-5 mr-2" />
            Buscar
          </button>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            <FolderIcon className="w-5 h-5 mr-2" />
            Exportar Excel
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            <LanguageIcon className="w-5 h-5 mr-2" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white shadow rounded-lg p-4 flex justify-between">
        <div>Total Tratamientos: {summary.totalTratamientos}</div>
        <div>Total Montos: ${summary.totalMontos.toFixed(2)}</div>
      </div>

      {/* Assigned Treatments Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tratamiento
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignedTreatments.map((treatment, index) => (
              <tr 
                key={index} 
                onClick={() => handleTreatmentSelect(treatment.id)}
                className="hover:bg-gray-100 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">{treatment.fecha}</td>
                <td className="px-6 py-4 whitespace-nowrap">{treatment.paciente}</td>
                <td className="px-6 py-4 whitespace-nowrap">{treatment.tratamiento}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">${treatment.monto.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Session Details Table */}
      {sessionDetails.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th>Fecha Sesión</th>
                <th>Número Sesión</th>
                <th>Monto Total</th>
                <th>Monto Esteticista</th>
                <th>Monto Vendedor</th>
                <th>Monto Neto</th>
              </tr>
            </thead>
            <tbody>
              {sessionDetails.map((session, index) => (
                <tr key={index}>
                  <td>{session.fechaSesion}</td>
                  <td>{session.numeroSesion}</td>
                  <td>${session.montoTotal.toFixed(2)}</td>
                  <td>${session.montoEsteticista.toFixed(2)}</td>
                  <td>${session.montoVendedor.toFixed(2)}</td>
                  <td>${session.montoNeto.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;
