import * as T from 'three';

// A closed, chiselled rock column. Relief stays inside the solid wall cell:
// formations never become invisible obstacles in the walkable corridor.
export function roCaveRockGeometry(){
 const positions=[],colors=[],levels=[0,.6,1.4,2.3,3.5,4.8,6.5,9,12,16,22,30,42,58,76,96],rings=[];
 const random=(a,b)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
 const perimeter=[];for(let side=0;side<4;side++)for(let j=0;j<6;j++){const t=-.5+j/6;perimeter.push(side===0?[t,-.5]:side===1?[.5,t]:side===2?[-t,.5]:[-.5,-t]);}
 for(let layer=0;layer<levels.length;layer++)rings.push(perimeter.map(([x,z],j)=>{const edge=j%6===0,depth=edge?.09+random(j,layer)*.06:.025+random(j,layer)*.15,ledge=layer%3===1?.035:0;return[x*(1-depth*2),levels[layer]/96-.5+(layer&&layer<levels.length-1?(random(j+4,layer)-.5)*Math.min(1,levels[layer]-levels[layer-1])*.24/96:0),z*(1-depth*2-ledge)];}));
 const triangle=(a,b,c,shade)=>{for(const p of [a,b,c]){positions.push(...p);colors.push(shade,shade*.98,shade*.93);}};
 for(let l=0;l<rings.length-1;l++)for(let j=0;j<24;j++){const k=(j+1)%24,a=rings[l][j],b=rings[l+1][j],c=rings[l+1][k],d=rings[l][k],shade=.67+random(j+1,l+8)*.33;triangle(a,b,c,shade);triangle(a,c,d,shade*(.91+random(l,j)*.09));}
 for(let j=0;j<24;j++){const k=(j+1)%24;triangle([0,-.5,0],rings[0][j],rings[0][k],.7);triangle([0,.5,0],rings.at(-1)[k],rings.at(-1)[j],.8);}
 // Embedded broken boulders at the foot of each face break the straight
 // column silhouette. Their outermost face still stays inside the cell.
 const rock=new T.IcosahedronGeometry(1,0),rp=rock.attributes.position;
 for(let face=0;face<4;face++)for(let j=0;j<3;j++){const angle=face*Math.PI/2,cs=Math.cos(angle),sn=Math.sin(angle),along=(j-1)*.30,deep=.405,cy=(1.6+random(face,j)*1.2)/96-.5,sy=(1.6+random(j,face+4)*1.1)/96;
  for(let k=0;k<rp.count;k+=3){const points=[];for(let q=0;q<3;q++){const px=along+rp.getX(k+q)*(.18+random(j,face)*.05),pz=deep+rp.getZ(k+q)*.095;points.push([px*cs+pz*sn,cy+rp.getY(k+q)*sy,-px*sn+pz*cs]);}triangle(...points,.74+random(k+j,face)*.24);}
 }rock.dispose();
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
