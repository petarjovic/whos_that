import ReactModal from "react-modal";

const ModalLayout = ({
    isOpen,
    classNames,
    handleClose,
    children,
}: {
    isOpen: boolean;
    classNames: string;
    handleClose: () => void;
    children: React.ReactNode;
}) => {
    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={handleClose}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mx-auto  h-fit max-h-[90vh] w-[97%]   border-2 border-neutral-300 rounded bg-neutral-200 px-6 py-6 shadow-lg inset-shadow-sm/15 inset-shadow-white ${classNames}`}
            overlayClassName="fixed inset-0 z-99 bg-zinc-900/70"
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
        >
            {children}
        </ReactModal>
    );
};
export default ModalLayout;
