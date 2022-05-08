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

      for({key, target} of JSON.parse(file)) {
         if(file) {
            node(key, target, site, process.env.port, process.env.sslport); 
         } else {
            node(null, target, site, process.env.port, process.env.sslport);
         }
      }
   }
})()


