// Convert .glb files to self-contained glTF JSON (.json) — artifact hosting serves .json but not .glb
const {NodeIO,Format}=require('@gltf-transform/core');const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');const fs=require('fs');
(async()=>{const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
for(const f of process.argv.slice(2)){const doc=await io.read(f);const {json,resources}=await io.writeJSON(doc,{format:Format.GLTF});
 const data=(uri,mime)=>`data:${mime};base64,`+Buffer.from(resources[uri]).toString('base64');
 (json.buffers||[]).forEach(b=>{if(b.uri&&resources[b.uri])b.uri=data(b.uri,'application/octet-stream')});
 (json.images||[]).forEach(im=>{if(im.uri&&resources[im.uri])im.uri=data(im.uri,im.mimeType||'image/png')});
 const out=f.replace(/\.glb$/,'.json');fs.writeFileSync(out,JSON.stringify(json));fs.unlinkSync(f);console.log(out.split('/').slice(-2).join('/'),(fs.statSync(out).size>>10)+'KB')}})();
