import '../styles/ApplicationForm.css';

const TitledField = ({title, value}) => {
    return (
        <div className='titled-field'>
            <p className='item-title'> {title} </p>
            <p className='item-value'> {value} </p>
        </div>
    )
}

export default function AddressTile({ data, selected, onDeleteAddress, selectedMessage, onSelect }) {
    return (
        <>
        <div className={`address-tile ${selected ? 'selected' : ''}`} onClick={onSelect}>
            <div className='address-tile-column'>
                <TitledField title='Ulica' value={data.street} />
                <TitledField title='Miasto' value={data.city} />
                <TitledField title='Kraj' value={data.country} />
            </div>

            <div className='address-tile-column'>
                <TitledField title='Nr domu' value={data.house_number} />
                {data.flat_number !== '' && data.flat_number != null ? <TitledField title='Nr mieszkania' value={data.flat_number} /> : null}
                <TitledField title='Kod pocztowy' value={data.postal_code} />
            </div>
            
            <div className='address-tile-actions'>
                <p className='address-tile-delete-label'>Usuń adres z konta</p>
                <button className='delete-address-button' onClick={(e) => { e.stopPropagation(); onDeleteAddress(data.id); }} type='button' name='action'>
                    <span className='material-symbols-outlined text-primary'>delete</span>
                </button>
            </div>
        </div>
        {selected && <p className='selected-message'>{selectedMessage}</p>}
    </>
    )
}