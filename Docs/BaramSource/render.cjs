const fs=require('fs'),zlib=require('zlib');
const {png}=require('../BaramEntry/extract.cjs');
function archive(file){const b=fs.readFileSync(file),out={};for(let i=0;i<b.readUInt32LE(0)-1;i++){const p=4+i*17,n=b.subarray(p+4,p+17).toString('ascii').split('\0')[0].toLowerCase();out[n]=b.subarray(b.readUInt32LE(p),b.readUInt32LE(p+17));}return out;}
function palettes(b){const arr=[];let p=4;while(p<b.length){if(b.toString('ascii',p,p+9)!=='DLPalette')throw Error('PAL '+p);const c=p+32+b.readUInt32LE(p+24)*2;arr.push(b.subarray(c,c+1024));p=c+1024;}return arr;}
// dye = mob_db.txt 4번째 컬럼(염색). 팔레트를 바꾸는 게 아니라 인덱스를 8칸 단위로 민다.
// 앞 48색(0x00~0x2F)은 눈·그림자 같은 공통색이라 고정. dye 는 signed byte 라 음수면 반대 방향.
function frame(epf,pals,index,pal,dye){const at=12+epf.readUInt32LE(8)+index*16,t=epf.readInt16LE(at),l=epf.readInt16LE(at+2),h=epf.readInt16LE(at+4)-t,w=epf.readInt16LE(at+6)-l,off=12+epf.readUInt32LE(at+8);const out=Buffer.alloc(w*h*4),p=pals[pal];if(!p)throw Error('palette '+pal);const shift=((dye|0)*8)&0xFF;for(let i=0;i<w*h;i++){let c=epf[off+i];if(c){if(c>=48)c=(c+shift)&0xFF;p.copy(out,i*4,c*4,c*4+3);out[i*4+3]=255;}}return {w,h,l,t,rgba:out};}
function blit(dest,w,h,f,ox,oy){for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){const dx=ox+x,dy=oy+y,p=(y*f.w+x)*4;if(dx>=0&&dy>=0&&dx<w&&dy<h&&f.rgba[p+3])f.rgba.copy(dest,(dy*w+dx)*4,p,p+4);}}
const tile=archive('TILE.DAT'),gp=palettes(tile['tile.pal']),op=palettes(tile['tilec.pal']);
// SObj.tbl: [count u32][ver u8] 뒤에 엔트리가 이어진다.
// 엔트리 = [height u8][frames u16 * height][미상 4바이트][attr u16]  = 7 + 2*height 바이트
// 이전 코드는 p=6에서 시작해 p+6을 height로 읽었는데, 오브젝트 0의 height가 0이라
// 그 위치가 정확히 오브젝트 1의 height와 겹쳐서 배열 전체가 한 칸씩 밀렸다.
// (게다가 flags/directions는 앞 엔트리에서 읽혀서 프레임과 짝이 안 맞았다.)
let p=5;const objects=[];
for(let i=0;i<tile['sobj.tbl'].readUInt32LE(0);i++){const b=tile['sobj.tbl'],n=b[p];objects.push({height:n,frames:Array.from({length:n},(_,j)=>b.readUInt16LE(p+1+j*2)),attr:b.readUInt16LE(p+5+n*2)});p+=7+n*2;}
const assets=[],maps=[];fs.mkdirSync('Docs/BaramSource/Assets',{recursive:true});
function save(name,w,h,rgba,meta={}){const file='Docs/BaramSource/Assets/'+name+'.png';fs.writeFileSync(file,png(w,h,rgba));assets.push({name,file,bytes:fs.statSync(file).size,...meta});}
const cache=new Map();function tileframe(id,object){let key=object+':'+id;if(!cache.has(key)){const prefix=object?'tilec':'tile';cache.set(key,frame(tile[prefix+'.epf'],object?op:gp,id,tile[prefix+'.tbl'].readUInt16LE(4+id*2)&32767,0));}return cache.get(key);}
for(const id of [14,15,7,315]){
 const b=fs.readFileSync('barammap/Ba'+String(id).padStart(6,'0')+'.cmp'),cols=b.readUInt16LE(4),rows=b.readUInt16LE(6),raw=zlib.inflateSync(b.subarray(8)),w=cols*24,h=rows*24,ground=Buffer.alloc(w*h*4),over=Buffer.alloc(w*h*4),pass=[],objectFlags=[];
 for(let y=0;y<rows;y++){let row='';for(let x=0;x<cols;x++){const i=(y*cols+x)*6,tid=raw.readUInt16LE(i),flag=raw.readUInt16LE(i+2),oid=raw.readUInt16LE(i+4),f=tileframe(tid,false);blit(ground,w,h,f,x*24+f.l,y*24+f.t);row+=flag===0?'1':'0';if(oid){const o=objects[oid];if(!o)throw Error('object '+oid);o.frames.forEach((v,j)=>{const f=tileframe(v,true);blit(over,w,h,f,x*24+f.l,(y-j)*24+f.t)});objectFlags.push({x,y,oid,height:o.height,attr:o.attr});}}pass.push(row);}
 const chunks=[];for(let y=0;y<h;y+=960)for(let x=0;x<w;x+=960){const cw=Math.min(960,w-x),ch=Math.min(960,h-y);for(const [label,buff] of [['ground',ground],['objects',over]]){const pixels=Buffer.alloc(cw*ch*4);for(let r=0;r<ch;r++)buff.copy(pixels,r*cw*4,((y+r)*w+x)*4,((y+r)*w+x+cw)*4);const name='map'+id+'-'+label+'-'+x+'-'+y;save(name,cw,ch,pixels,{mapId:id,layer:label,x,y,w:cw,h:ch});chunks.push(name);}}
 maps.push({id,cols,rows,pass,objectFlags,chunks});
}
const mon=archive('mon.dat'),mp=palettes(mon['monster.pal']),dna=mon['monster.dna'],mobs=[];p=4;
for(let i=0;i<dna.readUInt32LE(0);i++){const base=dna.readUInt32LE(p),n=dna[p+4],pal=dna.readUInt16LE(p+6),chunks=[];p+=8;for(let j=0;j<n;j++){const count=dna.readUInt16LE(p);p+=2;const frames=[];for(let k=0;k<count;k++){frames.push({index:base+dna.readUInt16LE(p),duration:dna.readUInt16LE(p+2)});p+=9;}chunks.push(frames);}mobs.push({i,base,pal,chunks});}
// mob_db.txt: 번호 \t 이름 \t 이미지 \t 염색 \t ...  (이름 컬럼만 cp949 라 latin1 로 읽고 숫자만 쓴다)
const mobdb={};
for(const line of fs.readFileSync('mob_db.txt','latin1').split('\n')){if(!line.trim()||line.startsWith('//'))continue;const c=line.split('\t'),no=parseInt(c[0],10),img=parseInt(c[2],10),dye=parseInt(c[3],10);if(Number.isInteger(no)&&Number.isInteger(img))mobdb[no]={image:img,dye:Number.isInteger(dye)?dye:0};}
const actors=[];
// NPC(15 연실네 / 12 옥이)는 염색 정보가 없어 0. 몬스터는 mob_db 염색 컬럼을 따른다 — 다람쥐 5, 토끼 29.
const targets=[{image:15,dye:0},{image:12,dye:0},{image:mobdb[1].image,dye:mobdb[1].dye},{image:mobdb[2].image,dye:mobdb[2].dye}];
for(const {image:id,dye} of targets){const m={...mobs[id-1],imageId:id,dye};actors.push(m);
 // 청크 0=사망, 1~4=정지, 5~8=걷기, 9~12=피격, 13~16=공격. 전부 뽑는다.
 const list=[...new Set(m.chunks.flat().map(x=>x.index))];
 for(const index of list){const f=frame(mon['monster.epf'],mp,index,m.pal,dye),out=Buffer.alloc(96*96*4);blit(out,96,96,f,48+f.l,72+f.t);save('actor'+id+'-'+index,96,96,out,{actor:id,index,dye});}}
const misc=archive('MISC.DAT'),ip=palettes(misc['item.pal']);for(const [id,index] of [[17,3],[2200,77],[3014,215],[3018,218]]){const f=frame(misc['item.epf'],ip,index-1,0,0),out=Buffer.alloc(48*48*4);blit(out,48,48,f,24+f.l,36+f.t);save('item'+id,48,48,out,{item:id});}
fs.writeFileSync('Docs/BaramSource/rendered.json',JSON.stringify({assets,maps,actors},null,2));console.log(JSON.stringify({assets:assets.length,maps:maps.map(m=>({id:m.id,size:[m.cols,m.rows],pass:m.pass.join('').split('1').length-1})),dnaBytes:p,dnaLength:dna.length,actors:actors.map(m=>({id:m.i,base:m.base,pal:m.pal,chunks:m.chunks.map(c=>c.length)}))}));
module.exports={archive,palettes,frame,blit};
