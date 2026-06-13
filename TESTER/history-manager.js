const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'history.json');

// Cargar el historial en memoria al inicio
let history = new Set();

function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
            const arr = JSON.parse(data);
            history = new Set(arr);
        }
    } catch (e) {
        console.error('Error loading history:', e);
    }
}

function saveHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(Array.from(history)), 'utf-8');
    } catch (e) {
        console.error('Error saving history:', e);
    }
}

// Inicializar
loadHistory();

/**
 * Verifica si un número ya está en el historial
 */
function isDuplicate(number) {
    return history.has(number);
}

/**
 * Agrega un número al historial y lo guarda
 */
function addToHistory(number) {
    history.add(number);
    saveHistory();
}

/**
 * Retorna todos los números enviados
 */
function getHistory() {
    return Array.from(history);
}

/**
 * Elimina un número del historial y lo guarda
 */
function removeFromHistory(number) {
    if (history.has(number)) {
        history.delete(number);
        saveHistory();
        return true;
    }
    return false;
}

module.exports = {
    isDuplicate,
    addToHistory,
    getHistory,
    removeFromHistory
};
