define( [ "config", "shared", "mid.rooms" ],
function( config, shared, rooms )
{
  /***
   * middle-ware used by telnet and web, check command and return result
   * Nb: write is a custom method on web-sockets, but is raw method for telnet
   */
  function commandHandler( socket, cleanData )
  {
    splited = cleanData.slice( 1, cleanData.length ).split( " " );
    
    // check data is ok
    if ( splited.length > 1 )
    {
      splited[ 1 ] = splited[ 1 ].replace( / /gi, "" )
    }
    // add empty stuff to avoid more checking and/or errors
    else
      splited[ 1 ] = "";
    
    switch( splited[ 0 ].toLowerCase() )
    {
      /***
       * disconnect
       */
      case "end":
        socket.end( 'Goodbye!' );
        break;
      
      /***
       * set or change nickname
       */
      case "nick":
        var nick = splited[ 1 ];
        if ( nick != "" )
        {
          // some checking
          if ( nick.length < config.NICK_MIN || nick.length > config.NICK_MAX )
          {
            socket.write( 'Nickname must be between ' + config.NICK_MIN + ' and ' + config.NICK_MAX + ' characters' );
            return;
          }
          if ( !nick.match( /^[A-Z0-9]+$/gi ) )
          {
            socket.write( 'A nickname can contain only letters and numbers' );
            return;
          }
          
          for ( var i in shared.socketsByNick )
          {
            if ( i == nick )
            {
              socket.write( 'This nickname is already used, pick an other.' );
              return;
            }
          }
          
          if ( !socket.nick )
          {
            socket.nick = nick;
            socket.write( 'Welcome on board ' + socket.nick + ' you are now able to chat !' );
            shared.socketsByNick[ socket.nick.toLowerCase() ] = socket;
            rooms.join( socket, config.mainRoom );
          }
          else
          {
            socket.nick = nick;
            socket.write( 'Nickname changed to ' + socket.nick );
          }
        }
        else
          socket.write( 'Please set a nick by typing /nick MyNickName before chatting' );
        break;
      
      // join a room
      case "join":
        if ( splited[ 1 ] != "" )
          rooms.join( socket, splited[ 1 ].toLowerCase() );
        else
          socket.write( 'To join a room please type a room name. Ex: /join myRoom' );
        break;
      
      // leave a room
      case "leave":
        if ( socket.room != config.mainRoom )
          rooms.leave( socket );
        else
          socket.write( 'You are not in a room, to disconnect type /end' );
        break;
      
      /***
       * private message
       */
      case "pm":
      case "whisper":
      case "mp":
      case "to":
        if ( splited[ 1 ] == "" || splited.length < 3 || splited[ 2 ].trim() == "" )
        {
          socket.write( "for a private message type /to userName message" );
          return;
        }
        var msg = "";
        for ( var i = 2; i < splited.length; ++i )
          msg += splited[ i ].trim() + " ";
        
        // if the targeted user is in the same worker we don't need to send to master
        if ( shared.socketsByNick[ splited[ 1 ].toLowerCase() ] )
        {
          var to = shared.socketsByNick[ splited[ 1 ].toLowerCase() ];
          to.write( "from " + socket.nick + ": " + msg );
          socket.write( "to " + to.nick + ": " + msg );
        }
        // we have to use send a request to master and check in all workers if the user exist
        else
        {
          process.send( {
            cmd           : "private-message"
            // id suppose that user cannot send 2 private message in the same millisecond
            // if we want to do it perfectly we could add a randomness but in most of case it's enough
            ,id           : "pm-" + splited[ 1 ] + "-" + socket.nick + ( Date.now().toString() )
            ,msg          : msg
            ,from         : socket.nick.toLowerCase()
            ,cleanFrom    : socket.nick
            ,to           : splited[ 1 ].toLowerCase()
            ,fromWorker   : shared.workerId
            // this will store true or false if the worker found the user
            // when all workers gave result, we know if user is online or not
            ,testedWorkers: []
          } );
        }
        break;
      
      default:
        socket.write( "Command unknown" );
    }
  }
  
  return commandHandler;
} );