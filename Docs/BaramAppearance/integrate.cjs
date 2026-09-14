const fs = require('fs');
const assets = require('./assets.json').assets;
const uploaded = new Map(require('./ruids.json').map(x => [x.name,x.ruid]));
const ruid = a => { const r=uploaded.get(a.canonical); if(!r)throw Error(a.name); return r; };
const body = [0,1].map(style=>assets.filter(a=>a.kind.toLowerCase()==='body' && a.style===style).map(ruid));
const head = Array.from({length:10},(_,style)=>assets.filter(a=>a.kind.toLowerCase()==='head' && a.style===style).map(ruid));
if(body.some(x=>x.length!==12)||head.some(x=>x.length!==12))throw Error('Frame count');
const lua = x=>Array.isArray(x)?'{'+x.map(lua).join(',')+'}':JSON.stringify(x);
fs.writeFileSync('RootDesk/MyDesk/BaramCharacter/BaramAppearance.mlua',`@Logic
script BaramAppearance extends Logic
    -- Original EPF layers share a 48x72 canvas and foot origin (24,60).
    property table BodyFrames = ${lua(body)}
    property table HeadFrames = ${lua(head)}

    method string GetBody(integer gender, integer frame)
        return self.BodyFrames[math.max(0, math.min(1, gender)) + 1][math.max(0, math.min(11, frame)) + 1]
    end

    method string GetHead(integer hair, integer frame)
        return self.HeadFrames[math.max(0, math.min(9, hair)) + 1][math.max(0, math.min(11, frame)) + 1]
    end
end
`);
let recipe=fs.readFileSync('Docs/BaramEntry/build.cjs','utf8');
recipe=recipe.replace("picture('Create/Preview','940d28d21a1f4aeab412e92593254d22',21,43,465,143);",`picture('Create/Preview','${body[0][6]}',48,72,451,137);
picture('Create/PreviewHead','${head[0][6]}',48,72,451,137);
b.button('Frame/Create/Turn','회전',{anchor:'top-left',pos:[523,-181],rect_size:[52,20],font_size:9,bg_color:'#80532D',color:'#FFF0D0'});
b.addComponent('Frame/Create/Turn','MOD.Core.UITouchReceiveComponent');`);
recipe=recipe.replace("text('Create/PreviewLabel','기본 외형 미리보기',374,186,202,16,9);","text('Create/PreviewLabel','머리 1 / 10',371,183,74,16,9);");
fs.writeFileSync('Docs/BaramEntry/build.cjs',recipe);
require('../BaramEntry/build.cjs');
console.log('Shared catalog and creation UI built: 2 bodies, 10 heads, 12 frames each');
