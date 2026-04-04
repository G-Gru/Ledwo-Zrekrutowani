import React, { useState, useEffect } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import { serverApi } from '../../services/serverApi';
import '../../styles/Payments.css';

export default function Payments() {
    const [summary, setSummary] = useState({ totalToPay: '0.00', deadline: '' });
    const [activePayments, setActivePayments] = useState([]);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        // Pobieranie danych z Twojego serverApi
        setSummary(serverApi.getUserPaymentsSummary());
        setActivePayments(serverApi.getUserActivePayments());
        setHistory(serverApi.getUserPaymentsHistory());
    }, []);

    return (
        <div className='account-page-layout'>
            <AccountPageLeftMenu />

            {/* JEDEN GŁÓWNY OBSZAR ZAMIAST DWÓCH KOLUMN */}
            <div className='payments-main-container'>
                
                <header className='payments-page-header'>
                    <div className='page-title'>Płatności</div>
                    <p className='page-subtitle'>Zarządzaj swoją dokumentacją finansową i monitoruj statusy opłat w jednym miejscu.</p>
                </header>

                <div className='payments-grid-layout'>
                    {/* Karta Podsumowania (Lewa strona góry) */}
                    <div className='bg-panel summary-wide-card'>
                        <div className='summary-content'>
                            <span className='label-tiny'>DO ZAPŁATY ŁĄCZNIE</span>
                            <div className='main-balance'>{summary.totalToPay}</div>
                            <p className='deadline-text'>
                                <span className="material-symbols-outlined">event</span>
                                Najbliższy termin: <strong>{summary.deadline}</strong>
                            </p>
                        </div>
                        <button className='btn-primary-large'>
                            <span className="material-symbols-outlined">payments</span>
                            Zapłać za Wszystko
                        </button>
                    </div>

                    {/* Tabela Bieżących Zobowiązań (Prawa strona góry) */}
                    <div className='bg-panel active-table-card'>
                        <h3 className='panel-h3'>Bieżące zobowiązania</h3>
                        <table className='modern-table'>
                            <thead>
                                <tr>
                                    <th>PRZEDMIOT</th>
                                    <th>STATUS</th>
                                    <th>KWOTA</th>
                                    <th>TERMIN</th>
                                    <th>AKCJA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activePayments.map(pay => (
                                    <tr key={pay.id}>
                                        <td className='bold-text'>{pay.name}</td>
                                        <td>
                                            <span className={`badge ${pay.type}`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                        <td className='bold-text'>{pay.amount}</td>
                                        <td className={pay.type === 'overdue' ? 'error-text' : ''}>{pay.date}</td>
                                        <td>
                                            <button className='table-action-btn'>ZAPŁAĆ</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sekcja Historii (Pełna szerokość na dole) */}
                <div className='history-section-wide'>
                    <div className='history-top-bar'>
                        <h2 style={{textAlign: 'center'}}>Historia transakcji</h2>
                        {/* <div className='filter-group'>
                            <button className='icon-only-btn'><span className="material-symbols-outlined">filter_alt</span></button>
                            <button className='icon-only-btn'><span className="material-symbols-outlined">download</span></button>
                        </div> */}
                    </div>

                    <div className='bg-panel history-list-container'>
                        {history.map((item, idx) => (
                            <div key={item.id} className='history-row-item'>
                                <div className='row-main-info'>
                                    <div className='status-icon-circle'>
                                        <span className="material-symbols-outlined">done_all</span>
                                    </div>
                                    <div className='text-group'>
                                        <div className='history-item-name'>{item.name}</div>
                                        <div className='history-item-sub'>ID: {item.transId} • {item.date}</div>
                                    </div>
                                </div>
                                <div className='row-amount-info'>
                                    <div className='history-amount'>{item.amount}</div>
                                    <div className='history-status-tag'>{item.status}</div>
                                </div>
                                <button className='btn-ghost-icon'>
                                    <span className="material-symbols-outlined">description</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}