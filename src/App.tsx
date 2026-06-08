/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, Appointment, MessageTemplate, ServiceType, AppointmentStatus } from './types';
import { INITIAL_CLIENTS, INITIAL_APPOINTMENTS, INITIAL_TEMPLATES } from './initialData';
import { formatDateFriendly, formatCurrency } from './utils/helpers';

// Lucide Icons
import { 
  Sparkles, Calendar, User, MessageSquare, FileText, Plus, 
  Trash2, Edit, Check, AlertCircle, RefreshCw, Smartphone, Heart, ChevronRight 
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import WhatsappDisparador from './components/WhatsappDisparador';
import TemplateEditor from './components/TemplateEditor';
import AppointmentForm from './components/AppointmentForm';

import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Master states
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'painel' | 'clientes' | 'disparador' | 'templates'>('painel');
  
  // Scheduling modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [preselectedClientId, setPreselectedClientId] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const storedClients = localStorage.getItem('crm_pet_clients');
      const storedAppointments = localStorage.getItem('crm_pet_appointments');
      const storedTemplates = localStorage.getItem('crm_pet_templates');

      setClients(storedClients ? JSON.parse(storedClients) : INITIAL_CLIENTS);
      setAppointments(storedAppointments ? JSON.parse(storedAppointments) : INITIAL_APPOINTMENTS);
      setTemplates(storedTemplates ? JSON.parse(storedTemplates) : INITIAL_TEMPLATES);
    } catch (e) {
      console.warn("Could not load from localStorage, defaulting to initial state", e);
      setClients(INITIAL_CLIENTS);
      setAppointments(INITIAL_APPOINTMENTS);
      setTemplates(INITIAL_TEMPLATES);
    }
  }, []);

  // Save states helper
  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('crm_pet_clients', JSON.stringify(newClients));
  };

  const saveAppointments = (newApps: Appointment[]) => {
    setAppointments(newApps);
    localStorage.setItem('crm_pet_appointments', JSON.stringify(newApps));
  };

  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('crm_pet_templates', JSON.stringify(newTemplates));
  };

  // CLIENTS ACTIONS
  const handleAddClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: `client_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newClient, ...clients];
    saveClients(updated);
  };

  const handleEditClient = (updatedClient: Client) => {
    const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    saveClients(updated);
    
    // Auto-update client profile details on active appointments inside the agenda dynamically
    const updatedApps = appointments.map(app => {
      if (app.clientId === updatedClient.id) {
        return {
          ...app,
          clientName: updatedClient.name,
          phone: updatedClient.phone,
          petName: updatedClient.petName
        };
      }
      return app;
    });
    saveAppointments(updatedApps);
  };

  const handleDeleteClient = (clientId: string) => {
    // Delete client
    const updatedCli = clients.filter(c => c.id !== clientId);
    saveClients(updatedCli);

    // Delete all linked appointments in cascade
    const updatedApp = appointments.filter(a => a.clientId !== clientId);
    saveAppointments(updatedApp);
  };

  // APPOINTMENTS ACTIONS
  const handleSaveAppointment = (appData: {
    id?: string;
    clientId: string;
    date: string;
    time: string;
    service: ServiceType;
    price: number;
    status: AppointmentStatus;
    notes?: string;
  }) => {
    const client = clients.find(c => c.id === appData.clientId);
    if (!client) return;

    if (appData.id) {
      // Editing
      const updated = appointments.map(app => {
        if (app.id === appData.id) {
          return {
            ...app,
            clientId: appData.clientId,
            clientName: client.name,
            phone: client.phone,
            petName: client.petName,
            date: appData.date,
            time: appData.time,
            service: appData.service,
            price: appData.price,
            status: appData.status,
            notes: appData.notes
          };
        }
        return app;
      });
      saveAppointments(updated);
    } else {
      // Creating
      const newApp: Appointment = {
        id: `app_${Date.now()}`,
        clientId: appData.clientId,
        clientName: client.name,
        phone: client.phone,
        petName: client.petName,
        date: appData.date,
        time: appData.time,
        service: appData.service,
        price: appData.price,
        status: appData.status,
        reminderSent: false,
        notes: appData.notes
      };
      const updated = [newApp, ...appointments];
      saveAppointments(updated);
    }
    
    setShowBookingModal(false);
    setPreselectedClientId(null);
    setEditingAppointment(null);
  };

  const handleUpdateAppointmentStatus = (appId: string, status: AppointmentStatus) => {
    const updated = appointments.map(app => app.id === appId ? { ...app, status } : app);
    saveAppointments(updated);
  };

  const handleMarkReminderSent = (appId: string) => {
    const updated = appointments.map(app => app.id === appId ? { ...app, reminderSent: true } : app);
    saveAppointments(updated);
  };

  const handleDeleteAppointment = (appId: string) => {
    const updated = appointments.filter(app => app.id !== appId);
    saveAppointments(updated);
  };

  // BULK IMPORT ACTION (Excel sheets)
  const handleBulkImport = (newClients: Client[], newAppointments?: Appointment[]) => {
    // Avoid registration of duplicate phone numbers
    const existingPhones = new Set(clients.map(c => c.phone.replace(/\D/g, '')));
    const filteredNewClients = newClients.filter(c => {
      const clean = c.phone.replace(/\D/g, '');
      if (existingPhones.has(clean)) {
        return false; // Skip if phone already exists
      }
      existingPhones.add(clean);
      return true;
    });

    const mergedClients = [...clients, ...filteredNewClients];
    saveClients(mergedClients);

    if (newAppointments && newAppointments.length > 0) {
      // Ensure imported appointment clientIds map to our newly verified clients (since they share the same ID we generated in importer)
      const mergedApps = [...newAppointments, ...appointments];
      saveAppointments(mergedApps);
      alert(`Importação concluída com sucesso! ${filteredNewClients.length} novos clientes e ${newAppointments.length} agendamentos inseridos.`);
    } else {
      alert(`Importação concluída com sucesso! ${filteredNewClients.length} novos clientes cadastrados no CRM.`);
    }
  };

  // TEMPLATES ACTIONS
  const handleSaveTemplate = (updatedTemplate: MessageTemplate) => {
    const updated = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    saveTemplates(updated);
  };

  const handleAddTemplate = (templateData: Omit<MessageTemplate, 'id'>) => {
    const newTemplate: MessageTemplate = {
      ...templateData,
      id: `tmpl_${Date.now()}`
    };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updated = templates.filter(t => t.id !== templateId);
    saveTemplates(updated);
  };

  // Trigger quick modals
  const triggerQuickSchedule = (clientId: string) => {
    setPreselectedClientId(clientId);
    setEditingAppointment(null);
    setShowBookingModal(true);
  };

  const triggerEditSchedule = (app: Appointment) => {
    setEditingAppointment(app);
    setPreselectedClientId(null);
    setShowBookingModal(true);
  };

  // Quick reset to clear everything to test factory setting files
  const handleResetToDefaults = () => {
    if (confirm("Gostaria de redefinir o banco de dados do sistema para os valores padrões de demonstração? Isso limpará dados customizados.")) {
      saveClients(INITIAL_CLIENTS);
      saveAppointments(INITIAL_APPOINTMENTS);
      saveTemplates(INITIAL_TEMPLATES);
      alert("Sistema redefinido com sucesso!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-200 font-sans flex flex-col">
      {/* Visual Header / Navigation Bar */}
      <header className="bg-[#0a0a0a] border-b border-stone-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-[#0a0a0a] flex items-center justify-center font-black shadow-lg shadow-amber-600/10">
              🐾
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-serif italic text-amber-500 tracking-wide leading-none">PetGroom CRM</h1>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-[0.2em] mt-1">Banho e Tosa • Controle Executivo</p>
            </div>
          </div>

          {/* Master Tabs Controller Switcher */}
          <nav className="flex bg-stone-900/80 border border-stone-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('painel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'painel' ? 'bg-stone-800 text-amber-500 border border-stone-700/50 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
            >
              📊 Painel
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'clientes' ? 'bg-stone-800 text-amber-500 border border-stone-700/50 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
            >
              👥 Clientes & CRM
            </button>
            <button
              onClick={() => setActiveTab('disparador')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'disparador' ? 'bg-stone-800 text-amber-500 border border-stone-700/50 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
            >
              💬 WhatsApp Lembretes
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'templates' ? 'bg-stone-800 text-amber-500 border border-stone-700/50 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
            >
              📝 Modelos
            </button>
          </nav>
        </div>
      </header>

      {/* Main Application Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'painel' && (
              <Dashboard
                appointments={appointments}
                clients={clients}
                onNavigate={(tab) => setActiveTab(tab)}
                onQuickBook={() => {
                  setEditingAppointment(null);
                  setPreselectedClientId(null);
                  setShowBookingModal(true);
                }}
                onImportClick={() => {
                  setActiveTab('clientes');
                }}
                onUpdateStatus={handleUpdateAppointmentStatus}
              />
            )}

            {activeTab === 'clientes' && (
              <ClientList
                clients={clients}
                appointments={appointments}
                onAddClient={handleAddClient}
                onEditClient={handleEditClient}
                onDeleteClient={handleDeleteClient}
                onBulkImport={handleBulkImport}
                onQuickSchedule={triggerQuickSchedule}
              />
            )}

            {activeTab === 'disparador' && (
              <WhatsappDisparador
                appointments={appointments}
                clients={clients}
                templates={templates}
                onMarkReminderSent={handleMarkReminderSent}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              />
            )}

            {activeTab === 'templates' && (
              <TemplateEditor
                templates={templates}
                onSaveTemplate={handleSaveTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onAddTemplate={handleAddTemplate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Static developer footer helper - allows restarting database and guidelines */}
      <footer className="bg-[#0a0a0a] border-t border-stone-900 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] sm:text-xs text-stone-500 font-medium">
          <div>
            <span>© 2026 PetGroom CRM • Desenvolvido com sofisticação para Pet Shops de Elite</span>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={handleResetToDefaults}
              className="hover:text-rose-400 transition flex items-center gap-1 text-[10px] bg-stone-900/60 hover:bg-rose-950/20 border border-stone-800 hover:border-rose-900/40 px-2.5 py-1 rounded-md"
            >
              <RefreshCw className="w-3 h-3 text-stone-500 font-bold animate-[spin_4s_linear_infinite]" />
              <span>Redefinir Dados de Fábrica</span>
            </button>
            <span>Durable offline-first LocalStorage Ativo</span>
          </div>
        </div>
      </footer>

      {/* Global Booking Dialog Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <AppointmentForm
            clients={clients}
            initialAppointment={editingAppointment}
            preselectedClientId={preselectedClientId}
            onSave={handleSaveAppointment}
            onClose={() => {
              setShowBookingModal(false);
              setPreselectedClientId(null);
              setEditingAppointment(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
