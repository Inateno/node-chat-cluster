define( [ "shared", "mid.broadcaster" ],
function( shared, broadcaster )
{
  /***
   * Simple Method executed when a socket ends
   */
  function closeSocket( socket )
  {
    console.log( ( socket.nick || "guest" ) + " left" );
    var i = shared.telnetSockets.indexOf( socket );
    if ( i != -1 )
      shared.telnetSockets.splice( i, 1 );
    
    i = shared.rooms[ socket.room ].indexOf( socket );
    if ( i != -1 )
      shared.rooms[ socket.room ].splice( i, 1 );
    
    if ( socket.nick )
      delete shared.socketsByNick[ socket.nick ];
    
    broadcaster( { room: socket.room || "main", msg: ( socket.nick || "guest " ) + " disconnected" } );
  }
  
  return closeSocket;
} );