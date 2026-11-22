// Snapshot-driven HUDs must keep interactive DOM nodes alive between updates:
// replacing a pressed button can cancel its click before pointerup arrives.
const DEFAULT_KEYS=['id','data-ui-key'];
const rendered=new WeakMap();
const compatible=(a,b)=>a.nodeType===b.nodeType&&a.nodeName===b.nodeName;
function nodeKey(node,attributes){
 if(node.nodeType!==1)return null;
 for(const name of attributes)if(node.hasAttribute(name))return name+'='+node.getAttribute(name);
 return null;
}
function patchNode(node,next,keys){
 if(node.nodeType!==1){if(node.nodeValue!==next.nodeValue)node.nodeValue=next.nodeValue;return;}
 for(const attribute of [...node.attributes]){
  // Disclosure state belongs to the player, not to the incoming snapshot.
  if(node.nodeName==='DETAILS'&&attribute.name==='open')continue;
  if(!next.hasAttribute(attribute.name))node.removeAttribute(attribute.name);
 }
 for(const attribute of [...next.attributes])if(node.getAttribute(attribute.name)!==attribute.value)node.setAttribute(attribute.name,attribute.value);
 // Account widgets and other mounted controllers own their child DOM. Moving
 // or emptying an open select closes its native popup on every room snapshot.
 if(!node.hasAttribute('data-ui-preserve'))patchChildren(node,next,keys);
}
export function patchChildren(parent,source,keys=DEFAULT_KEYS){
 const previous=[...parent.childNodes],used=new Set(),keyed=new Map();
 for(const node of previous){const key=nodeKey(node,keys);if(key!==null)keyed.set(key,node);}
 for(const [index,next]of [...source.childNodes].entries()){
  const key=nodeKey(next,keys);
  let node=key===null?previous.find(candidate=>!used.has(candidate)&&nodeKey(candidate,keys)===null&&compatible(candidate,next)):keyed.get(key);
  if(node&&(!compatible(node,next)||used.has(node)))node=null;
  if(!node)node=next.cloneNode(true);
  used.add(node);
  if(parent.childNodes[index]!==node)parent.insertBefore(node,parent.childNodes[index]||null);
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
