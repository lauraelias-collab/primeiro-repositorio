/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Appointment, Client, MessageTemplate } from '../types';
import { sanitizePhoneForWhatsapp, formatPhoneFriendly, formatDateFriendly, fillTemplate, formatCurrency } from '../utils/helpers';
import { 
  MessageSquare, Send, Calendar, Clock, Sparkles, Copy, 
  Check, Smile, HelpCircle, AlertCircle, RefreshCw, Layers, CheckSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsappDisparadorProps {
  appointments: Appointment[];
  clients: Client[];
  templates: MessageTemplate[];
  onMarkReminderSent: (appointmentId: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: any) => void;
}

export default function WhatsappDisparador({
  appointments,
  clients,
  templates,
  onMarkReminderSent,
  onUpdateAppointmentStatus
}: WhatsappDisparadorProps) {
  const [filterDateMode, setFilterDateMode] = useState<'today' | 'tomorrow' | 'pending_reminders' | 'all'>('today');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState<string | null>(null);

  // Quick Client Responses Library for Pet Shop
  const [shopQuickResponses, setShopQuickResponses] = useState([
    { id: 'qr1', title: 'Agradecimento por confirmar', text: 'Muito obrigado pela confirmação! 👍 Já deixamos tudo pronto por aqui para receber o(a) {nome_pet} às {hora}. Até breve! 🐾✨' },
    { id: 'qr2', title: 'Opções de Reagendamento', text: 'Sem problemas! 😊 Temos horários vagos amanhã às 10:30, 14:00 ou na sexta às 09:00. Algum desses fica bom para você e para o(a) {nome_pet}?' },
    { id: 'qr3', title: 'Seu pet já começou o banho', text: 'Olá! O(a) {nome_pet} já entrou para o banho. Em torno de 1h a 1h30 ele(a) estará pronto(a) e entramos em contato para você buscar. Obrigado!' },
    { id: 'qr4', title: 'Mensagem de Atraso Tolerância', text: 'Olá, tudo bem? 🐾 Notamos que passou um pouquinho do horário do agendamento do(a) {nome_pet} ({hora}). Vocês estão a caminho? Temos uma tolerância de 15 minutinhos para garantir o bem-estar de todos da agenda.' }
  ]);

  // Sync selection
  const selectedAppointment = appointments.find(a => a.id === selectedAppId) || null;
  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0] || null;

  useEffect(() => {
    // If we have appointments and none is selected, auto-select the first visible one
    if (visibleAppointments.length > 0 && !selectedAppId) {
      setSelectedAppId(visibleAppointments[0].id);
    }
  }, [filterDateMode, appointments]);

  // Recalculate message whenever selected appointment or current template changes
  useEffect(() => {
    if (selectedAppointment && currentTemplate) {
      const client = clients.find(c => c.id === selectedAppointment.clientId);
      const parsedText = fillTemplate(currentTemplate.text, {
        nome_cliente: selectedAppointment.clientName,
        nome_pet: selectedAppointment.petName,
        servico: selectedAppointment.service,
        data: selectedAppointment.date,
        hora: selectedAppointment.time
      });
      setCustomMessage(parsedText);
    } else {
      setCustomMessage('');
    }
  }, [selectedAppId, selectedTemplateId, appointments, templates]);

  // Date filters
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getTomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const visibleAppointments = appointments.filter((app) => {
    const todayStr = getTodayISO();
    const tomorrowStr = getTomorrowISO();
    
    if (filterDateMode === 'today') {
      return app.date === todayStr;
    }
    if (filterDateMode === 'tomorrow') {
      return app.date === tomorrowStr;
    }
    if (filterDateMode === 'pending_reminders') {
      return !app.reminderSent && app.status === 'Agendado';
    }
    return true; // all
  }).sort((a, b) => a.time.localeCompare(b.time));

  // WhatsApp formatted link
  const cleanPhone = selectedAppointment ? sanitizePhoneForWhatsapp(selectedAppointment.phone) : '';
  const waLink = selectedAppointment
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customMessage)}`
    : '#';

  const handleCopyText = () => {
    if (!customMessage) return;
    navigator.clipboard.writeText(customMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyPhone = () => {
    if (!selectedAppointment) return;
    navigator.clipboard.writeText(selectedAppointment.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyResponse = (responseId: string, responseRawText: string) => {
    if (!selectedAppointment) {
      alert('Selecione um agendamento na lista para preencher os dados de resposta do pet!');
      return;
    }
    const parsedText = fillTemplate(responseRawText, {
      nome_cliente: selectedAppointment.clientName,
      nome_pet: selectedAppointment.petName,
      servico: selectedAppointment.service,
      data: selectedAppointment.date,
      hora: selectedAppointment.time
    });
    navigator.clipboard.writeText(parsedText);
    setCopiedResponse(responseId);
    setTimeout(() => setCopiedResponse(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* List Panel - 5/12 cols */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Header filter controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
          <h2 className="text-sm font-bold text-slate-800">Selecione o Cliente na Agenda</h2>
          
          <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1.5 rounded-xl">
            <button
              onClick={() => { setFilterDateMode('today'); setSelectedAppId(null); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${filterDateMode === 'today' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              📅 Hoje
            </button>
            <button
              onClick={() => { setFilterDateMode('tomorrow'); setSelectedAppId(null); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${filterDateMode === 'tomorrow' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              🗓️ Amanhã
            </button>
            <button
              onClick={() => { setFilterDateMode('pending_reminders'); setSelectedAppId(null); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${filterDateMode === 'pending_reminders' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ⚠️ Sem Lembrete
            </button>
            <button
              onClick={() => { setFilterDateMode('all'); setSelectedAppId(null); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition ${filterDateMode === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              📁 Todos
            </button>
          </div>
        </div>

        {/* Appointment List Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden max-h-[60vh] overflow-y-auto">
          {visibleAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Calendar className="w-9 h-9 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Nenhum atendimento encontrado</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto">Não há nenhum agendamento pendente nesta visualização da agenda.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleAppointments.map((app) => {
                const isSelected = selectedAppId === app.id;
                
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full text-left p-4 hover:bg-slate-50/60 transition flex items-start gap-3 border-l-4 ${isSelected ? 'bg-indigo-50/40 border-indigo-600' : 'bg-white border-transparent'}`}
                  >
                    <div className="pt-0.5">
                      <span className="w-10 h-10 rounded-lg bg-slate-150 text-slate-800 flex flex-col items-center justify-center font-mono">
                        <span className="text-[10px] leading-3 text-slate-500">HORA</span>
                        <span className="text-xs font-extrabold leading-4">{app.time}</span>
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-800 truncate">{app.clientName}</h4>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-sm">
                          🐶 {app.petName}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-550">
                        <span className="font-semibold text-slate-700">{app.service} ({formatCurrency(app.price)})</span>
                        <span className="text-slate-350">•</span>
                        <span>{formatDateFriendly(app.date)}</span>
                      </div>

                      {/* Reminder sent badge */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {app.reminderSent ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-55/15 text-emerald-700 rounded-sm">
                            ✓ Lembrete Enviado
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-sm">
                            ⚠️ Lembrete Pendente
                          </span>
                        )}
                        
                        {/* Current Status */}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-semibold border ${app.status === 'Confirmado' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : app.status === 'Concluido' ? 'bg-purple-50 border-purple-100 text-purple-700' : app.status === 'Cancelado' ? 'bg-rose-50 border-rose-100 text-rose-750' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Disparador Control Panel - 7/12 cols */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {selectedAppointment ? (
            <motion.div
              key={`trigger-${selectedAppointment.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden"
            >
              {/* Client Briefing & Template Selection */}
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-120">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider text-indigo-500 uppercase">Destinatário Ativo</span>
                    <h3 className="text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
                      {selectedAppointment.clientName} 
                      <span className="font-medium text-xs text-slate-500">({formatPhoneFriendly(selectedAppointment.phone)})</span>
                    </h3>
                    <p className="text-xs text-slate-550 mt-1">Especial de Banho: <span className="font-bold text-indigo-800">{selectedAppointment.petName}</span> • Agendando {selectedAppointment.service} em {formatDateFriendly(selectedAppointment.date)} às {selectedAppointment.time}.</p>
                  </div>
                </div>

                {/* Template Selector dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Qual modelo de mensagem carregar?</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 outline-hidden px-3.5 py-2.5 rounded-xl font-medium focus:border-indigo-500 focus:bg-white transition"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.type === 'lembrete' ? 'Lembrete' : 'Agendamento'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message Generator Text Area */}
              <div className="p-6 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Texto da Mensagem (Você pode editar livremente)</h3>
                  
                  {/* Copy actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyPhone}
                      className="text-[10px] flex items-center gap-1 font-bold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 px-2 py-1 rounded transition"
                    >
                      {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copiar Telefone</span>
                    </button>
                    <button
                      onClick={handleCopyText}
                      className="text-[10px] flex items-center gap-1 font-bold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 px-2 py-1 rounded transition"
                    >
                      {copiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copiar Mensagem</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden h-[120px] shadow-inner font-sans resize-none leading-relaxed"
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  {/* Action 1: Mark text sent directly */}
                  <button
                    onClick={() => onMarkReminderSent(selectedAppointment.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-extrabold transition bg-white hover:bg-slate-50 text-slate-755 border-slate-200 ${selectedAppointment.reminderSent ? 'text-emerald-700 bg-emerald-50/20' : ''}`}
                  >
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>{selectedAppointment.reminderSent ? '✓ Lembrete Lido como Enviado' : 'Marcar Lembrete como Enviado'}</span>
                  </button>

                  {/* Action 2: Trigger WhatsApp (Wrapped raw anchor to ensure popup behavior in new tab) */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // Automatically read as sent on click! This is beautiful helper
                      onMarkReminderSent(selectedAppointment.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Disparar WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* CRM simulator of responses */}
              <div className="p-6 space-y-4">
                <div className="border-l-4 border-amber-500 pl-3">
                  <h3 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase">Mensagens de Resposta</h3>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">Se o cliente retornar no WhatsApp com uma resposta, use estes atalhos para atuar rapidamente:</p>
                </div>

                {/* Simulated quick toggles for status updates directly based on client replies */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150">
                  <h4 className="text-[11px] font-bold text-slate-700 mb-2.5">O cliente respondeu? Atualizar agenda instantaneamente:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => onUpdateAppointmentStatus(selectedAppointment.id, 'Confirmado')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${selectedAppointment.status === 'Confirmado' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 border-slate-200'}`}
                    >
                      👍 Confirmar Banho
                    </button>
                    <button
                      onClick={() => onUpdateAppointmentStatus(selectedAppointment.id, 'Cancelado')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${selectedAppointment.status === 'Cancelado' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-700 border-slate-200'}`}
                    >
                      ❌ Desmarcar Agendado
                    </button>
                    <button
                      onClick={() => onUpdateAppointmentStatus(selectedAppointment.id, 'Concluido')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${selectedAppointment.status === 'Concluido' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white hover:bg-purple-50 hover:border-purple-200 text-slate-700 border-slate-200'}`}
                    >
                      🧼🚿 Prontinho / Banho Concluído
                    </button>
                  </div>
                </div>

                {/* Shop messages response library */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-700">Respostas rápidas do Pet Shop para enviar ao Tutor (Clique para copiar):</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {shopQuickResponses.map((qr) => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => handleCopyResponse(qr.id, qr.text)}
                        className="p-2.5 rounded-lg border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/15 text-left transition text-xs space-y-1 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800 text-[11px]">{qr.title}</span>
                          {copiedResponse === qr.id ? (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">Copiado!</span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-1 py-0.2 rounded hover:text-indigo-600">Copiar</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                          {fillTemplate(qr.text, {
                            nome_cliente: selectedAppointment.clientName,
                            nome_pet: selectedAppointment.petName,
                            servico: selectedAppointment.service,
                            data: selectedAppointment.date,
                            hora: selectedAppointment.time
                          })}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-xs text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Nenhum atendimento selecionado</p>
              <p className="text-xs text-slate-405 mt-1 max-w-sm mx-auto">Escolha um horário na agenda ao lado para gerar o lembrete de WhatsApp correspondente e acompanhar as mensagens.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
