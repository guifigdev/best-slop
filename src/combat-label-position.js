// Lava numbers sit above the actual caster silhouette, leaving its body fire visible.
export function combatLabelHeight(event,actor,age){
 const ground=actor?.root?.position?.y||.18;
 if(event.warlockLava){const height=Number.isFinite(actor?.modelHeight)?actor.modelHeight:2.65,scale=Number.isFinite(actor?.root?.scale?.y)?actor.root.scale.y:1;return ground+height*scale+.9+age*2;}
 return ground+2.7+age*2;
}
