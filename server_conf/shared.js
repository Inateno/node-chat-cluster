/***
 * this file is used to share data through files like sockets or workerId
 * it's used only if the current process is a worker and declare telnet-server and/or web-server
 */
define( [],
function()
{
  var shared = {
    telnetSockets  : [] // store only telnet sockets
    ,socketsByNick : {} // store all socket by nick
    ,rooms         : {} // store rooms
    ,workerId      : null
  };
  
  return shared;
} );