const fs = require('fs');
const node = require('./node.js');
const sites = fs.readdirSync('sites');
if(!fs.existsSync('run')) {
   require('./init.js');
   fs.closeSync(fs.openSync('run', 'w'));
}

for(const site of sites) {
   const file = fs.readFileSync('./sites/'+site+'/hyperconfig.json');
   const config = JSON.parse(file);
   const {key, target} = file;
   node(key, target);
}
