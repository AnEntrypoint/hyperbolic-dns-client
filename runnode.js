
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
      node( 
         JSON.parse(file).key, 
         JSON.parse(file).target, 
         JSON.parse(file).http, 
         JSON.parse(file).https 
      ); 
   } else {
      node( 
         null, 
         JSON.parse(file).target, 
         JSON.parse(file).http, 
         JSON.parse(file).https 
      );
   }

})()

