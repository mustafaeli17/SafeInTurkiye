import {useEffect,useRef,type ReactNode} from 'react';
export default function AccessibleDialog({label,onClose,children}:{label:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const dialog=ref.current!;const overflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';return()=>{dialog.close();document.body.style.overflow=overflow;previous?.focus();};},[]);
 return <dialog aria-label={label} ref={ref} onCancel={event=>{event.preventDefault();onClose();}} className="m-auto w-[calc(100%-2rem)] max-w-sm max-h-[90dvh] overflow-y-auto rounded-3xl border-0 p-0 backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm">{children}</dialog>;
}
