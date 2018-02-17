'use strict';

const Hapi 	    = require('hapi');
var md5 		= require('md5');
const auth      = require('hapi-auth-cookie');
const auth_jwt  = require('hapi-auth-jwt2');
const glob      = require('glob');
const path      = require('path');
const auth_key  = require('./config/auth.js');
const server    = new Hapi.Server();
const userStore = require('./api/user/model/store');

server.connection({
    host : "10.0.100.16",
    port: 8000,
    routes: {
            cors: true
        }
});

var validate = function (decoded, request, callback) 
{
    if(request.query.token == "")
    {
        return callback(null, false);    
    }
    else
    {
        userStore.validateToken(request.query.token, decoded.uid, function(err, result)
        {
            if(err)
            {
                return callback(null, false);
            }
            else
            {		
                return callback(null, true);
            }
        });
    }    	
};

server.register(auth_jwt, function (err) {

    if(err)
    {
        console.log(err);
    }

    server.auth.strategy('jwt', 'jwt',
    { 
        key: auth_key,
        validateFunc: validate,
        verifyOptions: { algorithms: [ 'HS256' ] }
    });

    server.auth.default('jwt'); 
    
    // Individual Router
    //server.route(require('./api/user/routes'));

    // Load all Router
    glob.sync('./api/**/routes.js', 
    {
        root: __dirname
    }).forEach(file => {
        const route = require(path.join(__dirname, file));
        server.route(route);
    });
});

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});