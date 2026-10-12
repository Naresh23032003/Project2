import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  /** Close when the dim backdrop is clicked. Off for dialogs that hold typed input. */
  dismissOnBackdrop?: boolean;
  children: React.ReactNode;
};

export function Modal({ open, onClose, labelledBy, className = 'modal', dismissOnBackdrop = true, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (dismissOnBackdrop && e.target === ref.current) onClose();
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
