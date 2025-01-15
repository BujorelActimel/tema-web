const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// route pentru convertirea valutelor
app.get('/convert', async (req, res) => {
    const { from, to, amount } = req.query;
    
    try {
        // asta e api-ul (e gratis si nici nu trebuie api key)
        const response = await axios.get(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Eroare la convertire' });
    }
});

// route pentru a obtine lista de valute disponibile
app.get('/currencies', async (req, res) => {
    try {
        const response = await axios.get('https://api.frankfurter.app/currencies');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Eroare la obtinerea listei de valute' });
    }
});

app.listen(port, () => {
    console.log(`Serverul ruleaza la http://localhost:${port}`);
});