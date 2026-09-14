// Read-only audit of supplied source data. Outputs stay outside Maker's workspace.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const root=path.resolve(__dirname,'../..'),out=__dirname;
const read=p=>fs.readFileSync(path.join(root,p));
const decode=b=>{try{return new TextDecoder('utf-8',{fatal:true}).decode(b)}catch{return new TextDecoder('euc-kr').decode(b)}};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const schemas={
 'map_db.txt':['id','parentId','name','musicId','effect','flags'],
 'npc_db.txt':['id','name','imageId','dye'],
 'npcspawn.txt':['npcId','mapId','x','y','direction','script'],
 'mob_db.txt':['id','name','imageId','dye','hp','experience','armor','size','attackType','magicResistance','minDamage','maxDamage','attackScript','deathScript','moveIntervalMs'],
 'mobspawn.txt':['mobId','mapId','xMinRaw','xMaxRaw','yMinRaw','yMaxRaw','countRaw','intervalRaw'],
 'item_db.txt':['id','name','type','imageId','equipImageId','dye','maxCount','durability','price','strengthRequired','dexterityRequired','intelligenceRequired','genderRequired','levelRequired','jobRequired','promotionRequired','deathType','dropAllowed','repairable','repairCost','depositCost','renameCost','equipScript','unequipScript','useScript','tooltip','description']
};
const inventory=[],tables={},issues=[];
for(const [file,columns] of Object.entries(schemas)){
 const bytes=read(file),rows=[],invalid=[];
 decode(bytes).split(/\r?\n/).forEach((line,i)=>{
  if(!/^\s*\d+\s/.test(line))return;
  const cells=line.trim().split(/\t+/);
  if(cells.length!==columns.length){invalid.push({line:i+1,columns:cells.length});return;}
  const row={source:{file,line:i+1}};
  columns.forEach((key,k)=>{row[key]=/^-?\d+(\.\d+)?$/.test(cells[k])?Number(cells[k]):cells[k]});rows.push(row);
 });
 tables[file]=rows;
 const ids=new Map(),duplicates=[];
 if(columns[0]==='id')for(const row of rows){if(ids.has(row.id))duplicates.push({id:row.id,lines:[ids.get(row.id),row.source.line]});ids.set(row.id,row.source.line);}
 inventory.push({file,bytes:bytes.length,sha256:hash(bytes),parsedRows:rows.length,rejectedNumericRows:invalid,duplicates});
}
const scriptFiles=['npc','monster','item','magic','function'].flatMap(folder=>fs.globSync(folder+'/**/*.txt',{cwd:root}));
const symbols=[];
for(const file of scriptFiles){const s=decode(read(file));s.split(/\r?\n/).forEach((line,i)=>{const m=line.match(/^\s*([^\s\/{};]+)\s*\{\s*$/);if(m)symbols.push({name:m[1],file:file.replaceAll('\\','/'),line:i+1})});}
const maps=[];
for(const file of fs.readdirSync(path.join(root,'barammap')).filter(x=>/\.cmp$/i.test(x))){
 const p='barammap/'+file,b=read(p);let result={file:p,sha256:hash(b)};
 try{if(b.toString('ascii',0,4)!=='CMAP')throw Error('header');const width=b.readUInt16LE(4),height=b.readUInt16LE(6),raw=zlib.inflateSync(b.subarray(8));result={...result,width,height,bytesPerCell:raw.length/(width*height),decompressedBytes:raw.length};if(raw.length!==width*height*6)throw Error('cell size');}catch(e){result.error=e.message}maps.push(result);
}
const mapIds=[14,15,7,315],mobIds=[1,2],itemIds=[17,3014,3018,2200];
const selectedMaps=tables['map_db.txt'].filter(x=>mapIds.includes(x.id));
for(const m of selectedMaps){m.asset=maps.find(x=>x.file.toLowerCase()==='barammap/ba'+String(m.id).padStart(6,'0')+'.cmp')||null;if(!m.asset)issues.push({kind:'missing-map-asset',mapId:m.id,name:m.name});}
const warpRows=[];
decode(read('warp_db.txt')).split(/\r?\n/).forEach((line,i)=>{const t=line.trim().split(/\s+/);if(t.length===8&&t.every(x=>/^\d+$/.test(x))&&mapIds.includes(+t[0])&&mapIds.includes(+t[3]))warpRows.push({source:{file:'warp_db.txt',line:i+1},from:+t[0],x:+t[1],y:+t[2],to:+t[3],toX:+t[4],toY:+t[5],minLevel:+t[6],maxLevel:+t[7]});});
const spawns=tables['npcspawn.txt'].filter(x=>[15,7].includes(x.mapId));
const pursuits=[];
decode(read('pursuit_db.txt')).split(/\r?\n/).forEach((line,i)=>{if(!line.trim()||line.trim().startsWith('//'))return;const t=line.trim().split(/\t+/);if(t.length>=2)pursuits.push({name:t[0],script:t[1],source:{file:'pursuit_db.txt',line:i+1}})});
for(const spawn of spawns){spawn.pursuit=pursuits.find(p=>p.name===spawn.script)||null;const resolved=spawn.pursuit?.script||spawn.script;spawn.scriptCandidates=symbols.filter(s=>s.name===resolved);if(!spawn.scriptCandidates.length)issues.push({kind:'unresolved-npc-script',...spawn});}
const shops=[];
decode(read('shop_db.txt')).split(/\r?\n/).forEach((line,i)=>{const t=line.trim().split(/\s+/);if([0,20,21].includes(+t[0])&&t.every(x=>/^\d+$/.test(x)))shops.push({id:+t[0],itemIds:t.slice(1).map(Number),source:{file:'shop_db.txt',line:i+1}})});
const selectedMobs=tables['mob_db.txt'].filter(x=>mobIds.includes(x.id));
const selectedItems=tables['item_db.txt'].filter(x=>itemIds.includes(x.id));
const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),purpose:'M1 staging only; not imported into MSW runtime',maps:selectedMaps,portals:warpRows,npcSpawns:spawns,npcs:tables['npc_db.txt'].filter(x=>spawns.some(s=>s.npcId===x.id)),monsters:selectedMobs,monsterSpawns:tables['mobspawn.txt'].filter(x=>x.mapId===315),items:selectedItems,shops,issues};
const report={generatedAt:manifest.generatedAt,tables:inventory,scriptFileCount:scriptFiles.length,scriptSymbolCandidates:symbols.length,mapAssets:maps,issues};
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(out,'m1-manifest.json'),JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(out,'script-symbols.json'),JSON.stringify(symbols,null,2));
fs.writeFileSync(path.join(out,'normalized-tables.json'),JSON.stringify(tables,null,2));
// Verify selected records against independently known source values, and portal bounds.
const assert=require('assert/strict');
assert.equal(selectedMobs.find(x=>x.id===1).experience,10);
assert.equal(selectedMobs.find(x=>x.id===2).experience,5);
assert.equal(selectedItems.find(x=>x.id===3014).name,'도토리');
assert.equal(selectedItems.find(x=>x.id===17).durability,1000);
assert(warpRows.some(x=>x.from===14&&x.x===33&&x.y===121&&x.to===315));
for(const w of warpRows){const source=selectedMaps.find(m=>m.id===w.from).asset;if(source)assert(w.x>=0&&w.x<source.width&&w.y>=0&&w.y<source.height);}
console.log(JSON.stringify({tables:inventory.map(x=>({file:x.file,rows:x.parsedRows,rejected:x.rejectedNumericRows.length,duplicates:x.duplicates.length})),scripts:scriptFiles.length,mapAssets:maps.length,selectedPortals:warpRows.length,issues:issues.map(x=>({kind:x.kind,mapId:x.mapId,script:x.script})),verification:'passed'},null,2));
