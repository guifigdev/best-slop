// Snapshot-driven HUDs must keep interactive DOM nodes alive between updates:
// replacing a pressed button can cancel its click before pointerup arrives.
const DEFAULT_KEYS=['id','data-ui-key'];
const rendered=new WeakMap();
const compatible=(a,b)=>a.nodeType===b.nodeType&&a.nodeName===b.nodeName;
const hudHandle=node=>node.nodeType===1&&node.classList?.contains('hud-drag-handle');
const HUD_LAYOUT_STYLES=['position','left','top','right','bottom','transform','width','max-width','max-height','margin','z-index'];
function nodeKey(node,attributes){
 if(node.nodeType!==1)return null;
 for(const name of attributes)if(node.hasAttribute(name))return name+'='+node.getAttribute(name)+(node.hasAttribute('data-bk-slot')?'|slot='+node.getAttribute('data-bk-slot'):'');
 return null;
}
function patchNode(node,next,keys){
 if(node.nodeType!==1){if(node.nodeValue!==next.nodeValue)node.nodeValue=next.nodeValue;return;}
 const layout=node.getAttribute('data-hud-layout'),hudClasses=layout?[...node.classList].filter(c=>c.startsWith('hud-')):[],hudStyles=layout&&node.classList.contains('hud-positioned')?HUD_LAYOUT_STYLES.map(p=>[p,node.style.getPropertyValue(p),node.style.getPropertyPriority(p)]):[];
 for(const attribute of [...node.attributes]){
  // Disclosure state belongs to the player, not to the incoming snapshot.
  if(node.nodeName==='DETAILS'&&attribute.name==='open')continue;
  if(layout&&attribute.name==='data-hud-layout')continue;
  if(!next.hasAttribute(attribute.name))node.removeAttribute(attribute.name);
 }
 for(const attribute of [...next.attributes])if(node.getAttribute(attribute.name)!==attribute.value)node.setAttribute(attribute.name,attribute.value);
 for(const c of hudClasses)node.classList.add(c);
 for(const [property,value,priority]of hudStyles)if(value)node.style.setProperty(property,value,priority);
 // Account widgets and other mounted controllers own their child DOM. Moving
 // or emptying an open select closes its native popup on every room snapshot.
 if(!node.hasAttribute('data-ui-preserve'))patchChildren(node,next,keys);
}
export function patchChildren(parent,source,keys=DEFAULT_KEYS){
 const handles=[...parent.childNodes].filter(hudHandle),previous=[...parent.childNodes].filter(node=>!hudHandle(node)),used=new Set(),keyed=new Map();
 for(const node of previous){const key=nodeKey(node,keys);if(key!==null)keyed.set(key,node);}
 for(const [index,next]of [...source.childNodes].entries()){
  const key=nodeKey(next,keys);
  let node=key===null?previous.find(candidate=>!used.has(candidate)&&nodeKey(candidate,keys)===null&&compatible(candidate,next)):keyed.get(key);
  if(node&&(!compatible(node,next)||used.has(node)))node=null;
  if(!node)node=next.cloneNode(true);
  used.add(node);
  const position=index+handles.length;
  if(parent.childNodes[position]!==node)parent.insertBefore(node,parent.childNodes[position]||null);
  patchNode(node,next,keys);
 }
 for(const node of previous)if(!used.has(node)&&node.parentNode===parent)parent.removeChild(node);
}
export function patchHTML(parent,html,keys=DEFAULT_KEYS){
 const previous=rendered.get(parent);
 // Other game modes share the same hosts. Only skip if their live children
 // still belong to our last render; a mode switch can replace them externally.
 if(previous?.html===html&&previous.children.length===parent.childNodes.length&&previous.children.every((node,index)=>parent.childNodes[index]===node))return false;
 const template=parent.ownerDocument.createElement('template');
 template.innerHTML=html;
 patchChildren(parent,template.content,keys);
 rendered.set(parent,{html,children:[...parent.childNodes]});
 return true;
}
