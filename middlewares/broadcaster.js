define( [ "shared" ],
function( shared )
{
  /***
   * standard broadcaster
   * work with telnet and modified sockets
   * can broadcast to everyone, room or targeted user
   */
  function broadcaster( packet )
  {
    // standard broadcast
    if ( packet.room )
    {
      // nothing more to do
      if ( !shared.rooms [ packet.room ] || shared.rooms [ packet.room ].length == 0 )
        return;
      
      for ( var i = 0, s; s = shared.rooms[ packet.room ][ i ]; ++i )
      {
        if ( packet.avoid && s.nick.toLowerCase() == packet.avoid )
        {
          delete packet.avoid; // delete value to avoid test
          continue;
        }
        
        s.write( packet.msg );
      }
    }
    // global broadcasting, mainly for admins and system
    else
    {
      for ( var i = 0, s; s = shared.telnetSockets[ i ]; ++i )
      {
        if ( packet.avoid && s.nick == packet.avoid )
          continue;
        
        s.write( packet.msg );
      }
    }
  }
  
  return broadcaster;
} );