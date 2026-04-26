import React, { useEffect, useState, useMemo } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import '../../styles/AdminFinances.css';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function getToken() {
  return localStorage.getItem('user-access-token') || localStorage.getItem('token') || '';
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(val) || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pl-PL');
}

function getFeeStatus(fee, transaction) {
  if (fee.status === 'paid' || fee.paid_date) return 'paid';

  const trxStatus = String(transaction?.status || '').toUpperCase();
  if (trxStatus === 'COMPLETED') return 'paid';
  if (trxStatus === 'PENDING') return 'pending';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(fee.due_date);
  due.setHours(0, 0, 0, 0);
  return due < today ? 'overdue' : 'unpaid';
}

const STATUS_LABELS = {
  paid: 'Zaksięgowano',
  pending: 'Oczekuje',
  unpaid: 'Brak wpłaty',
  overdue: 'Zaległe',
};

async function apiFetch(path) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ─── CSV export helper ─────────────────────────────── */
function mapCsvCell(value) {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

function exportFeesCsv(fees, transactionByFee) {
  const headers = ['Student', 'ID Zapisu', 'Kierunek', 'Przedmiot', 'Kwota (PLN)', 'Status', 'Termin płatności', 'Data wpłaty', 'Numer referencyjny'];
  const rows = fees.map((f) => {
    const trx = transactionByFee[f.id];
    const status = getFeeStatus(f, trx);
    return [
      mapCsvCell(f.student_name),
      mapCsvCell(f.enrollment),
      mapCsvCell(f.studies_name),
      mapCsvCell(f.title),
      mapCsvCell(f.amount),
      mapCsvCell(STATUS_LABELS[status]),
      mapCsvCell(formatDate(f.due_date)),
      mapCsvCell(formatDate(f.paid_date)),
      mapCsvCell(trx ? `#${trx.reference_number}` : '—'),
    ].join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wplaty_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Component ─────────────────────────────────────── */
export default function Finances() {
  const [activeTab, setActiveTab] = useState('payments');
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      apiFetch('/api/admin/finances/fees/'),
      apiFetch('/api/admin/finances/transactions/'),
      apiFetch('/api/admin/finances/dashboard/'),
    ])
      .then(([feesData, trxData, dashData]) => {
        setFees(Array.isArray(feesData) ? feesData : []);
        setTransactions(Array.isArray(trxData) ? trxData : []);
        setDashboard(dashData);
      })
      .catch((err) => setError(`Nie udało się załadować danych: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  /* map fee.id → first transaction */
  const transactionByFee = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (t.fee && !map[t.fee]) map[t.fee] = t;
    });
    return map;
  }, [transactions]);

  async function handleApprove(transactionId) {
    setApprovingId(transactionId);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/finances/transactions/${transactionId}/approve/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      /* refresh data */
      const [feesData, trxData, dashData] = await Promise.all([
        apiFetch('/api/admin/finances/fees/'),
        apiFetch('/api/admin/finances/transactions/'),
        apiFetch('/api/admin/finances/dashboard/'),
      ]);
      setFees(Array.isArray(feesData) ? feesData : []);
      setTransactions(Array.isArray(trxData) ? trxData : []);
      setDashboard(dashData);
    } catch (err) {
      setError(`Nie udało się zatwierdzić płatności: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  }

  /* ── derived stats ── */
  const paidCount = fees.filter((f) => getFeeStatus(f, transactionByFee[f.id]) === 'paid').length;
  const overdueCount = fees.filter((f) => getFeeStatus(f, transactionByFee[f.id]) === 'overdue').length;
  const totalCollected = dashboard?.overall?.total_collected ?? 0;

  /* ── budget: group editions by academic year ── */
  const byYear = useMemo(() => {
    const editions = dashboard?.by_edition || [];
    const map = {};
    editions.forEach((ed) => {
      const yr = ed.academic_year || 'Brak roku';
      if (!map[yr]) map[yr] = [];
      map[yr].push(ed);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [dashboard]);

  /* ─── render ─────────────────────────────────────────── */
  return (
    <div className="account-page-layout admin-finances-layout">
      <AccountPageLeftMenu />

      <div className="account-column" id="account-page-column-middle">
        <div className="finances-header">
          <h2 className="page-title" style={{ margin: '1.5rem 0 0.25rem' }}>
            Finanse
          </h2>
        </div>
        <p className="finances-subtitle">Zarządzanie płatnościami i budżetem rekrutacyjnym</p>

        {/* Tab bar */}
        <div className="finances-tabs">
          <button
            className={`finances-tab-btn${activeTab === 'payments' ? ' active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Zarządzanie wpłatami
          </button>
          <button
            className={`finances-tab-btn${activeTab === 'transfers' ? ' active' : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            Przelewy do zatwierdzenia
            {dashboard?.overall?.pending_transfers_count > 0 && (
              <span className="tab-badge">{dashboard.overall.pending_transfers_count}</span>
            )}
          </button>
          <button
            className={`finances-tab-btn${activeTab === 'budget' ? ' active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            Kosztorys rekrutacyjny
          </button>
        </div>

        {error && <div className="finances-error">{error}</div>}

        {loading ? (
          <div className="finances-loading">Ładowanie danych…</div>
        ) : activeTab === 'payments' ? (
          <PaymentsTab
            fees={fees}
            transactionByFee={transactionByFee}
            paidCount={paidCount}
            overdueCount={overdueCount}
            totalCollected={totalCollected}
          />
        ) : activeTab === 'transfers' ? (
          <PendingTransfersTab
            transactions={transactions}
            fees={fees}
            onApprove={handleApprove}
            approvingId={approvingId}
          />
        ) : (
          <BudgetTab byYear={byYear} overall={dashboard?.overall} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Tab 1: Zarządzanie wpłatami                           */
/* ─────────────────────────────────────────────────────── */
function PaymentsTab({ fees, transactionByFee, paidCount, overdueCount, totalCollected }) {
  const [sortConfig, setSortConfig] = useState({ key: 'due_date', direction: 'asc' });

  const sortedFees = useMemo(() => {
    const rows = [...fees];
    const statusOrder = { overdue: 0, pending: 1, unpaid: 2, paid: 3 };

    rows.sort((a, b) => {
      const trxA = transactionByFee[a.id];
      const trxB = transactionByFee[b.id];
      const statusA = getFeeStatus(a, trxA);
      const statusB = getFeeStatus(b, trxB);

      let cmp = 0;
      if (sortConfig.key === 'status') {
        cmp = (statusOrder[statusA] ?? 99) - (statusOrder[statusB] ?? 99);
      } else if (sortConfig.key === 'studies_name') {
        cmp = String(a.studies_name || '').localeCompare(String(b.studies_name || ''), 'pl');
      } else if (sortConfig.key === 'due_date') {
        const aTime = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bTime = b.due_date ? new Date(b.due_date).getTime() : 0;
        cmp = aTime - bTime;
      }

      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [fees, transactionByFee, sortConfig]);

  function handleSort(key) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }

  function sortIndicator(key) {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }

  return (
    <>
      {/* Stat cards */}
      <div className="finances-stats-row">
        <div className="finances-stat-card">
          <span className="finances-stat-label">Łączna kwota wpłat</span>
          <span className="finances-stat-value green">{formatCurrency(totalCollected)}</span>
        </div>
        <div className="finances-stat-card">
          <span className="finances-stat-label">Zaksięgowane wpłaty</span>
          <span className="finances-stat-value">
            {paidCount}
            <span style={{ fontWeight: 400, fontSize: '1rem', color: 'var(--text-muted)' }}>
              {' '}/ {fees.length}
            </span>
          </span>
        </div>
        <div className="finances-stat-card">
          <span className="finances-stat-label">Zaległe płatności</span>
          <span className={`finances-stat-value${overdueCount > 0 ? ' red' : ''}`}>{overdueCount}</span>
        </div>
      </div>

      {/* Table section */}
      <div className="finances-section-header">
        <h3 className="finances-section-title">Lista wpłat</h3>
        <button className="btn-export" onClick={() => exportFeesCsv(fees, transactionByFee)}>
          ↓ Eksportuj do pliku
        </button>
      </div>

      <div className="finances-table-wrap">
        <table className="finances-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Nr zapisu</th>
              <th>Przedmiot</th>
              <th>
                <button className="finances-sort-btn" onClick={() => handleSort('studies_name')}>
                  Kierunek {sortIndicator('studies_name')}
                </button>
              </th>
              <th>Kwota</th>
              <th>
                <button className="finances-sort-btn" onClick={() => handleSort('status')}>
                  Status {sortIndicator('status')}
                </button>
              </th>
              <th>
                <button className="finances-sort-btn" onClick={() => handleSort('due_date')}>
                  Termin płatności {sortIndicator('due_date')}
                </button>
              </th>
              <th>Data wpłaty</th>
              <th>Nr referencyjny</th>
              <th>Metoda płatności</th>
            </tr>
          </thead>
          <tbody>
            {fees.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  Brak danych o wpłatach
                </td>
              </tr>
            ) : (
              sortedFees.map((fee) => {
                const trx = transactionByFee[fee.id];
                const status = getFeeStatus(fee, trx);
                return (
                  <tr key={fee.id}>
                    <td>{fee.student_name}</td>
                    <td className="mono">{fee.enrollment}</td>
                    <td>{fee.title}</td>
                    <td>{fee.studies_name}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(fee.amount)}</td>
                    <td>
                      <span className={`status-badge ${status}`}>{STATUS_LABELS[status]}</span>
                    </td>
                    <td className="mono">{formatDate(fee.due_date)}</td>
                    <td className="mono">{formatDate(fee.paid_date)}</td>
                    <td className="mono">{trx ? `#${trx.reference_number}` : '—'}</td>
                    <td>{trx ? formatPaymentMethod(trx.payment_method) : '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Tab 2: Przelewy do zatwierdzenia                      */
/* ─────────────────────────────────────────────────────── */
const TRX_STATUS_LABELS = {
  PENDING: 'Oczekuje',
  APPROVED: 'Zatwierdzone',
  REJECTED: 'Odrzucone',
};

const TRX_STATUS_CSS = {
  PENDING: 'pending',
  APPROVED: 'paid',
  REJECTED: 'overdue',
};

function formatPaymentMethod(method) {
  if (!method) return '—';
  const map = {
    transfer: 'Przelew bankowy',
    bank_transfer: 'Przelew bankowy',
    cash: 'Gotówka',
    card: 'Karta płatnicza',
    online: 'Płatność online',
  };
  return map[method?.toLowerCase()] || method;
}

function PendingTransfersTab({ transactions, fees, onApprove, approvingId }) {
  const feeById = useMemo(() => {
    const map = {};
    fees.forEach((f) => { map[f.id] = f; });
    return map;
  }, [fees]);

  const pendingTrx = transactions.filter((t) => t.status === 'PENDING');

  return (
    <>
      <div className="finances-stats-row">
        <div className="finances-stat-card">
          <span className="finances-stat-label">Oczekujące przelewy</span>
          <span className={`finances-stat-value${pendingTrx.length > 0 ? ' orange' : ''}`}>
            {pendingTrx.length}
          </span>
        </div>
        <div className="finances-stat-card">
          <span className="finances-stat-label">Łączna kwota do zatwierdzenia</span>
          <span className="finances-stat-value">
            {formatCurrency(
              pendingTrx.reduce((sum, t) => sum + Number(t.amount || feeById[t.fee]?.amount || 0), 0)
            )}
          </span>
        </div>
      </div>

      <div className="finances-section-header">
        <h3 className="finances-section-title">Przelewy oczekujące na zatwierdzenie</h3>
      </div>

      <div className="finances-table-wrap">
        <table className="finances-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Przedmiot opłaty</th>
              <th>Kwota</th>
              <th>Metoda płatności</th>
              <th>Nr referencyjny</th>
              <th>Status</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {pendingTrx.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  Brak przelewów oczekujących na zatwierdzenie
                </td>
              </tr>
            ) : (
              pendingTrx.map((trx) => {
                const fee = feeById[trx.fee];
                return (
                  <tr key={trx.id}>
                    <td>{trx.student_name}</td>
                    <td>{trx.fee_title || fee?.title || '—'}</td>
                    <td style={{ fontWeight: 600 }}>
                      {formatCurrency(trx.amount || fee?.amount)}
                    </td>
                    <td>{formatPaymentMethod(trx.payment_method)}</td>
                    <td className="mono">#{trx.reference_number}</td>
                    <td>
                      <span className={`status-badge ${TRX_STATUS_CSS[trx.status] || 'pending'}`}>
                        {TRX_STATUS_LABELS[trx.status] || trx.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-approve"
                        disabled={approvingId === trx.id}
                        onClick={() => onApprove(trx.id)}
                      >
                        {approvingId === trx.id ? '…' : 'Zatwierdź'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Tab 3: Kosztorys rekrutacyjny                         */
/* ─────────────────────────────────────────────────────── */
function BudgetTab({ byYear, overall }) {
  return (
    <>
      {/* Overall summary */}
      <div className="finances-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="finances-stat-card">
          <span className="finances-stat-label">Łączne przychody</span>
          <span className="finances-stat-value green">{formatCurrency(overall?.total_collected)}</span>
        </div>
        <div className="finances-stat-card">
          <span className="finances-stat-label">Oczekujące przelewy</span>
          <span className="finances-stat-value orange">{formatCurrency(overall?.total_pending)}</span>
        </div>
        <div className="finances-stat-card">
          <span className="finances-stat-label">Zaległości</span>
          <span className="finances-stat-value red">{formatCurrency(overall?.total_overdue)}</span>
        </div>
      </div>

      {byYear.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Brak danych o edycjach studiów.</p>
      ) : (
        byYear.map(([year, editions]) => {
          const totalStudents = editions.reduce((s, e) => s + (e.fees_count || 0), 0);
          const totalRevenue = editions.reduce((s, e) => s + Number(e.collected || 0), 0);
          return (
            <div key={year} className="budget-year-section">
              {/* Year card */}
              <div className="budget-year-header">
                <span className="budget-year-label">Rekrutacja {year}</span>
              </div>
              <div className="budget-year-card">
                <div className="budget-kpi">
                  <div className="budget-kpi-label">Liczba kierunków</div>
                  <div className="budget-kpi-value">{editions.length}</div>
                </div>
                <div className="budget-kpi">
                  <div className="budget-kpi-label">Łączna liczba studentów</div>
                  <div className="budget-kpi-value">{totalStudents}</div>
                </div>
                <div className="budget-kpi">
                  <div className="budget-kpi-label">Łączne przychody</div>
                  <div className="budget-kpi-value" style={{ color: '#2e7d32' }}>{formatCurrency(totalRevenue)}</div>
                </div>
              </div>

              {/* Per-direction table */}
              <div className="finances-table-wrap">
                <table className="finances-table">
                  <thead>
                    <tr>
                      <th>Kierunek</th>
                      <th>Rok akad.</th>
                      <th>Liczba opłat</th>
                      <th>Zebrano</th>
                      <th>Oczekuje</th>
                      <th>Zaległe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editions.map((ed) => (
                      <tr key={ed.edition_id}>
                        <td>{ed.studies_name}</td>
                        <td className="mono">{ed.academic_year}</td>
                        <td>{ed.fees_count}</td>
                        <td style={{ color: '#2e7d32', fontWeight: 600 }}>{formatCurrency(ed.collected)}</td>
                        <td style={{ color: '#e65100', fontWeight: 600 }}>{formatCurrency(ed.pending)}</td>
                        <td style={{ color: '#c62828', fontWeight: 600 }}>{formatCurrency(ed.overdue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
