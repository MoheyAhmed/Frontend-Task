// Modal component with two action buttons

import React from 'react'

const Modal = ({
  show,
  title,
  save,
  cancel,
  children,
  confirmLabel = 'Submit',
  cancelLabel = 'Cancel',
  disableSave = false,
  disableCancel = false,
}) => {
    return (
        <div className={`fixed inset-0 flex items-center justify-center bg-black/30 bg-opacity-50 ${show ? '' : 'hidden'}`}>
            <div className="bg-white rounded-xl shadow-lg w-xl overflow-hidden">
                <h2 className="text-lg  mb-4 bg-main text-white  p-4">{title}</h2>
                <div className='flex flex-col items-center justify-center w-full p-4 font-light'> 

               {children}
               </div>
                <div className="flex justify-end space-x-4 p-4 font-light">
                    
                    <button
                        onClick={cancel}
                        disabled={disableCancel}
                        className="text-main border border-main bg-white px-3 py-1.5 rounded disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={save}
                        disabled={disableSave}
                        className="bg-main text-white px-3 py-1.5 rounded disabled:cursor-not-allowed disabled:bg-main/60"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Modal