import {useState} from 'react';
import AccessibleDialog from './AccessibleDialog';
export function useDiscardChanges(dirty:boolean){
 const [pending,setPending]=useState<(()=>void)|null>(null);
 return {protect(action:()=>void){if(dirty)setPending(()=>action);else action();},dialog:pending?<AccessibleDialog label="Kaydedilmemiş değişiklikler" onClose={()=>setPending(null)}><div className="p-6 space-y-4"><h3 className="text-lg font-bold">Kaydedilmemiş değişiklikler</h3><p className="text-sm text-slate-600">Devam ederseniz formdaki değişiklikler kaybolacak.</p><div className="flex gap-3 flex-wrap"><button autoFocus className="admin-button" onClick={()=>setPending(null)}>Düzenlemeye devam et</button><button className="admin-button admin-primary" onClick={()=>{const action=pending;setPending(null);action();}}>Değişikliklerden vazgeç</button></div></div></AccessibleDialog>:null};
}
