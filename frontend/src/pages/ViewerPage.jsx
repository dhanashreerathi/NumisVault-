import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../services/api';

export default function ViewerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { collectionData, currentVaultMode, getDecade, showToast } = useApp();
  const { user, token, wishlist, toggleWishlist } = useAuth();

  const [playlist, setPlaylist]     = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mobileBack, setMobileBack] = useState(false); // which image showing on mobile
  const wrapperRefs = useRef([]);

  // Build playlist and find starting index from ?item= param
  useEffect(() => {
    if (!collectionData.length) return;

    const itemId = searchParams.get('item');
    const target = itemId
      ? collectionData.find(i => i.unique_id === itemId)
      : null;

    const mode = target?.itemType || currentVaultMode;
    const list = collectionData.filter(i => i.itemType === mode);
    setPlaylist(list);

    if (target) {
      const idx = list.findIndex(i => i.unique_id === target.unique_id);
      setCurrentIdx(idx >= 0 ? idx : 0);
    } else {
      setCurrentIdx(0);
    }
    setMobileBack(false);
  }, [collectionData, searchParams]); // eslint-disable-line

  // Update URL when navigating cards (pushState without full re-render)
  useEffect(() => {
    const item = playlist[currentIdx];
    if (!item) return;
    const url = `${window.location.pathname}?item=${item.unique_id}`;
    window.history.replaceState(null, '', url);
  }, [currentIdx, playlist]);

  // Zoom effect
  const applyZoom = useCallback((wrappers) => {
    wrappers.forEach(wrapper => {
      if (!wrapper) return;
      const img = wrapper.querySelector('img');
      if (!img) return;
      wrapper.onmousemove = (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
      };
      wrapper.onmouseleave = () => { img.style.transformOrigin = 'center center'; };
    });
  }, []);

  useEffect(() => {
    const wrappers = document.querySelectorAll('.zoom-wrapper');
    applyZoom(Array.from(wrappers));
  }, [currentIdx, playlist, applyZoom]);

  const data = playlist[currentIdx];
  if (!data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading item...</p>
      </div>
    );
  }

  const safeDesc = data.desc?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
  const decade   = getDecade(data.year);
  const isWishlisted = wishlist.includes(data.id);

  const handleWishlist = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('nv:openAuth', {
        detail: { tab: 'login', message: 'Interested in this Piece? Please login to add to Wishlist.' }
      }));
      return;
    }
    try { await toggleWishlist(data.id); }
    catch { showToast('Failed to update wishlist.'); }
  };

  const handleContactOwner = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('nv:openAuth', {
        detail: { tab: 'login', message: 'Please log in to express interest in this piece.' }
      }));
      return;
    }
    try {
      await notificationsApi.inquire({ item_id: data.id }, token);
      showToast('✅ Request sent to admin!');
    } catch (err) {
      if (err.message === 'duplicate') {
        showToast('You have already submitted a request for this item.');
      } else {
        showToast('Failed to send inquiry. Please try again.');
      }
    }
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/gallery');
  };

  const renderImage = (src, alt, shapeClass) => {
    if (src && src !== 'EMPTY') {
      return (
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', display: 'block' }}
          onError={e => { e.target.onerror = null; e.target.outerHTML = '<div class="no-preview-box">No preview available</div>'; }}
        />
      );
    }
    return <div className="no-preview-box">No preview available</div>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-buttons">
          <button className="btn-back" onClick={() => navigate('/')}>🏠 Home</button>
          <button className="btn-back" onClick={goBack}>← Back</button>
        </div>
        <h2 className="page-title">Note Details</h2>
      </div>

      <div className="viewer-wrapper">
        <div className="card">
          {/* Left: Images */}
          <div className="card-left">
            <div className="image-container">
              {/* Desktop: show both; Mobile: show one at a time */}
              <div className={`carousel-item${mobileBack ? ' mobile-hidden' : ''}`}>
                <div className="zoom-wrapper">
                  {renderImage(data.imgFront, 'Front')}
                </div>
                <div className="image-label">Obverse</div>
              </div>

              <div className={`carousel-item${!mobileBack ? ' mobile-hidden' : ''}`}>
                <div className="zoom-wrapper">
                  {renderImage(data.imgBack, 'Back')}
                </div>
                <div className="image-label">Reverse</div>
              </div>

              <button className="carousel-nav left"  onClick={() => setMobileBack(false)}>&#10094;</button>
              <button className="carousel-nav right" onClick={() => setMobileBack(true)}>&#10095;</button>
            </div>
          </div>

          {/* Right: Details */}
          <div className="card-right">
            <h1 className="card-title">{data.title}</h1>
            <div className="description" dangerouslySetInnerHTML={{ __html: safeDesc }} />

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Denomination</span>
                <span className="detail-value">{data.denom}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Country</span>
                <span className="detail-value">{data.country}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Year</span>
                <span className="detail-value">{data.year}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Era</span>
                <span className="detail-value">{data.era}</span>
              </div>
              {data.itemType === 'note' && (
                <div className="detail-item full-width">
                  <span className="detail-label">Serial Number</span>
                  <span className="detail-value">{data.serial}</span>
                </div>
              )}
            </div>

            <div className="interested-section">
              <h4>Interested in this piece?</h4>
              <div className="action-buttons">
                <button
                  className="btn-wishlist"
                  style={isWishlisted ? { background: '#4b5563' } : {}}
                  onClick={handleWishlist}
                >
                  {isWishlisted ? '💔 Remove from Wishlist' : '❤️ Add to Wishlist'}
                </button>
                <button className="btn-contact" onClick={handleContactOwner}>
                  ✉️ Reach out to Owner
                </button>
              </div>
            </div>

            <div className="controls">
              <button
                id="btn-prev"
                className="icon-btn"
                disabled={currentIdx === 0}
                onClick={() => { setCurrentIdx(p => p - 1); setMobileBack(false); }}
              >◄ Prev</button>
              <span id="card-counter">{currentIdx + 1} / {playlist.length}</span>
              <button
                id="btn-next"
                className="icon-btn"
                disabled={currentIdx === playlist.length - 1}
                onClick={() => { setCurrentIdx(p => p + 1); setMobileBack(false); }}
              >Next ►</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
