/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import ContactFilters from './features/contacts/ContactFilters';
import ContactList from './features/contacts/ContactList';
import ContactDetail from './features/contacts/ContactDetail';
import ContactForm from './features/contacts/ContactForm';
import OpportunityGlobalList from './features/opportunities/OpportunityGlobalList';
import KanbanBoard from './features/kanban/KanbanBoard';
import SettingsPage from './features/settings/SettingsPage';
import TaskList from './features/tasks/TaskList';
import Dashboard from './features/dashboard/Dashboard';
import { fetchContacts, fetchContactById, deleteContact, fetchTags } from './lib/api';
import ConversationsPage from './features/conversations/ConversationsPage';

import { Plus } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  // Contacts states
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tags states
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  // Selected contact details
  const [selectedId, setSelectedId] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  // Form mode: 'view' | 'create' | 'edit'
  const [formMode, setFormMode] = useState('view');

  // Load contacts list
  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContacts({ page, size, q, tag: selectedTag });
      setContacts(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load contact details when selection changes
  const loadContactDetails = async (id) => {
    try {
      const data = await fetchContactById(id);
      setSelectedContact(data);
    } catch (err) {
      console.error('Error al cargar detalles:', err);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [page, q, selectedTag]);

  // Load tags catalogue once
  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await fetchTags();
        setTags(data);
      } catch (err) {
        console.error('Error al cargar etiquetas:', err);
      }
    };
    loadTags();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadContactDetails(selectedId);
      if (formMode === 'create') {
        setFormMode('view');
      }
    } else {
      setSelectedContact(null);
    }
  }, [selectedId]);

  const handleSearchChange = (val) => {
    setQ(val);
    setPage(1); // Reset to first page on search
  };

  const handleContactSelect = (id) => {
    setSelectedId(id);
    if (formMode === 'create') {
      setFormMode('view');
    }
  };

  const handleTagFilter = (tagName) => {
    setSelectedTag(tagName);
    setPage(1); // Reset to first page on tag filter change
  };

  const handleContactDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este contacto?')) {
      try {
        await deleteContact(id);
        if (selectedId === id) {
          setSelectedId(null);
        }
        setFormMode('view');
        loadContacts();
      } catch (err) {
        alert('Error al eliminar contacto: ' + err.message);
      }
    }
  };

  const handleContactUpdate = (updatedContact) => {
    setContacts(contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c)));
    if (selectedContact?.id === updatedContact.id) {
      setSelectedContact(updatedContact);
    }
  };

  const handleCreateClick = () => {
    setSelectedId(null);
    setSelectedContact(null);
    setFormMode('create');
  };

  const handleEditClick = () => {
    setFormMode('edit');
  };

  const handleFormSave = (savedContact) => {
    loadContacts();
    setSelectedId(savedContact.id);
    setSelectedContact(savedContact);
    setFormMode('view');
  };

  const handleFormCancel = () => {
    setFormMode('view');
  };

  // Navigation from global opportunities view to contact profile details
  const handleNavigateToContact = (contactId) => {
    setSelectedId(contactId);
    setFormMode('view');
    setCurrentView('contacts');
  };

  return (
    <AppLayout currentView={currentView} onViewChange={setCurrentView} onNavigateToContact={handleNavigateToContact}>

      {currentView === 'dashboard' && (
        <div className="animate-fadeIn">
          <Dashboard onNavigateToContact={handleNavigateToContact} onNavigateToOpportunity={() => {}} />
        </div>
      )}

      {currentView === 'contacts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
          {/* List and Filters section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-heading text-text">Catálogo de Contactos</h2>
              <button
                onClick={handleCreateClick}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Contacto
              </button>
            </div>

            <ContactFilters q={q} onSearchChange={handleSearchChange} />

            <ContactList
              contacts={contacts}
              total={total}
              page={page}
              size={size}
              loading={loading}
              error={error}
              selectedId={selectedId}
              onSelect={handleContactSelect}
              onDelete={handleContactDelete}
              onPageChange={setPage}
              onRetry={loadContacts}
              tags={tags}
              selectedTag={selectedTag}
              onTagFilter={handleTagFilter}
            />
          </div>

          {/* Details Sidebar section */}
          <div className="lg:col-span-1">
            {formMode === 'view' ? (
              <ContactDetail
                contact={selectedContact}
                onUpdate={handleContactUpdate}
                onEdit={handleEditClick}
              />
            ) : (
              <ContactForm
                contact={formMode === 'edit' ? selectedContact : null}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
              />
            )}
          </div>
        </div>
      )}

      {currentView === 'opportunities' && (
        <div className="animate-fadeIn">
          <OpportunityGlobalList onNavigateToContact={handleNavigateToContact} />
        </div>
      )}

      {currentView === 'kanban' && (
        <div className="animate-fadeIn">
          <KanbanBoard />
        </div>
      )}

      {currentView === 'tasks' && (
        <div className="animate-fadeIn">
          <TaskList />
        </div>
      )}

      {currentView === 'conversations' && (
        <div className="animate-fadeIn -mx-8 -my-8" style={{ height: 'calc(100vh - 64px)' }}>
          <ConversationsPage onNavigateToContact={handleNavigateToContact} />
        </div>
      )}

      {currentView === 'settings' && (
        <div className="animate-fadeIn">
          <SettingsPage />
        </div>
      )}

    </AppLayout>
  );
}

export default App;
