const {UIBuilder}=require('../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b=new UIBuilder('BaramItemCodex');b.group('/ui/BaramItemCodex',{group_order:110});
const frame='4924358c7b674d64a7166b5f224b0e31',button='42f935a1778245afb0d9636bc0d7b8fe',card='549a77decfa34134ad00907ab23eaa48';
function sprite(p,r,pos,size,extra={}){b.sprite(p,{anchor:'top-left',pivot:[0,1],pos,rect_size:size,image_ruid:r,color:'#FFFFFF',sprite_type:0,...extra});}
function text(p,t,pos,size,font=11,color='#311909'){b.text(p,t,{anchor:'top-left',pivot:[0,1],pos,rect_size:size,size:font,color,alignment:3});b.patchComponent(p,'MOD.Core.TextGUIRendererComponent',{Font:'Galmuri11',Overflow:0});}
function btn(p,t,pos,size){sprite(p,button,pos,size,{raycast:true});b.addComponent(p,'MOD.Core.UITouchReceiveComponent');text(p+'/Label',t,[0,0],size);b.patchComponent(p+'/Label','MOD.Core.TextGUIRendererComponent',{HorizontalAlignment:2});}
const root='/ui/BaramItemCodex/Overlay',win=root+'/Window';
sprite(root,frame,[0,0],[1920,1080],{anchor:'stretch',pivot:[0.5,0.5],alpha:0,raycast:true});b.patch(root,{enable:false});
sprite(win,'4c53a45f0b6c45bcbfd0c7238d28aa8d',[0,0],[580,400],{anchor:'center',pivot:[0.5,0.5],raycast:true});
sprite(win+'/DragArea',frame,[16,0],[548,52],{alpha:0,raycast:true});b.addComponent(win+'/DragArea','MOD.Core.UITouchReceiveComponent');b.addComponent(win,'script.BaramDialogDrag');
text(win+'/Title','아이템 도감',[56,-24],[225,26],17);
text(win+'/Progress','등록 0/600   공격력 +0',[300,-22],[248,22],11);
const entries=[['도토리','다람쥐','초보사냥터','공격력 +1'],['토끼고기','토끼','초보사냥터','보상 추후 추가'],['쥐고기','쥐 · 큰쥐 · 시궁쥐','쥐굴','보상 추후 추가'],['박쥐고기','박쥐 · 빨간박쥐','쥐굴','보상 추후 추가'],['뱀고기','독사 · 백사','뱀굴','보상 추후 추가'],['웅담','곰','곰굴','보상 추후 추가']];
entries.forEach(([name,monster,region,reward],i)=>{
 let p=win+'/Row'+(i+1),x=26+(i%2)*274,y=64+Math.floor(i/2)*94;
 sprite(p,'51880f12e7884d6f993f4fcfef299106',[x,-y],[254,88]);
 sprite(p+'/IconFrame','dba7a2c3d7564d098cb3699f615c1d2f',[5,-5],[66,78]);
 sprite(p+'/Icon','a292a51da7404fe68a4c8b220df9cd3c',[38,-42],[18,15],{pivot:[0.5,0.5]});
 text(p+'/Name',name,[80,-3],[165,16],12);
 text(p+'/Count','0/100',[80,-20],[166,14],10);
 text(p+'/Source',monster+'\n'+region,[80,-36],[168,28],10);
 text(p+'/Reward',reward,[80,-66],[100,15],9);
 btn(p+'/Register','등록',[190,-65],[56,18]);
});
btn(win+'/Close','닫기',[254,-367],[72,18]);
const prompt=root+'/Prompt';sprite(prompt,frame,[0,0],[260,160],{anchor:'center',pivot:[0.5,0.5],raycast:true});b.patch(prompt,{enable:false,display_order:200});
sprite(prompt+'/DragArea',frame,[8,0],[244,25],{alpha:0,raycast:true});b.addComponent(prompt+'/DragArea','MOD.Core.UITouchReceiveComponent');b.addComponent(prompt,'script.BaramDialogDrag');
text(prompt+'/Question','몇 개를 등록할까요?',[26,-27],[208,50],11);
b.textInput(prompt+'/Amount',{anchor:'top-left',pivot:[0,1],pos:[70,-84],rect_size:[120,24],image_ruid:button,sprite_type:0,bg_color:'#FFFFFF',font_size:12,color:'#311909',content_type:2,char_limit:3,text:'1',placeholder:'수량'});
b.patchComponent(prompt+'/Amount','MOD.Core.TextGUIRendererComponent',{Font:'Galmuri11',Overflow:0});
btn(prompt+'/Confirm','등록',[49,-121],[72,18]);btn(prompt+'/Cancel','취소',[139,-121],[72,18]);
b.write('ui/BaramItemCodex.ui');
const menu=UIBuilder.read('ui/BaramMenu.ui');let p='/ui/BaramMenu/MenuOverlay/Window/Codex';menu.patchComponent(p,'MOD.Core.SpriteGUIRendererComponent',{RaycastTarget:true});menu.upsertComponent(p,'MOD.Core.UITouchReceiveComponent');
p='/ui/BaramMenu/MenuOverlay/Window/CodexLabel';menu.patchComponent(p,'MOD.Core.SpriteGUIRendererComponent',{RaycastTarget:true});menu.upsertComponent(p,'MOD.Core.UITouchReceiveComponent');menu.write('ui/BaramMenu.ui');
