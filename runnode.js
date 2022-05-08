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

      const config = JSON.parse(file);
      const {key, target, port, sslport} = config;
      if(file) {
         node(key, target, site, port); 
      } else {
         node(null, target, site, sslport);
      }
   }
})()


