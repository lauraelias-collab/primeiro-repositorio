/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Client, Appointment, ServiceType } from '../types';
import { formatCurrency, formatDateFriendly, exportToCSV } from '../utils/helpers';
import { 
  Calendar, CheckCircle, Clock, Scissors, DollarSign, 
  MessageSquare, User, Sparkles, TrendingUp, Inbox, Play, ArrowRight, Download 
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  appointments: Appointment[];
  clients: Client[];
  onNavigate: (tab: 'agenda' | 'clientes' | 'disparador' | 'templates') => void;
  onQuickBook: () => void;
  onImportClick: () => void;
  onUpdateStatus: (id: string, status: any) => void;
}

export default function Dashboard({
  appointments,
  clients,
  onNavigate,
  onQuickBook,
  onImportClick,
  onUpdateStatus
}: DashboardProps) {
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const todayStr = getTodayISO();

  // Filter Today's Appointments
  const todayAppointments = appointments.filter(a => a.date === todayStr);

  const handleExportAppointments = () => {
    if (appointments.length === 0) {
      alert("Não há dados de agendamentos para exportar.");
      return;
    }

    const headers = [
      'ID do Agendamento',
      'Data',
      'Horário',
      'Nome do Tutor/Cliente',
      'Telefone/WhatsApp',
      'Nome do Pet',
      'Serviço',
      'Preço cobrado',
      'Status atual',
      'Lembrete Enviado',
      'Observações'
    ];

    const rows = appointments.map(app => [
      app.id,
      app.date,
      app.time,
      app.clientName,
      app.phone,
      app.petName,
      app.service,
      app.price,
      app.status,
      app.reminderSent ? 'Sim' : 'Não',
      app.notes || ''
    ]);

    exportToCSV('historico_agenda_petgroom', headers, rows);
  };

  const handleExportTodayAppointments = () => {
    if (todayAppointments.length === 0) {
      alert("Não há agendamentos agendados para hoje para exportar.");
      return;
    }

    const headers = [
      'Horário',
      'Nome do Tutor/Cliente',
      'Telefone/WhatsApp',
      'Nome do Pet',
      'Serviço',
      'Preço cobrado',
      'Status',
      'Lembrete Enviado',
      'Observações/Notas'
    ];

    const sortedToday = [...todayAppointments].sort((a, b) => a.time.localeCompare(b.time));
    const rows = sortedToday.map(app => [
      app.time,
      app.clientName,
      app.phone,
      app.petName,
      app.service,
      app.price,
      app.status,
      app.reminderSent ? 'Sim' : 'Não',
      app.notes || ''
    ]);

    exportToCSV(`agenda_de_hoje_${todayStr}`, headers, rows);
  };

  // Statistics
  const totalTodayCount = todayAppointments.length;
  const completedTodayCount = todayAppointments.filter(a => a.status === 'Concluido').length;
  const confirmedTodayCount = todayAppointments.filter(a => a.status === 'Confirmado').length;
  const pendingRemindersCount = appointments.filter(a => !a.reminderSent && a.status === 'Agendado').length;

  const expectedRevenueToday = todayAppointments
    .filter(a => a.status !== 'Cancelado')
    .reduce((sum, a) => sum + a.price, 0);

  const accumulatedEarnedToday = todayAppointments
    .filter(a => a.status === 'Concluido')
    .reduce((sum, a) => sum + a.price, 0);

  // Service distribution for stats
  const serviceCounts = todayAppointments.reduce((acc, current) => {
    acc[current.service] = (acc[current.service] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const banhosCount = (serviceCounts['Banho'] || 0) + (serviceCounts['Banho e Tosa'] || 0);
  const tosasCount = (serviceCounts['Tosa'] || 0) + (serviceCounts['Banho e Tosa'] || 0);

  // Timeline list sorted by time
  const sortedTodayTimeline = [...todayAppointments].sort((a, b) => a.time.localeCompare(b.time));

  // Next active client (first Agendado or Confirmado service from now)
  const nextUp = sortedTodayTimeline.find(a => a.status === 'Agendado' || a.status === 'Confirmado');

  return (
    <div className="space-y-6">
      {/* Banner / Friendly Greeting */}
      <div className="bg-gradient-to-r from-stone-900 via-[#141414] to-stone-900 p-6 rounded-3xl text-stone-200 border border-stone-850 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-900/30 px-2.5 py-1 rounded-full text-xs font-bold w-fit">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Painel Administrativo Executivo</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif italic text-stone-100 tracking-wide">Olá, Laura! 👋 Bem-vinda ao seu Pet CRM</h1>
          <p className="text-xs text-stone-400">Gerencie banhos, tosas, envie lembretes e acompanhe a saúde do seu faturamento hoje.</p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2 relative z-10">
          <button
            onClick={onQuickBook}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-[#0a0a0a] rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Agendar Banho / Tosa</span>
          </button>
          
          <button
            onClick={onNavigate.bind(null, 'clientes')}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <User className="w-4 h-4" />
            <span>Ver Clientes</span>
          </button>

          <button
            onClick={handleExportAppointments}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-amber-500 border border-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 hover:text-amber-400"
            title="Exportar histórico total de agendamentos"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Agenda</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 - Appointments Count */}
        <div className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800/85 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl shrink-0 text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Agendas de Hoje</span>
            <p className="text-xl font-serif italic text-stone-100 leading-tight">{totalTodayCount}</p>
            <p className="text-[9px] text-stone-400 mt-0.5 font-medium">{completedTodayCount} concluídos • {confirmedTodayCount} confirmados</p>
          </div>
        </div>

        {/* Metric 2 - Expected Revenue */}
        <div className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800/85 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl shrink-0 text-emerald-500">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Faturamento Hoje</span>
            <p className="text-xl font-serif italic text-[#34d399] leading-tight">{formatCurrency(expectedRevenueToday)}</p>
            <p className="text-[9px] text-stone-400 mt-0.5 font-medium">{formatCurrency(accumulatedEarnedToday)} já recebido</p>
          </div>
        </div>

        {/* Metric 3 - Pending Reminders */}
        <div 
          onClick={onNavigate.bind(null, 'disparador')}
          className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800/85 shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-amber-900/50 transition-all duration-300"
        >
          <div className="p-3 bg-amber-955/20 border border-amber-900/40 rounded-xl shrink-0 text-amber-500 animate-pulse">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Remessas Pendentes</span>
            <p className="text-xl font-serif italic text-stone-100 leading-tight">{pendingRemindersCount}</p>
            <p className="text-[9px] text-amber-500 font-semibold mt-0.5 flex items-center gap-0.5">
              Enviar lembretes <ArrowRight className="w-2.5 h-2.5" />
            </p>
          </div>
        </div>

        {/* Metric 4 - Clients Registered */}
        <div 
          onClick={onNavigate.bind(null, 'clientes')}
          className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800/85 shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-stone-700 transition"
        >
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl shrink-0 text-stone-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Base de Tutores</span>
            <p className="text-xl font-serif italic text-stone-100 leading-tight">{clients.length}</p>
            <p className="text-[9px] text-stone-500 mt-0.5 font-medium">Clientes fidelizados no CRM</p>
          </div>
        </div>
      </div>

      {/* Main Core Layout: Agenda Checklist Timeline & Daily stats split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left pane: Agenda de Hoje (7/12 classes) */}
        <div className="lg:col-span-8 bg-stone-900/40 rounded-2xl border border-stone-800 overflow-hidden shadow-md">
          <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-stone-950/40">
            <div>
              <h2 className="text-sm font-serif italic text-stone-100">Agenda de Atendimentos Para Hoje</h2>
              <p className="text-xs text-stone-500">Cronograma diário • Clique para atualizar o status em 1 clique</p>
            </div>
            
            <div className="flex items-center gap-2">
              {sortedTodayTimeline.length > 0 && (
                <button
                  onClick={handleExportTodayAppointments}
                  className="px-2.5 py-1 text-[10px] font-bold text-amber-500 bg-amber-955/10 border border-amber-900/30 hover:bg-amber-955/20 rounded-lg flex items-center gap-1 transition"
                  title="Exportar apenas a agenda de hoje"
                >
                  <Download className="w-3 h-3" />
                  <span>Exportar Hoje</span>
                </button>
              )}
              <span className="text-xs font-bold text-amber-500 bg-amber-950/20 border border-amber-900/30 px-2.5 py-1 rounded-full whitespace-nowrap animate-fadeIn">
                {formatDateFriendly(todayStr)}
              </span>
            </div>
          </div>

          {sortedTodayTimeline.length === 0 ? (
            /* Blank state of schedules today */
            <div className="p-16 text-center text-stone-500 space-y-3.5">
              <div className="p-4 bg-stone-900 border border-stone-800 text-stone-400 rounded-full w-fit mx-auto">
                <Calendar className="w-8 h-8 text-stone-500" />
              </div>
              <p className="text-sm font-bold text-stone-300">Agenda livre para hoje!</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">Não há banhos ou tosas programados para hoje. Deseja agendar um novo pet ou importar de seu arquivo?</p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={onQuickBook}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Agendar Novo
                </button>
                <button
                  onClick={onImportClick}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition border border-stone-700"
                >
                  Importar Planilha
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-stone-800/80">
              {sortedTodayTimeline.map((app) => (
                <div key={app.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-transparent hover:bg-stone-900/20 transition">
                  {/* Event item brief */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <span className="font-mono text-xs text-amber-500 bg-stone-950 border border-stone-850 px-2.5 py-1.5 rounded-lg shrink-0 text-center inline-block">
                      {app.time}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-200 truncate">{app.clientName}</span>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-stone-800 border border-stone-750 text-stone-300 rounded-sm">
                          🐾 {app.petName}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <span className="font-semibold text-stone-300">{app.service}</span>
                        <span>•</span>
                        <span className="font-bold text-amber-500">{formatCurrency(app.price)}</span>
                        {app.notes && (
                          <>
                            <span>•</span>
                            <span className="text-stone-500 italic truncate max-w-[150px] sm:max-w-xs">{app.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end border-t sm:border-0 pt-2 sm:pt-0 border-stone-800">
                    {/* Fast WhatsApp reminder fallback if not confirmed */}
                    {app.status === 'Agendado' && (
                      <button
                        onClick={onNavigate.bind(null, 'disparador')}
                        className={`p-1.5 bg-stone-900 border border-stone-800 hover:border-amber-900/50 hover:bg-amber-955/20 hover:text-amber-500 rounded-lg text-stone-400 transition`}
                        title="Enviar Lembrete por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick status cycle buttons */}
                    <div className="flex bg-stone-950 border border-stone-850 p-0.5 rounded-xl">
                      {(['Agendado', 'Confirmado', 'Concluido'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => onUpdateStatus(app.id, st)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${app.status === st ? 'bg-stone-800 text-amber-500 border border-stone-700/50 shadow-xs' : 'text-stone-500 hover:text-stone-300'}`}
                        >
                          {st === 'Concluido' ? 'Concluído' : st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: Daily insights & quick shortcuts (4/12 classes) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Daily workload balance charts rendered with native visual SVGs */}
          <div className="bg-stone-900/40 p-5 rounded-2xl border border-stone-800 shadow-md space-y-4">
            <h3 className="text-xs font-bold text-stone-550 tracking-wider uppercase flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500" /> Balanço do Trabalho de Hoje
            </h3>

            {/* Simulated bar chart for services completed */}
            <div className="space-y-4 pt-1">
              {/* Banhos */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-300">Demanda de Banhos</span>
                  <span className="text-stone-400">{banhosCount} agendados</span>
                </div>
                <div className="w-full h-2.5 bg-stone-950 border border-stone-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-600 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (banhosCount / (totalTodayCount || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Tosas */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-300">Demanda de Tosas (Corte)</span>
                  <span className="text-stone-400">{tosasCount} agendados</span>
                </div>
                <div className="w-full h-2.5 bg-stone-950 border border-stone-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-805 bg-stone-700 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (tosasCount / (totalTodayCount || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mini Tips */}
            <div className="text-[11px] py-2.5 bg-amber-955/10 text-amber-500 rounded-xl px-3.5 border border-amber-900/30 leading-relaxed font-serif italic">
              💡 <strong>Dica de Luxo</strong>: Enviar lembretes do WhatsApp um dia antes (na véspera) reduz as ausências no pet shop em mais de 40%!
            </div>
          </div>

          {/* Next Up Priority alert pane */}
          {nextUp && (
            <div className="bg-gradient-to-br from-amber-955/20 to-stone-950 border border-amber-900/30 p-5 rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <Play className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                <span>Próximo Atendimento</span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-base font-serif italic text-stone-100">{nextUp.clientName}</h4>
                <p className="text-xs text-stone-300">Pet: <span className="font-bold text-amber-500">{nextUp.petName}</span> • às {nextUp.time} ({nextUp.service})</p>
                {nextUp.notes && (
                  <p className="text-[11px] text-stone-400 bg-stone-950/70 p-2.5 rounded-lg italic mt-1.5 border border-stone-850">"{nextUp.notes}"</p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => onUpdateStatus(nextUp.id, 'Concluido')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black rounded-lg text-[10px] font-bold transition flex items-center gap-1 border-none"
                >
                  Confirmar Conclusão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
