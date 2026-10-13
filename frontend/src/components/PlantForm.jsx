import { useState, useRef } from 'react';
import { generatePlantDetails } from '../services/aiService';

export default function PlantForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [name, setName]                   = useState(initial.name || '');
  const [scientificName, setSci]          = useState(initial.scientificName || '');
  const [description, setDescription]    = useState(initial.description || '');
  const [careInstructions, setCare]       = useState(initial.careInstructions || '');
  const [imageFile, setImageFile]         = useState(null);
  const [preview, setPreview]             = useState(initial.image || '');
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiMessage, setAiMessage]         = useState('');
  const fileRef = useRef();

  const handleAiAutoFill = async () => {
    if (!name.trim()) {
      setAiMessage('⚠️ Enter a plant name first');
      return;
    }
    setAiLoading(true);
    setAiMessage('');
    try {
      const details = await generatePlantDetails(name.trim());
      if (details.scientificName) setSci(details.scientificName);
      if (details.description) setDescription(details.description);
      if (details.careInstructions) setCare(details.careInstructions);
      setAiMessage('✨ AI details generated successfully!');
      setTimeout(() => setAiMessage(''), 3500);
    } catch {
      setAiMessage('Could not generate details right now.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', name);
    fd.append('scientificName', scientificName);
    fd.append('description', description);
    fd.append('careInstructions', careInstructions);
    if (imageFile) fd.append('image', imageFile);
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label className="form-label" style={{ margin: 0 }}>Plant Name *</label>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleAiAutoFill}
            disabled={aiLoading}
            style={{ fontSize: '.78rem', padding: '3px 10px', borderRadius: '16px', color: 'var(--pine)', borderColor: 'var(--pine)' }}
          >
            {aiLoading ? '✨ Analyzing…' : '✨ AI Auto-Fill Details'}
          </button>
        </div>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Peace Lily, Monstera, Snake Plant"
        />
        {aiMessage && (
          <div style={{ fontSize: '.78rem', marginTop: 4, color: aiMessage.startsWith('✨') ? 'var(--pine)' : '#b91c1c', fontWeight: 500 }}>
            {aiMessage}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Scientific Name</label>
        <input
          className="form-input"
          value={scientificName}
          onChange={(e) => setSci(e.target.value)}
          placeholder="e.g. Spathiphyllum wallisii"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this plant..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Care Instructions</label>
        <textarea
          className="form-textarea"
          value={careInstructions}
          onChange={(e) => setCare(e.target.value)}
          placeholder="Watering, sunlight, soil requirements..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Plant Image</label>
        <div className="upload-zone" onClick={() => fileRef.current.click()}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{ maxHeight: 160, borderRadius: 8, margin: '0 auto' }}
            />
          ) : (
            <>
              <div style={{ fontSize: '2rem' }}>🌿</div>
              <p>Click to upload an image (JPG, PNG, WebP)</p>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial._id ? 'Save Changes' : 'Add Plant'}
        </button>
      </div>
    </form>
  );
}
