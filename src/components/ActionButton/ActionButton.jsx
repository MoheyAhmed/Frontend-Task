const ActionButton = ({ icon, action, className = '', disabled = false, title }) => (
  <button
    type="button"
    onClick={action}
    disabled={disabled}
    title={title}
    className={`grid h-10 w-10 place-items-center rounded bg-main text-white transition hover:bg-main/90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
  >
    <img src={icon} alt="Action" className="h-4 w-4" />
  </button>
)

export default ActionButton