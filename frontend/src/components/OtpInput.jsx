import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

export default forwardRef(function OtpInput({ length = 6, value, onChange, disabled = false, autoFocus = false }, ref) {
  const [digits, setDigits] = useState(Array.from({ length }, (_, i) => value?.[i] || ''))
  const refs = useRef(Array.from({ length }, () => React.createRef()))

  useEffect(() => {
    const arr = Array.from({ length }, (_, i) => value?.[i] || '')
    setDigits(arr)
  }, [value, length])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.current?.focus()
  }, [autoFocus])

  useImperativeHandle(ref, () => ({
    focusFirst: () => refs.current[0]?.current?.focus(),
  }))

  function commit(newDigits) {
    const joined = newDigits.join('')
    onChange?.(joined)
  }

  function handleChange(i, e) {
    const raw = e.target.value
    // Allow paste of full code
    if (raw && raw.length > 1) {
      const onlyNums = raw.replace(/\D/g, '').slice(0, length)
      const arr = Array.from({ length }, (_, k) => onlyNums[k] || '')
      setDigits(arr)
      commit(arr)
      const nextIndex = Math.min(onlyNums.length, length - 1)
      refs.current[nextIndex]?.current?.focus()
      return
    }
    const ch = raw.replace(/\D/g, '').slice(0, 1)
    const next = [...digits]
    next[i] = ch
    setDigits(next)
    commit(next)
    if (ch && i < length - 1) refs.current[i + 1]?.current?.focus()
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (next[i]) {
        next[i] = ''
        setDigits(next)
        commit(next)
      } else if (i > 0) {
        refs.current[i - 1]?.current?.focus()
        const prev = [...digits]
        prev[i - 1] = ''
        setDigits(prev)
        commit(prev)
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.current?.focus()
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.current?.focus()
    }
  }

  return (
    <div className="otp">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={refs.current[i]}
          className="otp-box"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i]}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
        />
      ))}
    </div>
  )
})