const fs = require('node:fs');
const path = require('node:path');
const {MapBuilder} = require('../../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs');
const {ModelBuilder,vector3} = require('../../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs');
const rendered=JSON.parse(fs.readFileSync('Docs/BaramSource/rendered.json'));
const manifest=JSON.parse(fs.readFileSync('Docs/BaramSource/m1-manifest.json'));
const ruids=Object.fromEntries(JSON.parse(fs.readFileSync('Docs/BaramSource/ruids.json')).map(r=>[r.name,r.ruid]));
const names={14:'BaramBuyeo',15:'BaramInn',7:'BaramButcher',315:'BaramBeginner'};
const labels={14:'부여성',15:'부여주막',7:'부여푸줏간',315:'부여왕초보사냥터1'};
const template=path.resolve('.agents/skills/msw-general/models/TransformOnly.model');
const S='MOD.Core.SpriteRendererComponent',T='MOD.Core.TransformComponent';
const chunkFile='RootDesk/MyDesk/Models/MapObjects/BaramMapChunk.model';
ModelBuilder.fromTemplate(template,'BaramMapChunk',{model_id:'barammapchunk'}).component(S).value(S,'SpriteRUID',ruids[rendered.assets[0].name],'string').value(S,'SortingLayer','MapLayer0','string').write(chunkFile);
const bodySource=fs.readFileSync('RootDesk/MyDesk/BaramCharacter/BaramAppearance.mlua','utf8');
const initial=bodySource.match(/[a-f0-9]{32}/)[0];
const actor=ModelBuilder.fromTemplate(template,'BaramWorldVisual',{model_id:'baramworldvisual'});
for(const child of ['Body','Head'])actor.child(child,{components:[T,S]}).childValue(child,T,'Position',vector3(0,.24,0),'vector3').childValue(child,S,'SpriteRUID',initial,'string').childValue(child,S,'SortingLayer','MapLayer0','string').childValue(child,S,'OrderInLayer',child==='Head'?101:100,'int');
actor.write('RootDesk/MyDesk/Models/Characters/BaramWorldVisual.model');
for(const m of rendered.maps){
 const name=names[m.id]; const file=`map/${name}.map`;
 if(fs.existsSync(file))throw Error('Map exists; patch existing map explicitly: '+file);
 const b=MapBuilder.fromTemplate('map/BaramMinimalTest.map',name);
 if(b.getTileMapMode()!==1)throw Error('RectTile required');
 for(const n of ['BaramActor','BaramBa000010Ground','BaramBa000010Objects','BaramMap000000','ChaseMonsterTemplate','MoveMonsterTemplate','StaticMonsterTemplate'])if(b.find(n))b.remove(n);
 b.patch('RectTileMap',{enable:false});
 b.patch('SpawnLocation',{pos:[.12,-.12,0]});
 for(const a of rendered.assets.filter(a=>a.mapId===m.id)){
  if(!ruids[a.name])throw Error('Missing '+a.name);
  b.placeModel(a.name,chunkFile,{pos:[(a.x+a.w/2)/100,-(a.y+a.h/2)/100,0],componentOverrides:{[S]:{SpriteRUID:ruids[a.name],OrderInLayer:a.layer==='ground'?0:10}}});
 }
 b.write(file);
}
// Sector membership is the documented MapBuilder coverage gap; preserve other settings.
const sectorFile='Global/SectorConfig.config';const sector=JSON.parse(fs.readFileSync(sectorFile));
const entries=sector.ContentProto.Json.Sectors[0].entries;
for(const name of Object.values(names))if(!entries.some(e=>e.toLowerCase()==='map://'+name.toLowerCase()))entries.push('map://'+name.toLowerCase());
fs.writeFileSync(sectorFile,JSON.stringify(sector,null,2));
function lua(v){if(v===null)return'nil';if(Array.isArray(v))return'{'+v.map(lua).join(',')+'}';if(typeof v==='object')return'{'+Object.entries(v).map(([k,v])=>'['+lua(k)+']='+lua(v)).join(',')+'}';return JSON.stringify(v)}
const maps=Object.fromEntries(rendered.maps.map(m=>[m.id,{name:names[m.id],label:labels[m.id],cols:m.cols,rows:m.rows,pass:m.pass}]));
const portals=manifest.portals.map(({source,...p})=>p);
const source=`@Logic\nscript BaramWorldData extends Logic\n    -- Generated from local CMAP, warp_db and item_db; coordinates are original 24 px cells.\n    property table Maps = ${lua(maps)}\n    property table Portals = ${lua(portals)}\n    property table Items = ${lua(Object.fromEntries(manifest.items.map(i=>[i.id,i])))}\n    method table Map(integer id)\n        return self.Maps[tostring(id)]\n    end\n    method table Item(integer id)\n        return self.Items[tostring(id)]\n    end\n    method Vector3 Position(integer x, integer y)\n        return Vector3((x + 0.5) * 0.24, -(y + 1) * 0.24, 0)\n    end\n    method boolean Walkable(integer id, integer x, integer y)\n        local m = self:Map(id)\n        if m == nil or x < 0 or y < 0 or x >= m.cols or y >= m.rows then return false end\n        for _, p in ipairs(self.Portals) do if p.from == id and p.x == x and p.y == y then return true end end\n        return string.sub(m.pass[y + 1], x + 1, x + 1) == "1"\n    end\nend\n`;
fs.mkdirSync('RootDesk/MyDesk/BaramWorld',{recursive:true});
fs.writeFileSync('RootDesk/MyDesk/BaramWorld/BaramWorldData.mlua',source);
console.log('Built 4 maps, 38 chunks, 2 models, source collision and 17 portals.');
