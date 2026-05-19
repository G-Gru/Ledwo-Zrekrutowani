import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/faq.css';

export default function FAQ() {
    const [activeIndex, setActiveIndex] = useState(null);

    const faqData = [
        {
            question: "Jakie dokumenty są wymagane do zapisu na studia podyplomowe?",
            answer: "Standardowo wymagane jest przesłanie skanu dyplomu ukończenia studiów wyższych (licencjackich, inżynierskich lub magisterskich), wypełnionego podania o przyjęcie wygenerowanego z systemu oraz zdjęcia dowodowego. Szczegółowa lista dokumentów pojawia się w panelu 'Moje Dokumenty' po wybraniu konkretnego kierunku."
        },
        {
            question: "W jaki sposób mogę uiścić opłatę rekrutacyjną?",
            answer: "Opłatę należy wpłacić na indywidualny numer konta widoczny w zakładce 'Płatności' po utworzeniu wniosku. W tytule przelewu prosimy podać imię, nazwisko oraz nazwę wybranego kierunku studiów. Obsługujemy też płatności online za pomocą systemu PayU, który jest dostępny po kliknięciu przycisku 'Zapłać Online' w panelu 'Płatności'."
        },
        {
            question: "Czy dokumenty muszę dostarczyć osobiście?",
            answer: "W pierwszym etapie rekrutacji wystarczą skany wgrane do systemu. Po zakwalifikowaniu się, oryginały dokumentów do wglądu (lub poświadczone kopie) należy dostarczyć do sekretariatu odpowiedniego wydziału przed rozpoczęciem zajęć."
        },
        {
            question: "Kiedy otrzymam informację o przyjęciu na studia?",
            answer: "Decyzja o uruchomieniu studiów i przyjęciu kandydatów zapada po zakończeniu zbierania zgłoszeń i weryfikacji dokumentów. Status Twojego wniosku zmieni się w systemie, o czym zostaniesz powiadomiony mailowo."
        },
        // {
        //     question: "Przykladowe pytanie 5 (?)",
        //     answer: "Przykladowa odpowiedź 5 (.)"
        // }
    ];

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div className='page-layout'>
            <div className='page-title'>Często Zadawane Pytania (FAQ)</div>
            
            <div className='bg-panel' style={{ padding: '20px 30px' }}>
                <p style={{ color: 'var(--secondary)', marginBottom: '30px' }}>
                    Znajdź odpowiedzi na najczęściej pojawiające się pytania dotyczące rekrutacji na AGH.
                </p>

                <div className="faq-container">
                    {faqData.map((item, index) => (
                        <div 
                            key={index} 
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                            onClick={() => toggleFAQ(index)}
                        >
                            <div className="faq-question">
                                <span>{item.question}</span>
                                <span className="material-symbols-outlined arrow-icon">
                                    {activeIndex === index ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {activeIndex === index && (
                                <div className="faq-answer">
                                    {item.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}