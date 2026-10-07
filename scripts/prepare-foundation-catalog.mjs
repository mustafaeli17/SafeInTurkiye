import {writeFile} from 'node:fs/promises'
import {foundationCatalog,catalogSeed} from './foundation-catalog.mjs'
const rows=await foundationCatalog()
await writeFile('supabase/seeds/foundation-catalog.sql',catalogSeed(rows))
console.log(`Prepared ${rows.length} existing routes as DRAFT; no remote writes.`)
