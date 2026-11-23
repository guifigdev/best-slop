import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildRoNativeEffectManifest,roNativeResourceToken,validateRoNativeStr} from '../shared/ro-native-effect-manifest.js';
import {RO_NATIVE_EFFECT_MANIFEST as manifest,RO_NATIVE_EFFECT_ASSETS as assets} from '../src/ro-native-effect-assets.js';
const bytes=file=>readFileSync(new URL('../src/assets/ro-native-effects/'+file,import.meta.url)),sha=data=>createHash('sha256').update(data).digest('hex');

test('native mappings preserve distinct skill/effect IDs, phases and procedural parts',()=>{
 const out=buildRoNativeEffectManifest({hammer:{key:'hammer',sourceId:110},unknown:{key:'unknown',sourceId:999}}, {'110':{effectId:102,hitEffectId:1,groundEffectId:25}},{'102':[{type:'STR',file:'crashearth'},{type:'FUNC',func:'Camera.setQuake'}],'1':[{type:'2D',file:'lens1.tga'}],'25':[{type:'STR',file:'firewall%d',rand:[1,2]}]});
 assert.equal(out.skills.hammer.sourceId,110);assert.equal(out.skills.hammer.phases.cast[0].effectId,102);assert.equal(out.skills.hammer.phases.cast[1].type,'FUNC');assert.equal(out.skills.hammer.phases.hit[0].type,'2D');
 assert.deepEqual(out.skills.hammer.phases.ground.map(p=>p.file),['firewall1','firewall2']);assert.ok(out.skills.hammer.phases.ground.every(p=>p.variantGroup==='firewall%d'));assert.deepEqual(out.skills.unknown.phases,{cast:[],hit:[],ground:[]});
});

test('native resource tokens decode client byte names and reject unsafe paths',()=>{
 assert.equal(roNativeResourceToken('effect\\lens1.tga'),'lens1.tga');assert.equal(roNativeResourceToken('¼Ò¿ï¹ø'),'소울번');assert.equal(roNativeResourceToken('디스펠'),'디스펠');
 for(const value of ['../private','a/../private','https://host/file','/root/file','a\0b','a//b'])assert.throws(()=>roNativeResourceToken(value));
});

test('packaged original STR data remains finite and texture hashes/dimensions match local assets',()=>{
 assert.ok(Object.keys(manifest.effects).length>=60);assert.equal(manifest.unavailable.length,0);assert.ok(manifest.coverage.packageBytes<25*1024*1024);
 const textures=new Set();for(const [file,effect]of Object.entries(manifest.effects)){
  const data=bytes(effect.data);assert.equal(sha(data),effect.sha256);const parsed=validateRoNativeStr(JSON.parse(data));assert.equal(parsed.fps,effect.fps);assert.equal(parsed.layers.length,effect.layerCount);assert.equal(effect.duration,(parsed.maxKey+1)/parsed.fps);assert.equal(assets[file].url,new URL('../src/assets/ro-native-effects/'+effect.data,import.meta.url).href);
  for(const layer of parsed.layers)for(const name of layer.textures){const target=effect.textures[name];assert.ok(target,'every original layer texture is bundled');assert.ok(assets[file].textures[name]);if(textures.has(target))continue;textures.add(target);const png=bytes(target),info=effect.textureInfo[name];assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(sha(png),info.sha256);assert.equal(png.readUInt32BE(16),info.width);assert.equal(png.readUInt32BE(20),info.height);assert.equal(png[25],6,'original textures have real RGBA alpha');assert.ok(statSync(new URL('../src/assets/ro-native-effects/'+target,import.meta.url)).size>0);}
 }
 assert.equal(textures.size,manifest.coverage.packagedTextures);
});

test('core references resolve original Hammer Fall, Storm Gust, Vermilion and numbered Pneuma',()=>{
 assert.equal(manifest.skills.hammerfall.sourceId,110);assert.equal(manifest.skills.hammerfall.phases.cast[0].effectId,102);assert.ok(assets.crashearth.textures['hammer.bmp']);assert.equal(assets.crashearth.fps,60);assert.equal(assets.crashearth.maxKey,79);
 for(const file of ['stormgust','lord','safetywall','pneuma1','pneuma2','pneuma3','firewall1','firewall2','quagmire'])assert.ok(assets[file],file+' is packaged');
 const invalid=JSON.parse(bytes(manifest.effects.crashearth.data));invalid.layers.find(l=>l.animations.length).animations[0].pos[0]=Infinity;assert.throws(()=>validateRoNativeStr(invalid),/vector/);
});
