import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {applyClimateLighting} from '../src/climate-lighting.js';
import {createRoAtmosphere} from '../src/ro-atmosphere.js';
test('cloud light scales the current day/night baseline without illuminating night or changing gameplay climate',()=>{
 const lights={sun:{intensity:.08},skyLight:{intensity:.7},actorLighting:{uniforms:{roSolarBounce:{value:.02}}}},climate=Object.freeze({sunlight:.3,indoor:false});applyClimateLighting(lights,climate);assert.equal(lights.sun.intensity,.024);assert.ok(lights.skyLight.intensity<.7&&lights.skyLight.intensity>.5);assert.equal(lights.actorLighting.uniforms.roSolarBounce.value,.006);applyClimateLighting(lights,{indoor:true,sunlight:0});assert.equal(lights.sun.intensity,0);assert.equal(lights.skyLight.intensity,1.8);assert.equal(lights.actorLighting.uniforms.roSolarBounce.value,0);
});
test('overcast sky loses blue saturation and clearing restores the exact approved daylight gradient',()=>{
 const scene=new T.Scene(),sun=new T.DirectionalLight(),skyLight=new T.HemisphereLight(),camera=new T.PerspectiveCamera(),a=createRoAtmosphere({scene,sun,skyLight}),state={options:{mode:'campaign'},arena:'forest'};
 try{a.update(state,122.4,camera,{outdoor:true,cloudCover:0});const u=a.root.getObjectByName('ro-analytic-sky').material.uniforms,clear=u.topColor.value.clone();a.update(state,122.4,camera,{outdoor:true,cloudCover:1});assert.notDeepEqual(u.topColor.value.toArray(),clear.toArray());assert.ok(Math.abs(u.topColor.value.b-u.topColor.value.r)<Math.abs(clear.b-clear.r));a.update(state,122.4,camera,{outdoor:true,cloudCover:0});assert.deepEqual(u.topColor.value.toArray(),clear.toArray());}finally{a.dispose();}
});
