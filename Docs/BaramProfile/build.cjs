const {UIBuilder}=require("../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const manifest=require("./manifest.json");
const r=Object.fromEntries(manifest.assets.filter(a=>a.ruid).map(a=>[a.file,a.ruid]));
const uiPath=path.join(root,"ui/BaramProfile.ui");
const fs=require("node:fs");
const b=fs.existsSync(uiPath)?UIBuilder.read(uiPath):new UIBuilder("BaramProfile",30,true,r["userlook-0.png"]);
b.empty("Canvas",{rect_size:[640,480],anchor:"middle-center"});
b.patchComponent("Canvas","MOD.Core.UITransformComponent",{UIScale:{x:3,y:2.25,z:1},Scale:{x:3,y:2.25,z:1}});
const w="Canvas/Window";
function sprite(name,ruid,x,y,width,height,extra={}) {
 b.sprite(name,{image_ruid:ruid,anchor:"top-left",pos:[x,-y],rect_size:[width,height],sprite_type:0,color:"#FFFFFF",alpha:1,...extra});
}
sprite(w,r["userlook-0.png"],434,12,192,288,{enable:false,raycast:true});
b.empty(w+"/Information",{anchor:"top-left",rect_size:[192,288]});
sprite(w+"/Information/Body","c64b25f16d014f5284f06b2ed46e7052",72,112,48,72);
sprite(w+"/Information/Head","3d16bf20f98748b8a7a2fb67ad1256c4",72,112,48,72);
sprite(w+"/Information/Weapon","53fbd0a9bed24c72b53ac3def57d85ac",11,87,48,48,{enable:false});
sprite(w+"/Information/ExchangeDisabled",r["lookbtn-3.png"],149,107,26,26);
sprite(w+"/Information/GroupDisabled",r["lookbtn-4.png"],149,134,26,26);
for(const [name,edge,y,width] of [["Clan",174,36,114],["ClanTitle",174,53,114],["Title",174,70,114],["Class",94,91,74],["Name",174,91,80],["WeaponText",174,194,152]]) {
 const f=w+"/Information/"+name;
 b.empty(f,{anchor:"top-left",pos:[edge-width,-y],rect_size:[width,12]});
 for(let i=1;i<=24;i++){
  const g=f+"/Glyph"+i;
  b.mask(g,{image_ruid:r["userlook-0.png"],anchor:"top-left",rect_size:[12,12],alpha:0,enable:false});
  b.patchComponent(g,"MOD.Core.SpriteGUIRendererComponent",{RaycastTarget:false});
  sprite(g+"/Atlas",r["font-0.png"],0,0,2048,2048,{color:(name==="Name"||name==="WeaponText")?"#000000":"#e4cc93"});
 }
}
for(const name of ["PreviousDisabled","NextDisabled"]) if(b.find(w+"/"+name)) b.remove(w+"/"+name);
for(const [name,x] of [["Previous",34],["Next",137]]) {
 sprite(w+"/"+name,r[name==="Previous"?"spellbut-2.png":"spellbut-1.png"],x,254,22,18,{raycast:true});
 b.addComponent(w+"/"+name,"MOD.Core.UITouchReceiveComponent");
}
b.write(uiPath,{bind:{mlua:path.join(root,"RootDesk/MyDesk/BaramHUD/BaramProfile.mlua"),props:{Window:w}}});
const snapshot=UIBuilder.read(uiPath);
if(snapshot.listEntities().length!==257) console.log("Profile entity count",snapshot.listEntities().length);
console.log("Original-only profile UI written",snapshot.getId(w));
