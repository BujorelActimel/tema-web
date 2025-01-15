const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conectare la baza de date
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initializare baza de date
function initializeDatabase() {
    db.serialize(() => {
        // Creare tabel pentru valute
        db.run(`CREATE TABLE IF NOT EXISTS currencies (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )`);

        // Creare tabel pentru rate de schimb
        db.run(`CREATE TABLE IF NOT EXISTS exchange_rates (
            from_currency TEXT,
            to_currency TEXT,
            rate REAL NOT NULL,
            PRIMARY KEY (from_currency, to_currency),
            FOREIGN KEY (from_currency) REFERENCES currencies (code),
            FOREIGN KEY (to_currency) REFERENCES currencies (code)
        )`);

        // Inserare date initiale pentru valute
        const currencies = [
            ['EUR', 'Euro'],
            ['USD', 'US Dollar'],
            ['GBP', 'British Pound'],
            ['RON', 'Romanian Leu'],
            ['CHF', 'Swiss Franc']
        ];

        const insertCurrency = db.prepare('INSERT OR IGNORE INTO currencies (code, name) VALUES (?, ?)');
        currencies.forEach(currency => {
            insertCurrency.run(currency);
        });
        insertCurrency.finalize();

        // Inserare rate de schimb initiale
        const rates = [
            ['EUR', 'RON', 4.97],
            ['USD', 'RON', 4.56],
            ['GBP', 'RON', 5.82],
            ['CHF', 'RON', 5.23],
            ['EUR', 'USD', 1.09],
            ['EUR', 'GBP', 0.85],
            ['EUR', 'CHF', 0.95]
        ];

        const insertRate = db.prepare('INSERT OR REPLACE INTO exchange_rates (from_currency, to_currency, rate) VALUES (?, ?, ?)');
        rates.forEach(rate => {
            insertRate.run(rate);
            // Adaugam si rata inversa
            insertRate.run(rate[1], rate[0], 1/rate[2]);
        });
        insertRate.finalize();
    });
}

// Route pentru lista de valute
app.get('/currencies', (req, res) => {
    db.all('SELECT code, name FROM currencies', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        const currencies = {};
        rows.forEach(row => {
            currencies[row.code] = row.name;
        });
        res.json(currencies);
    });
});

// Route pentru conversie
app.get('/convert', (req, res) => {
    const { from, to, amount } = req.query;
    const query = 'SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ?';
    
    db.get(query, [from, to], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Exchange rate not found' });
            return;
        }
        
        const convertedAmount = parseFloat(amount) * row.rate;
        res.json({
            rates: {
                [to]: convertedAmount
            }
        });
    });
});

// Inchidere conexiune la baza de date cand serverul se opreste
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});