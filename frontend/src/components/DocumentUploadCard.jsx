import { useRef, useState } from 'react';
import '../styles/Style.css';
import '../styles/ApplicationForm.css';

export default function DocumentUploadCard({ 
    id, 
    title, 
    formats, 
    maxSize, 
    icon, 
    onFileSelect,
    onFileRemove
}) {
    // Stan do przechowywania nazwy wybranego pliku
    const [fileName, setFileName] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    
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

    // Funkcja do usuwania pliku
    const handleRemoveFile = () => {
        setFileName(null);
        fileInputRef.current.value = '';
        if (onFileRemove) {
            onFileRemove(id);
        }
    };

    // Obsługa drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const file = droppedFiles[0];
            
            // Walidacja rozszerzenia pliku
            const allowedExtensions = formats.split(', ').map(ext => `.${ext.toLowerCase()}`);
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (!allowedExtensions.includes(fileExtension)) {
                alert(`Niedozwolone rozszerzenie. Dopuszczalne formaty: ${formats}`);
                return;
            }
            
            setFileName(file.name);
            if (onFileSelect) {
                onFileSelect(id, file);
            }
        }
    };

    return (
        <div 
            className="upload-card"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                borderColor: isDragOver ? '#1976d2' : 'inherit',
                backgroundColor: isDragOver ? 'rgba(25, 118, 210, 0.05)' : 'inherit',
                transition: 'all 0.2s ease'
            }}
        >
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
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                    type="button" 
                    className="btn-upload" 
                    onClick={handleButtonClick}
                    title={fileName}
                    style={{ flex: 1 }}
                >
                    {fileName ? fileName : "Wybierz plik"}
                </button>
                {fileName && (
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        title="Usuń plik"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#d32f2f',
                            fontSize: '20px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}