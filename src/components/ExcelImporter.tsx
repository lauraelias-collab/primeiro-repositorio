/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Client, Appointment, ServiceType, AppointmentStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ExcelImporterProps {
  clients: Client[];
  onImportComplete: (importedClients: Client[], importedAppointments?: Appointment[]) => void;
  onClose: () => void;
}

export default function ExcelImporter({ clients, onImportComplete, onClose }: ExcelImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'clients_only' | 'clients_and_appointments'>('clients_only');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workbookRef = useRef<XLSX.WorkBook | null>(null);

  const resetState = () => {
    setFile(null);
    setSheetNames([]);
    setSelectedSheet('');
    setRawRows([]);
    setHeaders([]);
    setPreviewRows([]);
    setColumnMapping({});
    setError(null);
  };

  const handleFile = (uploadedFile: File) => {
    setError(null);
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    const extension = uploadedFile.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(uploadedFile.type) && !['xlsx', 'xls', 'csv'].includes(extension || '')) {
      setError('Formato inválido. Por favor, envie uma planilha do Excel (.xlsx, .xls) ou arquivo CSV.');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        workbookRef.current = workbook;
        
        setSheetNames(workbook.SheetNames);
        const firstSheet = workbook.SheetNames[0];
        setSelectedSheet(firstSheet);
        loadSheetData(workbook, firstSheet);
      } catch (err) {
        console.error(err);
        setError('Ocorreu um erro ao carregar a planilha. Verifique se o arquivo não está corrompido.');
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const loadSheetData = (workbook: XLSX.WorkBook, sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    // Read raw data as a 2D array (matrix)
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    if (data.length === 0) {
      setError('A aba selecionada está vazia.');
      return;
    }

    // Filter out completely empty rows
    const filledRows = data.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
    
    if (filledRows.length === 0) {
      setError('Nenhuma linha preenchida encontrada na aba selecionada.');
      return;
    }

    // Header row is index 0
    const rawHeaders: string[] = filledRows[0].map((h: any, idx: number) => 
      h ? String(h).trim() : `Coluna ${idx + 1}`
    );

    setHeaders(rawHeaders);
    setRawRows(filledRows.slice(1));
    setPreviewRows(filledRows.slice(1, 6)); // Preview 5 rows

    // Auto-map columns if likely names match
    const initialMapping: Record<string, number> = {};
    const lowerHeaders = rawHeaders.map(h => h.toLowerCase());

    const mappings = {
      name: ['nome', 'cliente', 'customer', 'nome do cliente', 'nome_cliente'],
      phone: ['telefone', 'tel', 'celular', 'cel', 'whatsapp', 'whats', 'contato', 'fone'],
      email: ['email', 'e-mail', 'mail', 'correio'],
      petName: ['pet', 'nome do pet', 'nome_pet', 'animal', 'cachorro', 'gato', 'nome pet'],
      petBreed: ['raca', 'raça', 'breed', 'tipo_pet', 'especie'],
      // Optional appointment mappings
      date: ['data', 'data agendamento', 'dia', 'date'],
      time: ['hora', 'horario', 'horário', 'time'],
      service: ['servico', 'serviço', 'procedimento', 'service'],
      price: ['valor', 'preco', 'preço', 'custo', 'price']
    };

    Object.entries(mappings).forEach(([key, matches]) => {
      const idx = lowerHeaders.findIndex(lh => matches.some(match => lh.includes(match) || match.includes(lh)));
      if (idx !== -1) {
        initialMapping[key] = idx;
      }
    });

    setColumnMapping(initialMapping);
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedSheet(name);
    if (workbookRef.current) {
      loadSheetData(workbookRef.current, name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleMappingChange = (field: string, colIdx: number) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: colIdx
    }));
  };

  const executeImport = () => {
    if (columnMapping.name === undefined || columnMapping.phone === undefined) {
      setError('Os campos "Nome do Cliente" e "Telefone/WhatsApp" são obrigatórios para realizar o mapeamento.');
      return;
    }

    const importedClients: Client[] = [];
    const importedAppointments: Appointment[] = [];
    const nowStr = new Date().toISOString().split('T')[0];

    rawRows.forEach((row, index) => {
      const cName = row[columnMapping.name] ? String(row[columnMapping.name]).trim() : '';
      let cPhone = row[columnMapping.phone] ? String(row[columnMapping.phone]).replace(/\D/g, '') : '';
      const cEmail = columnMapping.email !== undefined && row[columnMapping.email] ? String(row[columnMapping.email]).trim() : '';
      const cPetName = columnMapping.petName !== undefined && row[columnMapping.petName] ? String(row[columnMapping.petName]).trim() : 'Pet';
      const cPetBreed = columnMapping.petBreed !== undefined && row[columnMapping.petBreed] ? String(row[columnMapping.petBreed]).trim() : '';

      // Skip row if name or phone are completely blank
      if (!cName || !cPhone) return;

      // Brazilian mobile fix: if it starts with 11-9 or other prefix, make sure it has proper format
      // Generate unique ID
      const clientId = `imp_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`;

      const clientObj: Client = {
        id: clientId,
        name: cName,
        phone: cPhone,
        email: cEmail || `${cName.toLowerCase().replace(/\s+/g, '')}@exemplo.com`,
        petName: cPetName,
        petBreed: cPetBreed,
        createdAt: nowStr,
        notes: 'Importado via planilha Excel.'
      };

      importedClients.push(clientObj);

      // If appointments are mapped and user checked "clients and appointments"
      if (importMode === 'clients_and_appointments') {
        const uDate = columnMapping.date !== undefined && row[columnMapping.date] ? String(row[columnMapping.date]).trim() : nowStr;
        const uTime = columnMapping.time !== undefined && row[columnMapping.time] ? String(row[columnMapping.time]).trim() : '09:00';
        const uServiceRaw = columnMapping.service !== undefined && row[columnMapping.service] ? String(row[columnMapping.service]).trim() : 'Banho';
        const uPriceRaw = columnMapping.price !== undefined && row[columnMapping.price] ? String(row[columnMapping.price]) : '80.00';

        // Parse price to number
        let parsedPrice = parseFloat(uPriceRaw.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (isNaN(parsedPrice)) parsedPrice = 80.00;

        // Parse service to strict ServiceType
        let serviceType: ServiceType = 'Banho';
        const sLower = uServiceRaw.toLowerCase();
        if (sLower.includes('tosa') && sLower.includes('banho')) {
          serviceType = 'Banho e Tosa';
        } else if (sLower.includes('tosa')) {
          serviceType = 'Tosa';
        } else if (sLower.includes('outro') || sLower.includes('hidrata') || sLower.includes('unha')) {
          serviceType = 'Outro';
        }

        // Format date dynamically if it's an Excel fractional serial number
        let formattedDate = uDate;
        if (/^\d{5}$|^\d{5}\.\d+$/.test(uDate)) {
          // If Excel serial number format
          try {
            const dateObj = new Date(Math.round((parseFloat(uDate) - 25569) * 86400 * 1000));
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toISOString().split('T')[0];
            }
          } catch (e) {
            formattedDate = nowStr;
          }
        } else if (uDate.includes('/')) {
          // Parse DD/MM/YYYY to YYYY-MM-DD
          const pts = uDate.split('/');
          if (pts.length === 3) {
            formattedDate = `${pts[2]}-${pts[1].padStart(2, '0')}-${pts[0].padStart(2, '0')}`;
          }
        }

        // Format time safely (HH:MM)
        let formattedTime = uTime;
        if (/^\d+(\.\d+)?$/.test(uTime)) {
          // Excel decimal time (fraction of a day)
          const totalSeconds = Math.round(parseFloat(uTime) * 24 * 3600);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else if (uTime.includes(':')) {
          const pts = uTime.split(':');
          formattedTime = `${pts[0].padStart(2, '0')}:${pts[1].slice(0, 2).padStart(2, '0')}`;
        }

        const appointmentObj: Appointment = {
          id: `imp_ap_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
          clientId: clientId,
          clientName: cName,
          phone: cPhone,
          petName: cPetName,
          date: formattedDate,
          time: formattedTime,
          service: serviceType,
          price: parsedPrice,
          status: 'Agendado',
          reminderSent: false,
          notes: 'Agendamento importado via planilha Excel.'
        };

        importedAppointments.push(appointmentObj);
      }
    });

    if (importedClients.length === 0) {
      setError('Não foi possível importar nenhuma linha. Certifique-se de preencher as colunas obrigatórias com dados válidos.');
      return;
    }

    onImportComplete(importedClients, importedAppointments.length > 0 ? importedAppointments : undefined);
  };

  const dropZoneClass = isDragOver
    ? 'border-emerald-500 bg-emerald-955/20 text-stone-200'
    : 'border-stone-800 hover:border-emerald-700 bg-stone-900/40 text-stone-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] bg-[#0c0c0c] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-850"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#121212] border-b border-stone-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-950 text-emerald-450 border border-stone-850 rounded-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif italic text-stone-105 font-bold">Importar Clientes / Agendamentos</h2>
              <p className="text-xs text-stone-450">Importe dados a partir de planilhas do Excel (.xlsx, .xls) ou CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-550 hover:text-stone-300 rounded-lg p-2 hover:bg-stone-900 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-955/20 text-rose-400 border-l-4 border-rose-500 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Upload */}
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition duration-200 ${dropZoneClass}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Upload className="w-12 h-12 text-stone-600 mx-auto mb-4 animate-bounce" />
              <p className="text-base font-semibold text-stone-300">Arraste sua planilha ou clique para fazer upload</p>
              <p className="text-xs text-stone-500 mt-2">Formatos aceitos: Microsoft Excel (.xlsx, .xls) ou CSV</p>
              
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-stone-955 text-stone-400 rounded-lg text-xs font-semibold border border-stone-850">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                Dica: O sistema permite mapear qualquer cabeçalho de coluna
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* File Info */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 bg-stone-955 rounded-xl border border-stone-850">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-stone-900 border border-stone-800 text-emerald-400 rounded-lg font-bold">XLS</div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-200 max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">{file.name}</h4>
                    <p className="text-xs text-stone-500">{(file.size / 1024).toFixed(1)} KB • {rawRows.length} linhas de dados carregadas</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {sheetNames.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-450 shrink-0 font-medium">Pasta/Aba:</span>
                      <select
                        value={selectedSheet}
                        onChange={handleSheetChange}
                        className="text-xs border border-stone-800 outline-none bg-stone-900 px-2 py-1.5 rounded-md text-stone-205 font-medium font-sans"
                      >
                        {sheetNames.map((name) => (
                          <option key={name} value={name} className="bg-stone-955 text-stone-250">{name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    onClick={resetState}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-800 text-xs text-stone-400 hover:text-stone-150 rounded-md bg-stone-900 transition hover:bg-stone-850 ml-auto font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Trocar arquivo
                  </button>
                </div>
              </div>

              {/* Step 2: Choose Mode */}
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-850">
                <h3 className="text-xs font-bold text-stone-500 tracking-wider uppercase mb-3 flex items-center gap-1.5 font-mono">
                  <Layers className="w-4 h-4 text-amber-500" />
                  1. O que deseja importar desta planilha?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`flex p-4 rounded-xl border-2 cursor-pointer transition ${importMode === 'clients_only' ? 'border-amber-600 bg-amber-955/15' : 'border-stone-850 bg-stone-950 hover:border-stone-800'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'clients_only'}
                      onChange={() => setImportMode('clients_only')}
                      className="sr-only"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-stone-200">Apenas Cadastro dos Clientes</h4>
                      <p className="text-xs text-stone-450 mt-1">Lê apenas informações cadastrais (Nome, WhatsApp, E-mail e nome do Pet) de forma consolidada no CRM.</p>
                    </div>
                  </label>
                  
                  <label className={`flex p-4 rounded-xl border-2 cursor-pointer transition ${importMode === 'clients_and_appointments' ? 'border-amber-600 bg-amber-955/15' : 'border-stone-850 bg-stone-955/5 hover:border-stone-800'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'clients_and_appointments'}
                      onChange={() => setImportMode('clients_and_appointments')}
                      className="sr-only"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-stone-200">Clientes + Histórico de Agendamento</h4>
                      <p className="text-xs text-stone-450 mt-1">Lê os clientes e também cria os horários marcados de banho/tosa (para hoje ou em datas históricas).</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 3: Mapping */}
              <div className="bg-stone-955/20 p-4 rounded-xl border border-stone-850">
                <h3 className="text-xs font-bold text-stone-500 tracking-wider uppercase mb-3 font-mono">
                  2. Mapeamento de Colunas da Planilha
                </h3>
                <p className="text-xs text-stone-450 mb-4">Mapeie quais campos do CRM correspondem a quais colunas detectadas no seu Excel:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Client Name (Required) */}
                  <div className="space-y-1.5 bg-stone-955 p-3 rounded-lg border border-stone-850">
                    <label className="text-xs font-bold text-stone-250 flex items-center justify-between">
                      <span>Nome do Cliente <span className="text-amber-500">*</span></span>
                      <span className="text-[10px] text-amber-500 bg-amber-955/25 px-1.5 py-0.5 rounded border border-amber-900/30 font-bold font-mono">Obrigatório</span>
                    </label>
                    <select
                      value={columnMapping.name !== undefined ? columnMapping.name : ''}
                      onChange={(e) => handleMappingChange('name', parseInt(e.target.value))}
                      className="w-full text-xs bg-stone-900 border border-stone-800 text-stone-300 outline-none px-2.5 py-2 rounded focus:border-amber-900/40 transition font-sans"
                    >
                      <option value="" className="bg-[#111]">-- Selecione uma coluna --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx} className="bg-[#111]">{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Client Phone / WhatsApp (Required) */}
                  <div className="space-y-1.5 bg-stone-955 p-3 rounded-lg border border-stone-850">
                    <label className="text-xs font-bold text-stone-250 flex items-center justify-between">
                      <span>WhatsApp / Telefone <span className="text-amber-500">*</span></span>
                      <span className="text-[10px] text-amber-500 bg-amber-955/25 px-1.5 py-0.5 rounded border border-amber-900/30 font-bold font-mono">Obrigatório</span>
                    </label>
                    <select
                      value={columnMapping.phone !== undefined ? columnMapping.phone : ''}
                      onChange={(e) => handleMappingChange('phone', parseInt(e.target.value))}
                      className="w-full text-xs bg-stone-900 border border-stone-800 text-stone-300 outline-none px-2.5 py-2 rounded focus:border-amber-900/40 transition font-sans"
                    >
                      <option value="" className="bg-[#111]">-- Selecione uma coluna --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx} className="bg-[#111]">{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pet Name (Highly recommended) */}
                  <div className="space-y-1.5 bg-stone-955 p-3 rounded-lg border border-stone-850">
                    <label className="text-xs font-bold text-stone-250 flex items-center justify-between">
                      <span>Nome do Pet</span>
                      <span className="text-[10px] text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded font-semibold border border-stone-800">Padrão "Pet"</span>
                    </label>
                    <select
                      value={columnMapping.petName !== undefined ? columnMapping.petName : ''}
                      onChange={(e) => handleMappingChange('petName', parseInt(e.target.value))}
                      className="w-full text-xs bg-stone-900 border border-stone-850 text-stone-300 outline-none px-2.5 py-2 rounded focus:border-amber-900/45 transition font-sans"
                    >
                      <option value="" className="bg-[#111]">-- Selecione uma coluna --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx} className="bg-[#111]">{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 bg-stone-955 p-3 rounded-lg border border-stone-850">
                    <label className="text-xs font-bold text-stone-300">E-mail do Cliente</label>
                    <select
                      value={columnMapping.email !== undefined ? columnMapping.email : ''}
                      onChange={(e) => handleMappingChange('email', parseInt(e.target.value))}
                      className="w-full text-xs bg-stone-900 border border-stone-800 text-stone-300 outline-none px-2.5 py-2 rounded focus:border-amber-900/45 transition font-sans"
                    >
                      <option value="" className="bg-[#111]">-- Sem mapeamento --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx} className="bg-[#111]">{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pet breed */}
                  <div className="space-y-1.5 bg-stone-955 p-3 rounded-lg border border-stone-850">
                    <label className="text-xs font-bold text-stone-300">Raça do Pet</label>
                    <select
                      value={columnMapping.petBreed !== undefined ? columnMapping.petBreed : ''}
                      onChange={(e) => handleMappingChange('petBreed', parseInt(e.target.value))}
                      className="w-full text-xs bg-stone-900 border border-stone-800 text-stone-300 outline-none px-2.5 py-2 rounded focus:border-amber-900/45 transition font-sans"
                    >
                      <option value="" className="bg-[#111]">-- Sem mapeamento --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx} className="bg-[#111]">{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Conditional mapping fields for APPOINTMENT */}
                  {importMode === 'clients_and_appointments' && (
                    <>
                      <div className="space-y-1.5 bg-[#121212] p-3 rounded-lg border border-stone-850">
                        <label className="text-xs font-bold text-amber-500">Data do Agendamento</label>
                        <select
                          value={columnMapping.date !== undefined ? columnMapping.date : ''}
                          onChange={(e) => handleMappingChange('date', parseInt(e.target.value))}
                          className="w-full text-xs bg-stone-900 border border-stone-800 text-stone-300 outline-none px-2.5 py-2 rounded focus:border-amber-955 transition font-sans"
                        >
                          <option value="" className="bg-[#111]">-- Padrão (Hoje) --</option>
                          {headers.map((h, idx) => (
                            <option key={idx} value={idx} className="bg-[#111]">{h}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 bg-[#121212] p-3 rounded-lg border border-stone-850">
                        <label className="text-xs font-bold text-amber-500">Horário do Agendamento</label>
                        <select
                          value={columnMapping.time !== undefined ? columnMapping.time : ''}
                          onChange={(e) => handleMappingChange('time', parseInt(e.target.value))}
                          className="w-full text-xs bg-stone-900 border border-stone-800 text-stone-305 outline-none px-2.5 py-2 rounded focus:border-amber-955 transition font-sans"
                        >
                          <option value="" className="bg-[#111]">-- Padrão (09:00) --</option>
                          {headers.map((h, idx) => (
                            <option key={idx} value={idx} className="bg-[#111]">{h}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 bg-[#121212] p-3 rounded-lg border border-stone-850">
                        <label className="text-xs font-bold text-amber-505">Tipo de Serviço</label>
                        <select
                          value={columnMapping.service !== undefined ? columnMapping.service : ''}
                          onChange={(e) => handleMappingChange('service', parseInt(e.target.value))}
                          className="w-full text-xs bg-stone-900 border border-stone-800 text-stone-305 outline-none px-2.5 py-2 rounded focus:border-amber-955 transition font-sans"
                        >
                          <option value="" className="bg-[#111]">-- Padrão (Banho) --</option>
                          {headers.map((h, idx) => (
                            <option key={idx} value={idx} className="bg-[#111]">{h}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 bg-[#121212] p-3 rounded-lg border border-stone-850">
                        <label className="text-xs font-bold text-amber-505">Preço do Serviço</label>
                        <select
                          value={columnMapping.price !== undefined ? columnMapping.price : ''}
                          onChange={(e) => handleMappingChange('price', parseInt(e.target.value))}
                          className="w-full text-xs bg-stone-900 border border-stone-800 text-stone-305 outline-none px-2.5 py-2 rounded focus:border-amber-955 transition font-sans"
                        >
                          <option value="" className="bg-[#111]">-- Padrão (R$80,00) --</option>
                          {headers.map((h, idx) => (
                            <option key={idx} value={idx} className="bg-[#111]">{h}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Step 4: Preview Table */}
              <div className="border border-stone-850 rounded-xl overflow-hidden bg-stone-950">
                <div className="px-4 py-2.5 bg-stone-900 border-b border-stone-850 text-stone-300 font-bold text-xs uppercase tracking-wider font-mono">
                  Visualização de Amostra (Primeiras 5 linhas do Excel)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-[#151515] border-b border-stone-850">
                      <tr>
                        {headers.map((h, idx) => {
                          const isMapped = Object.values(columnMapping).includes(idx);
                          return (
                            <th key={idx} className={`px-4 py-2 font-mono font-medium ${isMapped ? 'bg-amber-955/10 text-amber-500 font-bold border-x border-stone-850' : 'text-stone-400'}`}>
                              {h}
                              {isMapped && (
                                <span className="block text-[9px] text-amber-500 uppercase tracking-wider leading-normal mt-0.5 font-bold">
                                  Mapped: {Object.keys(columnMapping).find(k => columnMapping[k] === idx)}
                                </span>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850 bg-stone-950">
                      {previewRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-stone-900/40">
                          {headers.map((_, cIdx) => (
                            <td key={cIdx} className={`px-4 py-2 whitespace-nowrap overflow-hidden max-w-[200px] text-ellipsis ${Object.values(columnMapping).includes(cIdx) ? 'bg-amber-955/5 border-x border-stone-850' : ''}`}>
                              {row[cIdx] !== undefined ? String(row[cIdx]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-stone-900 border-t border-stone-850 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-stone-800 text-stone-400 hover:text-stone-150 rounded-xl text-sm font-medium transition hover:bg-stone-850"
          >
            Cancelar
          </button>
          
          {file && (
            <button
              onClick={executeImport}
              disabled={columnMapping.name === undefined || columnMapping.phone === undefined}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition ${columnMapping.name === undefined || columnMapping.phone === undefined ? 'bg-stone-800 text-stone-500 cursor-not-allowed shadow-none' : 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-950/20'}`}
            >
              <Check className="w-4 h-4" />
              <span>Importar {rawRows.length} Registros</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
