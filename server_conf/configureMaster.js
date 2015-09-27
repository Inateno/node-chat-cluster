define( [ "config", "cluster", "os" ],
function( config, cluster, os )
{
  var maxWorkers = os.cpus().length;
  var workers = [];
  
  /***
   * used to send messages to all workers
   */
  function dispatchMsg( packet )
  {
    packet.cmd = "dispatch-msg";
    for ( var i = 0, w; w = workers[ i ]; ++i )
    {
      w.send( packet );
    }
  }
  
  var _usersRequests = {};
  function configureMaster()
  {
    var spawn = function( i )
    {
      workers[ i ] = cluster.fork(); // create worker
      
      // restart worker on exit
      workers[ i ].on( 'exit', function( worker, code, signal )
      {
        console.log( 'Respawning worker', i );
        spawn( i );
      } );
      
      // store request that need a check in all workers and have to be stored while waiting results
      
      // when a worker send message to master
      workers[ i ].on( 'message', function( packet )
      {
        switch( packet.cmd )
        {
          case "message-enter":
            dispatchMsg( packet );
            break;
          
          /***
           * private message main handler
           * this is a little bit tricky, we have to check in all workers if the users exist and store result
           */
          case "private-message":
            _usersRequests[ packet.id ] = packet;
            for ( var i = 0, w; w = workers[ i ]; ++i )
            {
              if ( i == packet.fromWorker )
                continue;
              w.send( { cmd: "private-message", request: packet } );
            }
            break;
          
          /***
           * handle worker result
           */
          case "private-message-result":
            var request = _usersRequests[ packet.request.id ];
            request.testedWorkers.push( packet.result );
            // if user is found or not after parsing all workers except ours
            if ( packet.result == true || request.testedWorkers.length == workers.length - 1 )
            {
              request.cmd     = "private-message-result";
              request.result  = packet.result;
              request.cleanTo = packet.cleanTo;
              workers[ request.fromWorker ].send( request );
              delete _usersRequests[ request.id ];
              request = null;
            }
            break;
        }
      } );
      
      // when worker is ready to listen
      workers[ i ].on( 'listening', function( worker )
      {
        workers[ i ].send( { cmd: "worker-id", value: i } );
      } );
    };
    
    // spawn all workers
    for ( var i = 0; i < maxWorkers; ++i )
      spawn( i );
    
    console.log( maxWorkers + " workers launched" );
    console.log( "HTTP Server launched, Listening " + config.webPort );
    console.log( "Telnet Server launched, Listening " + config.telnetPort );
  }
  
  return configureMaster;
} );