import React, { createContext, useState, useContext } from 'react';

const UnsavedChangesContext = createContext();

export const UnsavedChangesProvider = ({ children }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedRoute, setUnsavedRoute] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        unsavedRoute,
        setUnsavedRoute,
        showUnsavedModal,
        setShowUnsavedModal,
      }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
};

export const useUnsavedChanges = () => useContext(UnsavedChangesContext);
