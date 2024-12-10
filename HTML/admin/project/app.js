// Déclaration des données de transactions
let transactions = {
    deposits: [],
    withdrawals: []
};
let autoRefreshInterval = null;
//---------------------------------------------------------------------------------------------------------------

// Gestion de la recherche
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase(); // Terme de recherche en minuscules
    const activeTab = document.querySelector('.tab-button.active').dataset.tab; // Onglet actif

    // Vérifie si l'onglet actif est pour les dépôts ou retraits
    if (activeTab === 'deposits') {
        transactions.deposits.forEach(dateGroup => {
            dateGroup.items.forEach(transaction => {
                const card = document.querySelector(`.transaction-card.deposit[data-id="${transaction.id}"]`);
                const matches = (transaction.User?.name || '').toLowerCase().includes(searchTerm) ||
                                (transaction.operatorNumber || '').includes(searchTerm) ||
                                (transaction.amount ||'').includes(searchTerm);
                if (card) {
                    card.classList.toggle('hidden', !matches); // Masque ou affiche la carte en fonction de la correspondance
                }
            });
        });
    } else if (activeTab === 'withdrawals') {
        transactions.withdrawals.forEach(transaction => {
            const card = document.querySelector(`.transaction-card.withdrawal[data-id="${transaction.id}"]`);
            const matches = (transaction.User?.name || '').toLowerCase().includes(searchTerm) ||
                            (transaction.operatorNumber || '').includes(searchTerm) ||
                            (transaction.amount ||'').includes(searchTerm);
            if (card) {
                card.classList.toggle('hidden', !matches); // Masque ou affiche la carte en fonction de la correspondance
            }
        });
    }
}


//---------------------------------------------------------------------------------------------------------------
// Gestion des onglets
function switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    document.querySelectorAll('.transactions-section').forEach(section => {
        section.classList.toggle('active', section.id === `${tabName}-section`);
    });
}

// Ajout des gestionnaires d'événements pour les boutons des onglets
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
        });
    });

    // Charger les données initiales et démarrer le rafraîchissement automatique
    loadData();
    startAutoRefresh();
});

// Formatage des montants
function formatAmount(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

// Création d'une carte de transaction
function createTransactionCard(transaction) {
    const card = document.createElement('div');
    card.className = `transaction-card ${transaction.type}`;
    card.dataset.id = transaction.id;

    const sign = transaction.type === 'withdrawal' ? '-' : '+';

    card.innerHTML = `
        <div class="transaction-info">
            <div class="customer-details">
                <div class="customer-name">${transaction.User?.name || 'Nom inconnu'}</div>
                <div class="customer-phone">${transaction.operatorNumber || 'Téléphone inconnu'}</div>
            </div>
            <div class="transaction-amount">
                <div class="amount">${sign}${formatAmount(transaction.amount)}</div>
                <div class="time">${new Date(transaction.createdAt).toLocaleString()}</div>
            </div>
        </div>
        <div class="actions">
            <button class="btn btn-approve" onclick="handleTransaction(${transaction.id}, '${transaction.type}', 'approve')">Valider</button>
            <button class="btn btn-reject" onclick="handleTransaction(${transaction.id}, '${transaction.type}', 'reject')">Annuler</button>
        </div>
    `;

    return card;
}

// Fonction pour trier les transactions par date (plus récente d'abord)
function sortTransactionsByDate(transactionsArray) {
    return transactionsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Affichage des dépôts
function renderDeposits() {
    const depositsContainer = document.getElementById('deposits-list');
    depositsContainer.innerHTML = '';

    // Trier les dépôts par date
    const sortedDeposits = sortTransactionsByDate(transactions.deposits);
    sortedDeposits.forEach(transaction => {
        depositsContainer.appendChild(createTransactionCard(transaction));
    });
}

// Affichage des retraits
function renderWithdrawals() {
    const withdrawalsContainer = document.getElementById('withdrawals-list');
    withdrawalsContainer.innerHTML = '';

    // Trier les retraits par date
    const sortedWithdrawals = sortTransactionsByDate(transactions.withdrawals);
    sortedWithdrawals.forEach(transaction => {
        withdrawalsContainer.appendChild(createTransactionCard(transaction));
    });
}

// Gestion des actions sur les transactions
async function handleTransaction(id, type, action) {
    const url = action === 'approve' 
        ? `https://lionfish-app-54bdv.ondigitalocean.app/transaction/${id}/completed` 
        : `https://lionfish-app-54bdv.ondigitalocean.app/transaction/${id}/failed`;

    try {
        // Appel API pour valider ou refuser la transaction
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de la ${action === 'approve' ? 'validation' : 'refus'} de la transaction`);
        }

        const result = await response.json();
        console.log(result.message); // Facultatif : afficher la réponse dans la console

        // Animation de suppression de la carte
        const card = document.querySelector(`.${type}[data-id="${id}"]`);
        if (card) {
            card.classList.add('slide-out');
        }

        // Supprimer la transaction de la liste après un délai
        setTimeout(() => {
            if (type === 'withdrawal') {
                transactions.withdrawals = transactions.withdrawals.filter(w => w.id !== id);
                renderWithdrawals(transactions.withdrawals);
            } else if (type === 'deposit') {
                transactions.deposits = transactions.deposits.filter(d => d.id !== id);
                renderDeposits(transactions.deposits);
            }
        }, 300);
    } catch (error) {
        console.error('Erreur:', error.message);
        alert(`Impossible de ${action === 'approve' ? 'valider' : 'refuser'} la transaction : ${error.message}`);
    }
}




// Fonction pour charger les données depuis l'API
async function loadData() {
    try {
        const response = await fetch('https://lionfish-app-54bdv.ondigitalocean.app/pending');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des données');
        }

        const data = await response.json();
        //console.log(data);

        // Trier les données en dépôts et retraits et les trier par date
        transactions.deposits = sortTransactionsByDate(data.filter(item => item.type === 'deposit'));
        transactions.withdrawals = sortTransactionsByDate(data.filter(item => item.type === 'withdrawal'));

        // Afficher les données
        renderDeposits();
        renderWithdrawals();
    } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
    }
}

// Gestionnaire d'événements pour la recherche
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', handleSearch);

// Fonction de rafraîchissement
function refreshData() {
    const refreshButton = document.querySelector('.refresh-button');
    refreshButton.classList.add('spinning');

    setTimeout(() => {
        loadData();
        refreshButton.classList.remove('spinning');
    }, 1000);
}

// Démarrer le rafraîchissement automatique
function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(() => {
        refreshData();
    }, 10000); // 10 secondes
}

// Arrêter le rafraîchissement automatique
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}
