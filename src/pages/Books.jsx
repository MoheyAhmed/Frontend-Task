import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Loading from './Loading'
import Table from '../components/Table/Table'
import Modal from '../components/Modal'
import TableActions from '../components/ActionButton/TableActions'
import useLibraryData from '../hooks/useLibraryData'
import { libraryService } from '../services/libraryService'
import { useAuth } from '../context/AuthContext'

const initialFormState = {
    name: '',
    page_count: '',
  author_id: '',
}

const Books = () => {
  const { books, authors, setBooks, setInventory, authorMap, isLoading } = useLibraryData()
  const { isAuthenticated, openModal: promptSignIn } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [editingBookId, setEditingBookId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newBook, setNewBook] = useState(initialFormState)
  const [mutationState, setMutationState] = useState({ type: null, id: null })

  const searchTerm = searchParams.get('search') ?? ''

  const handleSearch = useCallback(
    (value) => {
      setSearchParams(value ? { search: value } : {})
    },
    [setSearchParams]
  )

  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) {
      return books
    }
    const lower = searchTerm.toLowerCase()
    return books.filter((book) =>
      [book.name, book.page_count, authorMap[book.author_id]?.first_name, authorMap[book.author_id]?.last_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(lower))
    )
  }, [authorMap, books, searchTerm])

  const startMutation = (type, id = null) => setMutationState({ type, id })
  const endMutation = () => setMutationState({ type: null, id: null })

  const handleEdit = useCallback(
    (book) => {
      if (!isAuthenticated) {
        promptSignIn()
        return
      }
      setEditingBookId(book.id)
      setEditName(book.name)
    },
    [isAuthenticated, promptSignIn]
  )

  const cancelEdit = useCallback(() => {
    if (mutationState.type === 'edit') return
    setEditingBookId(null)
    setEditName('')
  }, [mutationState.type])

  const handleSave = useCallback(
    async (id) => {
      if (!editName.trim()) {
        alert('Book title cannot be empty')
        return
      }
      try {
        startMutation('edit', id)
        const updated = await libraryService.updateBook(id, { name: editName.trim() })
        setBooks((prev) => prev.map((book) => (book.id === updated.id ? updated : book)))
        setEditingBookId(null)
        setEditName('')
      } catch (error) {
        alert(error.message ?? 'Failed to update the book')
      } finally {
        endMutation()
      }
    },
    [editName, setBooks]
  )

  const handleDelete = useCallback(
    async (book) => {
      if (!isAuthenticated) {
        promptSignIn()
        return
      }
      if (!window.confirm(`Delete "${book.name}"? This will remove it from inventories as well.`)) {
        return
      }
      try {
        startMutation('delete', book.id)
        await libraryService.deleteBook(book.id)
        setBooks((prev) => prev.filter((item) => item.id !== book.id))
        setInventory((prev) => prev.filter((item) => item.book_id !== book.id))
        if (editingBookId === book.id) {
          setEditingBookId(null)
          setEditName('')
        }
      } catch (error) {
        alert(error.message ?? 'Failed to delete the book')
      } finally {
        endMutation()
      }
    },
    [editingBookId, isAuthenticated, promptSignIn, setBooks, setInventory]
  )

  const openModal = () => {
    if (!isAuthenticated) {
      promptSignIn()
      return
    }
    setShowModal(true)
  }

  const closeModal = () => {
    if (mutationState.type === 'create') return
    setShowModal(false)
  }

  const handleAddNew = async () => {
    if (!newBook.name.trim() || !newBook.page_count || !newBook.author_id) {
      alert('All fields are required')
      return
    }

    const payload = {
      name: newBook.name.trim(),
      page_count: Number(newBook.page_count),
      author_id: Number(newBook.author_id),
    }

    if (Number.isNaN(payload.page_count) || payload.page_count <= 0) {
      alert('Page count must be a positive number')
      return
    }

    try {
      startMutation('create')
      const created = await libraryService.createBook(payload)
      setBooks((prev) => [...prev, created])
      setNewBook(initialFormState)
      setShowModal(false)
    } catch (error) {
      alert(error.message ?? 'Failed to create book')
    } finally {
      endMutation()
    }
  }

  const columns = useMemo(
    () => [
      { header: 'Book Id', accessorKey: 'id' },
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) =>
          editingBookId === row.original.id ? (
            <input
              type="text"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSave(row.original.id)
                } else if (event.key === 'Escape') {
                  cancelEdit()
                }
              }}
              disabled={mutationState.type === 'edit'}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/40"
              autoFocus
            />
          ) : (
            row.original.name
          ),
      },
      { header: 'Pages', accessorKey: 'page_count' },
      {
        header: 'Author',
        accessorKey: 'author_id',
        cell: ({ row }) => {
          const author = authorMap[row.original.author_id]
          return author ? `${author.first_name} ${author.last_name}`.trim() : 'Unknown'
        },
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => (
          <TableActions
            row={row}
            onEdit={editingBookId === row.original.id ? cancelEdit : () => handleEdit(row.original)}
            onDelete={() => handleDelete(row.original)}
            disableEdit={
              !isAuthenticated || (mutationState.type === 'edit' && mutationState.id === row.original.id)
            }
            disableDelete={
              !isAuthenticated || (mutationState.type === 'delete' && mutationState.id === row.original.id)
            }
            editTooltip={isAuthenticated ? 'Edit book' : 'Sign in to edit'}
            deleteTooltip={isAuthenticated ? 'Delete book' : 'Sign in to delete'}
          />
        ),
      },
    ],
    [
      authorMap,
      cancelEdit,
      editName,
      editingBookId,
      handleDelete,
      handleEdit,
      handleSave,
      isAuthenticated,
      mutationState.id,
      mutationState.type,
    ]
  )

  return (
    <div className="space-y-4 py-6">
      <Header
        addNew={openModal}
        title="Books List"
        onSearchChange={handleSearch}
        searchValue={searchTerm}
        actionDisabled={!isAuthenticated || mutationState.type === 'create'}
        actionTooltip={!isAuthenticated ? 'Sign in to add books' : ''}
      />
      {isLoading ? (
        <Loading />
      ) : (
        <Table data={filteredBooks} columns={columns} />
      )}
      <Modal
        title="New Book"
        save={handleAddNew}
        cancel={closeModal}
        show={showModal}
        confirmLabel={mutationState.type === 'create' ? 'Creating...' : 'Create'}
        disableSave={mutationState.type === 'create'}
        disableCancel={mutationState.type === 'create'}
      >
        <div className="flex w-full flex-col gap-4">
          <div>
            <label htmlFor="book_name" className="mb-1 block text-sm font-medium text-slate-700">
              Book Name
            </label>
            <input
              id="book_name"
              type="text"
              value={newBook.name}
              onChange={(event) => setNewBook((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Enter book title"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/30"
            />
          </div>
          <div>
            <label htmlFor="book_pages" className="mb-1 block text-sm font-medium text-slate-700">
              Pages
            </label>
            <input
              id="book_pages"
              type="number"
              min="1"
              value={newBook.page_count}
              onChange={(event) =>
                setNewBook((prev) => ({ ...prev, page_count: event.target.value }))
              }
              placeholder="Number of pages"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/30"
            />
          </div>
          <div>
            <label htmlFor="book_author" className="mb-1 block text-sm font-medium text-slate-700">
              Author
            </label>
            <select
              id="book_author"
              value={newBook.author_id}
              onChange={(event) =>
                setNewBook((prev) => ({ ...prev, author_id: event.target.value }))
              }
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/30"
            >
              <option value="" disabled>
                Select an author
              </option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.first_name} {author.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Books
