(async ()=>{
   const fs = require('fs');
   const node = require('./node.js');
   if(!fs.existsSync('run')) {
      await require('./init.js')();
      fs.closeSync(fs.openSync('run', 'w'));
   }
   const sites = fs.readdirSync('sites');

   for(const site of sites) {
      let file;
      try {
         file = fs.readFileSync('./sites/'+site+'/hyperconfig.json');
      } catch(e) {}

      if(file) {
         const config = JSON.parse(file);
         const {key, target} = config;
         node(key, target); 
      } else {
         node(null, target, site);
      }
   }
})()


