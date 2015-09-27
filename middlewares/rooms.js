define( [ "config", "shared" ],
function( config, shared )
{
  /***
   * Rooms is a namespace used to store rooms and sockets
   * this is used only by telnet because socket.io got a room manager inside
   */
  var rooms = new function()
  {
    /***
     * join a room
     */
    this.join = function( socket, roomName )
    {
      if ( roomName == socket.room )
        return;
      
      if ( !shared.rooms[ roomName ] )
        shared.rooms[ roomName ] = [];
      shared.rooms[ roomName ].push( socket );
      
      // on first join there is no room defined
      if ( socket.room )
      {
        socket.write( 'You leaved room ' + socket.room + ' and entered ' + roomName + ". " );
        this.leave( socket, roomName );
      }
      
      // send message to other users
      process.send( {
        cmd   : "message-enter"
        ,msg  : socket.nick + " joined the room"
        ,room : roomName
        ,avoid: socket.nick.toLowerCase()
      } );
      
      socket.room = roomName;
    };
    
    /***
     * leave the current room, set room in global if there is no destination
     */
    this.leave = function( socket, destRoom )
    {
      // prevent leaving main room
      if ( socket.room == "global" && !destRoom )
        return;
      
      var room = shared.rooms[ socket.room ];
      var i = room.indexOf( socket );
      if ( i != -1 )
        room.splice( i, 1 );
      
      // send message to other users
      process.send( {
        cmd   : "message-enter"
        ,msg  : socket.nick + " leaved the room"
        ,room : socket.room
        ,avoid: socket.nick.toLowerCase()
      } );
      
      if ( !destRoom )
        this.join( socket, config.mainRoom );
    };
  };
  
  return rooms;
} );