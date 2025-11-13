import { useMemo } from 'react'
import { useLibrary } from '../context/LibraryContext'

const filterStoreBooks = ({ books, inventory, authorsById, storeId, searchTerm }) => {
  const numericId = Number(storeId)

  const items = inventory.filter((item) =>
    Number.isNaN(numericId) ? true : Number(item.store_id) === numericId
  )

  const merged = items
    .map((item) => {
      const book = books.find((candidate) => candidate.id === item.book_id)
      if (!book) {
        return null
      }

      return {
        ...book,
        inventoryId: item.id,
        store_id: item.store_id,
        price: item.price,
        author_name: authorsById[book.author_id]
          ? `${authorsById[book.author_id].first_name} ${authorsById[book.author_id].last_name}`
          : 'Unknown Author',
      }
    })
    .filter(Boolean)

  if (!searchTerm?.trim()) {
    return merged
  }

  const lower = searchTerm.toLowerCase()

  return merged.filter((entry) =>
    Object.values(entry).some((value) => String(value).toLowerCase().includes(lower))
  )
}

const mapBooksWithStores = ({ books, inventory, authorsById, storesById }) =>
  books.map((book) => {
    const related = inventory.filter((item) => item.book_id === book.id)
    return {
      title: book.name,
      author: authorsById[book.author_id]
        ? `${authorsById[book.author_id].first_name} ${authorsById[book.author_id].last_name}`
        : 'Unknown Author',
      stores: related.map((item) => ({
        name: storesById[item.store_id]?.name ?? 'Unknown Store',
        price: item.price,
      })),
    }
  })

const useLibraryData = ({ storeId = null, searchTerm = '' } = {}) => {
  const {
    books,
    authors,
    stores,
    inventory,
    status,
    error,
    setBooks,
    setAuthors,
    setStores,
    setInventory,
    authorsById,
    storesById,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  } = useLibrary()

  const storeBooks = useMemo(
    () =>
      filterStoreBooks({
        books,
        inventory,
        authorsById,
        storeId,
        searchTerm,
      }),
    [authorsById, books, inventory, searchTerm, storeId]
  )

  const booksWithStores = useMemo(
    () =>
      mapBooksWithStores({
        books,
        inventory,
        authorsById,
        storesById,
      }),
    [authorsById, books, inventory, storesById]
  )

  const authorMap = authorsById

  const isLoading = status === 'idle' || status === 'loading'

  return {
    books,
    setBooks,
    authors,
    setAuthors,
    stores,
    setStores,
    inventory,
    setInventory,
    authorMap,
    storesById,
    storeBooks,
    booksWithStores,
    isLoading,
    error,
    currentStore: stores.find((store) => store.id === Number(storeId)),
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  }
}

export default useLibraryData
