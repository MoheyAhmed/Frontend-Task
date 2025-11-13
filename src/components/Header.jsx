import Searchbar from './Searchbar'

const Header = ({
  addNew,
  title,
  buttonTitle,
  onSearchChange,
  searchValue,
  searchPlaceholder = 'Search...',
  hideSearch = false,
  actionDisabled = false,
  actionTooltip = '',
}) => {
  const label = buttonTitle ?? `Add New ${(title ?? '').split(' ')[0] ?? ''}`.trim()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <h1 className="text-lg font-semibold text-slate-800">{title || 'List'}</h1>
        {!hideSearch ? (
          <Searchbar value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
        ) : null}
      </div>
      {addNew ? (
        <button
          type="button"
          onClick={addNew}
          disabled={actionDisabled}
          title={actionTooltip}
          className="inline-flex w-full items-center justify-center rounded bg-main px-4 py-2 text-sm font-medium text-white transition hover:bg-main/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto"
        >
          {label}
        </button>
      ) : null}
    </div>
  )
}

export default Header
