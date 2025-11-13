import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Loading from './Loading'
import Table from '../components/Table/Table'
import Modal from '../components/Modal'
import TableActions from '../components/ActionButton/TableActions'
import useLibraryData from '../hooks/useLibraryData'
import { libraryService } from '../services/libraryService'
import { useAuth } from '../context/AuthContext'

const buildFullAddress = ({ address_1, address_2, city, state, zip }) =>
  [address_1, address_2, `${city}, ${state} ${zip}`.trim()].filter(Boolean).join(', ')

const defaultStoreState = {
  name: '',
  address: '',
}

const Stores = () => {
  const navigate = useNavigate()
  const { isAuthenticated, openModal: promptSignIn } = useAuth()
  const { stores, setStores, setInventory, isLoading } = useLibraryData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [editingRowId, setEditingRowId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newStore, setNewStore] = useState(defaultStoreState)

  const searchTerm = searchParams.get('search') ?? ''

  const onRowClick = (_, row) => {
    navigate(`/store/${row.id}`)
  }

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      promptSignIn()
      return
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setNewStore(defaultStoreState)
  }

  const filteredStores = useMemo(() => {
    const enriched = stores.map((store) => ({
      ...store,
      full_address: buildFullAddress(store),
    }))

    if (!searchTerm.trim()) {
      return enriched
    }

    const lower = searchTerm.toLowerCase()

    return enriched.filter((store) =>
      Object.values(store).some((value) => String(value).toLowerCase().includes(lower))
    )
  }, [searchTerm, stores])

  const handleSearch = (value) => {
    setSearchParams(value ? { search: value } : {})
  }

  const handleEdit = (store) => {
    if (!isAuthenticated) {
      promptSignIn()
      return
    }
    setEditingRowId(store.id)
    setEditName(store.name)
  }

  const handleCancel = () => {
    setEditingRowId(null)
    setEditName('')
  }

  const handleSave = async (id) => {
    if (!editName.trim()) {
      return
    }

    try {
      const payload = { name: editName.trim() }
      const updated = await libraryService.updateStore(id, payload)
      setStores((prev) => prev.map((store) => (store.id === updated.id ? updated : store)))
      setEditingRowId(null)
      setEditName('')
    } catch (error) {
      alert(error.message ?? 'Failed to update store details')
    }
  }

  const deleteStore = async (id, name) => {
    if (!isAuthenticated) {
      promptSignIn()
      return
    }

    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      await libraryService.deleteStore(id)
      setStores((prev) => prev.filter((store) => store.id !== id))
      setInventory((prev) => prev.filter((item) => item.store_id !== id))
      handleCancel()
    } catch (error) {
      alert(error.message ?? 'Failed to delete store')
    }
  }

  const parseAddress = (address) => {
    if (!address || !address.trim()) {
      throw new Error('Address is required')
    }

    const parts = address.split(',').map((part) => part.trim())

    if (parts.length < 3) {
      throw new Error('Address must include street, city, state and zip')
    }

    const lastPart = parts[parts.length - 1]
    const stateZipMatch = lastPart.match(/([A-Za-z]{2})\s+(\d{5})/)
    if (!stateZipMatch) {
      throw new Error('State and zip must follow the pattern "GA 30305"')
    }

    const city = parts[parts.length - 2]
    const address_1 = parts[0]
    const address_2 = parts.length > 3 ? parts[1] : ''

    return {
      address_1,
      address_2,
      city,
      state: stateZipMatch[1],
      zip: stateZipMatch[2],
    }
  }

  const handleAddNew = async () => {
    if (!newStore.name.trim()) {
      alert('Store name is required')
      return
    }

    try {
      const parsedAddress = parseAddress(newStore.address)
      const payload = {
        name: newStore.name.trim(),
        ...parsedAddress,
      }
      const created = await libraryService.createStore(payload)
      setStores((prev) => [...prev, created])
      closeModal()
    } catch (error) {
      alert(error.message ?? 'Failed to create store')
    }
  }

  const columns = useMemo(
    () => [
      { header: 'Store Id', accessorKey: 'id' },
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) =>
          editingRowId === row.original.id ? (
            <input
              type="text"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSave(row.original.id)
                if (event.key === 'Escape') handleCancel()
              }}
              className="w-full rounded border border-slate-300 px-2 py-1 focus:border-main focus:outline-none focus:ring-1 focus:ring-main/40"
              autoFocus
            />
          ) : (
            row.original.name
          ),
      },
      { header: 'Address', accessorKey: 'full_address' },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => (
          <TableActions
            row={row}
            onEdit={
              editingRowId === row.original.id
                ? handleCancel
                : () => handleEdit(row.original)
            }
            onDelete={() => deleteStore(row.original.id, row.original.name)}
            disableEdit={!isAuthenticated}
            disableDelete={!isAuthenticated}
            editTooltip={isAuthenticated ? 'Edit store name' : 'Sign in to edit'}
            deleteTooltip={isAuthenticated ? 'Delete store' : 'Sign in to delete'}
          />
        ),
      },
    ],
    [deleteStore, editName, editingRowId, handleCancel, handleEdit, handleSave, isAuthenticated]
  )

  return (
    <div className="space-y-4">
      <Header addNew={handleOpenModal} title="Stores List" onSearchChange={handleSearch} searchValue={searchTerm} />
      {isLoading ? (
        <Loading />
      ) : (
        <Table data={filteredStores} columns={columns} onRowClick={onRowClick} />
      )}
      <Modal
        title="New Store"
        save={handleAddNew}
        cancel={closeModal}
        show={showModal}
      >
        <div className="flex w-full flex-col gap-4">
          <div>
            <label htmlFor="store_name" className="mb-1 block text-sm font-medium text-slate-700">
              Store Name
            </label>
            <input
              id="store_name"
              type="text"
              value={newStore.name}
              onChange={(event) => setNewStore((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/40"
              placeholder="Enter Store Name"
            />
          </div>
          <div>
            <label htmlFor="store_address" className="mb-1 block text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              id="store_address"
              type="text"
              value={newStore.address}
              onChange={(event) =>
                setNewStore((prev) => ({
                  ...prev,
                  address: event.target.value,
                }))
              }
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-main focus:outline-none focus:ring-1 focus:ring-main/40"
              placeholder='123 Main St, Floor 2, Atlanta, GA 30305'
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Stores
