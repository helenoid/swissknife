// Temporary clean bootstrap replacing corrupted main.ts
import '/css/desktop.css';

interface App { id:string; title:string; loader:(el:HTMLElement)=>void; }
class MiniDesktop {
  private apps = new Map<string, App>();
  private desktop!: HTMLElement;
  private taskbar!: HTMLElement;
  private z=10;
  constructor(){ this.init(); }
  private init(){
    this.desktop=document.getElementById('desktop')||this.mk('desktop','desktop');
    this.taskbar=document.getElementById('taskbar')||this.mk('taskbar','taskbar');
    this.registerDefaults();
    this.launch('ai');
  }
  private mk(id:string, cls:string){ const el=document.createElement('div'); el.id=id; el.className=cls; document.body.appendChild(el); return el; }
  private register(app:App){ this.apps.set(app.id, app); }
  private registerDefaults(){ this.register({ id:'ai', title:'AI Chat', loader: c=>{ c.innerHTML='<div style="padding:8px;color:#ddd;font:13px system-ui">AI placeholder desktop operational.</div>'; } }); }
  launch(id:string){ const app=this.apps.get(id); if(!app) return; const w=this.makeWindow(app.title); app.loader(w.querySelector('.window-content') as HTMLElement); }
  private makeWindow(title:string){ const w=document.createElement('div'); w.className='window'; Object.assign(w.style,{position:'absolute',left:'80px',top:'70px',width:'420px',height:'300px',background:'#181818',border:'1px solid #333',display:'flex',flexDirection:'column',zIndex:String(++this.z)}); w.innerHTML=`<div class="titlebar" style="background:#262626;color:#eee;padding:4px 8px;font-size:12px;cursor:move;display:flex;gap:6px;align-items:center"><span>🧪</span><div style="flex:1">${title}</div><button data-x style="background:#444;color:#fff;border:none;padding:2px 6px;border-radius:4px;cursor:pointer;font-size:11px">✕</button></div><div class="window-content" style="flex:1;overflow:auto;background:#111"></div>`; this.desktop.appendChild(w); (w.querySelector('[data-x]') as HTMLButtonElement).onclick=()=>w.remove(); return w; }
}
if(typeof document!=='undefined'){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>new MiniDesktop()); else new MiniDesktop(); }
