const fs=require('fs');
const {Decoder,Formatter,FormatterSyntax}=require('C:/Users/black/AppData/Local/Temp/msw-original-analysis-20260914/node_modules/iced-x86');
const data=fs.readFileSync('C:/Users/black/UI/winbaram.exe');
const base=0x400000;
const mode=process.argv[2], target=parseInt(process.argv[3],16);
const fmt=new Formatter(FormatterSyntax.Nasm);
if(mode==='d') {
 const d=new Decoder(32,data.subarray(target-base,target-base+Number(process.argv[4]||500)),0);d.ip=BigInt(target);
 while(d.canDecode){const i=d.decode();console.log(Number(i.ip).toString(16)+' '+fmt.format(i));i.free();}d.free();
} else {
 const d=new Decoder(32,data.subarray(0x1000,0x129000),0);d.ip=0x401000n;
 while(d.canDecode){const i=d.decode(),t=fmt.format(i);if([...t.matchAll(/(?:0x)?([0-9A-F]{6,8})h?/ig)].some(m=>parseInt(m[1],16)===target))console.log(Number(i.ip).toString(16)+' '+t);i.free();}d.free();
}
fmt.free();
