var express = require('express');
var router = express.Router();
var http    = require('http');
var rp      = require('request-promise');
var mysql = require('promise-mysql');

/* Configuation Variables */
var yotpoConfig = require('../yotpoAuth.js');
var clearDBConfig = require('../clearDBAuth.js');

router.get('/', function(request, response) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  response.set('Content-Type', 'application/json');
  var connection;
  var referer = request.query.shop;

  if(referer == ''){
    var error = {
      "Error" : "Referral address not found. Application can not authorize fetch attempt"
    };
    console.log(error);
    response.send(error);
    throw new Error('Referral address not found. Application can not authorize fetch attempt');
  }

  /* DB Failed Query Custom Error Handling */
  var handleFailedQuery = function () {
    console.log('Error, no yotpo credientials found for referral address, '+ referer+' -- queryShopCendentials');
    var error = {
      "Error" : "No yotpo credientials found",
      "Referral Address": referer,
      "Solution" : "Enter client shop url and credentials at yotpo-seed-all.herokuapp.com/client-add"
    }
    response.send(error);
  };

  /* Initailize & Query Client Database For Yotpo Credentials - IIFE */
  var queryClientCredentials = (function () {
  /* Promise Chain
  /*========================================================*/ 

   /* 
    * Setup Connection to ClearDB Instance:
    * Use configuration file as connection options
    * Returns the connection object
    */
    var setupConnection = mysql.createConnection(clearDBConfig);

   /*
    * Create connection:
    * Set global variable 'connection' to the returned connection object and return it
    */ 
    var createConnection = setupConnection.then(function(conn) {
      connection = conn;
      return connection;
    });

   /*
    * Create Query:
    * Use the referer address to make an SQL query
    * This query will return an array containing the referers yotpo credentials or an empty array
    */ 
    var queryShopCredentials = setupConnection.then(function(connection) {
      var sql = 'SELECT * FROM client_yotpo WHERE client_shop_url = "'+referer+'"';
      return connection.query(sql);
    });

   /*
    * Generate Yotpo Configuation Object:
    * If the query returns results
    * - update the yotpo config object, close the DB connection & begin the yotpo promise chain
    * If not - close the connection and run the failed query error handler
    */ 
    var generateYotpoConfig = queryShopCredentials.then(function(rows) {
      var querySuccessful = rows.length > 0 ? true: false;
      if(querySuccessful){
        console.log(rows);
        var rowData = rows[0];
        yotpoConfig.client_id = rowData.yotpo_client_id;
        yotpoConfig.client_secret = rowData.yotpo_client_secret;
        connection.destroy();
        /* Begin Yotpo Promise Chain */
        return initYotpoPromiseChain();
      } else {
        connection.destroy();
        handleFailedQuery(); 
      }
    });
  /*End Promise Chain
  /*========================================================*/ 
  }());

  /* Yotpo Custom Error Handling */
  var handleYotpoErrors = function(error){
    var customErrorMessage = '';
    switch(error.message){
      case 'invalid_client':
      customErrorMessage = 'Given yotpo client_secret is invalid';
      break;

      case "unsupported_grant_type":
      customErrorMessage = 'Given yotpo grant_type is invalid';
      break;

      case "invalid_client_id":
      customErrorMessage = 'Given yotpo client_id is invalid';
      break;

      default:
      customErrorMessage = 'An error occured while attmepting to authorize/interact with Yotpo. Please make sure your referral address is registered at https://yotpo-seed-all.herokuapp.com/client-add.'
    }

    var returnError = {
      "error" : error.message,
      "error_description" : customErrorMessage
    } 

    console.log('CUSTOM ERROR:\n', returnError, '\n------END');
    
    return returnError;
  };

  /* Initialize Yotpo Auth and Retrieval */
  var initYotpoPromiseChain = function(){
    /* Variables */
    var pid = request.query.pid || false;
    var parsedReviews = '';
    var yotpoToken    = '';
    var yotpoAPIKey   = yotpoConfig.client_id;
    var yotpoAuthOptions = {
      uri  :'https://api.yotpo.com/oauth/token', 
      body : yotpoConfig, 
      json : true
    };

    /* Promise Chain
    /*========================================================*/ 

     /* Yotpo Token Request:
      * send client info to yotpo to obtain access token
      * --Start
      */
      var tokenRequest = rp(yotpoAuthOptions);

     /* Check Token Request Response:
      * handle custom yotpo errors (yotpo error codes and empty token - only if pid == false)
      * handle any promise rejections from "tokenRequest"
      */
      var sealToken = tokenRequest.then( function(parsedBody) {
        console.log(parsedBody); 
        if(parsedBody.error && !pid){
          throw new Error(parsedBody.error);
        }else{
          console.log('No Yotpo Authorization Errors');
          yotpoToken = parsedBody.access_token;
          if(yotpoToken === undefined && !pid){
            console.log('Token Invlaid - Error Location: sealToken');
            throw new Error('invalid_client');
          }
        }
        return yotpoToken;

      }, handleYotpoErrors);


     /* Create/Send A Review Request Package:
      * handle token errors (empty token - only if pid == false)
      * create request package function call
      * return reviews request promise
      * handle any promise rejections from "sealToken"
      */
      var handleToken = sealToken.then(function(token){
        var requestPackage = '';
        if(token === undefined && !pid){
          console.log('Token Invalid - Error Location: handleToken');
          throw new Error('invalid_client_id');
        } else {
          requestPackage = generateReviewsPackage(token);
          return rp(requestPackage);
        }
      }, handleYotpoErrors );


     /* Helper Function - Review Package Creator:
      * build package based on existence of a "pid"(product-id) in querystring 
      * return package
      */ 
      var generateReviewsPackage = function(token) {
        if(pid){
          var requestURI = 'http://api.yotpo.com/v1/widget/' + yotpoAPIKey + '/products/' + pid + '/reviews.json?per_page=' + process.env.REVIEWS_COUNT;
          var options = {
            uri: requestURI,
            json: true
          };
          return options;
        } else {
          var requestURI = 'http://api.yotpo.com/v1/apps/' + yotpoAPIKey + '/reviews?per_page=' + process.env.REVIEWS_COUNT;
          var options = {
            uri: requestURI,
            qs: {
              utoken: token 
            },
            json: true
          };
          return options;
        }
      };


     /* Prepare Front-End Response with Review Data:
      * handle custom yotpo errors (empty response)
      * pass on the final JSON object containing the reviews
      */
      var createFinalResponse = handleToken.then(function(body) {
        if(body === undefined){
          console.log('Empty Response - Error Location: createFinalResponse')
          throw new Error('invalid_client');
        }else{
          return body;
        }
      }, handleYotpoErrors);


     /* Send JSON Response to Front-End
      * set headers to json
      * send final response to browser
      * browser can manipulate the data from here
      * --Complete
      */
      var sendFinalResponse = createFinalResponse.then(function(body){
        response.json(body);
      }, handleYotpoErrors);

      /*End Promise Chain
      /*========================================================*/ 
  };

  
  // queryClientCredentials();

});

module.exports = router;