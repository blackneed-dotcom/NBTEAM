const {UIBuilder}=require('../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const h=UIBuilder.read('ui/BaramHUD.ui'),m=UIBuilder.read('ui/BaramMenu.ui');
const win='/ui/BaramMenu/MenuOverlay/Window',btn='/ui/BaramHUD/Frame/MenuButton';
function art(b,p,r){b.patchComponent(p,'MOD.Core.SpriteGUIRendererComponent',{ImageRUID:{DataId:r},Color:{r:1,g:1,b:1,a:1},Type:0});}
art(h,btn,'42f935a1778245afb0d9636bc0d7b8fe');
h.patch(btn,{pos:[361,-453],rect_size:[60,16]});
h.patch('/ui/BaramHUD/Frame/ChatEntry',{rect_size:[344,18]});
h.patch('/ui/BaramHUD/Frame/ChatEntry/Input',{rect_size:[297,12]});
h.patch('/ui/BaramHUD/Frame/ChatHint',{rect_size:[341,12]});
art(m,win,'4924358c7b674d64a7166b5f224b0e31');
art(m,win+'/Close','42f935a1778245afb0d9636bc0d7b8fe');
art(m,win+'/Warp','f5b7220db9444579803606b1e9c1d84f');
m.patch(win+'/Warp',{pos:[103,-53],rect_size:[28,40]});
art(m,win+'/Codex','934837314e7b4505a6c2ba9a817edc9f');
m.patch(win+'/Codex',{pos:[167,-54],rect_size:[32,38]});
for(const name of ['Title','MyInfoLabel','WarpLabel','CodexLabel','SettingsLabel','Close/Label'])m.patchComponent(win+'/'+name,'MOD.Core.TextGUIRendererComponent',{FontColor:{r:0.19,g:0.10,b:0.035,a:1}});
h.write('ui/BaramHUD.ui');m.write('ui/BaramMenu.ui');
