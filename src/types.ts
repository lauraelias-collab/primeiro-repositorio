/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  petName: string;
  petBreed?: string;
  notes?: string;
  createdAt: string;
}

export type ServiceType = 'Banho' | 'Tosa' | 'Banho e Tosa' | 'Outro';

export type AppointmentStatus = 'Agendado' | 'Confirmado' | 'Concluido' | 'Cancelado';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  phone: string;
  petName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: ServiceType;
  price: number;
  status: AppointmentStatus;
  reminderSent: boolean;
  notes?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'lembrete' | 'agradecimento' | 'retorno' | 'customizado';
  text: string;
}

export interface SpreadsheetColumnMap {
  name: string;
  phone: string;
  email: string;
  petName: string;
  petBreed?: string;
  date?: string;
  time?: string;
  service?: string;
  price?: string;
}
