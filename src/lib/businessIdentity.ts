export function validBusinessKey(value:unknown):value is string {
 return typeof value==='string'&&/^(google\/[A-Za-z0-9_-]{5,200}|(?:hotels|restaurants|activities)\/[a-f0-9-]{36})$/.test(value);
}
export function businessKeyFromSource(source:string){
 try{const url=new URL(source);if(!['maps.google.com','www.google.com','google.com'].includes(url.hostname))return null;
 const id=url.searchParams.get('query_place_id')??url.searchParams.get('place_id');return id&&validBusinessKey('google/'+id)?'google/'+id:null;
 }catch{return null;}
}
