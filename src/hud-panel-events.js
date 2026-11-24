// Mode controllers can request the shared drawer without importing its DOM shell.
export function requestHudPanel(page,doc=globalThis.document){
 const EventClass=doc?.defaultView?.CustomEvent||globalThis.CustomEvent;
 if(!doc?.dispatchEvent||!EventClass)return false;
 doc.dispatchEvent(new EventClass('hud-open-panel',{detail:{page}}));return true;
}
