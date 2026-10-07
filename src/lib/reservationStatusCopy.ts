// All visitor-facing request history states share the existing seven locales.
export const reservationStatusCopy: Record<string, readonly string[]> = {
  en: ['My reservation requests', 'Refresh', 'No requests yet.', 'Sign in to see your requests.', 'Requests could not be loaded. Please try again.', 'Pending', 'Restaurant contacted', 'Confirmed', 'Declined', 'Cancelled'],
  tr: ['Rezervasyon taleplerim', 'Yenile', 'Henüz talebiniz yok.', 'Taleplerinizi görmek için giriş yapın.', 'Talepler yüklenemedi. Lütfen tekrar deneyin.', 'Bekliyor', 'Restoranla görüşüldü', 'Onaylandı', 'Reddedildi', 'İptal edildi'],
  de: ['Meine Reservierungsanfragen', 'Aktualisieren', 'Noch keine Anfragen.', 'Melden Sie sich an, um Ihre Anfragen zu sehen.', 'Anfragen konnten nicht geladen werden. Bitte versuchen Sie es erneut.', 'Ausstehend', 'Restaurant kontaktiert', 'Bestätigt', 'Abgelehnt', 'Storniert'],
  fr: ['Mes demandes de réservation', 'Actualiser', 'Aucune demande pour le moment.', 'Connectez-vous pour voir vos demandes.', 'Impossible de charger les demandes. Réessayez.', 'En attente', 'Restaurant contacté', 'Confirmée', 'Refusée', 'Annulée'],
  ar: ['طلبات الحجز الخاصة بي', 'تحديث', 'لا توجد طلبات بعد.', 'سجّل الدخول لعرض طلباتك.', 'تعذر تحميل الطلبات. يرجى المحاولة مجددًا.', 'قيد الانتظار', 'تم التواصل مع المطعم', 'مؤكد', 'مرفوض', 'ملغى'],
  ru: ['Мои заявки на бронирование', 'Обновить', 'Заявок пока нет.', 'Войдите, чтобы увидеть свои заявки.', 'Не удалось загрузить заявки. Попробуйте ещё раз.', 'Ожидает обработки', 'Ресторану позвонили', 'Подтверждено', 'Отклонено', 'Отменено'],
  zh: ['我的预订申请', '刷新', '暂无申请。', '请登录以查看您的申请。', '无法加载申请，请重试。', '待处理', '已联系餐厅', '已确认', '已拒绝', '已取消'],
}
export function reservationStatusIndex(status: string, contactStage?: string) {
  if (status === 'CONFIRMED') return 7
  if (status === 'REJECTED') return 8
  if (status === 'CANCELLED') return 9
  return contactStage === 'CONTACTED' ? 6 : 5
}
