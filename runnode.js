(async ()=>{
   const fs = require('fs');
   const node = require('./node.js');
   if(!fs.existsSync('run')) {
      await require('./init.js')();
      fs.closeSync(fs.openSync('run', 'w'));
   }
   const sites = fs.readdirSync('sites');

   for(const site of sites) {
      const file = fs.readFileSync('./sites/'+site+'/hyperconfig.json');
      const config = JSON.parse(file);
      const {key, target} = config;
      node(key, target);
   }
})()


