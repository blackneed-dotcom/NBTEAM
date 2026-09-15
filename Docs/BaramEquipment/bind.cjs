// Run after export.cjs and upload.cjs, while Maker is stopped; then refresh.
const fs=require('node:fs');
const root='C:/Users/black/UI',out=root+'/Docs/BaramEquipment';
const inv=JSON.parse(fs.readFileSync(out+'/inventory.json','utf8'));
const uploaded=JSON.parse(fs.readFileSync(out+'/uploaded.json','utf8'));
const byName=new Map(uploaded.filter(x=>x.propertiesApplied).map(x=>[x.name,x.ruid]));
const rows=Object.entries(inv.sets).map(([key,v])=>'["'+key+'"]={'+v.frames.map(name=>{const ruid=byName.get(name);if(!ruid)throw Error('Unregistered '+name);return JSON.stringify(ruid);}).join(',')+'}');
const file=root+'/RootDesk/MyDesk/BaramCharacter/BaramAppearance.mlua';
let text=fs.readFileSync(file,'utf8');
const re=/    property table WeaponFrames = \{[\s\S]*?\}\r?\n    -- Original EPF offsets/;
if(!re.test(text))throw Error('WeaponFrames marker missing');
text=text.replace(re,'    property table WeaponFrames = {'+rows.join(',\n        ')+'}\n    -- Original EPF offsets');
fs.writeFileSync(file,text);console.log('Bound '+rows.length+' weapon/dye sets');
