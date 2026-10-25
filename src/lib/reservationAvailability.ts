// Enable only after approved migration, mail configuration and delivery verification.
// The server performs a separate readiness check; a UI flag alone cannot open intake.
export const restaurantRequestsEnabled=import.meta.env.VITE_RESTAURANT_REQUESTS==='true';
export const reservationUnavailable:Record<string,string>={
 tr:'Rezervasyon talebi hizmetimiz henüz açık değil. Rezervasyon için işletmenin telefonunu veya resmî web sitesini kullanın.',
 en:'Our reservation request service is not available yet. Please contact the business by phone or through its official website to book.',
 de:'Unser Reservierungsservice ist noch nicht verfügbar. Reservieren Sie bitte telefonisch oder über die offizielle Website des Betriebs.',
 fr:'Notre service de demande de réservation n’est pas encore disponible. Contactez l’établissement par téléphone ou sur son site officiel.',
 es:'Nuestro servicio de solicitudes de reserva aún no está disponible. Reserva por teléfono o en la web oficial del establecimiento.',
 ar:'خدمة طلب الحجز لدينا غير متاحة بعد. للحجز، تواصل مع المنشأة عبر الهاتف أو موقعها الرسمي.',
 ru:'Наш сервис заявок на бронирование пока недоступен. Свяжитесь с заведением по телефону или через его официальный сайт.',
 zh:'我们的预约申请服务暂未开放。请通过商家的电话或官方网站预订。'
};
