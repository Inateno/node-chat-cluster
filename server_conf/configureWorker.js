define( [ "config", "shared", "net"
        , "mid.broadcaster", "telnetInit", "webInit" ],
function( config, shared, net
        , broadcaster, telnetInit, webInit )
{
  function configureWorker( dirname )
  {
    // init telnet
    var server = net.createServer( telnetInit );
    server.listen( config.telnetPort );
    
    // init web server / sockets
    webInit( dirname );
    
    /***
     * execute message from master
     */
    process.on( 'message', function( packet )
    {
      switch( packet.cmd )
      {
        case "worker-id":
          shared.workerId = packet.value;
          console.log( "worker " + shared.workerId + " ready" )
          break;
        
        /***
         * master forward each user msg to each workers
         * and broadcast it inside telnet-server and web-server
         */
        case "dispatch-msg":
          broadcaster( packet );
          break;
        
        // when master try to send a private message, check if user is in this instance
        case "private-message":
          var result = false;
          var to = shared.socketsByNick[ packet.request.to ];
          if ( to )
          {
            result = true;
            to.write( "from " + packet.request.cleanFrom + ": " + packet.request.msg );
          }
          // send clean nick (without lowerCase)
          process.send( { cmd: "private-message-result", request: packet.request, result: result, cleanTo: to ? to.nick : undefined } );
          break;
        
        // callback for result after looking in other workers
        case "private-message-result":
          if ( packet.result )
            shared.socketsByNick[ packet.from ].write( "to " + packet.cleanTo + ": " + packet.msg );
          else
            shared.socketsByNick[ packet.from ].write( "cannot find user " + packet.to );
          break;
      }
    } );
  }
  
  return configureWorker;
} );