import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';

/** The language preference is independent from game progress/session storage. */
export type Language = 'en' | 'bg' | 'de' | 'fr' | 'pl' | 'es';
export const LANGUAGE_STORAGE_KEY = 'casefiles-language';
export const languages: ReadonlyArray<{code:Language;label:string}> = [
  {code:'en',label:'English'},
  {code:'bg',label:'Български'},
  {code:'de',label:'Deutsch'},
  {code:'fr',label:'Français'},
  {code:'pl',label:'Polski'},
  {code:'es',label:'Español'}
];

/** The Bulgarian source phrase is the stable lookup key during incremental migration. */
const dictionary: Record<string, Partial<Record<Language,string>>> = {
  'Език':{en:'Language',de:'Sprache',fr:'Langue',pl:'Język',es:'Idioma'},
  'Избери език':{en:'Choose language',de:'Sprache wählen',fr:'Choisir la langue',pl:'Wybierz język',es:'Elegir idioma'},
  'Класически инструменти':{en:'Classic tools',de:'Klassische Werkzeuge',fr:'Outils classiques',pl:'Klasyczne narzędzia',es:'Herramientas clásicas'},
  'Истината е':{en:'The truth is',de:'Die Wahrheit steckt',fr:'La vérité est',pl:'Prawda tkwi',es:'La verdad está'},
  'в детайлите.':{en:'in the details.',de:'im Detail.',fr:'dans les détails.',pl:'w szczegółach.',es:'en los detalles.'},
  'Започни разследването':{en:'Start investigation',de:'Ermittlung starten',fr:"Commencer l'enquête",pl:'Rozpocznij śledztwo',es:'Iniciar investigación'},
  'Продължи':{en:'Continue',de:'Fortsetzen',fr:'Continuer',pl:'Kontynuuj',es:'Continuar'},
  'Продължи разследването':{en:'Continue investigation',de:'Ermittlung fortsetzen',fr:"Poursuivre l'enquête",pl:'Kontynuuj śledztwo',es:'Continuar investigación'},
  'Екипна игра / нови случаи':{en:'Co-op / new cases',de:'Koop / neue Fälle',fr:'Coop / nouvelles affaires',pl:'Kooperacja / nowe sprawy',es:'Cooperativo / nuevos casos'},
  'Избери случай':{en:'Choose a case',de:'Fall auswählen',fr:'Choisir une affaire',pl:'Wybierz sprawę',es:'Elegir caso'},
  'Настройки':{en:'Settings',de:'Einstellungen',fr:'Paramètres',pl:'Ustawienia',es:'Configuración'},
  'Разширен режим':{en:'Advanced mode',de:'Erweiterter Modus',fr:'Mode avancé',pl:'Tryb zaawansowany',es:'Modo avanzado'},
  'Избор на случай':{en:'Case selection',de:'Fallauswahl',fr:"Choix de l'affaire",pl:'Wybór sprawy',es:'Selección de caso'},
  'Пропускай сюжетните въведения':{en:'Skip story introductions',de:'Story-Intros überspringen',fr:'Ignorer les introductions',pl:'Pomiń wprowadzenia fabularne',es:'Omitir introducciones'},
  'Намалени анимации':{en:'Reduce animations',de:'Animationen reduzieren',fr:'Réduire les animations',pl:'Ogranicz animacje',es:'Reducir animaciones'},
  'Звукът е изключен по подразбиране и се включва само в игровия екран.':{en:'Sound is off by default and can be enabled during gameplay.',de:'Ton ist standardmäßig aus und kann während des Spiels aktiviert werden.',fr:"Le son est désactivé par défaut et peut être activé pendant le jeu.",pl:'Dźwięk jest domyślnie wyłączony; można go włączyć podczas gry.',es:'El sonido está desactivado por defecto y puede activarse durante el juego.'},
  'ДОСИЕТА / ПОВЕРИТЕЛНО':{en:'CASE FILES / CONFIDENTIAL',de:'AKTEN / VERTRAULICH',fr:'DOSSIERS / CONFIDENTIEL',pl:'AKTA / POUFNE',es:'EXPEDIENTES / CONFIDENCIAL'},
  'АКТИВНО ДОСИЕ':{en:'ACTIVE CASE',de:'AKTIVER FALL',fr:'AFFAIRE EN COURS',pl:'AKTYWNA SPRAWA',es:'CASO ACTIVO'},
  'ИЗБЕРИ':{en:'SELECT',de:'AUSWÄHLEN',fr:'CHOISIR',pl:'WYBIERZ',es:'ELEGIR'},
  'Две отделни истории. Без задължителен AI.':{en:'Two separate stories. No AI required.',de:'Zwei eigenständige Geschichten. Keine KI erforderlich.',fr:'Deux histoires indépendantes. Aucune IA nécessaire.',pl:'Dwie osobne historie. AI nie jest wymagane.',es:'Dos historias independientes. Sin IA obligatoria.'},
  'СОФИЯ':{en:'SOFIA',de:'SOFIA',fr:'SOFIA',pl:'SOFIA',es:'SOFÍA'},
  'ПЛОВДИВ':{en:'PLOVDIV',de:'PLOVDIV',fr:'PLOVDIV',pl:'PŁOWDIW',es:'PLOVDIV'},
  'Последното обаждане':{en:'The Last Call',de:'Der letzte Anruf',fr:'Le dernier appel',pl:'Ostatni telefon',es:'La última llamada'},
  'Изчезналият архив':{en:'The Missing Archive',de:'Das verschwundene Archiv',fr:"L'archive disparue",pl:'Zaginione archiwum',es:'El archivo desaparecido'},
  'Трима заподозрени. Един последен разговор. Нощ, в която времето има значение.':{en:'Three suspects. One final call. A night when every minute matters.',de:'Drei Verdächtige. Ein letzter Anruf. Eine Nacht, in der jede Minute zählt.',fr:'Trois suspects. Un dernier appel. Une nuit où chaque minute compte.',pl:'Trzech podejrzanych. Ostatnia rozmowa. Noc, w której liczy się każda minuta.',es:'Tres sospechosos. Una última llamada. Una noche en la que cada minuto cuenta.'},
  'Един изчезнал договор. Един прекъснат регистър. Шест следи към истината.':{en:'A missing contract. An interrupted registry. Six clues leading to the truth.',de:'Ein verschwundener Vertrag. Ein unterbrochenes Register. Sechs Spuren zur Wahrheit.',fr:'Un contrat disparu. Un registre interrompu. Six indices vers la vérité.',pl:'Zaginiona umowa. Przerwany rejestr. Sześć tropów do prawdy.',es:'Un contrato desaparecido. Un registro interrumpido. Seis pistas hacia la verdad.'},
  'СОФИЯ / АПАРТАМЕНТ 407':{en:'SOFIA / APARTMENT 407',de:'SOFIA / WOHNUNG 407',fr:'SOFIA / APPARTEMENT 407',pl:'SOFIA / MIESZKANIE 407',es:'SOFÍA / APARTAMENTO 407'},
  'ПЛОВДИВ / ГРАДСКИ АРХИВ':{en:'PLOVDIV / CITY ARCHIVE',de:'PLOVDIV / STADTARCHIV',fr:'PLOVDIV / ARCHIVES MUNICIPALES',pl:'PŁOWDIW / ARCHIWUM MIEJSKIE',es:'PLOVDIV / ARCHIVO MUNICIPAL'},
  'УБИЙСТВО · 14 OCT':{en:'HOMICIDE · 14 OCT',de:'MORD · 14. OKT',fr:'HOMICIDE · 14 OCT',pl:'ZABÓJSTWO · 14 PAŹ',es:'HOMICIDIO · 14 OCT'},
  'ИЗЧЕЗНАЛ ДОКУМЕНТ · 23:47':{en:'MISSING DOCUMENT · 23:47',de:'VERSCHWUNDENES DOKUMENT · 23:47',fr:'DOCUMENT DISPARU · 23:47',pl:'ZAGINIONY DOKUMENT · 23:47',es:'DOCUMENTO DESAPARECIDO · 23:47'},
  'Главно меню':{en:'Main menu',de:'Hauptmenü',fr:'Menu principal',pl:'Menu główne',es:'Menú principal'},
  'Главно меню 1.0':{en:'Main menu 1.0',de:'Hauptmenü 1.0',fr:'Menu principal 1.0',pl:'Menu główne 1.0',es:'Menú principal 1.0'},
  'Зареждане на общността...':{en:'Loading community...',de:'Community wird geladen...',fr:'Chargement de la communauté...',pl:'Ładowanie społeczności...',es:'Cargando comunidad...'},
  'Местопрестъпление':{en:'Crime scene',de:'Tatort',fr:'Scène de crime',pl:'Miejsce zbrodni',es:'Escena del crimen'},
  'Досие':{en:'Case file',de:'Fallakte',fr:'Dossier',pl:'Akta sprawy',es:'Expediente'},
  'Криминалистика':{en:'Forensics',de:'Forensik',fr:'Criminalistique',pl:'Kryminalistyka',es:'Criminalística'},
  'Разпити':{en:'Interrogations',de:'Verhöre',fr:'Interrogatoires',pl:'Przesłuchania',es:'Interrogatorios'},
  'Телефон':{en:'Phone',de:'Telefon',fr:'Téléphone',pl:'Telefon',es:'Teléfono'},
  'Детективски режим':{en:'Detective mode',de:'Detektivmodus',fr:'Mode détective',pl:'Tryb detektywa',es:'Modo detective'},
  'Следствено бюро':{en:'Investigation desk',de:'Ermittlungsbüro',fr:"Bureau d'enquête",pl:'Biuro śledcze',es:'Despacho de investigación'},
  'Детективски свят':{en:'Detective world',de:'Detektivwelt',fr:'Univers du détective',pl:'Świat detektywa',es:'Mundo del detective'},
  'Финал':{en:'Finale',de:'Finale',fr:'Final',pl:'Finał',es:'Final'},
  'Детективски бележник':{en:'Detective notebook',de:'Notizbuch des Detektivs',fr:'Carnet du détective',pl:'Notatnik detektywa',es:'Cuaderno del detective'},
  'Заподозрени':{en:'Suspects',de:'Verdächtige',fr:'Suspects',pl:'Podejrzani',es:'Sospechosos'},
  'Алибита':{en:'Alibis',de:'Alibis',fr:'Alibis',pl:'Alibi',es:'Coartadas'},
  'Алибита и противоречия':{en:'Alibis and contradictions',de:'Alibis und Widersprüche',fr:'Alibis et contradictions',pl:'Alibi i sprzeczności',es:'Coartadas y contradicciones'},
  'Доказателства':{en:'Evidence',de:'Beweismittel',fr:'Preuves',pl:'Dowody',es:'Pruebas'},
  'Хронология':{en:'Timeline',de:'Zeitleiste',fr:'Chronologie',pl:'Chronologia',es:'Cronología'},
  'Обвинение':{en:'Accusation',de:'Anklage',fr:'Accusation',pl:'Oskarżenie',es:'Acusación'},
  'Доклад':{en:'Report',de:'Bericht',fr:'Rapport',pl:'Raport',es:'Informe'},
  'Общност на детективите':{en:'Detective community',de:'Detektiv-Community',fr:'Communauté de détectives',pl:'Społeczność detektywów',es:'Comunidad de detectives'},
  'Интерактивен град':{en:'Interactive city',de:'Interaktive Stadt',fr:'Ville interactive',pl:'Interaktywne miasto',es:'Ciudad interactiva'},
  'Партньор и задачи':{en:'Partner and assignments',de:'Partner und Aufgaben',fr:'Partenaire et missions',pl:'Partner i zadania',es:'Compañero y tareas'},
  'Живи заподозрени':{en:'Living suspects',de:'Lebendige Verdächtige',fr:'Suspects en mouvement',pl:'Żywi podejrzani',es:'Sospechosos en movimiento'},
  'Игрова навигация':{en:'Game navigation',de:'Spielnavigation',fr:'Navigation du jeu',pl:'Nawigacja w grze',es:'Navegación del juego'},
  'Включи звука':{en:'Enable sound',de:'Ton einschalten',fr:'Activer le son',pl:'Włącz dźwięk',es:'Activar sonido'},
  'Изключи звука':{en:'Mute sound',de:'Ton ausschalten',fr:'Désactiver le son',pl:'Wyłącz dźwięk',es:'Silenciar'},
  'НАПРЕДЪК ПО СЛУЧАЯ':{en:'CASE PROGRESS',de:'FALLFORTSCHRITT',fr:"PROGRESSION DE L'AFFAIRE",pl:'POSTĘP SPRAWY',es:'PROGRESO DEL CASO'},
  'РАЗСЛЕДВАНЕ':{en:'INVESTIGATION',de:'ERMITTLUNG',fr:'ENQUÊTE',pl:'ŚLEDZTWO',es:'INVESTIGACIÓN'},
  'СИСТЕМА ОНЛАЙН':{en:'SYSTEM ONLINE',de:'SYSTEM ONLINE',fr:'SYSTÈME EN LIGNE',pl:'SYSTEM ONLINE',es:'SISTEMA EN LÍNEA'},
  'ПОВЕРИТЕЛНО':{en:'CONFIDENTIAL',de:'VERTRAULICH',fr:'CONFIDENTIEL',pl:'POUFNE',es:'CONFIDENCIAL'},
  'Няма':{en:'None',de:'Keine',fr:'Aucun',pl:'Brak',es:'Ninguno'},
  'Активна':{en:'Active',de:'Aktiv',fr:'Active',pl:'Aktywna',es:'Activa'}
};

