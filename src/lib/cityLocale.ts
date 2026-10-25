import originals from '../data/citiesTr.json';
const copy:Record<string,Record<string,string[]>>={
 de:{
 'İstanbul':['Geschichte, Fähren und Kultur zwischen zwei Kontinenten','Planen Sie Zeit für den Besuch der historischen Halbinsel und mögliche Warteschlangen ein.','Nehmen Sie sich einen halben Tag für Palast, Gärten und Sammlungen.','Eine aussichtsreiche Fahrt zwischen der europäischen und asiatischen Seite.'],
 'Ankara':['Museen, historische Straßen und Parks in der Hauptstadt','Prüfen Sie vor dem Besuch die Öffnungszeiten der Gedenkstätte und des Museums.','Archäologische Sammlungen in der Nähe der Burg von Ankara.','Historische Straßen und Ausblicke auf die Stadt.'],
 'Antalya':['Mittelmeerküste, Wasserfälle und historisches Erbe','Prüfen Sie vor der Anreise die offiziellen Besuchsinformationen.','Altstadtgassen, Hafenblick und Spuren der Römerzeit.','Entdecken Sie Wasserfälle und Küstenlandschaften.'],
 'Cappadocia':['Feenkamine, Täler und Ballons bei Sonnenaufgang','Felsenkirchen und Fresken; prüfen Sie die Besuchszeiten.','Planen Sie Wanderungen vor der Mittagshitze und nehmen Sie Wasser mit.','Weite Ausblicke über die umliegenden Täler.'],
 'İzmir':['Ägäische Brise, Kordon und lebendige Basarstraßen','Römische Ruinen neben dem historischen Basarviertel.','Lebhafte Gassen für lokale Küche, Handwerk und Einkäufe.','Spaziergänge am Ufer und Fähren über die Bucht.']},
 fr:{
 'İstanbul':['Histoire, ferries et culture entre deux continents','Prévoyez du temps pour la péninsule historique et les files d’attente.','Réservez une demi-journée au palais, aux jardins et aux collections.','Une traversée panoramique entre les rives européenne et asiatique.'],
 'Ankara':['Musées, rues historiques et parcs dans la capitale','Vérifiez les horaires du mémorial et du musée avant la visite.','Des collections archéologiques près du château d’Ankara.','Des rues historiques et des panoramas sur la ville.'],
 'Antalya':['Littoral méditerranéen, cascades et patrimoine historique','Consultez les informations officielles avant la visite.','Ruelles de la vieille ville, vues sur le port et vestiges romains.','Découvrez les cascades et les paysages côtiers.'],
 'Cappadocia':['Cheminées de fées, vallées et ballons au lever du soleil','Églises rupestres et fresques ; vérifiez les horaires de visite.','Marchez avant les fortes chaleurs de midi et emportez de l’eau.','De larges panoramas sur les vallées environnantes.'],
 'İzmir':['Brise égéenne, Kordon et ruelles animées du bazar','Vestiges romains près du quartier historique du bazar.','Des rues animées pour la cuisine locale, l’artisanat et les achats.','Promenades au bord de l’eau et traversées de la baie en ferry.']},
 ar:{
 'İstanbul':['تاريخ وعبّارات وثقافة بين قارتين','خصص وقتًا لزيارة شبه الجزيرة التاريخية واحتمال الانتظار في الطوابير.','خصص نصف يوم للقصر والحدائق والمجموعات المتحفية.','رحلة ذات إطلالات جميلة بين الجانبين الأوروبي والآسيوي.'],
 'Ankara':['متاحف وشوارع تاريخية وحدائق في العاصمة','تحقق من ساعات زيارة النصب والمتحف قبل الذهاب.','مجموعات أثرية قرب قلعة أنقرة.','شوارع تاريخية وإطلالات على المدينة.'],
 'Antalya':['سواحل المتوسط وشلالات وتراث تاريخي','تحقق من معلومات الزيارة الرسمية قبل الذهاب.','أزقة البلدة القديمة وإطلالات الميناء وآثار العصر الروماني.','استكشف الشلالات والمناظر الساحلية.'],
 'Cappadocia':['مداخن الجنيات والوديان والمناطيد عند الشروق','كنائس منحوتة في الصخر ولوحات جدارية؛ تحقق من ساعات الزيارة.','خطط للمشي قبل حر الظهيرة وخذ معك الماء.','إطلالات واسعة على الوديان المحيطة.'],
 'İzmir':['نسيم إيجة والكورنيش وأزقة السوق النابضة بالحياة','آثار رومانية بجوار منطقة السوق التاريخي.','شوارع حيوية للمأكولات المحلية والحرف والتسوق.','المشي على الساحل والتنقل بالعبّارة عبر الخليج.']},
 ru:{
 'İstanbul':['История, паромы и культура между двумя континентами','Выделите время на исторический полуостров и возможные очереди.','Отведите полдня на дворец, сады и музейные коллекции.','Живописная поездка между европейской и азиатской сторонами.'],
 'Ankara':['Музеи, исторические улицы и парки столицы','Уточните часы посещения мемориала и музея перед поездкой.','Археологические коллекции рядом с крепостью Анкары.','Исторические улицы и виды на город.'],
 'Antalya':['Средиземноморское побережье, водопады и историческое наследие','Перед посещением проверьте официальную информацию.','Улицы старого города, виды на гавань и следы римской эпохи.','Откройте для себя водопады и прибрежные пейзажи.'],
 'Cappadocia':['Скальные образования, долины и воздушные шары на рассвете','Скальные церкви и фрески; уточняйте часы посещения.','Планируйте прогулки до полуденной жары и берите воду.','Широкие панорамы окрестных долин.'],
 'İzmir':['Эгейский бриз, набережная Кордон и оживлённые базары','Римские руины рядом с историческим базарным кварталом.','Местная кухня, ремёсла и покупки на оживлённых улицах.','Прогулки по набережной и паромы через залив.']}
};
export function cityLocale(city:string,lang:string){const row=copy[lang]?.[city],original=originals[city as keyof typeof originals];return row&&original?{tagline:row[0],highlights:original.highlights.map((h,i)=>({name:h.name,detail:row[i+1]}))}:{};}
export function cityDisplayName(city:string,lang:string){return city.startsWith('Cappadocia')?({tr:'Kapadokya',en:'Cappadocia',de:'Kappadokien',fr:'Cappadoce',es:'Capadocia',ar:'كابادوكيا',ru:'Каппадокия',zh:'卡帕多奇亚'}[lang]??city):city;}
