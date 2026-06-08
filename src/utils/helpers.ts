/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sanitizes a phone number for the WhatsApp API link.
 * Must be only digits. Prepends '55' (Brazil) if 10/11 digits are found without country code.
 */
export function sanitizePhoneForWhatsapp(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11 || digits.length === 10) {
    return `55${digits}`;
  }
  
  return digits;
}

/**
 * Formats a raw phone string into (XX) XXXXX-XXXX or similar.
 */
export function formatPhoneFriendly(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 55 and has 12 or 13 digits, extract the local part
  let localDigits = digits;
  if (digits.startsWith('55') && digits.length >= 12) {
    localDigits = digits.slice(2);
  }
  
  if (localDigits.length === 11) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 7)}-${localDigits.slice(7)}`;
  } else if (localDigits.length === 10) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;
  }
  
  // Fallback
  return phone;
}

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateFriendly(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Formats number to currency R$ XX,XX
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Replaces placeholders inside a template string
 */
export interface TemplatePlaceholderData {
  nome_cliente: string;
  nome_pet: string;
  servico: string;
  data: string;
  hora: string;
}

export function fillTemplate(text: string, data: TemplatePlaceholderData): string {
  let filled = text;
  filled = filled.replace(/{nome_cliente}/gi, data.nome_cliente);
  filled = filled.replace(/{nome_pet}/gi, data.nome_pet);
  filled = filled.replace(/{servico}/gi, data.servico);
  filled = filled.replace(/{data}/gi, formatDateFriendly(data.data));
  filled = filled.replace(/{hora}/gi, data.hora);
  return filled;
}

/**
 * Triggers a download of an Excel-compatible CSV file.
 * Automatically adds the UTF-8 BOM so Excel opens it with correct accents,
 * and uses semicolon (;) delimiter since Excel in PT-BR uses is as the column separator.
 */
export function exportToCSV(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const delimiter = ';';
  const csvLines = [
    headers.join(delimiter),
    ...rows.map(row => 
      row.map(value => {
        if (value === undefined || value === null) return '';
        // Escape quotes
        const valStr = String(value).replace(/"/g, '""');
        // Wrap in quotes if it contains semicolon, quotes, or newlines
        if (valStr.includes(delimiter) || valStr.includes('\n') || valStr.includes('"')) {
          return `"${valStr}"`;
        }
        return valStr;
      }).join(delimiter)
    )
  ];
  const csvContent = csvLines.join('\r\n');

  // UTF-8 BOM to force Excel to read accents correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

