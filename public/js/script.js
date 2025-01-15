async function loadCurrencies() {
    try {
        const response = await fetch('http://localhost:3000/currencies');
        const currencies = await response.json();
        
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');
        
        Object.entries(currencies).forEach(([code, name]) => {
            fromSelect.add(new Option(`${code} - ${name}`, code));
            toSelect.add(new Option(`${code} - ${name}`, code));
        });
        
        fromSelect.value = 'EUR';
        toSelect.value = 'RON';
    } catch (error) {
        console.error('Error loading currencies:', error);
    }
}

function switchCurrencies() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    const tempValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;
    
    convertCurrency();
}

async function convertCurrency() {
    const amount = document.getElementById('amount').value;
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const resultDiv = document.getElementById('result');
    const button = document.querySelector('button:not(.switch-button)');

    button.disabled = true;
    resultDiv.textContent = 'Converting...';

    try {
        const response = await fetch(`http://localhost:3000/convert?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`);
        const data = await response.json();
        
        if (data.rates) {
            const rate = data.rates[toCurrency];
            resultDiv.textContent = `${amount} ${fromCurrency} = ${rate.toFixed(2)} ${toCurrency}`;
        }
    } catch (error) {
        resultDiv.textContent = 'Error occurred during conversion. Please try again.';
    } finally {
        button.disabled = false;
    }
}

loadCurrencies();