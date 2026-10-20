import {describe,it,expect} from 'vitest';
import {randomTemplate,roomView,applyRoomAction} from './community.js';
import {case002,caseTemplateSchema} from './living.js';

describe('CASEFILES community 0.5 expansion',()=>{
  it('builds valid and varied deterministic procedural cases',()=>{
    const templates=Array.from({length:40},(_,i)=>randomTemplate(i+17));
    templates.forEach(t=>{
      expect(caseTemplateSchema.safeParse(t).success).toBe(true);
      expect(t.suspects).toHaveLength(3);
      expect(t.clues).toHaveLength(6);
      expect(t.solution.clueIds).toHaveLength(3);
    });
    expect(new Set(templates.map(t=>t.solution.suspectId+t.setting)).size).toBeGreaterThan(3);
    expect(randomTemplate(42)).toEqual(randomTemplate(42));
  });
  function fixture(){
    return {
      id:'AAAABBBBCC',kind:'case-002' as const,storyId:null,story:case002,
      players:[{token:'member-a',name:'Ани',joinedAt:'2026-10-20'}],
      found:[] as string[],interviews:[] as string[],attempts:0,
      verdict:null as 'solved'|'incorrect'|'insufficient'|null,solvedBy:null as string|null,
      createdAt:'2026-10-20',updatedAt:'2026-10-20'
    };
  }
  it('never exposes the hidden solution or undiscovered clue details',()=>{
    const room=fixture();
    const view=roomView(room);
    expect(JSON.stringify(view)).not.toContain('solution');
    expect(JSON.stringify(view)).not.toContain('member-a');
    expect(view.clues.every(c=>c.description===null)).toBe(true);
    expect(view.clues[4].available).toBe(false);
  });
  it('shares evidence with gating and prevents invented evidence accusations',()=>{
    const room=fixture();
    expect(applyRoomAction(room,{action:'discover',id:'C4'},'Ани').status).toBe(403);
    expect(applyRoomAction(room,{action:'discover',id:'C1'},'Ани').status).toBe(200);
    expect(applyRoomAction(room,{action:'discover',id:'C2'},'Ани').status).toBe(200);
    expect(applyRoomAction(room,{action:'discover',id:'C4'},'Ани').status).toBe(200);
    expect(applyRoomAction(room,{action:'accuse',id:'boris',evidenceIds:['C2','C3','C4']},'Ани').status).toBe(403);
    expect(roomView(room).clues[3].description).toContain('23:52');
  });
  it('reveals ending only after a supported correct accusation',()=>{
    const room=fixture();
    for(const id of ['C1','C2','C3','C4','C6'])expect(applyRoomAction(room,{action:'discover',id},'Ани').status).toBe(200);
    expect(applyRoomAction(room,{action:'interview',id:'boris'},'Ани').status).toBe(200);
    expect(applyRoomAction(room,{action:'accuse',id:'raya',evidenceIds:['C2','C3','C4','C6']},'Ани').status).toBe(200);
    expect(room.verdict).toBe('incorrect');
    expect(roomView(room).ending).toBeNull();
    expect(applyRoomAction(room,{action:'accuse',id:'boris',evidenceIds:['C2','C3','C4','C6']},'Ани').status).toBe(200);
    expect(room.verdict).toBe('solved');
    expect(roomView(room).ending).toContain('Борис');
    expect(applyRoomAction(room,{action:'discover',id:'C5'},'Ани').status).toBe(409);
  });
});
