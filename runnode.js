(async ()=>{
   const fs = require('fs');
   const node = require('./node.js');
   if(!fs.existsSync('run')) {
      await require('./init.js')();
      fs.closeSync(fs.openSync('run', 'w'));
   }
   let file;
   try {
      file = fs.readFileSync('./site/hyperconfig.json');
   } catch(e) {}
   if(file) {
      node( JSON.parse(file).key, process.env.target, process.env.http, process.env.https); 
   } else {
      node(null, process.env.target, process.env.http, process.env.https);
   }
})()


