export const CSVHandler = {
    
    exportCSV(records, filename) {
        if (!records || records.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        const headers = ['Contacto', 'Teléfono', 'Fecha/Hora', 'Tipo', 'Notas', 'Estado'];
        const rows = records.map(r => [
            r.contacto || '', 
            r.telefono || '', 
            r.fechaHora || '', 
            r.tipo || '', 
            r.notas ? r.notas.replace(/\n/g, ' ') : '', 
            r.estado || ''
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importCSV(file, onParse) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n')
                                  .filter(l => l.trim().length > 0)
                                  .map(l => {
                                      // RegEx para parsear CSV respetando comillas
                                      const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                                      return l.split(re).map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
                                  });
                
                if (lines.length < 2) throw new Error('Archivo sin datos o formato incorrecto');
                
                const headers = lines[0];
                const expectedHeaders = ['Contacto', 'Teléfono', 'Fecha/Hora', 'Tipo', 'Notas', 'Estado'];
                
                // Validación básica de headers
                if (headers[0] !== expectedHeaders[0] && headers[1] !== expectedHeaders[1]) {
                    throw new Error('Cabeceras inválidas. Se espera: Contacto, Teléfono, ...');
                }

                const records = lines.slice(1).map(row => ({
                    id: crypto.randomUUID(),
                    contacto: row[0] || '',
                    telefono: row[1] || '',
                    fechaHora: row[2] || '',
                    tipo: row[3] || '',
                    notas: row[4] || '',
                    estado: row[5] || 'pendiente',
                    createdAt: Date.now()
                }));

                onParse(records);
            } catch (error) {
                alert('Error al importar: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
};
