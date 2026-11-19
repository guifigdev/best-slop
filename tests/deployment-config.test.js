import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {SETUP_GUIDES,websocketAddress,apiOriginFromSocket,fallbackRuntimeConfig} from '../src/deployment-config.js';

test('public server settings reject secrets, mixed content and non-socket protocols',()=>{
 const page={protocol:'https:',host:'play.gfig.space'};
 assert.equal(websocketAddress('wss://play.gfig.space',page),'wss://play.gfig.space/ws');
 for(const url of ['ws://play.gfig.space/ws','https://play.gfig.space/ws','wss://user:password@play.gfig.space/ws','wss://play.gfig.space/ws?token=secret','wss://play.gfig.space/ws#secret'])assert.equal(websocketAddress(url,page),null);
 assert.equal(websocketAddress('ws://localhost:2567',{protocol:'http:'}),'ws://localhost:2567/ws');
 assert.equal(apiOriginFromSocket('wss://play.gfig.space/ws'),'https://play.gfig.space');
 const config=fallbackRuntimeConfig(page,{VITE_SERVER_URL:'wss://play.gfig.space/ws'});
 assert.equal(config.features.online.status,'configured');
 assert.equal(config.features.payments.status,'not-implemented');
 assert.equal(config.phaseApiBase,'https://play.gfig.space');
});

test('every externally configured feature links to an actual operator tutorial',async()=>{
 for(const guide of Object.values(SETUP_GUIDES)){
  assert.ok(guide.steps.length>=2);
  await access(new URL('../docs/'+guide.doc,import.meta.url));
 }
});
