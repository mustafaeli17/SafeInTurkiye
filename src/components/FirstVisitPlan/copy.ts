import type {SearchLanguage} from '../../lib/searchLocales';
import type {Landmark} from './plan';

const en = {
  walks: 'Suggested walks', stops: 'Your stops', addWalk: 'Add walk', find: 'Choose a restaurant',
  up: 'Move up', down: 'Move down', remove: 'Remove stop', clear: 'Clear plan', confirm: 'Clear all stops?', cancel: 'Cancel',
  local: 'Saved in this browser on this device.', empty: 'Add a walk or choose a restaurant to start your plan.',
  add: 'Add to day plan', view: 'View day plan', nickname: 'Your label (optional)', restaurant: 'Saved restaurant',
  error: 'Your browser could not save this change. Check that site storage is allowed and try again.',
  landmarks: {square: 'Sultanahmet Square', ayasofya: 'Hagia Sophia', karakoy: 'Karaköy', galata: 'Galata Tower', gate: 'Hadrian’s Gate', oldTown: 'Kaleiçi', harbour: 'Old Harbour'},
};
type PlanCopy = Omit<typeof en, 'landmarks'> & {landmarks: Record<Landmark, string>};
const copy: Record<SearchLanguage, PlanCopy> = {
  en,
  tr: {
    walks: 'Önerilen yürüyüşler', stops: 'Duraklarınız', addWalk: 'Yürüyüşü ekle', find: 'Restoran seç',
    up: 'Yukarı taşı', down: 'Aşağı taşı', remove: 'Durağı kaldır', clear: 'Planı sil', confirm: 'Tüm duraklar silinsin mi?', cancel: 'Vazgeç',
    local: 'Bu cihazdaki tarayıcıda saklanır.', empty: 'Planınıza bir yürüyüş ekleyin veya bir restoran seçin.',
    add: 'Gün planına ekle', view: 'Gün planını aç', nickname: 'Kendi etiketiniz (isteğe bağlı)', restaurant: 'Kaydedilen restoran',
    error: 'Tarayıcı değişikliği kaydedemedi. Site verilerini saklamaya izin verip tekrar deneyin.',
    landmarks: {square: 'Sultanahmet Meydanı', ayasofya: 'Ayasofya', karakoy: 'Karaköy', galata: 'Galata Kulesi', gate: 'Hadrian Kapısı', oldTown: 'Kaleiçi', harbour: 'Kaleiçi Yat Limanı'},
  },
  de: {
    walks: 'Vorgeschlagene Spaziergänge', stops: 'Ihre Stationen', addWalk: 'Spaziergang hinzufügen', find: 'Restaurant auswählen',
    up: 'Nach oben', down: 'Nach unten', remove: 'Station entfernen', clear: 'Plan löschen', confirm: 'Alle Stationen löschen?', cancel: 'Abbrechen',
    local: 'In diesem Browser auf diesem Gerät gespeichert.', empty: 'Fügen Sie einen Spaziergang hinzu oder wählen Sie ein Restaurant.',
    add: 'Zum Tagesplan hinzufügen', view: 'Tagesplan öffnen', nickname: 'Eigene Bezeichnung (optional)', restaurant: 'Gespeichertes Restaurant',
    error: 'Die Änderung konnte nicht gespeichert werden. Lassen Sie die Speicherung von Websitedaten zu und versuchen Sie es erneut.',
    landmarks: {square: 'Sultanahmet-Platz', ayasofya: 'Hagia Sophia', karakoy: 'Karaköy', galata: 'Galataturm', gate: 'Hadrianstor', oldTown: 'Kaleiçi', harbour: 'Alter Hafen'},
  },
  fr: {
    walks: 'Promenades suggérées', stops: 'Vos étapes', addWalk: 'Ajouter la promenade', find: 'Choisir un restaurant',
    up: 'Monter', down: 'Descendre', remove: 'Retirer l’étape', clear: 'Effacer le programme', confirm: 'Effacer toutes les étapes ?', cancel: 'Annuler',
    local: 'Enregistré dans ce navigateur, sur cet appareil.', empty: 'Ajoutez une promenade ou choisissez un restaurant pour commencer.',
    add: 'Ajouter à mon programme', view: 'Voir mon programme', nickname: 'Votre libellé (facultatif)', restaurant: 'Restaurant enregistré',
    error: 'La modification n’a pas pu être enregistrée. Autorisez le stockage des données du site et réessayez.',
    landmarks: {square: 'Place Sultanahmet', ayasofya: 'Sainte-Sophie', karakoy: 'Karaköy', galata: 'Tour de Galata', gate: 'Porte d’Hadrien', oldTown: 'Kaleiçi', harbour: 'Vieux port'},
  },
  es: {
    walks: 'Paseos sugeridos', stops: 'Tus paradas', addWalk: 'Añadir paseo', find: 'Elegir un restaurante',
    up: 'Subir', down: 'Bajar', remove: 'Quitar parada', clear: 'Borrar plan', confirm: '¿Borrar todas las paradas?', cancel: 'Cancelar',
    local: 'Se guarda en este navegador y dispositivo.', empty: 'Añade un paseo o elige un restaurante para comenzar tu plan.',
    add: 'Añadir al plan del día', view: 'Ver el plan del día', nickname: 'Tu etiqueta (opcional)', restaurant: 'Restaurante guardado',
    error: 'El navegador no ha podido guardar el cambio. Permite el almacenamiento de datos del sitio e inténtalo de nuevo.',
    landmarks: {square: 'Plaza de Sultanahmet', ayasofya: 'Santa Sofía', karakoy: 'Karaköy', galata: 'Torre de Gálata', gate: 'Puerta de Adriano', oldTown: 'Kaleiçi', harbour: 'Puerto antiguo'},
  },
  ar: {
    walks: 'جولات مشي مقترحة', stops: 'محطاتك', addWalk: 'أضف الجولة', find: 'اختر مطعمًا',
    up: 'نقل لأعلى', down: 'نقل لأسفل', remove: 'حذف المحطة', clear: 'مسح الخطة', confirm: 'هل تريد مسح جميع المحطات؟', cancel: 'إلغاء',
    local: 'تُحفظ الخطة في هذا المتصفح على هذا الجهاز.', empty: 'أضف جولة مشي أو اختر مطعمًا لبدء خطتك.',
    add: 'أضف إلى خطة يومي', view: 'عرض خطة يومي', nickname: 'تسمية من اختيارك (اختياري)', restaurant: 'مطعم محفوظ',
    error: 'تعذّر حفظ التغيير. اسمح بتخزين بيانات الموقع في المتصفح ثم أعد المحاولة.',
    landmarks: {square: 'ساحة السلطان أحمد', ayasofya: 'آيا صوفيا', karakoy: 'كاراكوي', galata: 'برج غلاطة', gate: 'بوابة هادريان', oldTown: 'كاليتشي', harbour: 'الميناء القديم'},
  },
  ru: {
    walks: 'Предложенные прогулки', stops: 'Ваши остановки', addWalk: 'Добавить прогулку', find: 'Выбрать ресторан',
    up: 'Переместить выше', down: 'Переместить ниже', remove: 'Убрать остановку', clear: 'Очистить план', confirm: 'Удалить все остановки?', cancel: 'Отмена',
    local: 'План сохраняется в этом браузере на этом устройстве.', empty: 'Добавьте прогулку или выберите ресторан, чтобы начать план.',
    add: 'Добавить в план на день', view: 'Открыть план на день', nickname: 'Ваша подпись (необязательно)', restaurant: 'Сохранённый ресторан',
    error: 'Не удалось сохранить изменение. Разрешите браузеру хранить данные сайта и попробуйте снова.',
    landmarks: {square: 'Площадь Султанахмет', ayasofya: 'Айя-София', karakoy: 'Каракёй', galata: 'Галатская башня', gate: 'Ворота Адриана', oldTown: 'Калеичи', harbour: 'Старая гавань'},
  },
  zh: {
    walks: '推荐步行路线', stops: '我的行程站点', addWalk: '添加步行路线', find: '选择餐厅',
    up: '上移', down: '下移', remove: '移除站点', clear: '清空行程', confirm: '清空所有站点？', cancel: '取消',
    local: '行程保存在此设备的当前浏览器中。', empty: '添加步行路线或选择一家餐厅，开始规划行程。',
    add: '添加到一日行程', view: '查看一日行程', nickname: '自定义标签（可选）', restaurant: '已保存的餐厅',
    error: '浏览器无法保存更改。请允许此网站存储数据，然后重试。',
    landmarks: {square: '苏丹艾哈迈德广场', ayasofya: '圣索菲亚大清真寺', karakoy: '卡拉柯伊', galata: '加拉塔塔', gate: '哈德良门', oldTown: '卡莱伊奇老城', harbour: '老港口'},
  },
};
export const dayPlanCopy = (lang: string) => copy[lang as SearchLanguage] ?? en;
