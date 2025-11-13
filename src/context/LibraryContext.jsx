/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { libraryService } from '../services/libraryService';

const LibraryContext = createContext(undefined);

export const LibraryProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const loadLibrary = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const [storesData, booksData, authorsData, inventoryData] = await Promise.all([
        libraryService.getStores(),
        libraryService.getBooks(),
        libraryService.getAuthors(),
        libraryService.getInventory(),
      ]);

      setStores(storesData);
      setBooks(booksData);
      setAuthors(authorsData);
      setInventory(inventoryData);
      setStatus('success');
    } catch (err) {
      const message = err.payload?.message ?? err.message ?? 'Unable to load library data';
      setError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const createInventoryItem = useCallback(async (payload) => {
    const created = await libraryService.createInventoryItem(payload);
    setInventory((prev) => [...prev, created]);
    return created;
  }, []);

  const updateInventoryItem = useCallback(async (id, payload) => {
    const updated = await libraryService.updateInventoryItem(id, payload);
    setInventory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
  }, []);

  const deleteInventoryItem = useCallback(async (id) => {
    await libraryService.deleteInventoryItem(id);
    setInventory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const authorsById = useMemo(() => {
    return authors.reduce((acc, author) => {
      acc[author.id] = author;
      return acc;
    }, {});
  }, [authors]);

  const booksById = useMemo(() => {
    return books.reduce((acc, book) => {
      acc[book.id] = book;
      return acc;
    }, {});
  }, [books]);

  const storesById = useMemo(() => {
    return stores.reduce((acc, store) => {
      acc[store.id] = store;
      return acc;
    }, {});
  }, [stores]);

  const value = useMemo(
    () => ({
      stores,
      books,
      authors,
      inventory,
      status,
      error,
      reload: loadLibrary,
      setStores,
      setBooks,
      setAuthors,
      setInventory,
      createInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      authorsById,
      booksById,
      storesById,
    }),
    [
      stores,
      books,
      authors,
      inventory,
      status,
      error,
      loadLibrary,
      createInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      authorsById,
      booksById,
      storesById,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

