import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { setCurrentVaultMode } = useApp();

  const openGallery = (mode) => {
    setCurrentVaultMode(mode);
    navigate('/gallery');
  };

  return (
    <section className="hero-section">
      <h1 className="hero-title">Explore the Archive</h1>
      <div className="hero-subtitle">Historical &amp; Rare Numismatics</div>
      <div className="hero-buttons">
        <button className="btn-hero" onClick={() => openGallery('note')}>
          Explore Currency Notes
        </button>
        <button className="btn-hero" onClick={() => openGallery('coin')}>
          Explore Coins
        </button>
      </div>
    </section>
  );
}
