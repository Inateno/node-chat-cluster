var requirejs = require( 'requirejs' );

requirejs.config( {
  paths: {
    "config"                 : "server_conf/config"
    ,"routes"                : "server_conf/routes"
    ,"shared"                : "server_conf/shared"
    ,"configureMaster"       : "server_conf/configureMaster"
    ,"configureWorker"       : "server_conf/configureWorker"
    
    ,"telnetInit"            : "server_conf/telnetInit"
    ,"webInit"               : "server_conf/webInit"
    
    ,"mid.broadcaster"       : "middlewares/broadcaster"
    ,"mid.commandHandler"    : "middlewares/commandHandler"
    ,"mid.dataReceiver"      : "middlewares/dataReceiver"
    ,"mid.rooms"             : "middlewares/rooms"
    ,"mid.closeSocket"       : "middlewares/closeSocket"
    //, "mid.emoticonsParser": "middlewares/emoticonsParser"
  }
} );

requirejs( [ "cluster", "configureMaster", "configureWorker" ],
function( cluster, configureMaster, configureWorker )
{
  if ( cluster.isMaster )
    configureMaster();
  else
    configureWorker( __dirname );
} );