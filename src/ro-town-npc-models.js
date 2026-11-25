// Full 3D sculptures studied from the original NPC sprites in assets/ro-town-npcs.
// Every costume is modeled around a solid body; no sprite pixels or silhouette extrusion.
const P=1/18;
function sculpt(type){
 const out=[],b=(x,y,z,w,h,d,c)=>out.push([x*P,y*P,z*P,w*P,h*P,d*P,c]),kafra=type==='kafra',nun=type==='healer',smith=type==='blacksmith',female=kafra||nun,potion=type==='potionShop';
 const skin=smith?0xd49b7e:0xe6b59a,shade=0xbb7f69,hair=kafra?0x72778d:nun?0x493636:smith?0xada99f:potion?0xd9b58b:0x795239,cloth=kafra?0x5e424c:nun?0x514137:smith?0x63483a:potion?0x7d6b68:0x8a6345,cream=0xf0dec5,ink=0x302c32,leather=0x654133,metal=0x8c9297;
 // Feet, calves and independently shaped legs, visible from every side.
 for(const side of [-1,1]){b(side*3,1.5,1,5,3,8,leather);b(side*3,5,0,4,5,5,nun?0x342c30:cloth);b(side*3,10,0,4.4,6,5,female?skin:cloth);b(side*3,2.9,2.7,4.5,.8,3,0xa07b5b);}
 if(female){for(const [y,w,d]of [[8.5,16,10],[11.5,14,9],[14.5,12,8]])b(0,y,0,w,3,d,cloth);b(0,20,0,10,9,7,cloth);b(0,25,0,12,4,8,kafra?0xac7d80:0x85714f);b(0,16.5,0,12,1.5,8,leather);}
 else{b(0,14,0,11,5,7,cloth);b(0,21,0,smith?16:12,11,8,smith?skin:cream);b(0,27,0,smith?17:13,3,8,smith?skin:cloth);b(0,15,0,12,1.5,8,leather);b(0,15.1,4.5,2,1.8,.7,0xc2a16b);}
 // Arms have upper arms, elbows, cuffs and hands; the blacksmith braces a hammer.
 for(const side of [-1,1]){const x=side*(smith?10:8);b(x,23,0,smith?5:4,8,6,smith?skin:cloth);b(x,18.5,1.5,4,3,5,skin);if(smith){b(side*11,28,2.5,4.5,7,4.5,skin);b(side*10,32,3,4.5,3,4.5,shade);}else{b(x,19,2,4.4,2,5.4,kafra||potion?cream:cloth);b(side*7,16.7,3.2,3.4,3.5,3.8,skin);}}
 b(0,29,0,5,3,5,skin);b(0,35,0,10,10,8,skin);b(0,34.6,4.1,8,7,.6,skin);for(const side of [-1,1]){b(side*5.2,34.5,0,1.5,3,3,skin);b(side*2.4,35.3,4.5,1.8,1.5,.5,cream);b(side*2.4,35.4,4.8,.8,1.3,.35,ink);b(side*2.3,37,4.5,2,.55,.4,hair);}b(0,33.7,4.7,1.1,1.7,.9,shade);b(0,31.8,4.5,2,.45,.4,0x925e5c);
 // Volumetric cap, side locks and layered back hair, not a painted front plane.
 b(0,41.5,-.2,11,3,9,hair);b(0,43.5,-1,9,3,7,hair);b(0,36,-4.2,11,9,2.5,hair);for(const side of [-1,1]){b(side*5.1,38.3,0,2,5,8,hair);b(side*4.7,33,1,1.8,5,5,hair);b(side*3,39.6,4.3,3,3,1,hair);}
 if(kafra){
  b(0,43.5,0,12,1.8,9,cream);for(let i=-2;i<=2;i++){b(i*2.1,44.4,2.5,1.6,1.2,4,cream);b(i*2,44.7,-2,1.5,.6,2,0xd2c7b4);}b(0,25,4.5,6,4,1,cream);b(0,22.5,5.2,2.5,2,.8,0x9a434e);for(const side of [-1,1])b(side*2.5,23,5,2,2.8,.8,0xbd7781);
  b(0,12.5,5,10,12,1,cream);b(0,18.5,4.3,7,3,1,cream);for(const side of [-1,1]){b(side*6.7,13,3,1.2,9,2,cream);b(side*4,7,5.6,3,1,1,0xffecd7);}for(let i=-3;i<=3;i++)b(i*2,6.9,4.9,1,1.7,1,cream);b(0,20.3,-4.6,7,3,2,cream);
 }else if(nun){
  b(0,25.3,4.8,8,5,1,0xc9b88a);b(0,22.5,5.3,.6,5,.5,0xceaf65);b(0,21.8,5.6,2.6,.65,.5,0xd8bd7a);b(0,23,5.6,.65,3,.5,0xd8bd7a);b(0,12.5,5,9,8,.7,0x756345);for(const side of [-1,1])b(side*4.5,9.8,5.1,.6,11,.5,0xa08d63);b(0,35,-4.6,10,10,2,hair);
 }else if(smith){
  b(0,17,4.7,11,9,1.3,leather);for(const side of [-1,1]){b(side*5,23,4.5,1.5,11,1,leather);b(side*6,22,4.4,3,6,.8,0xe8b392);}b(0,32,4.7,8,4,2,hair);b(0,29.5,4.4,6,3,2.4,hair);for(const x of [-3,-1,1,3])b(x,29,5.5,1.2,3,1,0xd2cbbb);b(-2.5,33.3,5.2,3,1.2,1,hair);b(2.5,33.3,5.2,3,1.2,1,hair);
  b(-3,33,3,29,1.7,1.8,0x967048);b(-16.5,33,3,5,8,6,metal);b(-16.5,36.6,3,6.5,1.2,7,0xb7bfc0);b(-16.5,29.4,3,6.5,1.2,7,0x6b7479);b(10.5,33,3,2,2.5,3.5,skin);
 }else if(potion){
  // Long blond hair, burgundy tie, pale sleeves and a dark open waistcoat.
  b(0,30,-5.1,10,20,3,hair);for(const side of [-1,1]){b(side*5.6,29,-3.5,2,16,4,hair);b(side*4,22,4.8,3,11,1,cloth);b(side*2.5,27.3,4.6,3,2,1,cream);}b(0,25,5.1,1.4,6,.8,0x8e525b);b(0,18,5,6,3,1,0xb7a18a);
 }else{
  b(0,21.5,4.6,7,10,1.2,0x9b744f);for(const side of [-1,1]){b(side*4,26.5,4.7,3,3,1.1,cream);b(side*4.5,21.5,4.8,1,9,.8,leather);}b(0,22.5,5.4,3.5,1.5,.5,0xc7a36f);b(0,39.5,4,2,4,1,hair);
 }
 return Object.freeze(out.map(Object.freeze));
}
export const RO_TOWN_NPC_MODELS=Object.freeze(Object.fromEntries(['kafra','potionShop','equipmentShop','healer','blacksmith'].map(type=>[type,sculpt(type)])));
