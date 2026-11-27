export async function roAccountSocketReceipt(db,accountId,receipt){
 if(typeof accountId!=='string'||typeof receipt!=='string'||receipt.length>100)return null;
 const row=await db.prepare('SELECT payload FROM ro_accounts WHERE id=?').bind(accountId).first();if(!row)return null;
 const state=JSON.parse(row.payload),socket=state.cardSockets?.find(s=>s.id===receipt);return socket||null;
}
