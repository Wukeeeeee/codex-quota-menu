const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const root = __dirname;
const source = path.resolve(process.argv[2] || '');
const artifactsOnly = process.argv[3] === '--artifacts';
const destination = path.join(root, artifactsOnly ? 'inplace-artifacts' : 'client');
const archivePath = path.join(source, 'resources', 'app.asar');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function readHeader(file) {
  const fd = fs.openSync(file, 'r');
  const prefix = Buffer.alloc(8); fs.readSync(fd, prefix, 0, 8, 0);
  requireCondition(prefix.readUInt32LE(0) === 4, '无法识别客户端归档格式。');
  const headerSize = prefix.readUInt32LE(4);
  const header = Buffer.alloc(headerSize); fs.readSync(fd, header, 0, headerSize, 8);
  const text = header.subarray(8, 8 + header.readUInt32LE(4));
  return { fd, dataStart: 8 + headerSize, text, json: JSON.parse(text.toString()) };
}
const archive = readHeader(archivePath);
const entries = [];
function walk(node, prefix = '') {
  for (const [name, entry] of Object.entries(node.files || {})) {
    const namePath = prefix ? `${prefix}/${name}` : name;
    if (entry.files) walk(entry, namePath);
    else if (entry.offset !== undefined && !entry.unpacked) entries.push({ name: namePath, entry });
  }
}
walk(archive.json);
function read(entry) {
  const buffer = Buffer.alloc(entry.size);
  fs.readSync(archive.fd, buffer, 0, buffer.length, archive.dataStart + Number(entry.offset));
  return buffer;
}
const changed = new Map();

