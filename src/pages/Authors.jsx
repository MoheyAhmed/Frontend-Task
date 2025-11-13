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

const normalizeName = (name) => name.trim().replace(/\s+/g, ' ')

const splitName = (fullName) => {
  const [firstName, ...rest] = normalizeName(fullName).split(' ')
  const lastName = rest.join(' ')
  return {
    first_name: firstName ?? '',
    last_name: lastName ?? '',
  }
}

const Authors = () => {
  const { authors, setAuthors, isLoading } = useLibraryData()
  const { isAuthenticated, openModal: promptSignIn } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [editingAuthorId, setEditingAuthorId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newAuthorName, setNewAuthorName] = useState('')
  const [mutationState, setMutationState] = useState({ type: null, id: null })

  const searchTerm = searchParams.get('search') ?? ''

  const handleSearch = useCallback(
    (value) => {
      setSearchParams(value ? { search: value } : {})
    },
    [setSearchParams]
  )

  const filteredAuthors = useMemo(() => {
    if (!searchTerm.trim()) {
      return authors
    }
    const lower = searchTerm.toLowerCase()
    return authors.filter((author) =>
      [author.first_name, author.last_name].some((field) =>
        String(field).toLowerCase().includes(lower)
      )
    )
  }, [authors, searchTerm])

  const startMutation = (type, id = null) => setMutationState({ type, id })
  const endMutation = () => setMutationState({ type: null, id: null })

  const handleEdit = useCallback(
    (author) => {
      if (!isAuthenticated) {
        promptSignIn()
        return
      }
      setEditingAuthorId(author.id)
      setEditName(`${author.first_name} ${author.last_name}`.trim())
    },
    [isAuthenticated, promptSignIn]
  )

  const handleCancelEdit = useCallback(() => {
    if (mutationState.type === 'edit') return
    setEditingAuthorId(null)
    setEditName('')
  }, [mutationState.type])

  const handleSave = useCallback(
    async (id) => {
      if (!editName.trim()) {
        alert('Author name cannot be empty')
        return
      }
      const payload = splitName(editName)
      try {
        startMutation('edit', id)
        const updated = await libraryService.updateAuthor(id, payload)
        setAuthors((prev) =>
          prev.map((author) => (author.id === updated.id ? updated : author))
        )
        setEditingAuthorId(null)
        setEditName('')
      } catch (error) {
        alert(error.message ?? 'Failed to update the author')
      } finally {
        endMutation()
      }
    },
    [editName, setAuthors]
  )

  const handleDelete = useCallback(
    async (author) => {
      if (!isAuthenticated) {
        promptSignIn()
        return
      }

      if (
        !window.confirm(`Are you sure you want to delete ${author.first_name} ${author.last_name}?`)
      ) {
        return
      }

      try {
        startMutation('delete', author.id)
        await libraryService.deleteAuthor(author.id)
        setAuthors((prev) => prev.filter((item) => item.id !== author.id))
        if (editingAuthorId === author.id) {
          setEditingAuthorId(null)
          setEditName('')
        }
      } catch (error) {
        alert(error.message ?? 'Failed to delete the author')
      } finally {
        endMutation()
      }
    },
    [editingAuthorId, isAuthenticated, promptSignIn, setAuthors]
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
    if (!newAuthorName.trim()) {
      alert('Author name cannot be empty')
      return
    }
    const payload = splitName(newAuthorName)
    try {
      startMutation('create')
      const created = await libraryService.createAuthor(payload)
      setAuthors((prev) => [...prev, created])
      setNewAuthorName('')
      setShowModal(false)
    } catch (error) {
      alert(error.message ?? 'Failed to create author')
    } finally {
      endMutation()
    }
  }

  const columns = useMemo(
    () => [
      { header: 'ID', accessorKey: 'id' },
      {
        header: 'Name',
        id: 'name',
        cell: ({ row }) =>
          editingAuthorId === row.original.id ? (
            <input
              type="text"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSave(row.original.id)
                } else if (event.key === 'Escape') {
                  handleCancelEdit()
                }
              }}
              disabled={mutationState.type === 'edit'}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/40"
              autoFocus
            />
          ) : (
            `${row.original.first_name} ${row.original.last_name}`.trim()
          ),
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => (
          <TableActions 
            row={row}
            onEdit={
              editingAuthorId === row.original.id ? handleCancelEdit : () => handleEdit(row.original)
            }
            onDelete={() => handleDelete(row.original)}
            disableEdit={
              !isAuthenticated || (mutationState.type === 'edit' && mutationState.id === row.original.id)
            }
            disableDelete={
              !isAuthenticated || (mutationState.type === 'delete' && mutationState.id === row.original.id)
            }
            editTooltip={isAuthenticated ? 'Edit author' : 'Sign in to edit'}
            deleteTooltip={isAuthenticated ? 'Delete author' : 'Sign in to delete'}
          />
        ),
      },
    ],
    [
      editName,
      editingAuthorId,
      handleCancelEdit,
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
        title="Authors List"
        onSearchChange={handleSearch}
        searchValue={searchTerm}
        actionDisabled={!isAuthenticated || mutationState.type === 'create'}
        actionTooltip={!isAuthenticated ? 'Sign in to add authors' : ''}
      />
      {isLoading ? (
        <Loading />
      ) : (
        <Table data={filteredAuthors} columns={columns} />
      )}
      <Modal
        title="New Author"
        save={handleAddNew}
        cancel={closeModal}
        show={showModal}
        confirmLabel={mutationState.type === 'create' ? 'Creating...' : 'Create'}
        disableSave={mutationState.type === 'create'}
        disableCancel={mutationState.type === 'create'}
      >
        <div className="flex w-full flex-col gap-3">
          <label htmlFor="author_name" className="text-sm font-medium text-slate-700">
            Author Name
          </label>
          <input
            id="author_name"
            type="text"
            value={newAuthorName}
            onChange={(event) => setNewAuthorName(event.target.value)}
            placeholder="e.g., Jane Austen"
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/30"
          />
        </div>
      </Modal>
    </div>
  )
}

export default Authors
