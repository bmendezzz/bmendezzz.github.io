document.addEventListener("DOMContentLoaded", function() {
    const apiUrl = 'https://api.airtable.com/v0/appBN2V1vvYM6KC7c/Table%201?maxRecords=3&view=dados_historicos';
    const apiKey = 'Bearer patUVaLf7yR0gM5gu.44e755779f53b6ccf29dd18f8de42362564fea5fffb0dbe2f6c50d0473d2efba';

    const tableBody = document.querySelector('#resultsTable tbody');
    const suggestionElement = document.getElementById('suggestion');
    const statsElement = document.getElementById('stats');
    const debugElement = document.createElement('div');
    debugElement.id = 'debug';
    debugElement.style.display = 'none'; // Tornando o elemento invisível
    document.body.appendChild(debugElement);

    if (!tableBody || !suggestionElement || !statsElement || !debugElement) {
        console.error('Erro: Não foi possível encontrar todos os elementos DOM necessários.');
        return;
    }

    let previousResults = [];

    async function fetchData() {
        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Dados recebidos:', data);

            if (data.records && data.records.length > 0 && data.records[0].fields.Nome) {
                const results = data.records[0].fields.Nome.split(', ').map(result => result.trim());
                const maxRows = 6;

                const suggestion = suggestNextResult(results);
                updateSuggestionElement(suggestion);

                updateTable(results, maxRows, suggestion);
                updateStats(results);
                updateDebugInfo(results, suggestion); // Atualiza informações de depuração
                previousResults = results;
            } else {
                console.error('Formato de dados inesperado:', data);
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    }

    function updateTable(results, maxRows, suggestion) {
        tableBody.innerHTML = '';

        let columns = Math.ceil(results.length / maxRows);

        for (let col = 0; col < columns; col++) {
            for (let row = 0; row < maxRows; row++) {
                if (col * maxRows + row >= results.length) break;

                let tableCell;
                if (tableBody.rows[row]) {
                    tableCell = tableBody.rows[row].insertCell();
                } else {
                    let tableRow = tableBody.insertRow();
                    tableCell = tableRow.insertCell();
                }

                let circleDiv = document.createElement('div');
                circleDiv.classList.add('circle', results[col * maxRows + row].trim());
                circleDiv.innerText = results[col * maxRows + row].trim().charAt(0);

                if (results[col * maxRows + row].trim() === suggestion) {
                    tableCell.classList.add('correct');
                }

                tableCell.appendChild(circleDiv);
            }
        }
    }

    function suggestNextResult(results) {
        if (results.length < 3) {
            console.log("Resultados insuficientes para sugestão.");
            return 'Player';  // Retorna um valor padrão
        }

        const lastThree = results.slice(-3);
        console.log('Últimos 3 resultados:', lastThree);

        const weightedCounts = {
            Player: 0,
            Banker: 0,
            Tie: 0
        };

        const weights = [1, 2, 3];  // Pesos: antepenúltimo, penúltimo, último

        lastThree.forEach((result, index) => {
            if (result === 'Player') {
