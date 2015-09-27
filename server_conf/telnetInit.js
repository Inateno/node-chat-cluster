define( [ "config", "shared", "mid.dataReceiver", "mid.broadcaster" ],
function( config, shared, dataReceiver, broadcaster )
{
  /***
   * Simple Method executed when a socket ends
   */
  function closeSocket( socket )
  {
    console.log( ( socket.nick || "guest" ) + " leaved" );
    var i = shared.telnetSockets.indexOf( socket );
    if ( i != -1 )
    {
      shared.telnetSockets.splice( i, 1 );
      if ( socket.nick )
        delete shared.socketsByNick[ socket.nick ];
    }
    broadcaster( { room: socket.room || "main", msg: ( socket.nick || "guest " ) + " disconnected" } );
  }
  
  function newSocket( socket )
  {
    console.log( "A connection appear on worker " + shared.workerId );
    shared.telnetSockets.push( socket );
    
    socket.__write = socket.write
    // socket._write = socket.write;
    // avoid typing \n each time, call __write for raw format
    socket.write = function( msg )
    {
      this.__write( msg + "\n\r" );
    };
    socket.write( 'Welcome ! You are connected to the Node chat Telnet !' );
    socket.write( 'Please set a nick by typing /nick MyNickName' );
    
    var _currentString = "";
    socket.on( 'data', function( data )
    {
      var str = data.toString();
      
      /***
       * this part is nasty due to windows telnet client
       * it's sending "\r\n" when type enter
       */
      if ( str.charCodeAt() == 13 && _currentString == "" )
        return;
      else if ( str.length > 1 )
      {
        // if it's a standard telnet client, str length should be > 1 and _currentString == ""
        if ( str.length > 1 && str.charCodeAt( 0 ) != 13 )
          _currentString = str;
        
        dataReceiver( socket, _currentString );
        _currentString = "";
      }
      else
      {
        _currentString = _currentString + str;
      }
    } );
    socket.on( 'end', function()
    {
      closeSocket( socket );
    } );
  }
  
  return newSocket;
} );