var net = require( 'net') ,
 client = net.connect( 8101, 'api.mss.gs', function() { //'connect' listener
        console.log( 'Connected' )
        
        // Credentials required
        this.package( 'credentials', require( './credentials' ))
        
        // Is valid
        client.valid = false;
        
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
                        'username': 'MssgsRobot',
                        'conversationId': 'dev'
                })  
        })
        client.on( 'server: conversation', function( data ) {
                client.package( 'message', {
                        'text': 'Hi ' + data.usernames.join( ', ' ) + ' - I\'m the Mssgs NodeJS Robot',
                        'conversation': data.id
                })  
        })
        client.on( 'server: message', function( data ) {
                console.log(data)
        })
});

var package = '', ending = ',"end":true}\r\n\r\n';
client.package = function( method, data ){
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