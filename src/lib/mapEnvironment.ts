// Browser keys are public but host-restricted. Never reuse the server Places key.
// Preview must opt into its own key, not inherit a production-only credential.
export function taxiMapKey(hostname:string,productionKey?:string,previewKey?:string):string|undefined {
 const live=hostname==='safeinturkiye.com'||hostname==='www.safeinturkiye.com';
 return (live?productionKey:previewKey)?.trim()||undefined;
}