let usageMatch;
for (const candidate of entries.filter(x => /^webview\/assets\/app-initial-.*\.js$/.test(x.name))) {
  const text = read(candidate.entry).toString();
  const match = /async function ([\w$]+)\(\{additionalHeaders:([\w$]+),signal:([\w$]+)\}\)\{try\{return ([\w$]+)\(await ([\w$]+)\.safeGet\(`\/wham\/usage`,/.exec(text);
  if (match) { usageMatch = { ...candidate, text, match }; break; }
}
requireCondition(usageMatch, '新版额度接口结构发生变化，补丁已停止。');
const { text: usageText, match } = usageMatch;
const [_, fetchName, headerName, signalName, mapperName] = match;
const mapperPattern = new RegExp(`function ${mapperName.replace(/[$]/g, '\\$&')}\\(([\\w$]+)\\)\\{`);
const mapper = mapperPattern.exec(usageText);
requireCondition(mapper, '找不到额度数据解析入口。');
const mapperArg = mapper[1];
let patchedUsage = usageText.replace(mapper[0], `${mapper[0]}try{globalThis.__quotaMenuRendererV1?.update(${mapperArg})}catch{}`);
const following = usageText.slice(match.index).match(/\}\}var [\w$,]+;function ([\w$]+)\(\)\{return\(/);
requireCondition(following, '找不到额度服务初始化入口。');
const initName = following[1];
const rendererHook = fs.readFileSync(path.join(root,'renderer-hook.js'),'utf8').replaceAll('__QUOTA_INIT__',initName).replaceAll('__QUOTA_FETCH__',fetchName);
patchedUsage += '\n' + rendererHook;
changed.set(usageMatch.name, Buffer.from(patchedUsage));

for (const [name, data] of changed) {
  if (name.startsWith('.vite/')) new vm.Script(data.toString(), { filename: name });
}
const targetMeta = path.join(destination, 'quota-patch.json');
if (fs.existsSync(targetMeta)) {
  const old = JSON.parse(fs.readFileSync(targetMeta));
  if (old.source === source && old.originalHeaderHash === sha(archive.text) && old.patchHash === sha(Buffer.concat([...changed.values()]))) {
    fs.closeSync(archive.fd); console.log(JSON.stringify({status:'ready',client:destination})); process.exit(0);
  }
  requireCondition(old.source === source && old.originalHeaderHash === sha(archive.text), '补丁副本已有其他版本，请先关闭补丁客户端并运行更新脚本。');
}
fs.mkdirSync(destination, { recursive:true });
function linkTree(from, to) {
  fs.mkdirSync(to, {recursive:true});
  for (const entry of fs.readdirSync(from, {withFileTypes:true})) {
    const oldPath = path.join(from, entry.name), newPath = path.join(to, entry.name);
    if (oldPath === archivePath || oldPath === path.join(source, 'ChatGPT.exe')) continue;
    if (entry.isDirectory()) linkTree(oldPath, newPath);
    else if (!fs.existsSync(newPath)) {
      try { fs.linkSync(oldPath, newPath); }
      catch { fs.copyFileSync(oldPath, newPath); }
    }
  }
}
if (!artifactsOnly) linkTree(source, destination);
else fs.mkdirSync(path.join(destination, 'resources'), {recursive:true});

const modifications = [...changed].map(([name, data]) => {
  const record = entries.find(x => x.name === name);
  return {name,data,entry:record.entry,oldOffset:Number(record.entry.offset),oldSize:record.entry.size};
}).sort((a,b) => a.oldOffset-b.oldOffset);
for (const record of entries) {
  const oldOffset = Number(record.entry.offset);
  const delta = modifications.filter(x => x.oldOffset < oldOffset).reduce((sum,x)=>sum+x.data.length-x.oldSize,0);
  record.entry.offset = String(oldOffset+delta);
  const change = modifications.find(x=>x.name === record.name);
  if (change) {
    const blockSize=record.entry.integrity?.blockSize || 4194304;
    record.entry.size=change.data.length;
    record.entry.integrity={algorithm:'SHA256',hash:sha(change.data),blockSize,blocks:[]};
    for(let start=0;start<change.data.length;start+=blockSize) record.entry.integrity.blocks.push(sha(change.data.subarray(start,start+blockSize)));
  }
}
const newHeader=Buffer.from(JSON.stringify(archive.json));
const padding=(4-newHeader.length%4)%4;
const pickle=Buffer.alloc(8+newHeader.length+padding);
pickle.writeUInt32LE(pickle.length-4,0);pickle.writeUInt32LE(newHeader.length,4);newHeader.copy(pickle,8);
const prefix=Buffer.alloc(8);prefix.writeUInt32LE(4,0);prefix.writeUInt32LE(pickle.length,4);
const targetArchive=path.join(destination,'resources','app.asar');
const fdOut=fs.openSync(targetArchive,'w');fs.writeSync(fdOut,prefix);fs.writeSync(fdOut,pickle);
const buffer=Buffer.alloc(8*1024*1024);
function copyRange(start,length){
  while(length>0){const count=Math.min(length,buffer.length);const n=fs.readSync(archive.fd,buffer,0,count,start);requireCondition(n>0,'归档读取不完整。');fs.writeSync(fdOut,buffer,0,n);start+=n;length-=n;}
}
let cursor=0;
for(const change of modifications){copyRange(archive.dataStart+cursor,change.oldOffset-cursor);fs.writeSync(fdOut,change.data);cursor=change.oldOffset+change.oldSize;}
copyRange(archive.dataStart+cursor,fs.fstatSync(archive.fd).size-archive.dataStart-cursor);
fs.closeSync(fdOut);fs.closeSync(archive.fd);

// Keep archive validation enabled; update only the expected archive hash in this local copy.
const originalExe=fs.readFileSync(path.join(source,'ChatGPT.exe'));
const oldHash=Buffer.from(sha(archive.text));
const hashOffset=originalExe.indexOf(oldHash);
requireCondition(hashOffset>=0 && originalExe.indexOf(oldHash,hashOffset+1)<0,'找不到唯一的归档完整性记录。');
Buffer.from(sha(newHeader)).copy(originalExe,hashOffset);
fs.writeFileSync(path.join(destination,'ChatGPT.exe'),originalExe);
const metadata={version:1,source,originalHeaderHash:sha(archive.text),headerHash:sha(newHeader),patchHash:sha(Buffer.concat([...changed.values()])),files:[...changed.keys()],createdAt:new Date().toISOString()};
fs.writeFileSync(targetMeta,JSON.stringify(metadata,null,2));
console.log(JSON.stringify({status:'built',client:destination,files:metadata.files,headerHash:metadata.headerHash}));

