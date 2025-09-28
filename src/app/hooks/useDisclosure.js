import { useState, useCallback } from 'react';

function useDisclosure({ defaultIsOpen = false } = {}) {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);
  
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return {
    isOpen,
    onOpen,
    onClose,
    onToggle
  };
}

export default useDisclosure;
