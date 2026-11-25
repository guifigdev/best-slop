import {handlerRagnarokRequest} from './ro-accounts.js';
import {RO_LINEAGES} from '../shared/ragnarok-jobs.js';

// Recovery keys are used only at admission, never added to a room or snapshot.
export async function ragnarokRoomProfile(store,input={}) {
 const explicitLineage=Object.hasOwn(RO_LINEAGES,input.lineage),lineage=explicitLineage?input.lineage:'dragonknight';
 if(!input.token){if(input.characterId)throw Error('Conecte sua conta para usar um personagem salvo.');return {lineage,cards:{},checkpoint:null};}
 if(typeof input.token!=='string'||!/^ro_[a-f0-9]{64}$/.test(input.token))throw Error('Conta Ragnarok inválida.');
 const response=await handlerRagnarokRequest(new Request('https://localhost/api/ragnarok/account',{headers:{Authorization:'Bearer '+input.token}}),{DB:store});
 if(!response.ok)throw Error('Não foi possível carregar sua conta Ragnarok.');
 const {account}=await response.json(),character=account.progress?.characters?.find(c=>c.id===input.characterId);
 if(input.characterId&&!character)throw Error('Personagem não encontrado na sua conta.');
 if(character&&explicitLineage&&character.lineage!==lineage)throw Error('O personagem salvo não pertence à classe escolhida. Escolha um personagem dessa classe ou crie um novo.');
 const saved=character?(character.checkpoints?.[input.activity]||character.checkpoint):null,checkpoint=saved?{...saved,hero:character.checkpoint.hero}:null;
 const cards=account.presets?.find(p=>p.id===account.activePreset)?.cards||{};
 return {warehouse:account.progress?.warehouse||{version:1,revision:0,items:[]},lineage:character?.lineage||lineage,checkpoint,cards,resume:input.resume===true,characterId:character?.id};
}
