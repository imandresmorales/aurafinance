import React, { useState } from 'react';
import './LocationPicker.css';

export default function LocationPicker({ location, onChange }) {
  const [isLocating, setIsLocating] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualText, setManualText] = useState('');

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada en este navegador.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        onChange({
          latitude: Number(latitude.toFixed(5)),
          longitude: Number(longitude.toFixed(5)),
          accuracy: Math.round(accuracy),
          label: `GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
          timestamp: Date.now(),
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsLocating(false);
        // Provide graceful fallback
        setIsManualOpen(true);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    onChange({
      label: manualText.trim(),
      timestamp: Date.now(),
    });
    setManualText('');
    setIsManualOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="location-picker-root">
      {!location ? (
        <div className="location-actions-bar">
          <button
            type="button"
            className="location-btn gps-btn"
            onClick={handleGetGPS}
            disabled={isLocating}
          >
            {isLocating ? '📡 Obteniendo GPS...' : '📍 GPS Automático'}
          </button>
          <button
            type="button"
            className="location-btn manual-btn"
            onClick={() => setIsManualOpen(!isManualOpen)}
          >
            ✏️ Lugar / Sucursal
          </button>
        </div>
      ) : (
        <div className="location-selected-chip">
          <span className="location-icon">📍</span>
          <div className="location-meta-text">
            <span className="location-label">{location.label}</span>
            {location.latitude && (
              <span className="location-coords num-mono">
                {location.latitude}, {location.longitude}
              </span>
            )}
          </div>
          <button
            type="button"
            className="location-remove-btn"
            onClick={handleClear}
            title="Quitar ubicación"
            aria-label="Quitar ubicación"
          >
            ×
          </button>
        </div>
      )}

      {isManualOpen && !location && (
        <form onSubmit={handleAddManual} className="location-manual-form">
          <input
            type="text"
            className="location-input-field"
            placeholder="Ej. Tienda Central / Aeropuerto JFK"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            autoFocus
          />
          <button type="submit" className="location-save-manual-btn" disabled={!manualText.trim()}>
            Guardar
          </button>
          <button
            type="button"
            className="location-cancel-manual-btn"
            onClick={() => setIsManualOpen(false)}
          >
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
