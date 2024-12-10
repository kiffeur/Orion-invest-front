import React from 'react';
import { Calendar, DollarSign } from 'lucide-react';

type Transaction = {
  id: string;
  date: string;
  amount: number;
  customerName: string;
  phoneNumber: string;
};

const mockTransactions: Transaction[] = [
  { id: '1', date: '2024-03-14', amount: 1000, customerName: 'Jean Dupont', phoneNumber: '+237 691234567' },
  { id: '2', date: '2024-03-14', amount: 2000, customerName: 'Marie Claire', phoneNumber: '+237 697654321' },
  { id: '3', date: '2024-03-13', amount: 1500, customerName: 'Paul Michel', phoneNumber: '+237 698765432' },
];

const TransactionList = () => {
  const groupedTransactions = mockTransactions.reduce((groups: Record<string, Transaction[]>, transaction) => {
    if (!groups[transaction.date]) {
      groups[transaction.date] = [];
    }
    groups[transaction.date].push(transaction);
    return groups;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <DollarSign className="text-blue-600" />
        Dépôts Entrants
      </h2>
      
      {Object.entries(groupedTransactions).map(([date, transactions]) => (
        <div key={date} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-700">{date}</h3>
          </div>
          
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{transaction.customerName}</p>
                    <p className="text-gray-600 text-sm">{transaction.phoneNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{transaction.amount.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;