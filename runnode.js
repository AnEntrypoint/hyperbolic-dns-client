(async ()=>{
   const fs = require('fs');
   const node = require('./node.js');
   if(!fs.existsSync('run')) {
      await require('./init.js')();
      fs.closeSync(fs.openSync('run', 'w'));
   }
   let file;
       /*router[b32pub+'.matic.ml'] = 
    {
      'n8n.l-inc.co.za' : 'http://localhost:5678',
      'code.l-inc:co.za' : 'http://localhost:8080',
       : 
  }*/

   try {
      file = fs.readFileSync('./site/hyperconfig.json');
      routerfile = fs.readFileSync('./site/routerconfig.json');
   } catch(e) {}
   if(file) {
      node( JSON.parse(file).key, process.env.target, process.env.http, process.env.https, JSON.parse(routerfile)); 
   } else {
      node( null, process.env.target, process.env.http, process.env.https, JSON.parse(routerfile) );
   }
})()


