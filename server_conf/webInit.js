define( [ "config", "shared", "express", "path", "errorhandler", "serve-favicon", "http"
        , "socket.io" /** /,"socket.io-redis", "toobusy"/**/
        , "mid.dataReceiver", "mid.broadcaster", "mid.closeSocket" ],
function( config, shared, express, path, errorHandler, favicon, http
        , socket_io /** /,socket.io-redis, toobusy/**/
        , dataReceiver, broadcaster, closeSocket  )
{
  // on windows installing toobusy is quite tricky, so this trick prevent crash if the lib doesn't exist
  var toobusy = toobusy || function(){};
  
  function webServer( dirname )
  {
    // setting up the basic server
    // we don't need sessions so we are not using cookieParser or session declaration
    // but if you want to create an accounts system and memorize sessions, just add the basic stuff here
    var app = express();
    
    var server = http.Server( app );
    var sockets = socket_io( server );
    
    app.use( express.static( path.join( dirname, '/public' ) ) );
    
    // no rendering engine, keep it simple
    
    // set a favicon
    app.use( favicon( dirname + '/public/icon.png' ) );
    
    // we could add a bodyParser and add a REST API support
    
    // only use in development
    if ( 'development' == app.get( 'env' ) )
    {
      app.use( errorHandler() )
    }
    
    // to busy handler, prevent server infinite lag from overload
    app.use( function( req, res, next )
    {
      if ( toobusy() ) res.status( 503 ).send( "Server overload, try again later please. Sorry for inconvenience." );
      else next();
    } );
    
    // this app is quite simple, no routes, simply serve the index.html in public folder
    // but in case, here is the sample
    // app.get( '/', function( req, res )
    // {
    //   res.send( "Hello there" );
    // } );
    
    // using a redis adapter ? before using it we have to checkout if this work with current broadcaster
    // sockets.adapter( socket_redis( { host: 'localhost', port: 6379 } ) );
    
    sockets.on( 'connection', function( socket )
    {
      console.log( "A socket connection appear on worker " + shared.workerId );
      socket.emit( "message-enter", "Welcome ! You are connected to the Node chat Socket !" );
      socket.emit( "message-enter", "Please set a nick by typing /nick MyNickName" );
      
      socket.write = function( message )
      {
        socket.emit( "message-enter", message.replace( /\n/gi, "<br />" ) );
      };
      
      socket.on( "send-message", function( value )
      {
        dataReceiver( socket, value );
      } );
      
      socket.end = function()
      {
        closeSocket( socket );
        socket.emit( "message-enter", "You are now disconnected" );
        socket.disconnect();
      }
    } );
    
    // launch the server listening
    server.listen( config.webPort );
  }
  
  return webServer;
} );