import { useRef, useState } from 'react';
import '../styles/Style.css';
import '../styles/ApplicationForm.css';

export default function DocumentUploadCard({ 
    id, 
    title, 
    formats, 
    maxSize, 
    icon, 
    onFileSelect 
}) {
    // Stan do przechowywania nazwy wybranego pliku
    const [fileName, setFileName] = useState(null);
    
    // Referencja do ukrytego inputa
    const fileInputRef = useRef(null);

    // Funkcja wywoływana po kliknięciu w nasz ostylowany przycisk
    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    // Funkcja wywoływana, gdy użytkownik faktycznie wybierze plik z dysku
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            // Przekazanie pliku wyżej (do głównego formularza), jeśli funkcja została podana
            if (onFileSelect) {
                onFileSelect(id, file);
            }
        }
    };

    return (
        <div className="upload-card">
            <span className="material-symbols-outlined upload-icon">{icon}</span>
            
            <div className="upload-text-container">
                <p className="upload-title">{title}</p>
                <p className="upload-meta">{formats} (max {maxSize})</p>
            </div>
            
            {/* Ukryty systemowy input plikowy */}
            <input 
                type="file" 
                id={id}
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                // Prosta zamiana np. "PDF, JPG" na ".pdf, .jpg" do walidacji w oknie systemu
                accept={formats.split(', ').map(ext => `.${ext.toLowerCase()}`).join(',')} 
            />
            
            <button 
                type="button" 
                className="btn-upload" 
                onClick={handleButtonClick}
                title={fileName} // Pokazuje pełną nazwę po najechaniu myszką
            >
                {/* Jeśli wybrano plik, pokaż jego nazwę. Jeśli nie, pokaż "Wybierz plik" */}
                {fileName ? fileName : "Wybierz plik"}
            </button>
        </div>
    );
}