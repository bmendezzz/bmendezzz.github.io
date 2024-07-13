document.addEventListener("DOMContentLoaded", function() {
    const apiUrl = 'https://api.airtable.com/v0/appBN2V1vvYM6KC7c/Table%201?maxRecords=3&view=dados_historicos';
    const apiKey = 'Bearer patUVaLf7yR0gM5gu.44e755779f53b6ccf29dd18f8de42362564fea5fffb0dbe2f6c50d0473d2efba';

    const tableBody = document.querySelector('#resultsTable tbody');
    const suggestionElement = document.getElementById('suggestion');
    const statsElement = document.getElementById('stats');
    const debugElement = document.getElementById('debug');

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
            debugElement.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`; // Exibir dados de depuração

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
                debugElement.innerHTML += `<p>Formato de dados inesperado: ${JSON.stringify(data)}</p>`;
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            debugElement.innerHTML += `<p>Erro ao buscar dados: ${error.message}</p>`;
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
                weightedCounts.Player += weights[index];
            } else if (result === 'Banker') {
                weightedCounts.Banker += weights[index];
            } else if (result === 'Tie') {
                weightedCounts.Tie += weights[index];
            }
        });

        console.log('Contagem ponderada dos resultados:', weightedCounts);

        // Ordena os resultados por peso
        const sortedResults = Object.keys(weightedCounts).sort((a, b) => weightedCounts[b] - weightedCounts[a]);
        console.log('Resultados ordenados:', sortedResults);

        const lastResult = lastThree[2];

        // Evita a repetição imediata do último resultado
        if (sortedResults[0] !== lastResult) {
            return sortedResults[0];
        } else if (sortedResults[1] !== lastResult) {
            return sortedResults[1];
        } else {
            return sortedResults[2];
        }
    }

    function updateSuggestionElement(suggestion) {
        suggestionElement.innerHTML = `Sugestão do Próximo Resultado: <br>`;
        if (suggestion) {
            const circleDiv = document.createElement('div');
            circleDiv.classList.add('circle', suggestion);
            circleDiv.innerText = suggestion.charAt(0);
            suggestionElement.appendChild(circleDiv);
            suggestionElement.innerHTML += ` ${suggestion}`;
        } else {
            suggestionElement.innerHTML += 'Nenhum resultado sugerido';
        }
    }

    function updateStats(results) {
        const counts = {
            Player: 0,
            Banker: 0,
            Tie: 0
        };

        results.forEach(result => {
            if (result === 'Player') {
                counts.Player++;
            } else if (result === 'Banker') {
                counts.Banker++;
            } else if (result === 'Tie') {
                counts.Tie++;
            }
        });

        const total = results.length;
        const playerPercent = ((counts.Player / total) * 100).toFixed(2);
        const bankerPercent = ((counts.Banker / total) * 100).toFixed(2);
        const tiePercent = ((counts.Tie / total) * 100).toFixed(2);

        statsElement.innerHTML = `Player: ${playerPercent}% | Banker: ${bankerPercent}% | Tie: ${tiePercent}%`;
    }

    function updateDebugInfo(results, suggestion) {
        const lastThree = results.slice(-3);
        const debugMessage = `Últimos 3 resultados: ${lastThree.join(', ')}<br>Sugestão: ${suggestion}`;
        debugElement.innerHTML += `<p>${debugMessage}</p>`;
    }

    fetchData();
    setInterval(fetchData, 1500);
});