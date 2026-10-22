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

  'Общност':{en:'Community',de:'Community',fr:'Communauté',pl:'Społeczność',es:'Comunidad'},
  'Случаи':{en:'Cases',de:'Fälle',fr:'Affaires',pl:'Sprawy',es:'Casos'},
  'Екипно разследване':{en:'Co-op investigation',de:'Kooperative Ermittlung',fr:'Enquête coopérative',pl:'Śledztwo zespołowe',es:'Investigación cooperativa'},
  'Редактор':{en:'Editor',de:'Editor',fr:'Éditeur',pl:'Edytor',es:'Editor'},
  'Профил':{en:'Profile',de:'Profil',fr:'Profil',pl:'Profil',es:'Perfil'},
  'Затвори':{en:'Close',de:'Schließen',fr:'Fermer',pl:'Zamknij',es:'Cerrar'},
  'Започни разследване':{en:'Start an investigation',de:'Ermittlung starten',fr:"Lancer une enquête",pl:'Rozpocznij śledztwo',es:'Iniciar una investigación'},
  'Име на детектива':{en:'Detective name',de:'Name des Detektivs',fr:'Nom du détective',pl:'Imię detektywa',es:'Nombre del detective'},
  'Генерирай нов случай':{en:'Generate new case',de:'Neuen Fall generieren',fr:'Générer une affaire',pl:'Wygeneruj nową sprawę',es:'Generar nuevo caso'},
  'Присъедини се към приятели':{en:'Join friends',de:'Freunden beitreten',fr:'Rejoindre des amis',pl:'Dołącz do znajomych',es:'Unirse a amigos'},
  'Код на стая':{en:'Room code',de:'Raumcode',fr:'Code de salle',pl:'Kod pokoju',es:'Código de sala'},
  'НАПР. A1B2C3D4E5':{en:'E.G. A1B2C3D4E5',de:'Z. B. A1B2C3D4E5',fr:'EX. A1B2C3D4E5',pl:'NP. A1B2C3D4E5',es:'P. EJ. A1B2C3D4E5'},
  'Влез в разследването':{en:'Join investigation',de:'Ermittlung beitreten',fr:"Rejoindre l'enquête",pl:'Dołącz do śledztwa',es:'Unirse a la investigación'},
  'Истории от общността':{en:'Community stories',de:'Community-Geschichten',fr:'Histoires de la communauté',pl:'Historie społeczności',es:'Historias de la comunidad'},
  'Разследвай историята':{en:'Investigate story',de:'Geschichte untersuchen',fr:"Enquêter sur l'histoire",pl:'Zbadaj historię',es:'Investigar historia'},
  'Нямаш активна стая':{en:'No active room',de:'Kein aktiver Raum',fr:'Aucune salle active',pl:'Brak aktywnego pokoju',es:'No hay sala activa'},
  'Създай стая или въведи код за покана.':{en:'Create a room or enter an invitation code.',de:'Erstelle einen Raum oder gib einen Einladungscode ein.',fr:"Créez une salle ou saisissez un code d'invitation.",pl:'Utwórz pokój lub wpisz kod zaproszenia.',es:'Crea una sala o introduce un código de invitación.'},
  'КОД НА СТАЯТА:':{en:'ROOM CODE:',de:'RAUMCODE:',fr:'CODE DE SALLE :',pl:'KOD POKOJU:',es:'CÓDIGO DE SALA:'},
  'Копирай код':{en:'Copy code',de:'Code kopieren',fr:'Copier le code',pl:'Kopiuj kod',es:'Copiar código'},
  'Обнови':{en:'Refresh',de:'Aktualisieren',fr:'Actualiser',pl:'Odśwież',es:'Actualizar'},
  'Общи доказателства':{en:'Shared evidence',de:'Gemeinsame Beweise',fr:'Preuves partagées',pl:'Wspólne dowody',es:'Pruebas compartidas'},
  'Все още няма достъп до съдържанието.':{en:'The contents are not available yet.',de:'Der Inhalt ist noch nicht verfügbar.',fr:"Le contenu n'est pas encore disponible.",pl:'Treść nie jest jeszcze dostępna.',es:'El contenido aún no está disponible.'},
  'В досието':{en:'In case file',de:'In der Fallakte',fr:'Dans le dossier',pl:'W aktach',es:'En el expediente'},
  'Разгледай':{en:'Inspect',de:'Untersuchen',fr:'Examiner',pl:'Zbadaj',es:'Examinar'},
  'Изисква 2 начални улики':{en:'Requires 2 initial clues',de:'Benötigt 2 erste Hinweise',fr:'Nécessite 2 indices initiaux',pl:'Wymaga 2 początkowych tropów',es:'Requiere 2 pistas iniciales'},
  'Разпитай':{en:'Interrogate',de:'Verhören',fr:'Interroger',pl:'Przesłuchaj',es:'Interrogar'},
  'Разпитай след две открити улики.':{en:'Interrogate after discovering two clues.',de:'Verhöre nach dem Entdecken von zwei Hinweisen.',fr:'Interrogez après avoir découvert deux indices.',pl:'Przesłuchaj po znalezieniu dwóch tropów.',es:'Interroga tras descubrir dos pistas.'},
  'Финално обвинение':{en:'Final accusation',de:'Abschließende Anklage',fr:'Accusation finale',pl:'Ostateczne oskarżenie',es:'Acusación final'},
  'Заподозрян':{en:'Suspect',de:'Verdächtiger',fr:'Suspect',pl:'Podejrzany',es:'Sospechoso'},
  'Избери най-малко три ключови улики, за да защитиш обвинението.':{en:'Choose at least three key clues to support the accusation.',de:'Wähle mindestens drei entscheidende Hinweise für deine Anklage.',fr:"Sélectionnez au moins trois indices clés pour étayer l'accusation.",pl:'Wybierz co najmniej trzy kluczowe dowody, aby uzasadnić oskarżenie.',es:'Elige al menos tres pistas clave para respaldar la acusación.'},
  'Предай обвинението':{en:'Submit accusation',de:'Anklage einreichen',fr:"Déposer l'accusation",pl:'Złóż oskarżenie',es:'Presentar acusación'},
  'СЛУЧАЯТ Е РАЗКРИТ':{en:'CASE SOLVED',de:'FALL GELÖST',fr:'AFFAIRE RÉSOLUE',pl:'SPRAWA ROZWIĄZANA',es:'CASO RESUELTO'},
  'ОБВИНЕНИЕТО Е ОТХВЪРЛЕНО':{en:'ACCUSATION REJECTED',de:'ANKLAGE ABGEWIESEN',fr:'ACCUSATION REJETÉE',pl:'OSKARŻENIE ODRZUCONE',es:'ACUSACIÓN RECHAZADA'},
  'НЕДОСТАТЪЧНИ ДОКАЗАТЕЛСТВА':{en:'INSUFFICIENT EVIDENCE',de:'UNZUREICHENDE BEWEISE',fr:'PREUVES INSUFFISANTES',pl:'NIEWYSTARCZAJĄCE DOWODY',es:'PRUEBAS INSUFICIENTES'},
  'Разгледай още улики и провери версията си.':{en:'Find more clues and review your theory.',de:'Suche weitere Hinweise und prüfe deine Theorie.',fr:'Trouvez plus d’indices et revoyez votre hypothèse.',pl:'Znajdź więcej tropów i sprawdź swoją teorię.',es:'Busca más pistas y revisa tu teoría.'},
  'Разкрит от:':{en:'Solved by:',de:'Gelöst von:',fr:'Résolu par :',pl:'Rozwiązane przez:',es:'Resuelto por:'},
  'Постоянен детективски профил':{en:'Persistent detective profile',de:'Dauerhaftes Detektivprofil',fr:'Profil permanent du détective',pl:'Trwały profil detektywa',es:'Perfil de detective permanente'},
  'Ниво':{en:'Level',de:'Stufe',fr:'Niveau',pl:'Poziom',es:'Nivel'},
  'разрешени разследвания':{en:'solved cases',de:'gelöste Fälle',fr:'affaires résolues',pl:'rozwiązanych spraw',es:'casos resueltos'},
  'Първото ти постижение предстои.':{en:'Your first achievement is ahead.',de:'Deine erste Errungenschaft wartet noch.',fr:'Votre premier succès vous attend.',pl:'Pierwsze osiągnięcie jeszcze przed tobą.',es:'Tu primer logro está por llegar.'},
  'Псевдоним':{en:'Nickname',de:'Spitzname',fr:'Pseudo',pl:'Pseudonim',es:'Apodo'},
  'Създай профил':{en:'Create profile',de:'Profil erstellen',fr:'Créer un profil',pl:'Utwórz profil',es:'Crear perfil'},
  'Създай и публикувай своя история':{en:'Create and publish your story',de:'Eigene Geschichte erstellen und veröffentlichen',fr:'Créer et publier votre histoire',pl:'Utwórz i opublikuj historię',es:'Crea y publica tu historia'},
  'Заглавие':{en:'Title',de:'Titel',fr:'Titre',pl:'Tytuł',es:'Título'},
  'Място':{en:'Location',de:'Ort',fr:'Lieu',pl:'Miejsce',es:'Lugar'},
  'Начална история':{en:'Opening story',de:'Vorgeschichte',fr:'Histoire initiale',pl:'Historia początkowa',es:'Historia inicial'},
  'Трима заподозрени':{en:'Three suspects',de:'Drei Verdächtige',fr:'Trois suspects',pl:'Trzech podejrzanych',es:'Tres sospechosos'},
  'Лице':{en:'Person',de:'Person',fr:'Personne',pl:'Osoba',es:'Persona'},
  'Име':{en:'Name',de:'Name',fr:'Nom',pl:'Imię',es:'Nombre'},
  'Алиби':{en:'Alibi',de:'Alibi',fr:'Alibi',pl:'Alibi',es:'Coartada'},
  'Пет доказателства':{en:'Five pieces of evidence',de:'Fünf Beweisstücke',fr:'Cinq preuves',pl:'Pięć dowodów',es:'Cinco pruebas'},
  'Какво разкрива':{en:'What it reveals',de:'Was es enthüllt',fr:'Ce que cela révèle',pl:'Co ujawnia',es:'Qué revela'},
  'Авторско решение (скрито до развръзката)':{en:'Author solution (hidden until the ending)',de:'Lösung des Autors (bis zum Ende verborgen)',fr:"Solution de l'auteur (masquée jusqu'à la fin)",pl:'Rozwiązanie autora (ukryte do finału)',es:'Solución del autor (oculta hasta el final)'},
  'Извършител':{en:'Culprit',de:'Täter',fr:'Coupable',pl:'Sprawca',es:'Culpable'},
  'Развръзка':{en:'Resolution',de:'Auflösung',fr:'Dénouement',pl:'Rozwiązanie',es:'Desenlace'},
  'Публикувай в общността':{en:'Publish to community',de:'In der Community veröffentlichen',fr:'Publier dans la communauté',pl:'Opublikuj w społeczności',es:'Publicar en la comunidad'},
  'Автор:':{en:'Author:',de:'Autor:',fr:'Auteur :',pl:'Autor:',es:'Autor:'},
  'улики':{en:'clues',de:'Hinweise',fr:'indices',pl:'tropy',es:'pistas'},
  'Стаята има код за покана и поддържа до шестима детективи. Прогресът по уликите е общ.':{en:'Each room has an invitation code and supports up to six detectives. Clue progress is shared.',de:'Jeder Raum hat einen Einladungscode und bietet Platz für bis zu sechs Detektive. Der Hinweisfortschritt wird geteilt.',fr:"Chaque salle possède un code d'invitation et accueille jusqu'à six détectives. Les indices sont partagés.",pl:'Każdy pokój ma kod zaproszenia i mieści do sześciu detektywów. Postępy w zbieraniu wskazówek są wspólne.',es:'Cada sala tiene un código de invitación y admite hasta seis detectives. El progreso de pistas es compartido.'},
  'Разследвай с приятели, генерирай нов случай, публикувай собствена мистерия и трупай XP.':{en:'Investigate with friends, generate cases, publish mysteries and earn XP.',de:'Ermittle mit Freunden, generiere Fälle, veröffentliche Rätsel und sammle XP.',fr:'Enquêtez entre amis, générez des affaires, publiez des mystères et gagnez des XP.',pl:'Prowadź śledztwa ze znajomymi, twórz sprawy, publikuj zagadki i zdobywaj XP.',es:'Investiga con amigos, genera casos, publica misterios y gana XP.'},
  'Още няма публикувани истории. Създай първата от раздел „Редактор“.':{en:'No published stories yet. Create the first one in the Editor tab.',de:'Noch keine veröffentlichten Geschichten. Erstelle die erste im Editor.',fr:"Aucune histoire publiée. Créez la première dans l'éditeur.",pl:'Brak opublikowanych historii. Utwórz pierwszą w edytorze.',es:'Aún no hay historias publicadas. Crea la primera en el editor.'},
  'Само измислени случаи. Публикуваните сценарии са достъпни за други играчи — не въвеждай истински лични данни.':{en:'Fictional cases only. Published stories are visible to other players — do not enter real personal information.',de:'Nur fiktive Fälle. Veröffentlichte Geschichten sind für andere sichtbar – keine echten persönlichen Daten eingeben.',fr:"Affaires fictives uniquement. Les récits publiés sont visibles par d'autres joueurs : ne saisissez pas de données personnelles réelles.",pl:'Tylko fikcyjne sprawy. Opublikowane historie widzą inni gracze — nie podawaj prawdziwych danych osobowych.',es:'Solo casos ficticios. Otros jugadores verán las historias publicadas; no introduzcas datos personales reales.'},
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
