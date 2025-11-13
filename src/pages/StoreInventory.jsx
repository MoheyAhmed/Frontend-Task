import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header'
import Table from '../components/Table/Table'
import Modal from '../components/Modal'
import useLibraryData from '../hooks/useLibraryData'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'
import TableActions from '../components/ActionButton/TableActions'

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === '') {
    return '—'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value))
}

const TABS = [
  { id: 'books', label: 'Books' },
  { id: 'authors', label: 'Authors' },
]

const StoreInventory = () => {
  const { storeId } = useParams()
  const {
    storeBooks,
    currentStore,
    books,
    isLoading,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  } = useLibraryData({ storeId })
  const { isAuthenticated, openModal: promptSignIn } = useAuth()

  const [activeTab, setActiveTab] = useState('books')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingInventoryId, setEditingInventoryId] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [bookSearchTerm, setBookSearchTerm] = useState('')
  const [selectedBookId, setSelectedBookId] = useState('')
  const [newBookPrice, setNewBookPrice] = useState('')
  const [mutationState, setMutationState] = useState({ type: null, id: null })

  const handleSearch = useCallback((value) => {
    setSearchTerm(value)
  }, [])

  const startMutation = (type, id = null) => {
    setMutationState({ type, id })
  }

  const endMutation = () => {
    setMutationState({ type: null, id: null })
  }

  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) {
      return storeBooks
    }

    const lower = searchTerm.toLowerCase()
    return storeBooks.filter((book) =>
      [book.name, book.author_name, book.page_count, book.price].some((value) =>
        String(value).toLowerCase().includes(lower)
      )
    )
  }, [searchTerm, storeBooks])

  const authorGroups = useMemo(() => {
    return filteredBooks.reduce((acc, book) => {
      const key = book.author_name ?? 'Unknown Author'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(book)
      return acc
    }, {})
  }, [filteredBooks])

  const existingBookIds = useMemo(() => new Set(storeBooks.map((book) => book.id)), [storeBooks])

  const availableBooks = useMemo(
    () =>
      books.filter((book) => !existingBookIds.has(book.id)).map((book) => ({
        id: book.id,
        label: book.name,
      })),
    [books, existingBookIds]
  )

  const filteredAvailableBooks = useMemo(() => {
    const filtered = bookSearchTerm
      ? availableBooks.filter((book) => book.label.toLowerCase().includes(bookSearchTerm.toLowerCase()))
      : availableBooks.slice(0, 7)
    return filtered
  }, [availableBooks, bookSearchTerm])

  const openAddModal = useCallback(() => {
    if (!isAuthenticated) {
      promptSignIn()
      return
    }
    setSelectedBookId('')
    setNewBookPrice('')
    setBookSearchTerm('')
    setModalOpen(true)
  }, [isAuthenticated, promptSignIn])

  const closeAddModal = useCallback(() => {
    if (mutationState.type === 'add') return
    setModalOpen(false)
  }, [mutationState.type])

  const handleEditPrice = useCallback(
    (row) => {
      if (!isAuthenticated) {
        promptSignIn()
        return
      }
      setEditingInventoryId(row.inventoryId)
      setEditPrice(String(row.price ?? ''))
    },
    [isAuthenticated, promptSignIn]
  )

  const cancelEdit = useCallback(
    (force = false) => {
      if (!force && mutationState.type === 'edit') return
    setEditingInventoryId(null)
    setEditPrice('')
    },
    [mutationState.type]
  )

  const commitPriceUpdate = useCallback(
    async (inventoryId, priceValue) => {
      if (!priceValue || Number.isNaN(Number(priceValue))) {
        alert('Please enter a valid price')
        return
      }
      const numericValue = Number(priceValue)
      if (numericValue < 0) {
        alert('Price must be zero or greater')
        return
      }
      try {
        startMutation('edit', inventoryId)
        await updateInventoryItem(inventoryId, { price: numericValue })
        cancelEdit(true)
      } catch (error) {
        alert(error.message ?? 'Failed to update the price')
      } finally {
        endMutation()
      }
    },
    [cancelEdit, updateInventoryItem]
  )

  const handleDelete = useCallback(
    async (row) => {
      if (!isAuthenticated) {
        promptSignIn()
        return
      }

      if (!window.confirm(`Remove "${row.name}" from ${currentStore?.name}?`)) {
        return
      }

      try {
        startMutation('delete', row.inventoryId)
        await deleteInventoryItem(row.inventoryId)
      } catch (error) {
        alert(error.message ?? 'Failed to delete the book from the inventory')
      } finally {
        endMutation()
      }
    },
    [currentStore?.name, deleteInventoryItem, isAuthenticated, promptSignIn]
  )

  const handleSubmitNewBook = useCallback(async () => {
    if (!selectedBookId) {
      alert('Please select a book')
      return
    }
    if (!newBookPrice || Number.isNaN(Number(newBookPrice))) {
      alert('Please enter a valid price')
      return
    }
    const numericPrice = Number(newBookPrice)
    if (numericPrice < 0) {
      alert('Price must be zero or greater')
      return
    }
    try {
      startMutation('add')
      await createInventoryItem({
        book_id: Number(selectedBookId),
        store_id: Number(storeId),
        price: numericPrice,
      })
      setModalOpen(false)
      setSelectedBookId('')
      setNewBookPrice('')
    } catch (error) {
      alert(error.message ?? 'Failed to add the book to inventory')
    } finally {
      endMutation()
    }
  }, [createInventoryItem, newBookPrice, selectedBookId, storeId])

  const columns = useMemo(
    () => [
      { header: 'Book Id', accessorKey: 'id' },
      { header: 'Name', accessorKey: 'name' },
      { header: 'Pages', accessorKey: 'page_count' },
      { header: 'Author', accessorKey: 'author_name' },
      {
        header: 'Price',
        accessorKey: 'price',
        cell: ({ row }) =>
          editingInventoryId === row.original.inventoryId ? (
            <input
              type="number"
              step="0.01"
              min="0"
              value={editPrice}
              onChange={(event) => setEditPrice(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitPriceUpdate(row.original.inventoryId, editPrice)
                }
                if (event.key === 'Escape') {
                  cancelEdit()
                }
              }}
              disabled={mutationState.type === 'edit'}
              className="w-28 rounded border border-slate-300 px-2 py-1 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/30"
              autoFocus
            />
          ) : (
            <span>{formatCurrency(row.original.price)}</span>
          ),
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => (
          <TableActions
            row={row}
            onEdit={
              editingInventoryId === row.original.inventoryId
                ? cancelEdit
                : () => handleEditPrice(row.original)
            }
            onDelete={() => handleDelete(row.original)}
            disableEdit={
              !isAuthenticated ||
              (mutationState.type === 'edit' && mutationState.id === row.original.inventoryId)
            }
            disableDelete={
              !isAuthenticated ||
              (mutationState.type === 'delete' && mutationState.id === row.original.inventoryId)
            }
            editTooltip={isAuthenticated ? 'Edit price' : 'Sign in to edit'}
            deleteTooltip={isAuthenticated ? 'Delete from inventory' : 'Sign in to delete'}
          />
        ),
      },
    ],
    [
      cancelEdit,
      commitPriceUpdate,
      editPrice,
      editingInventoryId,
      handleDelete,
      handleEditPrice,
      isAuthenticated,
      mutationState.id,
      mutationState.type,
    ]
  )

  if (isLoading) {
    return <Loading />
  }

  if (!currentStore) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-lg text-slate-600">Store not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{currentStore.name}</h2>
            <p className="text-sm text-slate-500">
              {currentStore.address_1}
              {currentStore.address_2 ? `, ${currentStore.address_2}` : ''}, {currentStore.city},{' '}
              {currentStore.state} {currentStore.zip}
            </p>
          </div>
          {!isAuthenticated ? (
            <p className="text-sm text-slate-500">
              Sign in to manage the inventory. Browsing is available for guests.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {TABS.map((tab) => (
        <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-main text-white shadow'
                : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            {tab.label}
        </button>
        ))}
      </div>

      {activeTab === 'books' ? (
        <div className="space-y-4">
          <Header
            addNew={openAddModal}
            title="Store Inventory"
            buttonTitle="Add to inventory"
            onSearchChange={handleSearch}
            searchValue={searchTerm}
            actionDisabled={!isAuthenticated || mutationState.type === 'add'}
            actionTooltip={!isAuthenticated ? 'Sign in to add books' : ''}
          />

          {filteredBooks.length > 0 ? (
            <Table
              data={filteredBooks}
              columns={columns}
              enableRowSelection={false}
              pageSizeOptions={[10, 25, 50]}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
              No books found in this store. {isAuthenticated ? 'Add a book to get started.' : ''}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Header
            title="Authors in Store"
            onSearchChange={handleSearch}
            searchValue={searchTerm}
            hideSearch={false}
            actionDisabled
          />
          {Object.keys(authorGroups).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(authorGroups).map(([authorName, authorBooks]) => (
                <div key={authorName} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800">{authorName}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {authorBooks.map((book) => (
                      <li
                        key={book.id}
                        className="flex items-center justify-between rounded bg-slate-50 px-3 py-2"
                      >
                        <span className="font-medium text-slate-700">{book.name}</span>
                        <span className="text-xs text-slate-500">
                          {book.page_count} pages · {formatCurrency(book.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
              No authors with books in this store.
            </div>
          )}
        </div>
      )}

      <Modal
        title="Add Book to Inventory"
        save={handleSubmitNewBook}
        cancel={closeAddModal}
        show={modalOpen}
        confirmLabel={mutationState.type === 'add' ? 'Saving...' : 'Add Book'}
        disableSave={mutationState.type === 'add'}
        disableCancel={mutationState.type === 'add'}
      >
        <div className="flex w-full flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="book_search">
              Search Book
            </label>
            <input
              id="book_search"
              type="text"
              value={bookSearchTerm}
              onChange={(event) => setBookSearchTerm(event.target.value)}
              placeholder="Search by book title"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="book_select">
              Select Book
            </label>
            <select
              id="book_select"
              value={selectedBookId}
              onChange={(event) => setSelectedBookId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/30"
            >
              <option value="" disabled>
                Choose a book
              </option>
              {filteredAvailableBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Showing up to 7 results. Use search to filter.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="book_price">
              Price
            </label>
            <input
              id="book_price"
              type="number"
              min="0"
              step="0.01"
              value={newBookPrice}
              onChange={(event) => setNewBookPrice(event.target.value)}
              placeholder="Enter price (e.g., 24.99)"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/30"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default StoreInventory
