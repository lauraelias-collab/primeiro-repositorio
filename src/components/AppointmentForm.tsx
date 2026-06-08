/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, FileText, User, Heart, Scissors, Check, HelpCircle } from 'lucide-react';
import { Client, Appointment, ServiceType, AppointmentStatus } from '../types';
import { formatDateFriendly } from '../utils/helpers';
import { motion } from 'motion/react';

interface AppointmentFormProps {
  clients: Client[];
  initialAppointment?: Appointment | null;
  preselectedClientId?: string | null;
  onSave: (app: {
    id?: string;
    clientId: string;
    date: string;
    time: string;
    service: ServiceType;
    price: number;
    status: AppointmentStatus;
    notes?: string;
  }) => void;
  onClose: () => void;
}

const SERVICE_DEFAULTS: Record<ServiceType, number> = {
  'Banho': 80.00,
  'Tosa': 95.00,
  'Banho e Tosa': 130.00,
  'Outro': 50.00
};

export default function AppointmentForm({
  clients,
  initialAppointment,
  preselectedClientId,
  onSave,
  onClose
}: AppointmentFormProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [service, setService] = useState<ServiceType>('Banho');
  const [price, setPrice] = useState<number>(80.00);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('09:00');
  const [status, setStatus] = useState<AppointmentStatus>('Agendado');
  const [notes, setNotes] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Load initial value or presets
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (initialAppointment) {
      setSelectedClientId(initialAppointment.clientId);
      const client = clients.find(c => c.id === initialAppointment.clientId);
      if (client) setSearchTerm(`${client.name} (Tutor de: ${client.petName})`);
      setService(initialAppointment.service);
      setPrice(initialAppointment.price);
      setDate(initialAppointment.date);
      setTime(initialAppointment.time);
      setStatus(initialAppointment.status);
      setNotes(initialAppointment.notes || '');
    } else {
      setDate(todayStr); // Default to today
      
      if (preselectedClientId) {
        setSelectedClientId(preselectedClientId);
        const client = clients.find(c => c.id === preselectedClientId);
        if (client) setSearchTerm(`${client.name} (Tutor de: ${client.petName})`);
      }
    }
  }, [initialAppointment, preselectedClientId, clients]);

  // Adjust price automatically if service defaults change
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as ServiceType;
    setService(val);
    setPrice(SERVICE_DEFAULTS[val]);
  };

  const filteredClientsForSearch = clients.filter(c => {
    const s = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.petName.toLowerCase().includes(s);
  });

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setSearchTerm(`${client.name} (Tutor de: ${client.petName})`);
    setIsDropdownOpen(false);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = parseFloat(e.target.value);
    setPrice(isNaN(p) ? 0 : p);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Por favor, selecione um cliente cadastrado!');
      return;
    }
    if (!date) {
      alert('Por favor, defina a data do agendamento!');
      return;
    }
    if (!time) {
      alert('Por favor, defina o horário do agendamento!');
      return;
    }

    onSave({
      id: initialAppointment?.id,
      clientId: selectedClientId,
      date,
      time,
      service,
      price,
      status,
      notes
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0d0d0d] rounded-2xl shadow-2xl overflow-hidden border border-stone-800 flex flex-col"
      >
        {/* Title and Icon */}
        <div className="px-6 py-4 bg-[#121212] border-b border-stone-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-950 text-amber-500 border border-stone-850 rounded-lg">
              <Calendar className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-base font-serif italic text-stone-100">
                {initialAppointment ? 'Editar Agendamento' : 'Agendar Banho e Tosa'}
              </h2>
              <p className="text-[11px] text-stone-450">Insira a data, detalhes do serviço e observações adicionais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 p-1.5 hover:bg-stone-900 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {/* Client Search Block (only searchable if not editing for absolute safety) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span>Selecione o Cliente / Pet <span className="text-amber-500">*</span></span>
            </label>
            
            {initialAppointment ? (
              <div className="px-3.5 py-2.5 bg-stone-950 text-stone-300 rounded-xl text-sm font-semibold border border-stone-850">
                {clients.find(c => c.id === selectedClientId)?.name} ({clients.find(c => c.id === selectedClientId)?.petName})
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Pesquisar por tutor ou nome do pet..."
                  value={searchTerm}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedClientId(''); // Clear if typing
                    setIsDropdownOpen(true);
                  }}
                  className="w-full text-sm px-3.5 py-2.5 bg-stone-955 border border-stone-850 outline-none rounded-xl text-stone-200 focus:border-amber-900/40 focus:bg-stone-900/80 transition"
                />
                
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-[160px] overflow-y-auto bg-stone-950 border border-stone-800 rounded-xl shadow-lg divide-y divide-stone-850">
                    {filteredClientsForSearch.length === 0 ? (
                      <div className="p-3 text-center text-xs text-stone-550 italic">
                        Nenhum cliente/pet encontrado. Por favor, cadastre o cliente antes de agendar.
                      </div>
                    ) : (
                      filteredClientsForSearch.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectClient(c)}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-stone-900/50 transition flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-stone-200">{c.name}</span>
                            <span className="text-stone-500 block text-[10px]">Contato: {c.phone}</span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-550 bg-stone-900/55 px-1.5 py-0.5 rounded border border-stone-850">
                            🐾 Pet: {c.petName}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            
            {!selectedClientId && searchTerm && !isDropdownOpen && (
              <p className="text-[10px] text-amber-500 mt-0.5">⚠️ É necessário clicar sobre um cliente listado no menu!</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Service Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                <span>Serviço Solicitado <span className="text-amber-505">*</span></span>
              </label>
              <select
                value={service}
                onChange={handleServiceChange}
                className="w-full text-xs bg-stone-955 border border-stone-850 outline-none px-3.5 py-2.5 rounded-xl text-stone-200 focus:border-amber-900/40 focus:bg-stone-900/80 transition"
              >
                <option value="Banho" className="bg-[#121212] text-stone-200">🛁 Banho Simples</option>
                <option value="Tosa" className="bg-[#121212] text-stone-200">✂️ Apenas Tosa</option>
                <option value="Banho e Tosa" className="bg-[#121212] text-stone-200">🧼🛁✂️ Banho e Tosa Completo</option>
                <option value="Outro" className="bg-[#121212] text-stone-200">🐾 Outro Serviço Especial</option>
              </select>
            </div>

            {/* Service Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span>Valor Cobrado (R$) <span className="text-amber-505">*</span></span>
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price || ''}
                onChange={handlePriceChange}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-955 border border-stone-850 outline-none rounded-xl text-stone-200 focus:border-amber-900/40 focus:bg-stone-900/80 transition"
              />
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Data do Agendamento <span className="text-amber-505">*</span></span>
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-955 border border-stone-850 outline-none rounded-xl text-stone-200 focus:border-amber-900/40 focus:bg-stone-900/80 transition"
              />
            </div>

            {/* Time Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Horário <span className="text-amber-505">*</span></span>
              </label>
              <input
                required
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-955 border border-stone-850 outline-none rounded-xl text-stone-200 focus:border-amber-900/40 focus:bg-stone-900/80 transition"
              />
            </div>

            {/* Status Picker */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Status Atual</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Agendado', 'Confirmado', 'Concluido', 'Cancelado'] as AppointmentStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`px-1.5 py-2.5 border rounded-xl text-[10px] sm:text-xs font-extrabold text-center transition duration-200 ${status === st ? 'bg-amber-600 border-amber-600 text-black shadow-md' : 'bg-stone-950 hover:bg-stone-900 text-stone-400 border-stone-850'}`}
                  >
                    {st === 'Concluido' ? 'Concluído' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Session special instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Instruções / Perfume / Observações para este dia</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Quer perfume adocicado. Cortar as unhas e limpar bem as orelhinhas."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2 bg-stone-955 border border-stone-850 outline-none rounded-xl text-stone-200 focus:border-amber-900/40 focus:bg-stone-900/80 transition resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-850">
            <button
               type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-800 text-stone-400 hover:bg-stone-850 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedClientId}
              className={`flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition duration-200 ${!selectedClientId ? 'bg-stone-850 text-stone-550 cursor-not-allowed shadow-none' : 'bg-amber-600 hover:bg-amber-500 text-black'}`}
            >
              <Check className="w-4 h-4" />
              <span>{initialAppointment ? 'Salvar Edições' : 'Criar Agendamento'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
