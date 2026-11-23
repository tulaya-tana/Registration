// Move embedded data: images out of glTF .json files into sibling .png files (artifact CSP blocks fetch of data: URIs)
const fs=require('fs'),path=require('path');
for(const f of process.argv.slice(2)){const j=JSON.parse(fs.readFileSync(f,'utf8'));let n=0;
 (j.images||[]).forEach((im,i)=>{const m=/^data:(image\/\w+);base64,(.*)$/.exec(im.uri||'');if(!m)return;const ext=m[1].split('/')[1];
  const name=path.basename(f,'.json')+'_'+i+'.'+ext;fs.writeFileSync(path.join(path.dirname(f),name),Buffer.from(m[2],'base64'));im.uri=name;n++});
 fs.writeFileSync(f,JSON.stringify(j));console.log(path.relative(process.cwd(),f),n,'images')}
