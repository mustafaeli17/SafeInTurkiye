import {useId, useRef, useState} from 'react'
import {Copy, Languages, X} from 'lucide-react'
import {hotelArrivalCopy} from '../lib/hotelArrivalCopy'
import './HotelArrival.css'

const copyLabels: Record<string, readonly [string, string, string]> = {
  en: ['Copy address', 'Address copied', 'Select the address to copy it manually.'],
  tr: ['Adresi kopyala', 'Adres kopyalandı', 'Adresi seçip elle kopyalayabilirsiniz.'],
  de: ['Adresse kopieren', 'Adresse kopiert', 'Wählen Sie die Adresse aus, um sie zu kopieren.'],
  fr: ['Copier l’adresse', 'Adresse copiée', 'Sélectionnez l’adresse pour la copier.'],
  es: ['Copiar dirección', 'Dirección copiada', 'Selecciona la dirección para copiarla.'],
  ru: ['Скопировать адрес', 'Адрес скопирован', 'Выделите адрес и скопируйте его.'],
  ar: ['نسخ العنوان', 'تم نسخ العنوان', 'حدّد العنوان لنسخه يدويًا.'],
  zh: ['复制地址', '地址已复制', '请选择地址并手动复制。'],
}

type Props = {name: string | null; address?: string | null; lang: string; google?: boolean}

export default function HotelAddressCard({name, address, lang, google}: Props) {
  const title = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const addressBlock = useRef<HTMLDivElement>(null)
  const [notice,setNotice] = useState('')
  const t = hotelArrivalCopy[lang] ?? hotelArrivalCopy.en
  const [copy, copied, manual] = copyLabels[lang] ?? copyLabels.en
  if (!name?.trim() || !address?.trim()) return null

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(`${name}\n${address}`)
      setNotice(copied)
    } catch {
      const selection = window.getSelection()
      if (selection && addressBlock.current) {
        const range = document.createRange()
        range.selectNodeContents(addressBlock.current)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      setNotice(manual)
    }
  }

  return <>
    <button type="button" className="arrival-driver" aria-haspopup="dialog" onClick={()=>{
      setNotice('')
      dialog.current?.showModal()
    }}><Languages size={17} aria-hidden="true"/>{t.driver}</button>
    <dialog ref={dialog} aria-labelledby={title} className="arrival-dialog" dir={lang==='ar'?'rtl':undefined}>
      <header><h2 id={title}>{t.driver}</h2><button type="button" aria-label={t.close} onClick={()=>dialog.current?.close()}><X size={24} aria-hidden="true"/></button></header>
      <p>{t.driverHint}</p>
      <div className="arrival-driver-address" dir="ltr">
        <p lang="tr">Lütfen beni bu otele götürür müsünüz?</p>
        <div ref={addressBlock}><strong dir="auto">{name}</strong><address dir="auto">{address}</address></div>
      </div>
      {google && <small dir="ltr" translate="no">Google Maps</small>}
      <div className="arrival-clipboard">
        <button type="button" className="arrival-driver" onClick={copyAddress}><Copy size={16} aria-hidden="true"/>{copy}</button>
        <span role="status">{notice}</span>
      </div>
    </dialog>
  </>
}
