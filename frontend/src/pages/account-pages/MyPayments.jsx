import React, { useState, useEffect } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import { serverApi } from '../../services/serverApi';
import '../../styles/Payments.css';
import DocumentUploadCard from '../../components/DocumentUploadCard'

export default function Payments() {
    const [summary, setSummary] = useState({ totalToPay: '0.00', deadline: '' });
    const [activePayments, setActivePayments] = useState([]);
    const [history, setHistory] = useState([]);
    // Stan do pokazywania panelu płatności
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);

    useEffect(() => {
        setSummary(serverApi.getUserPaymentsSummary());
        setActivePayments(serverApi.getUserActivePayments());
        setHistory(serverApi.getUserPaymentsHistory());
    }, []);

    return (
        <div className='account-page-layout'>
            <AccountPageLeftMenu />

            <div className='payments-main-container'>
                <header className='payments-page-header'>
                    <div className='page-title'>Płatności</div>
                    <p className='page-subtitle' style={{marginBottom: '50px'}}>Zarządzaj swoją dokumentacją finansową i monitoruj statusy opłat w jednym miejscu.</p>
                </header>

                <div className='payments-grid-layout'>
                    {/* Karta Podsumowania */}
                    <div className='bg-panel summary-wide-card'>
                        <div className='summary-content'>
                            <span className='label-tiny'>DO ZAPŁATY ŁĄCZNIE</span>
                            <div className='main-balance'>{summary.totalToPay}</div>
                            <p className='deadline-text'>
                                <span className="material-symbols-outlined">event</span>
                                Najbliższy termin: <strong>{summary.deadline}</strong>
                            </p>
                        </div>
                        <button 
                            className={`btn-primary-large ${showPaymentOptions ? 'active-btn' : ''}`}
                            onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                        >
                            <span className="material-symbols-outlined">payments</span>
                            {showPaymentOptions ? 'Ukryj opcje płatności' : 'Zapłać za Wszystko'}
                        </button>
                    </div>

                    {/* Tabela Bieżących Zobowiązań */}
                    <div className='bg-panel active-table-card'>
                        <h3 className='panel-h3'>Bieżące zobowiązania</h3>
                        <table className='upcoming-payments-table'>
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

                {/* Opcje płatności */}
                {showPaymentOptions && (
                    <div className='bg-panel payment-methods-panel'>
                        <div className='payment-method-column left'>
                            <h4 className='method-title'>Przelew tradycyjny</h4>
                            <div className='transfer-details'>
                                <p><strong>Odbiorca:</strong> <span className='copy-box'> AGH </span> </p>
                                <p><strong>Nr konta:</strong> <span className='copy-box'> XXXXXXXXXXXXx XXXXXXXXXxx </span></p>
                                <p><strong>Tytuł:</strong> <span className='copy-box'> Opłata - Jan Kowalski - ID 4432 </span></p>
                                <p className='transfer-hint'>* Pamiętaj o dokładnym przepisaniu tytułu przelewu. </p>

                                <DocumentUploadCard 
                                    id="payment-confirm"
                                    title="Potwierdzenie przelewu"
                                    formats="PDF, JPG"
                                    maxSize="5MB"
                                    icon="description"
                                    onFileSelect={null}
                                />
                            </div>
                        </div>
                        
                        <div className='payment-divider'></div>

                        <div className='payment-method-column right'>
                            <h4 className='method-title'>Płatność Online</h4>
                            <p className='method-desc'>Szybka płatność kartą, BLIK lub przelewem natychmiastowym.</p>
                            <button className='btn-online-pay'>
                                PRZEJDŹ DO PŁATNOŚCI
                            </button>
                        </div>
                    </div>
                )}

                {/* Sekcja Historii */}
                <div className='history-section-wide'>
                    <div className='history-top-bar'>
                        <h2 className='history-title'>Historia transakcji</h2>
                    </div>

                    <div className='bg-panel history-list-container'>
                        {history.map((item) => (
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