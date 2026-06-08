/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageTemplate } from '../types';
import { fillTemplate } from '../utils/helpers';
import { FileText, Save, Info, Plus, Trash2, Edit, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TemplateEditorProps {
  templates: MessageTemplate[];
  onSaveTemplate: (template: MessageTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onAddTemplate: (template: Omit<MessageTemplate, 'id'>) => void;
}

export default function TemplateEditor({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onAddTemplate
}: TemplateEditorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Fields state
  const [formName, setFormName] = useState('');
  const [formText, setFormText] = useState('');
  const [formType, setFormType] = useState<'lembrete' | 'agradecimento' | 'retorno' | 'customizado'>('lembrete');

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0] || null;

  // Real-time variables substitution preview details
  const SAMPLE_PREVIEW_DATA = {
    nome_cliente: 'Mariana Costa',
    nome_pet: 'Bidu',
    servico: 'Banho e Tosa Completo',
    data: '2026-06-04',
    hora: '14:00'
  };

  const handleStartEdit = () => {
    if (!selectedTemplate) return;
    setFormName(selectedTemplate.name);
    setFormText(selectedTemplate.text);
    setFormType(selectedTemplate.type);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleStartAdd = () => {
    setFormName('');
    setFormText('');
    setFormType('lembrete');
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formText) {
      alert('Nome e texto do template são obrigatórios!');
      return;
    }

    if (isEditing && selectedTemplate) {
      onSaveTemplate({
        ...selectedTemplate,
        name: formName,
        text: formText,
        type: formType
      });
      setIsEditing(false);
    } else {
      onAddTemplate({
        name: formName,
        text: formText,
        type: formType
      });
      setIsAdding(false);
      // Wait for re-render, select last
      setTimeout(() => {
        setSelectedTemplateId(templates[templates.length - 1]?.id || '');
      }, 50);
    }
  };

  const placeholderBadges = [
    { tag: '{nome_cliente}', label: 'Nome do Tutor' },
    { tag: '{nome_pet}', label: 'Nome do Pet' },
    { tag: '{servico}', label: 'Serviço Agendado' },
    { tag: '{data}', label: 'Data formatada' },
    { tag: '{hora}', label: 'Horário do banho' },
  ];

  const handleInjectTag = (tag: string) => {
    setFormText(prev => prev + tag);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Templates Directory - 4/12 cols */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800">Modelos de Mensagens</h2>
            <button
              onClick={handleStartAdd}
              className="flex items-center gap-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Modelo</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">Selecione, edite ou crie novos modelos de mensagens para disparar no WhatsApp.</p>
        </div>

        {/* Directory List */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {templates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              const typeLabels = {
                lembrete: 'Lembrete',
                agradecimento: 'Serviço Pronto',
                retorno: 'Fidelização',
                customizado: 'Customizado'
              };
              
              const badgeColors = {
                lembrete: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                agradecimento: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                retorno: 'bg-amber-50 text-amber-700 border-amber-100',
                customizado: 'bg-slate-50 text-slate-700 border-slate-100'
              };

              return (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setIsEditing(false);
                    setIsAdding(false);
                  }}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition border-l-4 ${isSelected ? 'bg-indigo-50/45 border-indigo-600' : 'bg-white border-transparent'}`}
                >
                  <p className="font-semibold text-sm text-slate-850 truncate">{template.name}</p>
                  <div className="flex gap-2 items-center mt-2">
                    <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${badgeColors[template.type]}`}>
                      {typeLabels[template.type]}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {template.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor & Rendering Panel - 8/12 cols */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {isEditing || isAdding ? (
            /* Editing or Creating form */
            <motion.div
              key="template-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4"
            >
              <h2 className="text-base font-extrabold text-slate-800">
                {isEditing ? `Editar Modelo: ${selectedTemplate?.name}` : 'Criar Novo Modelo de Mensagem'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Identificação / Nome do Modelo <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Lembrete de Banho 24h"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 outline-hidden rounded-xl focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Type Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Objetivo / Tipo</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 outline-hidden px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:bg-white transition"
                    >
                      <option value="lembrete">Lembrete de Horário</option>
                      <option value="agradecimento">Serviço Concluído / Pronto</option>
                      <option value="retorno">Fidelização / Aviso do Sumiço</option>
                      <option value="customizado">Customizado Geral</option>
                    </select>
                  </div>
                </div>

                {/* Tags injection helpers */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1 text-slate-650 text-xs font-bold">
                    <Info className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Variáveis de Autopreenchimento (Clique para inserir)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Insira estas tags no texto para que o sistema as substitua automaticamente pelas informações de cada cliente na hora de enviar.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {placeholderBadges.map((badge) => (
                      <button
                        key={badge.tag}
                        type="button"
                        onClick={() => handleInjectTag(badge.tag)}
                        className="text-[10px] hover:bg-indigo-100 hover:text-indigo-800 text-indigo-700 bg-indigo-50 font-semibold px-2 py-1 rounded border border-indigo-100 transition"
                      >
                        {badge.tag} ({badge.label})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Editor textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Texto Mensagem WhatsApp <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows={4}
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="Olá, {nome_cliente}! Seu pet {nome_pet} tem banho agendado..."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 outline-hidden rounded-xl focus:border-indigo-500 focus:bg-white transition resize-none font-sans"
                  />
                </div>

                {/* Form Footer */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setIsAdding(false);
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Gravar Modelo</span>
                  </button>
                </div>
              </form>
            </motion.div>
          ) : selectedTemplate ? (
            /* Showing Selected Template details and Live Simulator rendering */
            <motion.div
              key={`template-details-${selectedTemplate.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100"
            >
              {/* Toolbar */}
              <div className="p-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visualizando Modelo</p>
                  <h2 className="text-base font-extrabold text-slate-800">{selectedTemplate.name}</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-650 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      if (templates.length <= 1) {
                        alert('Você precisa manter pelo menos 1 modelo de mensagem no sistema.');
                        return;
                      }
                      if (confirm(`Excluir o modelo "${selectedTemplate.name}"?`)) {
                        onDeleteTemplate(selectedTemplate.id);
                        setSelectedTemplateId(templates.find(t => t.id !== selectedTemplate.id)?.id || '');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-100 bg-white rounded-xl text-xs font-bold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>

              {/* Raw Text Display */}
              <div className="p-6 space-y-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase">Texto Base</h3>
                <div className="p-4 bg-slate-50 rounded-xl text-xs border border-slate-150 text-slate-700 whitespace-pre-wrap font-mono relative">
                  {selectedTemplate.text}
                </div>
              </div>

              {/* Interactive Live Generator Simulator */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-450 uppercase tracking-wider">Simulador de Envio Real (WhatsApp)</h3>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Amostra de Demonstração
                  </span>
                </div>
                <p className="text-xs text-slate-500">Veja exatamente como o WhatsApp converterá as tags para o cliente final na hora de disparar o lembrete:</p>
                
                {/* Simulated chat message balloon */}
                <div className="p-5 bg-teal-50/40 rounded-2xl border border-teal-100 flex flex-col items-end">
                  <div className="w-full max-w-[85%] bg-[#dcf8c6] border border-[#d2f1b8] text-[#222222] text-xs p-4 rounded-t-xl rounded-bl-xl shadow-xs leading-relaxed whitespace-pre-wrap font-sans relative">
                    {fillTemplate(selectedTemplate.text, SAMPLE_PREVIEW_DATA)}
                    <span className="block text-right text-[9px] text-[#222222]/55 mt-1">
                      15:30 ✔✔
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 text-slate-400">
              <FileText className="w-12 h-12 text-slate-355 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Selecione ou crie um modelo de mensagem</p>
              <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">Customize de ponta a ponta as abordagens enviadas aos clientes via WhatsApp.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
