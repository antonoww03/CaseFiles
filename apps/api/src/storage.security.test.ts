import {describe,expect,it} from 'vitest';
import {secureDatabaseUrl} from './storage.js';

describe('Neon PostgreSQL SSL security',()=>{
 it('upgrades sslmode=require to verify-full without losing pooling and channel binding',()=>{
  const original='postgresql://user:password%2Fwith%3Achars@ep-example-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const result=new URL(secureDatabaseUrl(original));
  expect(result.searchParams.get('sslmode')).toBe('verify-full');
  expect(result.searchParams.get('channel_binding')).toBe('require');
  expect(result.host).toBe('ep-example-pooler.eu-central-1.aws.neon.tech');
  expect(decodeURIComponent(result.password)).toBe('password/with:chars');
 });
 it('keeps stronger or deliberately different modes untouched',()=>{
  for(const mode of ['verify-full','disable','no-verify']){
   const value='postgresql://user:pw@localhost:5432/casefiles?sslmode='+mode;
   expect(new URL(secureDatabaseUrl(value)).searchParams.get('sslmode')).toBe(mode);
  }
 });
 it('does not invent SSL query options when none are provided',()=>{
  expect(secureDatabaseUrl('postgresql://user:pw@localhost:5432/test')).toBe('postgresql://user:pw@localhost:5432/test');
 });
});
