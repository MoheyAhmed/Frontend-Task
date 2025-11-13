import ActionButton from '../ActionButton/ActionButton'
import pencil from '../../assets/Pencil.png'
import trash from '../../assets/Bin.png'

const TableActions = ({
  row,
  onEdit,
  onDelete,
  disableEdit = false,
  disableDelete = false,
  editTooltip = 'Edit',
  deleteTooltip = 'Delete',
}) => (
  <div className="flex items-center gap-2">
    {onEdit ? (
      <ActionButton
        icon={pencil}
        action={() => onEdit(row)}
        disabled={disableEdit}
        title={editTooltip}
        className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-400"
      />
    ) : null}
    {onDelete ? (
      <ActionButton
        icon={trash}
        action={() => onDelete(row)}
        disabled={disableDelete}
        title={deleteTooltip}
        className="bg-red-500 hover:bg-red-600 disabled:bg-red-400"
      />
    ) : null}
  </div>
)

export default TableActions
