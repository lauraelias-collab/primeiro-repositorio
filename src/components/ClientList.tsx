/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, Plus, UserPlus, FileSpreadsheet, Trash2, Edit2, 
  User, Mail, Phone, Calendar, Heart, ShieldAlert, CheckCircle, 
  Clock, XCircle, ChevronRight, FileText, Sparkles, Download
} from 'lucide-react';
import { Client, Appointment, ServiceType } from '../types';
import { formatPhoneFriendly, formatDateFriendly, formatCurrency, exportToCSV } from '../utils/helpers';
import ExcelImporter from './ExcelImporter';
import { motion, AnimatePresence } from 'motion/react';

interface ClientListProps {
  clients: Client[];
  appointments: Appointment[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onBulkImport: (newClients: Client[], newAppointments?: Appointment[]) => void;
  onQuickSchedule: (clientId: string) => void;
}

export default function ClientList({
  clients,
  appointments,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onBulkImport,
  onQuickSchedule
}: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  const handleExportClients = () => {
    if (clients.length === 0) {
      alert("Não há dados de clientes para exportar.");
      return;
    }
    
    // Offer exporting filtered list if a filter is active, otherwise the entire list
    const hasFilter = searchTerm.trim().length > 0;
    const itemsToExport = hasFilter ? filteredClients : clients;
    
    const headers = [
      'ID', 
      'Nome do Tutor/Cliente', 
      'WhatsApp/Telefone', 
      'E-mail', 
      'Nome do Pet', 
      'Raça do Pet', 
      'Observações', 
      'Data de Cadastro'
    ];
    
    const rows = itemsToExport.map(c => [
      c.id,
      c.name,
      c.phone,
      c.email || '',
      c.petName,
      c.petBreed || '',
      c.notes || '',
      c.createdAt || ''
    ]);
    
    const filename = hasFilter ? 'clientes_filtrados_petgroom' : 'clientes_petgroom_crm';
    exportToCSV(filename, headers, rows);
  };

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPetName, setFormPetName] = useState('');
  const [formPetBreed, setFormPetBreed] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0] || null;

  // Filtered clients list
  const filteredClients = clients.filter(c => {
    const s = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.phone.includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.petName.toLowerCase().includes(s) ||
      (c.petBreed && c.petBreed.toLowerCase().includes(s))
    );
  });

  const handleOpenAdd = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormPetName('');
    setFormPetBreed('');
    setFormNotes('');
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleOpenEdit = (client: Client) => {
    setFormName(client.name);
    setFormPhone(client.phone);
    setFormEmail(client.email);
    setFormPetName(client.petName);
    setFormPetBreed(client.petBreed || '');
    setFormNotes(client.notes || '');
    setIsAdding(false);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formPetName) {
      alert('Nome, Telefone e Nome do Pet são obrigatórios!');
      return;
    }

    const sanitizedPhone = formPhone.replace(/\D/g, '');

    if (isEditing && selectedClient) {
      onEditClient({
        ...selectedClient,
        name: formName,
        phone: sanitizedPhone,
        email: formEmail,
        petName: formPetName,
        petBreed: formPetBreed,
        notes: formNotes
      });
      setIsEditing(false);
    } else {
      onAddClient({
        name: formName,
        phone: sanitizedPhone,
        email: formEmail,
        petName: formPetName,
        petBreed: formPetBreed,
        notes: formNotes
      });
      setIsAdding(false);
    }
  };

  // Get service logs of the selected client
  const clientAppointments = appointments
    .filter(a => a.clientId === selectedClient?.id)
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Agendado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-900 text-amber-500 border border-stone-800"><Clock className="w-3" /> Agendado</span>;
      case 'Confirmado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/20 text-[#34d399] border border-emerald-900/30"><CheckCircle className="w-3 h-3" /> Confirmado</span>;
      case 'Concluido':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-900 text-stone-400 border border-stone-800"><Sparkles className="w-3 h-3" /> Concluído</span>;
      case 'Cancelado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/20 text-rose-400 border border-rose-900/30"><XCircle className="w-3 h-3" /> Cancelado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Search and List Side - 5/12 cols */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Controls Panel */}
        <div className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <h2 className="text-base font-serif italic text-stone-100">Diretório de Clientes CRM</h2>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black rounded-lg text-xs font-semibold transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo Cliente</span>
              </button>
              <button
                onClick={() => setShowImporter(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg text-xs font-semibold transition hover:text-stone-100"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Importar</span>
              </button>
              <button
                onClick={handleExportClients}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-500 border border-stone-700/60 rounded-lg text-xs font-semibold transition hover:text-amber-450"
                title="Exportar cadastro de clientes para Excel/CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar por cliente, pet, telefone ou raça..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm pl-9 pr-4 py-2 bg-stone-950 border border-stone-850 focus:border-amber-900/40 rounded-xl outline-hidden focus:bg-stone-900/80 text-stone-200 placeholder-stone-500 transition"
            />
          </div>
        </div>

        {/* Clients list */}
        <div className="bg-stone-900/40 rounded-2xl border border-stone-800 overflow-hidden max-h-[60vh] overflow-y-auto">
          {filteredClients.length === 0 ? (
            <div className="p-12 text-center text-stone-500 space-y-2">
              <User className="w-10 h-10 text-stone-600 mx-auto" />
              <p className="text-sm font-semibold text-stone-350">Nenhum cliente cadastrado</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">Tente refinar os filtros de busca ou importe sua lista usando o botão acima.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-850">
              {filteredClients.map((client) => {
                const isActive = selectedClient?.id === client.id;
                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setIsAdding(false);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left p-4 transition flex items-center justify-between gap-4 border-l-4 ${isActive ? 'bg-stone-850/80 border-amber-500' : 'bg-stone-900/20 border-transparent hover:bg-stone-850/20'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-stone-200 truncate">{client.name}</span>
                        <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-stone-955 text-stone-400 border border-stone-800 rounded">
                          🐾 {client.petName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-450 mt-1 truncate">
                        <span>{formatPhoneFriendly(client.phone)}</span>
                        {client.petBreed && (
                          <>
                            <span className="text-stone-700">•</span>
                            <span className="truncate">{client.petBreed}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-amber-500 transform translate-x-1' : 'text-stone-500'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details CRM Panel - 7/12 cols */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {/* Create or Edit Form */}
          {isAdding || isEditing ? (
            <motion.div
              key="client-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-stone-900/40 p-6 rounded-2xl border border-stone-800"
            >
              <h2 className="text-lg font-serif italic text-stone-100 mb-4">
                {isEditing ? `Editar Cadastro de: ${selectedClient?.name}` : 'Cadastrar Novo Cliente'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tutor Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400">Nome do Tutor (Cliente) <span className="text-amber-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Ana Souza"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-stone-950 border border-stone-850 text-stone-200 outline-none focus:border-amber-900/50 rounded-xl focus:bg-stone-900/80 transition focus:ring-1 focus:ring-amber-905"
                    />
                  </div>
                  
                  {/* Whatsapp */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400">WhatsApp / Celular <span className="text-amber-505">*</span></label>
                    <input
                      required
                      type="tel"
                      placeholder="Ex: (11) 99999-1111"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-stone-955 border border-stone-850 text-stone-200 outline-none focus:border-amber-900/50 rounded-xl focus:bg-stone-900/80 transition focus:ring-1 focus:ring-amber-905"
                    />
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400">E-mail</label>
                    <input
                      type="email"
                      placeholder="Ex: ana.souza@gmail.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-stone-955 border border-stone-850 text-stone-200 outline-none focus:border-amber-900/50 rounded-xl focus:bg-stone-900/80 transition focus:ring-1 focus:ring-amber-905"
                    />
                  </div>

                  {/* Pet Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400">Nome do Pet <span className="text-amber-505">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Mel"
                      value={formPetName}
                      onChange={(e) => setFormPetName(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-stone-955 border border-stone-850 text-stone-200 outline-none focus:border-amber-900/50 rounded-xl focus:bg-stone-900/80 transition focus:ring-1 focus:ring-amber-905"
                    />
                  </div>

                  {/* Pet Breed */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-stone-400">Raça do Pet / Porte</label>
                    <input
                      type="text"
                      placeholder="Ex: Golden Retriever, Shih Tzu, Porte Pequeno"
                      value={formPetBreed}
                      onChange={(e) => setFormPetBreed(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-stone-955 border border-stone-850 text-stone-200 outline-none focus:border-amber-900/50 rounded-xl focus:bg-stone-900/80 transition focus:ring-1 focus:ring-amber-905"
                    />
                  </div>
                  
                  {/* Special Notes */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-stone-400">Observações Especiais (Cuidados, Alergias, etc)</label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Pele sensível, medo do soprador, morde se pegar na pata traseira..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-stone-955 border border-stone-850 text-stone-200 outline-none focus:border-amber-900/50 rounded-xl focus:bg-stone-900/80 transition resize-none pointer-events-auto"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 border border-stone-800 text-stone-450 hover:bg-stone-850 rounded-xl text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs transition duration-200 shadow-sm"
                  >
                    Salvar Cadastro
                  </button>
                </div>
              </form>
            </motion.div>
          ) : selectedClient ? (
            /* Selected Client Detail view */
            <motion.div
              key={`client-details-${selectedClient.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-stone-900/40 rounded-2xl border border-stone-800 overflow-hidden"
            >
              {/* Tutor banner summary */}
              <div className="p-6 bg-stone-955/20 border-b border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-stone-950 text-amber-505 border border-stone-800 flex items-center justify-center font-bold text-xl shrink-0 uppercase">
                    {selectedClient.name.substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-lg font-serif italic text-stone-100">{selectedClient.name}</h2>
                    <p className="text-xs text-stone-400">Membro desde {formatDateFriendly(selectedClient.createdAt)}</p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(selectedClient)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-800 text-stone-400 hover:text-amber-500 hover:bg-stone-900 rounded-xl text-xs font-bold transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir o cadastro de ${selectedClient.name}? Todos os seus agendamentos também serão excluídos!`)) {
                        onDeleteClient(selectedClient.id);
                        setSelectedClientId(clients.find(c => c.id !== selectedClient.id)?.id || null);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-800 text-stone-450 hover:text-rose-400 hover:bg-stone-900 rounded-xl text-xs font-bold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>

              {/* Registration and Pet info cards */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Card */}
                <div className="bg-stone-955/10 p-4 rounded-xl border border-stone-850 space-y-3">
                  <h3 className="text-xs font-bold text-stone-500 tracking-widest uppercase">Informações de Contato</h3>
                  <div className="space-y-2.5 text-sm text-stone-300">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-medium whitespace-nowrap">{formatPhoneFriendly(selectedClient.phone)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate text-stone-400">{selectedClient.email || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Pet Specific Card */}
                <div className="bg-stone-955/10 p-4 rounded-xl border border-stone-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-stone-500 tracking-widest uppercase">Informações do Pet</h3>
                    <span className="text-[10px] font-bold text-[#10b981] bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Heart className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" /> Ativo
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-stone-200 flex items-center gap-1.5">
                      <span className="text-lg">🐾</span> {selectedClient.petName}
                    </p>
                    {selectedClient.petBreed && (
                      <p className="text-xs text-stone-400">Raça: <span className="font-semibold">{selectedClient.petBreed}</span></p>
                    )}
                  </div>
                </div>

                {/* Special Notes Card (Span wide) */}
                {selectedClient.notes && (
                  <div className="md:col-span-2 bg-amber-955/10 p-4 rounded-xl border border-amber-900/30 flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-500">Notas de Atenção</h4>
                      <p className="text-xs text-amber-400 mt-1 leading-relaxed">{selectedClient.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduling logs inside CRM */}
              <div className="px-6 pb-6 space-y-4">
                <div className="flex items-center justify-between border-t border-stone-800 pt-5">
                  <div>
                    <h3 className="text-sm font-serif italic text-stone-100">Histórico de Agendamento</h3>
                    <p className="text-xs text-stone-500">Total de {clientAppointments.length} banhos e tosas realizados/agendados</p>
                  </div>
                  <button
                    onClick={() => onQuickSchedule(selectedClient.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-955/20 hover:bg-amber-950/30 text-amber-500 rounded-lg text-xs font-bold transition border border-amber-900/30"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar Banho / Tosa</span>
                  </button>
                </div>

                {clientAppointments.length === 0 ? (
                  <div className="p-6 border border-dashed border-stone-800 rounded-xl text-center text-xs text-stone-550">
                    Ainda não possui agendamentos passados ou futuros. Clique acima para criar um horário!
                  </div>
                ) : (
                  <div className="border border-stone-850 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <div className="divide-y divide-stone-850">
                      {clientAppointments.map((app) => (
                        <div key={app.id} className="p-3.5 bg-stone-900/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-stone-900/30 transition">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-stone-950 font-bold px-2 py-0.5 rounded text-stone-300 border border-stone-800">
                                {app.service}
                              </span>
                              <span className="text-xs font-semibold text-amber-500">{formatCurrency(app.price)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-stone-400">
                              <span className="flex items-center gap-1 font-semibold text-stone-300"><Calendar className="w-3 h-3 text-amber-500" /> {formatDateFriendly(app.date)}</span>
                              <span>•</span>
                              <span>às {app.time}</span>
                            </div>
                            {app.notes && (
                              <p className="text-[11px] text-stone-450 italic flex items-center gap-1">
                                <FileText className="w-3 h-3 text-stone-605" />
                                {app.notes}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
                            {getStatusBadge(app.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Standard state placeholder if list is empty */
            <div className="bg-stone-900/40 p-12 text-center rounded-2xl border border-stone-800 text-stone-500">
              <User className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="font-semibold text-stone-300 text-sm">Selecione ou adicione um cliente</p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">Visualize detalhes completos do tutor, ficha médica especial do pet e histórico completo de atendimentos.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Sheet XLSX / CSV Importer Dialog overlay */}
      <AnimatePresence>
        {showImporter && (
          <ExcelImporter
            clients={clients}
            onClose={() => setShowImporter(false)}
            onImportComplete={(importedClients, importedAppointments) => {
              onBulkImport(importedClients, importedAppointments);
              setShowImporter(false);
              // Focus the first imported client
              if (importedClients.length > 0) {
                setSelectedClientId(importedClients[0].id);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
