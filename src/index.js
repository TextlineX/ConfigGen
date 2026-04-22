const fs = require('fs');
const path = require('path');

// 获取项目根目录
const projectRoot = path.join(__dirname, '..');

const generators = {
  singbox: require(path.join(projectRoot, 'generators', 'singbox')),
  clash: require(path.join(projectRoot, 'generators', 'clash')),
  surge: require(path.join(projectRoot, 'generators', 'surge')),
  shadowrocket: require(path.join(projectRoot, 'generators', 'surge')),
  surfboard: require(path.join(projectRoot, 'generators', 'surge')),
};

// 读取配置文件
const inputPath = path.join(projectRoot, 'src', 'config.json');
let config;

try {
  config = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
} catch (err) {
  console.error(`[ConfigGen] Cannot read config: ${inputPath}`);
  console.error(err.message);
  process.exit(1);
}

// 生成输出目录
const outputDir = path.join(projectRoot, 'output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

console.log('[ConfigGen] Generating configs...');

for (const [name, gen] of Object.entries(generators)) {
  try {
    const result = gen(config);
    const ext = name === 'singbox' ? 'json' : name === 'clash' ? 'yaml' : 'conf';
    const outPath = path.join(outputDir, `config-${name}.${ext}`);
    fs.writeFileSync(outPath, result, 'utf-8');
    console.log(`[ConfigGen] ${name}: ${outPath}`);
  } catch (err) {
    console.error(`[ConfigGen] ${name} failed:`, err.message);
  }
}

console.log('[ConfigGen] Done!');