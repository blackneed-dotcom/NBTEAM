const fs=require('node:fs'),path=require('node:path');
const {ModelBuilder,vector2,vector3}=require('../../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs');
const {MapBuilder}=require('../../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs');
const R=Object.fromEntries(JSON.parse(fs.readFileSync('Docs/BaramSource/actor-ruids.json')).map(x=>[x.name,x.ruid]));
const T='MOD.Core.TransformComponent',S='MOD.Core.SpriteRendererComponent',TX='MOD.Core.TextRendererComponent';
const template=path.resolve('.agents/skills/msw-general/models/TransformOnly.model');
const mob=ModelBuilder.fromTemplate(template,'BaramCreature',{model_id:'baramcreature'}).component('MOD.Core.KinematicbodyComponent').component('MOD.Core.MovementComponent').component('MOD.Core.HitComponent').value('MOD.Core.HitComponent','IsLegacy',false,'bool').value('MOD.Core.HitComponent','BoxSize',vector2(.22,.22),'vector2').value('MOD.Core.HitComponent','ColliderOffset',vector2(0,.1),'vector2');
mob.child('Sprite',{components:[T,S]}).childValue('Sprite',T,'Position',vector3(0,.24,0),'vector3').childValue('Sprite',S,'SpriteRUID',R['actor26-420'],'string').childValue('Sprite',S,'SortingLayer','MapLayer0','string').childValue('Sprite',S,'OrderInLayer',100,'int');
mob.child('Label',{components:[T,TX]}).childValue('Label',T,'Position',vector3(0,.48,0),'vector3').childValue('Label',TX,'Font','Galmuri9','string').childValue('Label',TX,'FontSize',9,'float').childValue('Label',TX,'Text','','string').childValue('Label',TX,'SortingLayer','MapLayer0','string').childValue('Label',TX,'OrderInLayer',500,'int').childValue('Label',TX,'RectSize',vector2(1,.2),'vector2');
mob.write('RootDesk/MyDesk/Models/Monsters/BaramCreature.model');
const npc=ModelBuilder.fromTemplate(template,'BaramNpc',{model_id:'baramnpc'}).component(S).component('MOD.Core.TouchReceiveComponent').value(S,'SpriteRUID',R['actor15-197'],'string').value(S,'SortingLayer','MapLayer0','string').value(S,'OrderInLayer',100,'int').value('MOD.Core.TouchReceiveComponent','TouchArea',vector2(.3,.55),'vector2');
npc.write('RootDesk/MyDesk/Models/NPCs/BaramNpc.model');
for(const [map,id,x,y,key] of [['BaramInn',8,6,8,'actor15-197'],['BaramButcher',11,5,4,'actor12-164']]){
 const b=MapBuilder.read('map/'+map+'.map');if(!b.find('Npc'+id))b.placeModel('Npc'+id,'RootDesk/MyDesk/Models/NPCs/BaramNpc.model',{pos:[(x+.5)*.24,-(y+1)*.24+.24,0],componentOverrides:{[S]:{SpriteRUID:R[key]}}});b.write('map/'+map+'.map');
}
const drop=ModelBuilder.fromTemplate(template,'BaramGroundLabel',{model_id:'baramgroundlabel'}).component(TX).value(TX,'Font','Galmuri9','string').value(TX,'FontSize',9,'float').value(TX,'Text','물건','string').value(TX,'RectSize',vector2(1,.18),'vector2').value(TX,'SortingLayer','MapLayer0','string').value(TX,'OrderInLayer',510,'int');
drop.write('RootDesk/MyDesk/Models/Items/BaramGroundLabel.model');
const source='@Logic\nscript BaramCreatureData extends Logic\n    property table Frames = {'+[26,22].map(id=>'['+id+']={'+Array.from({length:12},(_,i)=>JSON.stringify(R['actor'+id+'-'+((id===26?414:322)+i)])).join(',')+'}').join(',')+'}\nend\n';
fs.writeFileSync('RootDesk/MyDesk/BaramWorld/BaramCreatureData.mlua',source);
