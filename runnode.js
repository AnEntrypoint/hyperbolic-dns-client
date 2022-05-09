(async ()=>{
   const fs = require('fs');
   const node = require('./node.js');
   if(!fs.existsSync('run')) {
      await require('./init.js')();
      fs.closeSync(fs.openSync('run', 'w'));
   }
   routerfile = fs.readFileSync('./site/routerconfig.json');
   node(process.env.target, process.env.http, process.env.https, JSON.parse(routerfile)); 
})()


