const fs=require('fs');
const {frame,png}=require('./analyze.cjs');
const root='Docs/BaramAppearance/Assets';fs.mkdirSync(root,{recursive:true});
const w=48,h=72,ox=24,oy=60,assets=[];
function pixels(f){const out=Buffer.alloc(w*h*4);for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){let dx=ox+f.left+x,dy=oy+f.top+y;if(dx<0||dy<0||dx>=w||dy>=h)throw Error('frame outside canvas');let p=(y*f.w+x)*4;f.rgba.copy(out,(dy*w+dx)*4,p,p+4);}return out;}
for(const kind of ['BODY','Head'])for(let style=0;style<(kind==='BODY'?2:10);style++)for(let motion=0;motion<12;motion++){
 const index=style*(kind==='BODY'?104:100)+motion,f=frame(kind,index),name=kind.toLowerCase()+'-'+style+'-'+motion,file=root+'/'+name+'.png';
 fs.writeFileSync(file,png(w,h,pixels(f)));assets.push({name,file,kind,style,motion,index,bytes:fs.statSync(file).size});
}
const sheet=Buffer.alloc(10*w*2*h*4);
for(let g=0;g<2;g++)for(let hair=0;hair<10;hair++){const body=pixels(frame('BODY',g*104+6)),head=pixels(frame('Head',hair*100+6));for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(y*w+x)*4,d=(g*h*10*w+hair*w+y*10*w+x)*4;sheet.set([70,60,45,255],d);if(body[p+3])body.copy(sheet,d,p,p+4);if(head[p+3])head.copy(sheet,d,p,p+4);}}
fs.writeFileSync('Docs/BaramAppearance/combinations.png',png(10*w,2*h,sheet));
const seen=new Map();
for(const asset of assets){const hash=require('crypto').createHash('sha256').update(fs.readFileSync(asset.file)).digest('hex');asset.canonical=seen.get(hash)||asset.name;seen.set(hash,asset.canonical);}
fs.writeFileSync('Docs/BaramAppearance/assets.json',JSON.stringify({canvas:{w,h,ox,oy},assets},null,2));console.log('Exported',assets.length,'layers.');
