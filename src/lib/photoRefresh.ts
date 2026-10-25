export function expiredGooglePhoto(url:string,now=Date.now()){
 try{const value=new URL(url,'https://safeinturkiye.com');const expires=Number(value.searchParams.get('expires'));return value.pathname==='/api/place-photo'&&Number.isFinite(expires)&&expires>0&&expires<=now;}catch{return false;}
}
/** Multiple lazy image failures must produce one refresh, never one search per image. */
export function createPhotoRefreshGuard(){let next=0;return(now=Date.now())=>{if(now<next)return false;next=now+30000;return true;};}
