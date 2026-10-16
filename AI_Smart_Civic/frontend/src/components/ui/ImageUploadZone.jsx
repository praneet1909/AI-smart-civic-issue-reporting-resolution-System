import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from './Button';
import './ImageUploadZone.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (matches backend application.yml)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUploadZone({
  file,
  onFileSelect,
  label = 'Visual Evidence (Before Photo)',
  required = false,
  error = null,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const validateAndSet = (selectedFile) => {
    setInternalError(null);
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setInternalError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setInternalError('Image size exceeds 10MB limit.');
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSet(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setInternalError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const displayError = internalError || error;

  return (
    <div className="image-upload-zone">
      {label && (
        <label className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            Max 10MB
          </span>
        </label>
      )}

      <input
        ref={inputRef}
        id="image-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {file && previewUrl ? (
        <div className="upload-preview-container">
          <div className="upload-thumbnail-wrapper">
            <img src={previewUrl} alt="Complaint preview" className="upload-thumbnail" />
          </div>

          <div className="upload-meta">
            <h5 className="upload-filename" title={file.name}>
              {file.name}
            </h5>
            <p className="upload-filesize">{formatFileSize(file.size)}</p>
            <div className="upload-success-badge">
              <CheckCircle2 size={12} />
              <span>Ready for AI Analysis</span>
            </div>
          </div>

          <div className="upload-actions">
            <Button
              id="remove-image-button"
              type="button"
              variant="ghost"
              size="sm"
              icon={<Trash2 size={15} style={{ color: 'var(--civic-rose)' }} />}
              onClick={handleRemove}
              title="Remove image"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          id="dropzone-area"
          className={`upload-drop-area ${dragOver ? 'drag-over' : ''} ${
            displayError ? 'has-error' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="upload-icon-circle">
            <UploadCloud size={24} />
          </div>
          <div className="upload-title">Drop your hazard photo here, or browse</div>
          <div className="upload-subtitle">
            Upload clear before-photo of the pothole, trash, or leak
          </div>
          <div className="upload-formats">Supported formats: JPG, PNG, WEBP (up to 10MB)</div>
        </div>
      )}

      {displayError && (
        <div className="upload-error-banner">
          <AlertCircle size={15} />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