export function resolveLanguage(value:unknown):Language {
  return languages.some(l=>l.code===value)?value as Language:'en';
}
export function translate(source:string,language:Language):string {
  return language==='bg'?source:dictionary[source]?.[language]||source;
}

type LanguageContextValue={language:Language;setLanguage:(language:Language)=>void;t:(source:string)=>string};
const LanguageContext=createContext<LanguageContextValue|null>(null);

export function LanguageProvider({children}:{children:ReactNode}){
  const [language,updateLanguage]=useState<Language>(()=>{
    try{return resolveLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)??import.meta.env.VITE_DEFAULT_LANGUAGE);}catch{return 'en';}
  });
  const setLanguage=(next:Language)=>{
    const safe=resolveLanguage(next);
    updateLanguage(safe);
    try{window.localStorage.setItem(LANGUAGE_STORAGE_KEY,safe);}catch{}
  };
  useEffect(()=>{
    document.documentElement.lang=language;
    document.title='CASEFILES — '+translate('Последното обаждане',language);
    const meta=document.querySelector('meta[name="description"]');
    if(meta)meta.setAttribute('content',language==='bg'
      ?'CASEFILES — криминална детективска игра. Разследвай и открий истината.'
      :'CASEFILES — detective mystery game. Investigate, collect clues and uncover the truth.');
  },[language]);
  const value=useMemo(()=>({language,setLanguage,t:(source:string)=>translate(source,language)}),[language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage():LanguageContextValue {
  const value=useContext(LanguageContext);
  if(!value)throw Error('LanguageProvider is missing');
  return value;
}

export function LanguageSelector({className}:{className?:string}){
  const {language,setLanguage,t}=useLanguage();
  return <label className={'cf-language-selector '+(className||'')}>
    <span>{t('Език')}</span>
    <select aria-label={t('Избери език')} value={language} onChange={event=>setLanguage(resolveLanguage(event.target.value))}>
      {languages.map(option=><option key={option.code} value={option.code}>{option.label}</option>)}
    </select>
  </label>;
}
