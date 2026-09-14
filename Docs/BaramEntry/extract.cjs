const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const archive = fs.readFileSync('bint.dat');
const entries = [];
for (let i=0; i<archive.readUInt32LE(0); i++) {
  const p=4+i*17;
  entries.push({name:archive.subarray(p+4,p+17).toString('ascii').split('\0')[0],offset:archive.readUInt32LE(p)});
}
function entry(name) { const i=entries.findIndex(e=>e.name===name); if(i<0)throw Error(name); return archive.subarray(entries[i].offset,entries[i+1]?.offset||archive.length); }
function crc(b) { let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0; }
function chunk(t,b){const d=Buffer.concat([Buffer.from(t),b]),h=Buffer.alloc(4),c=Buffer.alloc(4);h.writeUInt32BE(b.length);c.writeUInt32BE(crc(d));return Buffer.concat([h,d,c]);}
function png(w,h,rgba){const ih=Buffer.alloc(13);ih.writeUInt32BE(w);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;const rows=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)rgba.copy(rows,y*(w*4+1)+1,y*w*4,(y+1)*w*4);return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
function decode(name,palette,index=0){const b=entry(name),p=entry(palette),at=12+b.readUInt32LE(8)+index*16;const top=b.readInt16LE(at),left=b.readInt16LE(at+2),bottom=b.readInt16LE(at+4),right=b.readInt16LE(at+6),start=b.readUInt32LE(at+8),end=b.readUInt32LE(at+12),w=right-left,h=bottom-top;if(w*h!==end-start)throw Error('frame bounds '+name);const out=Buffer.alloc(w*h*4);for(let i=0;i<w*h;i++){const n=b[12+start+i],j=32+n*4;out[i*4]=p[j];out[i*4+1]=p[j+1];out[i*4+2]=p[j+2];out[i*4+3]=n===0?0:255;}return {w,h,left,top,rgba:out};}
fs.mkdirSync('Docs/BaramEntry',{recursive:true});
const names=['TITLE.EPF','DLGNEW02.EPF','DLGLOGIN.EPF','DLGNC.EPF','TITLESEL.EPF'];
const pals=['BARAM.PAL',...Array.from({length:8},(_,i)=>'NPAL'+(i+1)+'.PAL')];
const meta=[];
for(const name of names){for(const pal of pals){const f=decode(name,pal);const file='Docs/BaramEntry/'+name+'-'+pal+'.png';fs.writeFileSync(file,png(f.w,f.h,f.rgba));meta.push({name,pal,file,w:f.w,h:f.h,left:f.left,top:f.top});}}
fs.writeFileSync('Docs/BaramEntry/frames.json',JSON.stringify(meta,null,2));

module.exports={decode,png,entry};
