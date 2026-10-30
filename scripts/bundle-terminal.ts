import { build } from "esbuild";
import { TERMINAL_SCROLLBAR_CSS } from "../apps/mobile/src/lib/terminal-scrollbar.js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const js = await readFile(
  new URL("../node_modules/@xterm/xterm/lib/xterm.js", import.meta.url),
  "utf8",
);
const css = await readFile(
  new URL("../node_modules/@xterm/xterm/css/xterm.css", import.meta.url),
  "utf8",
);
const fit = await readFile(
  new URL("../node_modules/@xterm/addon-fit/lib/addon-fit.js", import.meta.url),
  "utf8",
);
const font = await readFile(
  new URL(
    "../apps/mobile/assets/fonts/JetBrainsMono-Variable.ttf",
    import.meta.url,
  ),
);
const scrollbarBundle = await build({
  entryPoints: [
    new URL("../apps/mobile/src/lib/terminal-scrollbar.ts", import.meta.url)
      .pathname,
  ],
  bundle: true,
  write: false,
  format: "iife",
  globalName: "CompanionScrollbar",
  platform: "browser",
});
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:"><style>${css}${TERMINAL_SCROLLBAR_CSS}@font-face{font-family:"JetBrains Mono";src:url(data:font/ttf;base64,${font.toString("base64")})}html,body,#terminal-frame,#terminal{width:100%;height:100%;margin:0;background:#17191d}#terminal-frame{box-sizing:border-box;padding:12px 14px;overflow:hidden;background:inherit}#terminal{overflow:hidden}</style></head><body><div id="terminal-frame"><div id="terminal"></div></div><script>${js.replaceAll("</script", "<\\/script")}</script><script>${fit.replaceAll("</script", "<\\/script")}</script><script>
${scrollbarBundle.outputFiles[0]!.text}
const send=(message)=>window.ReactNativeWebView.postMessage(JSON.stringify(message));
async function start(){await document.fonts.load('14px \"JetBrains Mono\"');
const term=new Terminal({fontFamily:'JetBrains Mono',fontSize:14,scrollback:2000,screenReaderMode:true,disableStdin:true,theme:{background:'#17191d',foreground:'#d2d4d9',cursor:'#d2d4d9'}});const fit=new FitAddon.FitAddon();term.loadAddon(fit);term.open(document.getElementById('terminal'));CompanionScrollbar.installTerminalScrollbar(term);
let directInput=false;term.attachCustomKeyEventHandler(()=>directInput);let collecting=null;term.onData(data=>{if(collecting)collecting.push(data);else send({type:'input',data});});
function receive(event){try{const message=JSON.parse(event.data);if(message.type==='output'){const raw=atob(message.data),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));term.write(bytes,()=>send({type:'consumed',id:message.id}));}if(message.type==='control'){directInput=message.direct??true;term.options.disableStdin=!message.enabled;const input=document.querySelector('.xterm-helper-textarea');if(input)input.readOnly=message.direct===false;}if(message.type==='encodePaste'){collecting=[];const disabled=term.options.disableStdin;try{term.options.disableStdin=false;term.paste(message.text);send({type:'pasteEncoded',id:message.id,data:collecting.join('')});}finally{collecting=null;term.options.disableStdin=disabled;}}if(message.type==='focus')term.focus();if(message.type==='blur')term.blur();if(message.type==='theme'){term.options.theme=message.theme;document.documentElement.style.background=message.theme.background;document.body.style.background=message.theme.background;document.getElementById('terminal').style.background=message.theme.background;}}catch{}}
document.addEventListener('message',receive);window.addEventListener('message',receive);
function resize(){fit.fit();send({type:'resize',cols:term.cols,rows:term.rows});}
window.addEventListener('resize',resize);send({type:'ready'});resize();}
start();
</script></body></html>`;
await mkdir(new URL("../packages/terminal-web/", import.meta.url), {
  recursive: true,
});
await writeFile(
  new URL(
    "../apps/mobile/src/components/terminal-document.ts",
    import.meta.url,
  ),
  `// Generated from @xterm/xterm; MIT license in packages/terminal-web/LICENSE.xterm.\nexport const terminalDocument = ${JSON.stringify(html)};\n`,
);
await writeFile(
  new URL("../packages/terminal-web/LICENSE.xterm", import.meta.url),
  await readFile(
    new URL("../node_modules/@xterm/xterm/LICENSE", import.meta.url),
    "utf8",
  ),
);

await writeFile(
  new URL("../packages/terminal-web/LICENSE.addon-fit", import.meta.url),
  await readFile(
    new URL("../node_modules/@xterm/addon-fit/LICENSE", import.meta.url),
    "utf8",
  ),
);
