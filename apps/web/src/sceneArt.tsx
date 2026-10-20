import './sceneArt.css';
/** One registry for visible evidence and tappable hotspots across all case views.
 * Positions use % of the 1600×900 scene art, not the viewport.
 * A room with no matching foreground object must NOT show a generic floating pin.
 */
export const objectVisuals = {
 doormat:{asset:'doormat',room:'entrance',x:49,y:82,label:'Изтривалка'},
 bookshelf:{asset:'bookshelf',room:'living',x:20,y:44,label:'Библиотека'},
 lamp:{asset:'lamp',room:'living',x:76,y:65,label:'Работна лампа'},
 drawer:{asset:'drawer',room:'desk',x:76,y:72,label:'Заключено чекмедже'},
 papers:{asset:'papers',room:'desk',x:50,y:70,label:'Разпилени бележки'},
 safe:{asset:'safe',room:'desk',x:85,y:41,label:'Метална кутия'}
} as const;
export type ObjectVisualId=keyof typeof objectVisuals;
export const coreRoom={hall:'entrance',living:'living',study:'desk'} as const;
export const mainClueVisuals={
 E01:{room:'living',asset:'evidence',x:46,y:76},
 E03:{room:'living',asset:'phone',x:68,y:79},
 E04:{room:'desk',asset:'papers',x:51,y:75},
 E05:{room:'entrance',asset:'terminal',x:57,y:43},
 E08:{room:'entrance',asset:'safe',x:68,y:49},
 E02:{room:'medical',asset:'evidence',x:65,y:64}
} as const;
export const archiveClueVisuals={
 reading:{asset:'contract',x:50,y:77,clueId:'C1'},
 server:{asset:'terminal',x:54,y:49,clueId:'C2'},
 security:{asset:'logbook',x:59,y:75,clueId:'C3'},
 hall:{asset:'cctv',x:75,y:37,clueId:'C4'},
 lift:{asset:'cart',x:67,y:76,clueId:'C5'},
 studio:{asset:'contract',x:66,y:75,clueId:'C6'}
} as const;
export function visualForObject(id:string){return objectVisuals[id as ObjectVisualId]||null;}
export function visualForClue(id:string,room:string){
 const main=mainClueVisuals[id as keyof typeof mainClueVisuals];
 if(main&&main.room===room)return main;
 const archive=archiveClueVisuals[room as keyof typeof archiveClueVisuals];
 if(archive&&archive.clueId===id)return archive;
 return null;
}
export function objectAsset(asset:string){return '/art/objects/'+asset+'.svg';}
export function roomAsset(room:string){return '/art/rooms/'+room+'.svg';}
export function ObjectArt({asset,alt}:{asset:string;alt:string}){
 return <img className="cf-object-art" src={objectAsset(asset)} alt={alt} width={108} height={108} decoding="async" draggable={false}/>;
}
