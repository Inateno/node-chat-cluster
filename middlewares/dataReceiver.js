define( [ "mid.commandHandler" ],
function( commandHandler )
{
  /*
   * Cleans the input of carriage return, newline
   */
  function cleanInput( data )
  {
    return data.toString().replace( /(\r\n|\n|\r)/gm, "" );
  }
   
  /*
   * Method executed when data is received from a socket
   */
  function dataReceiver( socket, data )
  {
    var cleanData = cleanInput( data );
    if ( cleanData[ 0 ] === "/" )
    {
      commandHandler( socket, cleanData );
    }
    else
    {
      if ( !socket.nick )
      {
        socket.write( 'Please set a nick by typing /nick MyNickName before chatting' );
        return;
      }
      process.send( { cmd: "message-enter", msg: socket.nick + ": " + cleanData, room: socket.room } );
    }
  }
  
  return dataReceiver;
} );