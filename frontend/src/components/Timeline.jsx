import React from 'react';
import '../styles/Style.css';
import '../styles/Timeline.css';

export default function Timeline({ schedule }) {
    if (!schedule || schedule.length === 0) {
        return (
            <div className="right-panel harmonogram-panel">
                <h3 className="panel-title text-gold">HARMONOGRAM REKRUTACJI</h3>
                <p style={{ color: '#888', fontSize: '0.85rem' }}>
                    Wybierz wniosek, aby zobaczyć jego harmonogram.
                </p>
            </div>
        );
    }

    return (
        <div className="right-panel harmonogram-panel">
            <h3 className="panel-title text-gold">HARMONOGRAM REKRUTACJI</h3>
            
            <div className="timeline-container">
                <div className="timeline-line"></div>

                {schedule.map((step, index) => {
                    // Mapowanie flagi z serwera na klasę CSS z Twojego pliku
                    const statusClass = step.flag === 'complete' ? 'completed' : 
                                        step.flag === 'in-progress' ? 'in-progress' : 'upcoming';

                    return (
                        <div key={index} className={`timeline-item ${statusClass}`}>
                            <div className={`timeline-icon ${
                                statusClass === 'completed' ? 'bg-teal' : 
                                statusClass === 'in-progress' ? 'bg-yellow' : 'bg-grey'
                            }`}>
                                {statusClass === 'completed' && <span className="material-symbols-outlined">check</span>}
                                {statusClass === 'in-progress' && <span className="material-symbols-outlined">sync</span>}
                            </div>
                            
                            <div className="timeline-content">
                                {/* Obsługujemy step.title lub step.name w zależności jak nazwie to API */}
                                <h4>{step.title || step.name}</h4>
                                
                                {statusClass === 'completed' && (
                                    <p>Zakończono: {step.endDate}</p>
                                )}
                                {statusClass === 'in-progress' && (
                                    <p className="text-yellow">W toku (do {step.endDate})</p>
                                )}
                                {statusClass === 'upcoming' && (
                                    <p>Planowane: {step.startDate}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}