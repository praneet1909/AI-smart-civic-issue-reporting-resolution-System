import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import './LocationPicker.css';

export default function LocationPicker({
  latitude,
  longitude,
  locationAddress,
  onLocationChange,
  required = false,
  error = null,
}) {
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const detectLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        let address = locationAddress || '';
        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              address = data.display_name;
            }
          }
        } catch {
          // If Nominatim is unavailable or rate-limited, keep previous or leave empty for user entry
        }

        onLocationChange({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          locationAddress: address,
        });
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        if (err.code === 1) {
          setGeoError('Location permission was denied. Please enter the address manually.');
        } else if (err.code === 2) {
          setGeoError('Location position unavailable. Please enter the address manually.');
        } else {
          setGeoError('GPS timeout. Please try again or type address manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleAddressChange = (e) => {
    onLocationChange({
      latitude,
      longitude,
      locationAddress: e.target.value,
    });
  };

  const hasCoords = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  return (
    <div className="location-picker">
      <div className="location-toolbar">
        <label className="form-label" style={{ margin: 0 }}>
          <span>
            Location & GPS Tagging
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>

        <div className="flex items-center gap-2">
          {hasCoords && (
            <div className="gps-badge-active">
              <span className="gps-dot-pulse" />
              <span>GPS Tagged</span>
            </div>
          )}

          <Button
            id="detect-gps-button"
            type="button"
            variant={hasCoords ? 'secondary' : 'primary'}
            size="sm"
            icon={detecting ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
            onClick={detectLocation}
            disabled={detecting}
          >
            {detecting ? 'Locating...' : hasCoords ? 'Re-detect GPS' : 'Detect GPS Location'}
          </Button>
        </div>
      </div>

      {hasCoords && (
        <div className="coordinates-card">
          <div className="flex items-center gap-4">
            <div className="coord-group">
              <span className="coord-label">Lat:</span>
              <span className="coord-value">{latitude}</span>
            </div>
            <div className="coord-group">
              <span className="coord-label">Lng:</span>
              <span className="coord-value">{longitude}</span>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="location-map-link"
          >
            <span>View on Map</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      <Input
        id="location-address-input"
        label="Street Address / Landmark"
        placeholder="e.g. 124 Main Street, opposite City Park, Sector 4"
        value={locationAddress || ''}
        onChange={handleAddressChange}
        icon={<MapPin size={16} />}
        hint="Detect via GPS above or type the location manually"
        error={error}
      />

      {geoError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            color: '#fbbf24',
            background: 'rgba(245, 158, 11, 0.1)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <AlertCircle size={15} />
          <span>{geoError}</span>
        </div>
      )}
    </div>
  );
}
