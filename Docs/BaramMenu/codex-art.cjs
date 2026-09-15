const fs=require('fs'),e=require('../BaramProfile/extract.cjs'),f=e.frame('DLGMSG1.EPF',0,'NPAL8.PAL');
function pixel(out,w,x,y,sx,sy){let p=(sy*f.w+sx)*4,o=(y*w+x)*4;f.rgba.copy(out,o,p,p+4);if(out[o]<10&&out[o+1]>100&&out[o+2]>100)out[o+3]=0;}
function paper(x,y,w,h){return [80+Math.floor(x*150/w),70+Math.floor(y*110/h)];}
let w=580,h=400,b=Buffer.alloc(w*h*4);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 let sx,sy;if(x<32||x>=w-32||y<32||y>=h-32){sx=x<32?x:x>=w-32?314-(w-x):32+(x-32)%250;sy=y<32?y:y>=h-32?246-(h-y):80+(y%80);}else [sx,sy]=paper(x-32,y-32,w-64,h-64);pixel(b,w,x,y,sx,sy);
}fs.writeFileSync('Docs/BaramMenu/codex-window.png',e.png(w,h,b));
for(const [name,w,h,dark] of [['codex-row',254,88,false],['codex-icon',66,78,true]]){
 let b=Buffer.alloc(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 let sx,sy;if(x<2||x>=w-2||y<2||y>=h-2){sx=44+(x<2?x:x>=w-2?72-(w-x):2+x%68);sy=196+(y<2?y:y>=h-2?16-(h-y):2+y%12);}else if(dark){sx=48+x%62;sy=200+y%8;}else [sx,sy]=paper(x,y,w,h);pixel(b,w,x,y,sx,sy);
 }fs.writeFileSync('Docs/BaramMenu/'+name+'.png',e.png(w,h,b));
}
