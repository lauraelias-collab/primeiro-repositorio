/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Appointment, MessageTemplate } from './types';

// Helper to get formatted date relative to today
const getRelativeDate = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Ana Souza',
    phone: '5511999991111',
    email: 'ana.souza@gmail.com',
    petName: 'Mel',
    petBreed: 'Golden Retriever',
    notes: 'Muito dócil, mas tem medo do soprador de vento forte.',
    createdAt: getRelativeDate(-30),
  },
  {
    id: 'c2',
    name: 'Carlos Oliveira',
    phone: '5521988882222',
    email: 'carlos.oliveira@outlook.com',
    petName: 'Thor',
    petBreed: 'Shih Tzu',
    notes: 'Requer tosa alta na tesoura. Costuma agitar se ver outros cães.',
    createdAt: getRelativeDate(-25),
  },
  {
    id: 'c3',
    name: 'Juliana Lima',
    phone: '5511977773333',
    email: 'ju.lima@yahoo.com.br',
    petName: 'Luna',
    petBreed: 'Poodle',
    notes: 'Fazer o lacinho rosa no topo da cabeça. Pele sensível (usar shampoo neutro).',
    createdAt: getRelativeDate(-15),
  },
  {
    id: 'c4',
    name: 'Roberto Santos',
    phone: '5531966664444',
    email: 'roberto.santos@gmail.com',
    petName: 'Fred',
    petBreed: 'SDR (Sem Raça Definida)',
    notes: 'Pelagem curta, super tranquilo para banho.',
    createdAt: getRelativeDate(-5),
  },
  {
    id: 'c5',
    name: 'Letícia Barbosa',
    phone: '5511955555555',
    email: 'leticia.barbosa@hotmail.com',
    petName: 'Pipoca',
    petBreed: 'Maltês',
    notes: 'Tosa higiênica e banho com hidratação.',
    createdAt: getRelativeDate(-2),
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    clientId: 'c1',
    clientName: 'Ana Souza',
    phone: '5511999991111',
    petName: 'Mel',
    date: getRelativeDate(0), // Today
    time: '09:00',
    service: 'Banho',
    price: 80.00,
    status: 'Confirmado',
    reminderSent: true,
    notes: 'Banho simples com secagem cuidadosa.'
  },
  {
    id: 'a2',
    clientId: 'c2',
    clientName: 'Carlos Oliveira',
    phone: '5521988882222',
    petName: 'Thor',
    date: getRelativeDate(0), // Today
    time: '14:30',
    service: 'Banho e Tosa',
    price: 130.00,
    status: 'Agendado',
    reminderSent: false,
    notes: 'Tosa geral fofinha.'
  },
  {
    id: 'a3',
    clientId: 'c3',
    clientName: 'Juliana Lima',
    phone: '5511977773333',
    petName: 'Luna',
    date: getRelativeDate(-1), // Yesterday
    time: '10:00',
    service: 'Banho e Tosa',
    price: 110.00,
    status: 'Concluido',
    reminderSent: true,
    notes: 'Penteado especial completo.'
  },
  {
    id: 'a4',
    clientId: 'c4',
    clientName: 'Roberto Santos',
    phone: '5531966664444',
    petName: 'Fred',
    date: getRelativeDate(1), // Tomorrow
    time: '11:00',
    service: 'Banho',
    price: 60.00,
    status: 'Agendado',
    reminderSent: false,
    notes: 'Shampoo anti-pulgas por precaução.'
  },
  {
    id: 'a5',
    clientId: 'c5',
    clientName: 'Letícia Barbosa',
    phone: '5511955555555',
    petName: 'Pipoca',
    date: getRelativeDate(2), // In 2 days
    time: '16:00',
    service: 'Banho',
    price: 70.00,
    status: 'Agendado',
    reminderSent: false,
    notes: 'Trazer perfume suave.'
  }
];

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 't1',
    name: 'Lembrete de Agendamento',
    type: 'lembrete',
    text: 'Olá, {nome_cliente}! Tudo bem? 🐾 Passando para confirmar o horário de {servico} do(a) {nome_pet} marcado para {data} às {hora}. Podemos confirmar? Nos avise se precisar reagendar! 🧼🐶'
  },
  {
    id: 't2',
    name: 'Confirmação Automática de Agendamento',
    type: 'lembrete',
    text: 'Olá! Confirmamos o agendamento de {servico} para o(a) {nome_pet} no dia {data} às {hora} com sucesso! Estaremos prontos para atendê-lo da melhor forma possível! 🐾🛁'
  },
  {
    id: 't3',
    name: 'Serviço Concluído / Pronto para Buscar',
    type: 'agradecimento',
    text: 'Olá, {nome_cliente}! Boas notícias! O banho e tosa do(a) {nome_pet} foi finalizado. Ele(a) está cheiroso(a), fofo(a) e pronto(a) para ir para casa! 🚿✨ Pode vir buscá-lo(a) quando desejar.'
  },
  {
    id: 't4',
    name: 'Mensagem de Retorno / Fidelidade',
    type: 'retorno',
    text: 'Oi, {nome_cliente}! Já faz algum tempo que o(a) {nome_pet} não passa aqui no Pet Shop para tomar aquele banho gostoso. Vamos agendar um horário para essa semana e deixá-lo com os pelos brilhando? 🧼🐶 Aguardamos seu contato!'
  }
];
