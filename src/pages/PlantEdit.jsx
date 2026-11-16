import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { CONSERVATION, ZONES, cap, isWebUrl, linksOf, photosOf } from '../lib/plants';

const MAX_PHOTOS = 6;
const MAX_MB = 5;

const EMPTY = {
  local_name: '', scientific_name: '', description: '',
  habitat: '', source_collection: '', local_uses: '', identifying_features: '',
  ecological_zone: '', conservation_status: '',
  domain: 'Eukarya', kingdom: 'Plantae', phylum: '', class_name: '', order_name: '',
  family: '', genus: '', species: '',
  collected_on: '', source: '',
};

// Columns that may be saved as empty (stored as null)
const OPTIONAL = [
  'local_name', 'description', 'habitat', 'source_collection', 'local_uses', 'identifying_features',
  'conservation_status', 'domain', 'kingdom', 'phylum', 'class_name', 'order_name', 'species', 'source',
];

const newKey = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function PlantEdit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [photos, setPhotos] = useState([]);          // { key, id?, url, file? }
  const [removedPhotoIds, setRemovedPhotoIds] = useState([]);
  const [links, setLinks] = useState([]);            // { key, url, label }
  const [meta, setMeta] = useState({ status: 'draft', verifier: null });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  // ---------- load the record when editing ----------
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    supabase.from('plants')
      .select('*, plant_media(*), verifier:profiles!plants_verified_by_fkey(full_name)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) { navigate('/manage', { replace: true }); return; }
        if (data.created_by !== profile.id && profile.role !== 'admin') {
          navigate(`/plants/${id}`, { replace: true });
          return;
        }
        const next = { ...EMPTY };
        for (const k of Object.keys(EMPTY)) next[k] = data[k] ?? '';
        setForm(next);
        setPhotos(photosOf(data).map((m) => ({ key: m.id, id: m.id, url: m.url })));
        setLinks(linksOf(data).map((m) => ({ key: m.id, url: m.url, label: m.caption ?? '' })));
        setMeta({ status: data.status, verifier: data.verifier?.full_name ?? null });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, isEdit, navigate, profile.id, profile.role]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // ---------- photos ----------
  const addPhotos = (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const room = MAX_PHOTOS - photos.length;
    const accepted = [];
    let problem = '';
    for (const f of files.slice(0, room)) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { problem = 'Photos must be JPG, PNG or WebP.'; continue; }
      if (f.size > MAX_MB * 1024 * 1024) { problem = `“${f.name}” is larger than ${MAX_MB} MB.`; continue; }
      accepted.push({ key: newKey(), url: URL.createObjectURL(f), file: f });
    }
    if (files.length > room) problem = `You can add up to ${MAX_PHOTOS} photos.`;
    setFormError(problem);
    setPhotos((p) => [...p, ...accepted]);
    setErrors((er) => ({ ...er, photos: undefined }));
  };

  const removePhoto = (photo) => {
    if (photo.id) setRemovedPhotoIds((r) => [...r, photo.id]);
    if (photo.file) URL.revokeObjectURL(photo.url);
    setPhotos((ps) => ps.filter((p) => p.key !== photo.key));
  };

  // ---------- links ----------
  const addLink = () => setLinks((l) => [...l, { key: newKey(), url: '', label: '' }]);
  const updateLink = (key, field, value) =>
    setLinks((l) => l.map((x) => (x.key === key ? { ...x, [field]: value } : x)));
  const removeLink = (key) => setLinks((l) => l.filter((x) => x.key !== key));

  // ---------- validation ----------
  const validate = (forReview) => {
    const e = {};
    if (!form.scientific_name.trim()) e.scientific_name = 'Scientific name is required.';
    if (!form.family.trim()) e.family = 'Family is required.';
    if (!form.genus.trim()) e.genus = 'Genus is required.';
    if (!form.ecological_zone) e.ecological_zone = 'Choose an ecological zone.';
    if (links.some((l) => l.url.trim() && !isWebUrl(l.url.trim()))) {
      e.links = 'Links must start with http:// or https://';
    }
    if (forReview) {
      if (!form.description.trim()) e.description = 'Add a short description before submitting.';
      if (photos.length === 0) e.photos = 'Add at least one photo before submitting.';
    }
    return e;
  };

  // ---------- save ----------
  const save = async (targetStatus) => {
    setFormError('');
    const e = validate(targetStatus === 'pending');
    setErrors(e);
    if (Object.keys(e).length > 0) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector('.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        scientific_name: form.scientific_name.trim(),
        family: form.family.trim(),
        genus: form.genus.trim(),
        ecological_zone: form.ecological_zone,
        collected_on: form.collected_on || null,
        status: targetStatus,
      };
      for (const k of OPTIONAL) payload[k] = form[k].trim() || null;

      let plantId = id;
      if (isEdit) {
        const { error } = await supabase.from('plants').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('plants').insert({ ...payload, created_by: profile.id }).select('id').single();
        if (error) throw error;
        plantId = data.id;
      }

      // photos: remove deleted ones, upload new ones
      if (removedPhotoIds.length > 0) {
        const { error } = await supabase.from('plant_media').delete().in('id', removedPhotoIds);
        if (error) throw error;
      }
      for (const p of photos.filter((x) => x.file)) {
        const ext = p.file.type === 'image/png' ? 'png' : p.file.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `${plantId}/${newKey()}.${ext}`;
        const up = await supabase.storage.from('plant-media').upload(path, p.file, { contentType: p.file.type });
        if (up.error) throw up.error;
        const { data: pub } = supabase.storage.from('plant-media').getPublicUrl(path);
        const ins = await supabase.from('plant_media')
          .insert({ plant_id: plantId, media_type: 'image', url: pub.publicUrl, added_by: profile.id });
        if (ins.error) throw ins.error;
      }

      // links: replace the whole list
      const del = await supabase.from('plant_media').delete().eq('plant_id', plantId).eq('media_type', 'external_link');
      if (del.error) throw del.error;
      const rows = links
        .filter((l) => l.url.trim())
        .map((l) => ({
          plant_id: plantId, media_type: 'external_link',
          url: l.url.trim(), caption: l.label.trim() || null, added_by: profile.id,
        }));
      if (rows.length > 0) {
        const ins = await supabase.from('plant_media').insert(rows);
        if (ins.error) throw ins.error;
      }

      const notice =
        targetStatus === 'pending' ? 'Submitted. An admin will verify it before it is published.'
        : targetStatus === 'draft' ? 'Draft saved.'
        : 'Changes saved.';
      navigate('/manage', { state: { notice } });
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  if (loading) return <p className="muted-note">Loading…</p>;

  const field = (key) => `field${errors[key] ? ' has-error' : ''}`;
  const status = meta.status;

  return (
    <div className="edit-form" ref={formRef}>
      <div className="detail-bar">
        <button type="button" className="circle-btn" aria-label="Go back"
          onClick={() => navigate(isEdit ? `/plants/${id}` : '/manage')}>
          <ArrowLeft size={22} />
        </button>
        <div className="detail-bar-right">
          {isEdit && <StatusBadge status={status} />}
        </div>
      </div>

      <p className="form-hint">
        Fields marked <span className="req">*</span> are required. Drafts are only visible to you.
      </p>
      {formError && <p className="error-banner">{formError}</p>}

      <div className="detail">
        {/* ---------- left column ---------- */}
        <div className="col-left">
          <div className="field">
            <label htmlFor="f-local">Local name (Cebuano)</label>
            <input id="f-local" type="text" value={form.local_name} onChange={set('local_name')} placeholder="e.g. Nipa" />
          </div>
          <div className={field('scientific_name')}>
            <label htmlFor="f-sci">Scientific name <span className="req">*</span></label>
            <input id="f-sci" type="text" value={form.scientific_name} onChange={set('scientific_name')} placeholder="e.g. Nypa fruticans" />
            {errors.scientific_name && <span className="err-text">{errors.scientific_name}</span>}
          </div>

          <div className="field">
            <label className="label" htmlFor="f-habitat">Habitat</label>
            <textarea id="f-habitat" rows={4} value={form.habitat} onChange={set('habitat')}
              placeholder="Where does it grow? (soil, water, elevation, region)" />
          </div>
          <div className="field">
            <label className="label" htmlFor="f-source-col">Source collection</label>
            <textarea id="f-source-col" rows={4} value={form.source_collection} onChange={set('source_collection')}
              placeholder="How the specimen was collected. Do not include exact coordinates." />
          </div>
          <div className="field">
            <label className="label" htmlFor="f-uses">Local uses</label>
            <textarea id="f-uses" rows={4} value={form.local_uses} onChange={set('local_uses')}
              placeholder="Traditional or practical uses in the community" />
          </div>
        </div>

        {/* ---------- center column ---------- */}
        <div className="col-center">
          <div className={`field${errors.photos ? ' has-error' : ''}`}>
            <span className="label">Photos</span>
            <div className="photo-grid">
              {photos.map((p, i) => (
                <div className="photo-tile" key={p.key}>
                  <img src={p.url} alt={`Photo ${i + 1}`} />
                  {i === 0 && <span className="main-badge">Main</span>}
                  <button type="button" className="remove-btn" aria-label="Remove photo" onClick={() => removePhoto(p)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="add-tile">
                  <ImagePlus size={26} />
                  <span>Add photo</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={addPhotos} />
                </label>
              )}
            </div>
            <span className="hint-text">
              The first photo is the main one. JPG, PNG or WebP, up to {MAX_MB} MB each, {MAX_PHOTOS} photos max.
            </span>
            {errors.photos && <span className="err-text">{errors.photos}</span>}
          </div>

          <div className="info-pair">
            <div className={field('ecological_zone')}>
              <label htmlFor="f-zone">Ecological zone <span className="req">*</span></label>
              <select id="f-zone" value={form.ecological_zone} onChange={set('ecological_zone')}>
                <option value="">Choose…</option>
                {ZONES.map((z) => <option key={z} value={z}>{cap(z)}</option>)}
              </select>
              {errors.ecological_zone && <span className="err-text">{errors.ecological_zone}</span>}
            </div>
            <div className="field">
              <label htmlFor="f-cons">Conservation status</label>
              <select id="f-cons" value={form.conservation_status} onChange={set('conservation_status')}>
                <option value="">Not specified</option>
                {CONSERVATION.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className={`field${errors.links ? ' has-error' : ''}`}>
            <span className="label">Additional information (external links)</span>
            {links.map((l) => (
              <div className="link-row" key={l.key}>
                <input type="url" value={l.url} placeholder="https://…" aria-label="Link address"
                  onChange={(e) => updateLink(l.key, 'url', e.target.value)} />
                <input type="text" value={l.label} placeholder="Label (optional)" aria-label="Link label"
                  onChange={(e) => updateLink(l.key, 'label', e.target.value)} />
                <button type="button" className="icon-remove" aria-label="Remove link" onClick={() => removeLink(l.key)}>
                  <X size={16} />
                </button>
              </div>
            ))}
            <button type="button" className="text-btn" onClick={addLink}><Plus size={16} /> Add a link</button>
            {errors.links && <span className="err-text">{errors.links}</span>}
          </div>

          <div className="meta-row edit">
            <div className="field">
              <label htmlFor="f-collected">Collected</label>
              <input id="f-collected" type="date" value={form.collected_on} onChange={set('collected_on')} />
            </div>
            <div className="fact">
              <span>Verified by</span>
              <strong>{meta.verifier || 'Not yet verified'}</strong>
            </div>
            <div className="field">
              <label htmlFor="f-source">Source</label>
              <input id="f-source" type="text" value={form.source} onChange={set('source')} placeholder="e.g. USC Catalogue" />
            </div>
          </div>
        </div>

        {/* ---------- right column ---------- */}
        <div className="col-right">
          <div className={field('description')}>
            <label className="label" htmlFor="f-desc">Description</label>
            <textarea id="f-desc" rows={6} value={form.description} onChange={set('description')}
              placeholder="A short overview anyone can understand" />
            {errors.description && <span className="err-text">{errors.description}</span>}
          </div>
          <div className="field">
            <label className="label" htmlFor="f-ident">Identifying features</label>
            <textarea id="f-ident" rows={5} value={form.identifying_features} onChange={set('identifying_features')}
              placeholder="Leaves, flowers, fruit, bark… what makes it recognizable?" />
          </div>

          <span className="label">Taxonomy</span>
          <div className="tax-grid edit">
            <div className="field"><label htmlFor="t-domain">Domain</label>
              <input id="t-domain" type="text" value={form.domain} onChange={set('domain')} /></div>
            <div className="field"><label htmlFor="t-kingdom">Kingdom</label>
              <input id="t-kingdom" type="text" value={form.kingdom} onChange={set('kingdom')} /></div>
            <div className="field"><label htmlFor="t-phylum">Phylum</label>
              <input id="t-phylum" type="text" value={form.phylum} onChange={set('phylum')} /></div>
            <div className="field"><label htmlFor="t-class">Class</label>
              <input id="t-class" type="text" value={form.class_name} onChange={set('class_name')} /></div>
            <div className="field"><label htmlFor="t-order">Order</label>
              <input id="t-order" type="text" value={form.order_name} onChange={set('order_name')} /></div>
            <div className={field('family')}><label htmlFor="t-family">Family <span className="req">*</span></label>
              <input id="t-family" type="text" value={form.family} onChange={set('family')} />
              {errors.family && <span className="err-text">{errors.family}</span>}</div>
            <div className={field('genus')}><label htmlFor="t-genus">Genus <span className="req">*</span></label>
              <input id="t-genus" type="text" value={form.genus} onChange={set('genus')} />
              {errors.genus && <span className="err-text">{errors.genus}</span>}</div>
            <div className="field"><label htmlFor="t-species">Species</label>
              <input id="t-species" type="text" value={form.species} onChange={set('species')} /></div>
          </div>
        </div>
      </div>

      {/* always-visible action bar */}
      <div className="edit-actions">
        <button type="button" className="row-btn" disabled={saving}
          onClick={() => navigate(isEdit ? `/plants/${id}` : '/manage')}>
          Cancel
        </button>
        {status === 'draft' ? (
          <>
            <button type="button" className="pill-btn secondary" disabled={saving} onClick={() => save('draft')}>
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" className="pill-btn" disabled={saving} onClick={() => save('pending')}>
              Submit for verification
            </button>
          </>
        ) : (
          <button type="button" className="pill-btn" disabled={saving} onClick={() => save(status)}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>
    </div>
  );
}
