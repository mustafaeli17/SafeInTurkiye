import type {SearchLanguage} from './searchLocales';
export const navigationUi:Record<SearchLanguage,[string,string]>={
 en:['Open menu','Close menu'],tr:['Menüyü aç','Menüyü kapat'],de:['Menü öffnen','Menü schließen'],fr:['Ouvrir le menu','Fermer le menu'],es:['Abrir menú','Cerrar menú'],ar:['فتح القائمة','إغلاق القائمة'],ru:['Открыть меню','Закрыть меню'],zh:['打开菜单','关闭菜单'],
};
export const headerLabels:Record<SearchLanguage,[language:string,skip:string]>={
 en:['Language','Skip to content'], tr:['Dil','İçeriğe geç'], de:['Sprache','Zum Inhalt springen'],
 fr:['Langue','Aller au contenu'], es:['Idioma','Saltar al contenido'], ar:['اللغة','انتقل إلى المحتوى'],
 ru:['Язык','Перейти к содержимому'], zh:['语言','跳到主要内容'],
};
