// Export exact item2 worn sprites; EPF offsets share the existing 96x96 foot (48,72).
const fs=require('node:fs'),crypto=require('node:crypto');
const root='C:/Users/black/UI',out=root+'/Docs/BaramEquipment';
const dec=require(root+'/Docs/BaramResourcePack/decode.cjs');
const archive=dec.datMap(fs.readFileSync(root+'/char.dat'));
const rows=fs.readFileSync(root+'/item2_db.txt','utf8').split(/\r?\n/).filter(x=>/^\d+\t/.test(x)).map(x=>x.split('\t'));
const sets={},jobs=[],missing=[],hashes=new Map();fs.mkdirSync(out+'/Assets',{recursive:true});
for(const row of rows){if(+row[0]===55||+row[0]===56){missing.push({itemId:+row[0],name:row[1],reason:'Excluded by user: no worn source'});continue;}const equip=+row[4],dye=+row[5],key=equip+':'+dye;if(sets[key])continue;
 const kind=equip>=10000?'spear':'sword',id=equip>=10000?equip-10000:equip,t=dec.decodeTbl(archive[kind+'.tbl']);
 let record;for(let p=4;p<t.length;p+=12)if(t.readInt32LE(p)===id)record={palette:t.readInt32LE(p+4),start:t.readInt32LE(p+8)};
 if(!record){missing.push({itemId:+row[0],name:row[1],equip,dye,reason:'No source TBL/EPF entry'});continue;}
 const frames=[],pal=dec.palList(archive[kind+'.pal'])[record.palette];
 for(let frame=0;frame<20;frame++){const f=dec.rgbaFrame(archive[kind+'.epf'],record.start+frame,pal,dye),rgba=Buffer.alloc(96*96*4);
 for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){const dx=48+f.left+x,dy=72+f.top+y;if(dx<0||dy<0||dx>=96||dy>=96)throw Error('Clipped '+key+' frame '+frame);f.rgba.copy(rgba,(dy*96+dx)*4,(y*f.w+x)*4,(y*f.w+x)*4+4);}
 const png=dec.png({w:96,h:96,rgba}),hash=crypto.createHash('sha256').update(png).digest('hex');let name=hashes.get(hash);
 if(!name){name='BaramEquip_'+equip+'_D'+dye+'_F'+frame;hashes.set(hash,name);const file=out+'/Assets/'+name+'.png';fs.writeFileSync(file,png);jobs.push({name,file,category:'sprite',subcategory:'item',description:'Original char.dat '+kind+' frame '+(record.start+frame)+' dye '+dye,contentLength:png.length,sha256:hash});}
 frames.push(name);}
 sets[key]={kind,...record,frames};}
fs.writeFileSync(out+'/inventory.json',JSON.stringify({sourceHash:crypto.createHash('sha256').update(fs.readFileSync(root+'/char.dat')).digest('hex'),canvas:{w:96,h:96,foot:[48,72]},sets,jobs,missing},null,2));
if(!fs.existsSync(out+'/uploaded.json'))fs.writeFileSync(out+'/uploaded.json','[]');
console.log(JSON.stringify({sets:Object.keys(sets).length,jobs:jobs.length,missing}));
