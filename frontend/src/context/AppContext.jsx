import { createContext, useContext, useState, useCallback } from 'react';
import { collectionApi, countriesApi } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [collectionData, setCollectionData]   = useState([]);
  const [countries, setCountries]             = useState(['All Countries']);
  const [toast, setToast]                     = useState(null); // { msg }
  const [confirmModal, setConfirmModal]       = useState(null); // { message, onConfirm }
  const [alertModal, setAlertModal]           = useState(null); // { title, message }
  const [currentVaultMode, setCurrentVaultMode] = useState('note');

  // ─── Fetch collection ──────────────────────────────────────────────────────
  const fetchCollection = useCallback(async () => {
    try {
      const res = await collectionApi.getAll();
      const mapped = (res.data || []).map(item => {
        let subType = 'standard';
        if (item.is_unique_serial) subType = 'serial';
        else if (item.is_error) subType = 'error';
        return {
          id:       item.id,
          itemType: item.item_type,
          type:     subType,
          title:    item.title,
          imgFront: item.image_front_url,
          imgBack:  item.image_back_url,
          desc:     item.description,
          denom:    item.denomination,
          country:  item.country,
          year:     item.year_issued || 'ND',
          era:      item.era,
          serial:   item.serial_number || 'N/A',
          unique_id: item.unique_id || null,
        };
      });
      setCollectionData(mapped);
      return mapped;
    } catch (err) {
      console.error('Failed to fetch collection:', err);
      return [];
    }
  }, []);

  // ─── Fetch countries ───────────────────────────────────────────────────────
  const fetchCountries = useCallback(async () => {
    try {
      const res = await countriesApi.get();
      setCountries(['All Countries', ...(res.data || [])]);
    } catch {
      // fallback already set
    }
  }, []);

  // ─── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast({ msg });
    setTimeout(() => setToast(null), 3300);
  }, []);

  // ─── Confirm modal ─────────────────────────────────────────────────────────
  const showConfirm = useCallback((message, onConfirm) => {
    setConfirmModal({ message, onConfirm });
  }, []);

  // ─── Alert modal ───────────────────────────────────────────────────────────
  const showAlert = useCallback((title, message) => {
    setAlertModal({ title, message });
  }, []);

  // ─── ID generator ─────────────────────────────────────────────────────────
  const generateUniqueID = useCallback((itemType) => {
    const prefix = itemType === 'coin' ? 'C' : 'N';
    const typeItems = collectionData.filter(i => i.itemType === itemType);
    let maxNumber = 0;
    typeItems.forEach(item => {
      if (item.unique_id) {
        const num = parseInt(item.unique_id.replace(prefix, ''), 10);
        if (!isNaN(num) && num > maxNumber) maxNumber = num;
      }
    });
    return prefix + (maxNumber + 1).toString().padStart(5, '0');
  }, [collectionData]);

  // ─── Decade helper ─────────────────────────────────────────────────────────
  const getDecade = (yearValue) => {
    if (!yearValue) return 'Other';
    const str = String(yearValue);
    const m = str.match(/\d{4}/);
    if (m) return Math.floor(parseInt(m[0]) / 10) * 10 + 's';
    return 'Other';
  };

  return (
    <AppContext.Provider value={{
      collectionData, setCollectionData,
      countries,
      fetchCollection, fetchCountries,
      currentVaultMode, setCurrentVaultMode,
      toast, setToast,
      confirmModal, setConfirmModal,
      alertModal, setAlertModal,
      showToast, showConfirm, showAlert,
      generateUniqueID, getDecade,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
