import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import searchIcon from '../assets/search.png'

const Searchbar = ({ value, onChange, placeholder = 'Search...' }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const isControlled = useMemo(() => typeof onChange === 'function', [onChange])
  const [internalValue, setInternalValue] = useState(
    isControlled ? value ?? '' : searchParams.get('search') ?? ''
  )

  useEffect(() => {
    if (isControlled) {
      setInternalValue(value ?? '')
    }
  }, [isControlled, value])

  useEffect(() => {
    if (!isControlled) {
      if (internalValue) {
        setSearchParams({ search: internalValue })
      } else {
        setSearchParams({})
      }
    }
  }, [internalValue, isControlled, setSearchParams])

  const handleChange = (event) => {
    if (isControlled) {
      onChange?.(event.target.value)
    } else {
      setInternalValue(event.target.value)
    }
  }

  return (
    <div className="flex items-center rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
      <img src={searchIcon} alt="Search" className="mr-2 h-4 w-4" />
      <input
        type="text"
        value={isControlled ? value ?? '' : internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  )
}

export default Searchbar
