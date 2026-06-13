import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Search } from 'lucide-react';
import { fetchProductServices, createProductService, updateProductService, deleteProductService } from '../../lib/api';

export default function ProductServiceManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'product',
    sku: '',
    internal_code: '',
    brand: '',
    category: '',
    area: 'commercial',
    unit: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadItems();
  }, [searchTerm]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchProductServices({ search: searchTerm });
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        type: item.type,
        sku: item.sku || '',
        internal_code: item.internal_code || '',
        brand: item.brand || '',
        category: item.category || '',
        area: item.area,
        unit: item.unit || '',
        description: item.description || '',
        is_active: item.is_active
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        type: 'product',
        sku: '',
        internal_code: '',
        brand: '',
        category: '',
        area: 'commercial',
        unit: '',
        description: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateProductService(editingItem.id, formData);
      } else {
        await createProductService(formData);
      }
      closeModal();
      loadItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de desactivar/eliminar este elemento?')) return;
    try {
      await deleteProductService(id);
      loadItems();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Package className="w-6 h-6 mr-2 text-primary" />
          Catálogo Comercial
        </h2>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Elemento
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar producto o servicio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Cargando catálogo...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className={!item.is_active ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {item.brand && <span className="font-semibold text-gray-600 mr-1">[{item.brand}]</span>}
                      {item.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type === 'product' ? 'Producto' : 'Servicio'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="capitalize">{item.area}</span>
                    {item.category && <div className="text-xs text-gray-400 truncate max-w-[120px]">{item.category}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{item.sku || '-'}</div>
                    {item.internal_code && <div className="text-xs text-gray-400">Int: {item.internal_code}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron productos ni servicios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in">
            <h3 className="text-lg font-bold mb-4 text-gray-900 border-b pb-2">
              {editingItem ? 'Editar Producto / Servicio' : 'Nuevo Producto / Servicio'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sección 1: Identificación */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Identificación
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-primary focus:border-primary focus:outline-none"
                    >
                      <option value="product">Producto</option>
                      <option value="service">Servicio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary focus:outline-none"
                      placeholder="Ej. Cámara de Seguridad IP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU (Opcional)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary focus:outline-none"
                      placeholder="Ej. CAM-IP-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código Interno VP (Opcional)</label>
                    <input
                      type="text"
                      value={formData.internal_code}
                      onChange={(e) => setFormData({ ...formData, internal_code: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary focus:outline-none"
                      placeholder="Ej. COD-1234"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Clasificación */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Clasificación
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marca (Opcional)</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary focus:outline-none"
                      placeholder="Ej. Hikvision"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría (Opcional)</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary focus:outline-none"
                      placeholder="Ej. CCTV / Monitoreo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Área *</label>
                    <select
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-primary focus:border-primary focus:outline-none"
                    >
                      <option value="residential">Residencial</option>
                      <option value="commercial">Comercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unidad (Opcional)</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary focus:outline-none"
                      placeholder="Ej. pza, m, global"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Descripción & Estado */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Descripción y Estado
                </h4>
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary focus:outline-none"
                      placeholder="Detalles adicionales sobre el producto o servicio..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 font-medium">
                      Elemento Activo
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  {editingItem ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
