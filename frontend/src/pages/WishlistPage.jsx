import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { collectionData, getDecade } = useApp();
  const { wishlist } = useAuth();

  const wishlisted = collectionData.filter(item => wishlist.includes(item.id));

  return (
    <div>
      <div className="page-header">
        <div className="header-buttons">
          <button className="btn-back" onClick={() => navigate('/')}>🏠 Home</button>
        </div>
        <h2 className="page-title">My Wishlist</h2>
      </div>

      <div className="gallery-grid" style={{ padding: '24px' }}>
        {wishlisted.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
            <h3 style={{ color: 'var(--accent-gold)' }}>Your wishlist is empty</h3>
            <p style={{ color: 'var(--text-muted)' }}>Explore the archive and click the heart icon to save items here.</p>
          </div>
        ) : wishlisted.map(item => {
          const decade = getDecade(item.year);
          const shapeClass = item.itemType === 'coin' ? 'shape-coin' : 'shape-note';
          return (
            <div
              key={item.id}
              className="gallery-item"
              onClick={() => navigate(`/viewer?item=${item.unique_id}`)}
            >
              {item.imgFront && item.imgFront !== 'EMPTY'
                ? <img className={shapeClass} src={item.imgFront} alt={item.title}
                    onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x150?text=Image+Missing'; }} />
                : <div className="no-preview-box">No preview available</div>
              }
              <h4>{item.title}</h4>
              <p>{item.country} • {decade}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
