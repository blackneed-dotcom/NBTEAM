const fs=require('fs'),e=require('../BaramProfile/extract.cjs');
const f=e.frame('DLGMSG1.EPF',0,'NPAL8.PAL'),w=300,h=180,b=Buffer.alloc(w*h*4);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 let sx=x<32?x:x>=w-32?f.w-(w-x):100+(x%80);
 let sy=y<32?y:y>=h-32?f.h-(h-y):90+(y%70);
 if(x>=32&&x<w-32&&y<32) sx=32+(x-32)%(f.w-64);
 if(x>=32&&x<w-32&&y>=h-32) sx=32+(x-32)%(f.w-64);
 let p=(sy*f.w+sx)*4,o=(y*w+x)*4;f.rgba.copy(b,o,p,p+4);
 if(b[o]<10&&b[o+1]>100&&b[o+2]>100)b[o+3]=0;
}
fs.writeFileSync('Docs/BaramMenu/select-border.png',e.png(w,h,b));
let button=Buffer.alloc(72*16*4);for(let y=0;y<16;y++)f.rgba.copy(button,y*72*4,((196+y)*f.w+44)*4,((196+y)*f.w+116)*4);
fs.writeFileSync('Docs/BaramMenu/select-button.png',e.png(72,16,button));
const a=fs.readFileSync('MISC.DAT'),entries=[];for(let i=0;i<a.readUInt32LE(0);i++){let p=4+i*17;entries.push({n:a.subarray(p+4,p+17).toString('ascii').split('\0')[0].toLowerCase(),o:a.readUInt32LE(p)});}
function get(n){let i=entries.findIndex(x=>x.n===n);return a.subarray(entries[i].o,entries[i+1]?.o??a.length);}
const epf=get('item.epf'),pal=get('item.pal'),colors=36+pal.readUInt32LE(28)*2;
for(const [name,id,dye] of [['warp-scroll',247,0],['codex-book',2081,5]]){
 const p=12+epf.readUInt32LE(8)+(id-1)*16,t=epf.readInt16LE(p),l=epf.readInt16LE(p+2),h=epf.readInt16LE(p+4)-t,w=epf.readInt16LE(p+6)-l,start=12+epf.readUInt32LE(p+8),b=Buffer.alloc(w*h*4);
 for(let i=0;i<w*h;i++){let c=epf[start+i];if(!c)continue;if(c>=48)c=(c+dye*8)&255;pal.copy(b,i*4,colors+c*4,colors+c*4+3);b[i*4+3]=255;}
 fs.writeFileSync('Docs/BaramMenu/'+name+'.png',e.png(w,h,b));console.log(name,w,h);
 let zoom=Buffer.alloc(w*h*16*4);for(let y=0;y<h*4;y++)for(let x=0;x<w*4;x++){let p=(Math.floor(y/4)*w+Math.floor(x/4))*4;b.copy(zoom,(y*w*4+x)*4,p,p+4);}fs.writeFileSync('Docs/BaramMenu/'+name+'-preview.png',e.png(w*4,h*4,zoom));
}
