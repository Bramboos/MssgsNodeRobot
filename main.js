var tls = require( 'tls') ,
 client = tls.connect( 8101, 'api.mss.gs', function() { //'connect' listener
        console.log( 'Connected' )
        
        // Credentials required
        this.package( 'credentials', require( './credentials' ))
        
        // Is valid
        client.valid = false;
        client.ops   = [];
        
        // Events
        client.on( 'server: credentials', function( data ) {
                if( data.valid === true ) {
                        console.log( 'Valid credentials' )
                        client.valid = true;
                        client.emit( 'server: credentials valid' )
                }
                else {
                        console.log( 'Invalid credentials' )
                        client.valid = false;
                        client.emit( 'server: credentials invalid' )
                }
        })
        client.on( 'server: credentials valid', function( data ) {
                client.package( 'auth', {
                        'username': 'MssgsNodeJSRobot',
                        'conversationId': 'dev'
                })  
        })
        client.on( 'server: conversation', function( data ) {
                client.opts = data.ops;
        })
        client.on( 'server: new op', function( data ) {
                if( client.ops.indexOf( data.username ) == -1 )
                        client.ops.push( data.username ) 
        })
        client.on( 'server: new unop', function( data ) {
                if( client.ops.indexOf( data.username ) > -1 )
                        client.ops.splice( client.ops.indexOf( data.username ), 1 ) 
        })
        client.on( 'server: leave conversation', function( data ) {
                if( client.ops.indexOf( data.username ) > -1 )
                        client.ops.splice( client.ops.indexOf( data.username ), 1 ) 
        })
        client.on( 'server: message', function( data ) {
                if( data.internal === true ) {
                        // Internal message
                        var internalMethod = data.message.split( ':' )[0].toLowerCase();
                        data.message = JSON.parse( data.message.substr( data.message.split( ':' )[0].length+1 ) )
                        switch( internalMethod ) {
                                case 'join':
                                        // data.message.username
                                break;
                                case 'leave':
                                        // data.message.username
                                break;
                        }
                }
                else {
                        // Normal message
                }
        })
});
var package = '', ending = ',"end":true}\r\n\r\n';
client.package = function( method, data ){
        console.log( 'Sending ' + method + '' )
        this.write( JSON.stringify({
                method: method,
                data: data,
                end: true
        }) + '\r\n\r\n' )
}
client.on( 'data', function( data ) {
        data = data.toString()
        if( 'string' == typeof data ) {
                package += data;
                if( package.indexOf( ending ) > -1 ) {
                        var part = package.substr(0, (package.indexOf( ending ) + ending.length ));
                        client.emit( 'package', part );
                        package = package.substr((package.indexOf( ending ) + ending.length ));
                        
                        if( package.length >= 1 )
                                client.emit( 'data', '' )
                }
                else {
                        console.log( 'No valid ending yet' )
                }
        }
})
client.on( 'package', function( package ) {
        try {
                data = JSON.parse( package )
                if( data
                 && 'object' == typeof data
                 && ( 'method' in data ) ) {
                        console.log( 'Received\t' + data.method )
                        client.emit( 'server: ' + data.method, data.data )
                }
                else {
                        console.log( 'API response has invalid data or no method' )
                }
        }
        catch( e ) {
                console.log( e )
                console.log( e.stack )
                console.log( 'Invalid JSON data' )
        }
})
client.on( 'end', function() {
        console.log( 'Disconnected' )
})
client.setEncoding( 'utf8' )

// Clean shutdown
process.on( 'exit', function(){
        client.end();
})
process.on( 'SIGINT', function(){
        process.exit(0);
})
process.on( 'SIGHUP', function(){
        process.exit(0);
})

// Do not let it crash
process.on( 'uncaughtException', function( err ){
        console.log( 'Caught exception: ' + err );
        console.log( err.stack )
})