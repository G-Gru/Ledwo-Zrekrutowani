import React, { useState, useEffect } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken, isLoggedIn } from '../../services/authService';
import { formatDateInWarsaw } from '../../utils/dateTime';
import '../../styles/Payments.css';
import DocumentUploadCard from '../../components/DocumentUploadCard'

export default function Payments() {
    const [summary, setSummary] = useState({ totalToPay: '0.00', deadline: '', nextPaymentName: ''});

    const [upcomingPayments, setUpcomingPayments] = useState([]);
    const [userHasUpcomingPayments, setUserHasUpcomingPayments] = useState(false);

    const [paymentHistory, setPaymentHistory] = useState([]);
    const [userHasPaymentHistory, setUserHasPaymentHistory] = useState(false);

    const [userToken, setUserToken] = useState(null);
    const [userLoggedIn, setUserLoggedIn] = useState(false)
    const [error, setError] = useState("");

    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [payAll, setPayAll] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [paymentMessage, setPaymentMessage] = useState("");
    const [paymentSuccess, setPaymentSuccess] = useState(null);
    const [paymentProofFile, setPaymentProofFile] = useState(null);

    useEffect(() => {
        const token = getAccessToken();
        if (!token) { setUserLoggedIn(false); return; }
        setUserToken(token);
        setUserLoggedIn(true);

        async function fetchPaymentData() {
            /* get user upcoming payments */
            let upcomingPaymentsResponse = await serverApi.getUserActivePayments(token)
            if (upcomingPaymentsResponse != null && upcomingPaymentsResponse.payments) {
                setUserHasUpcomingPayments(upcomingPaymentsResponse.payments.length > 0)
                setUpcomingPayments(upcomingPaymentsResponse.payments)
                setSelectedIds(upcomingPaymentsResponse.payments.map(p => p.id)); // Set default to all
                if (upcomingPaymentsResponse.error) setError(upcomingPaymentsResponse.errorMsg);
            }

            /* get user payment history */
            let paymentHistoryResponse = await serverApi.getUserPaymentsHistory(token)
            if (paymentHistoryResponse != null && paymentHistoryResponse.payments) {
                setUserHasPaymentHistory(paymentHistoryResponse.payments.length > 0)
                setPaymentHistory(paymentHistoryResponse.payments)
                if (paymentHistoryResponse.error) setError(paymentHistoryResponse.errorMsg);
            }

            /* generate payments summary */
            if (!upcomingPaymentsResponse || upcomingPaymentsResponse.error) {
                // Fallback to mock data if error
                let mock_data = {
                    totalToPay: "3,450.00 PLN",
                    deadline: "01.01.2000",
                    nextPaymentName: "Czesne (Semestr Zimowy)"
                };
                setSummary(mock_data);
            } else if (!upcomingPaymentsResponse.payments || upcomingPaymentsResponse.payments.length === 0) {
                let empty_payments = {
                    totalToPay: "Brak zapłat",
                    deadline: "--/--/----",
                    nextPaymentName: ""
                };
                setSummary(empty_payments);
            } else {
                const payments = upcomingPaymentsResponse.payments;
                // Calculate total to pay
                const total = payments.reduce((sum, p) => {
                    const amtStr = p.amount || p.amout || '0'; // handle typo in amout
                    const amt = parseFloat(amtStr.replace(/[^\d.,]/g, '').replace(',', '.'));
                    return sum + (isNaN(amt) ? 0 : amt);
                }, 0);
                const totalToPay = `${total.toFixed(2).replace('.', ',')} PLN`;

                // Find earliest deadline and its title
                const earliest = payments.reduce((min, p) => {
                    const date = new Date(p.due_date);
                    return date < min.date ? { date, title: p.title } : min;
                }, { date: new Date('9999-12-31'), title: '' });

                const deadline = formatDateInWarsaw(earliest.date); // Format as DD.MM.YYYY
                const nextPaymentName = earliest.title;
                setSummary({ totalToPay, deadline, nextPaymentName });
            }
        }
        fetchPaymentData();

        const watchInterval = setInterval(() => {
            if (!isLoggedIn()) {
                setUserLoggedIn(false);
            }
        }, 30000);

        return () => clearInterval(watchInterval);
    }, []);

    // Obsługa pliku potwierdzenia przelewu
    const handlePaymentProofFileSelect = (id, file) => {
        setPaymentProofFile(file);
    };

    const handlePaymentProofFileRemove = (id) => {
        setPaymentProofFile(null);
    };

    return (
        !userLoggedIn ? <LoginRedirectPage /> : (
        <div className='account-page-layout'>
            <AccountPageLeftMenu />

            <div className='payments-main-container'>
                <header className='payments-page-header'>
                    {/* error msg */}
                    {error && <div className="error-message">{error}</div>}

                    {/* Title */}
                    <div className='page-title'>Płatności</div>
                    <p className='page-subtitle'>Monitoruj statusy opłat i wykonuj łączne transakcje w jednym miejscu.</p>
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
                            onClick={() => {
                                setPayAll(true);
                                setSelectedIds(upcomingPayments.map(p => p.id));
                                setShowPaymentOptions(!showPaymentOptions);
                                setPaymentMessage("");
                                setPaymentSuccess(null);
                            }}
                        >
                            <span className="material-symbols-outlined">payments</span>
                            {showPaymentOptions ? 'Ukryj opcje płatności' : 'Zapłać za Wszystko'}
                        </button>
                    </div>

                    {/* Tabela Bieżących Zobowiązań */}
                    <div className='bg-panel active-table-card'>
                        <h3 className='panel-h3'>Bieżące zobowiązania</h3>
                        { !userHasUpcomingPayments ? (<p> Brak nadchodzących płatności <br/> Dobra robota :) </p>) : (
                            <table className='upcoming-payments-table'>
                                <thead>
                                    <tr>
                                        <th>TYTUŁ</th>
                                        <th>STATUS</th>
                                        <th>KWOTA</th>
                                        <th>TERMIN</th>
                                        <th>AKCJA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {upcomingPayments.map(pay => (
                                        <tr key={pay.id}>
                                            <td className='bold-text'>{pay.title}</td>
                                            <td>
                                                <span className={`badge ${pay.type}`}>
                                                    {pay.status}
                                                </span>
                                            </td>
                                            <td className='bold-text'>{pay.amount}</td>
                                            <td className={pay.type === 'overdue' ? 'error-text' : ''}>{formatDateInWarsaw(pay.due_date)}</td>
                                            <td>
                                                <button className='table-action-btn' onClick={() => {
                                                    setPayAll(false);
                                                    setSelectedIds([pay.id]);
                                                    setShowPaymentOptions(true);
                                                    setPaymentMessage("");
                                                    setPaymentSuccess(null);
                                                }}>ZAPŁAĆ</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Opcje płatności */}
                {showPaymentOptions && (() => {
                    const selectedPayments = upcomingPayments.filter(p => selectedIds.includes(p.id));
                    const totalAmount = selectedPayments.reduce((sum, p) => {
                        const amt = parseFloat(p.amount.replace(/[^\d.,]/g, '').replace(',', '.'));
                        return sum + amt;
                    }, 0).toFixed(2).replace('.', ',') + ' PLN';
                    const idsString = selectedIds.join(', ');
                    const userData = serverApi.getUserData(userToken) // to bedzie async w przyszlosci i wsztyko zepsuje
                    const transferTitle = `Opłata-${userData.firstName}${userData.lastName}-ID${idsString}`;

                    return (
                        <div className='bg-panel payment-methods-panel'>
                            {/* Error transakcji */}
                            {paymentMessage && (
                                <div className="error-message" style={{borderColor: paymentSuccess ? 'green' : 'red'}}>
                                    {paymentMessage}
                                </div>
                            )}

                            <div style={{display: 'flex', flexDirection:'row'}}>
                                <div className='payment-method-column left'>
                                    <h4 className='method-title'>Przelew tradycyjny</h4>
                                    <div className='transfer-details'>
                                        <p><strong>Kwota:</strong> <span className='copy-box'>{totalAmount}</span></p>
                                        <p><strong>Odbiorca:</strong> <span className='copy-box'> AGH </span> </p>
                                        <p><strong>Nr konta:</strong> <span className='copy-box'> XXXXXXXXXXXXx XXXXXXXXXxx </span></p>
                                        <p><strong>Tytuł:</strong> <span className='copy-box'> {transferTitle} </span></p>
                                        <p className='transfer-hint'>* Pamiętaj o dokładnym przepisaniu tytułu przelewu. </p>

                                        <DocumentUploadCard 
                                            id="payment-confirm"
                                            title="Potwierdzenie przelewu"
                                            formats="PDF, JPG"
                                            maxSize="5MB"
                                            icon="description"
                                            onFileSelect={handlePaymentProofFileSelect}
                                            onFileRemove={handlePaymentProofFileRemove}
                                        />
                                        {paymentProofFile && (
                                            <button 
                                                className='btn-primary-large'
                                                onClick={async () => {
                                                    const res = await serverApi.userPayment(userToken, selectedIds)
                                                    setPaymentSuccess(res.success)
                                                    setPaymentMessage(res.success ? "Płatność została pomyślnie zrealizowana!" : res.errorMsg)
                                                    handlePaymentProofFileRemove()
                                                }}
                                                style={{ marginTop: '16px', width: '100%' }}
                                            >
                                                <span className="material-symbols-outlined">check_circle</span>
                                                Zatwierdź płatność
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className='payment-divider'></div>

                                <div className='payment-method-column right'>
                                    <h4 className='method-title'>Płatność Online</h4>
                                    <p className='method-desc'>Szybka płatność kartą, BLIK lub przelewem natychmiastowym.</p>
                                    <p><strong>Kwota do zapłaty:</strong> {totalAmount}</p>
                                    <button className='btn-online-pay' onClick={async () => {
                                        const res = await serverApi.userPayment(userToken, selectedIds);
                                        setPaymentSuccess(res.success);
                                        setPaymentMessage(res.success ? "Płatność została pomyślnie zrealizowana!" : res.errorMsg);
                                    }}>
                                        PRZEJDŹ DO PŁATNOŚCI
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Sekcja Historii */}
                <div className='history-section-wide'>
                    <div className='history-top-bar'>
                        <h2 className='history-title'>Historia transakcji</h2>
                    </div>

                    <div className='bg-panel history-list-container'>
                        { !userHasPaymentHistory ? (<p style={{padding: '30px'}}> Brak historii płatności </p>) : (
                            paymentHistory.map((item) => (
                                <div key={item.id} className='history-row-item'>
                                    <div className='row-main-info'>
                                        <div className='status-icon-circle'>
                                            <span className="material-symbols-outlined">done_all</span>
                                        </div>
                                        <div className='text-group'>
                                            <div className='history-item-name'>{item.title}</div>
                                            <div className='history-item-sub'>ID: {item.id} • {formatDateInWarsaw(item.paid_date)}</div>
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
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
        )
    );
}