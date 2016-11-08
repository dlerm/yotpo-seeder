var express = require('express');
var router = express.Router();
var http    = require('http');
var rp      = require('request-promise'); 

router.get('/', function(request, response) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  response.set('Content-Type', 'application/json');

  /* Configuation Variables */
  var yotpoConfig = require('../yotpoAuth.js');

  /* If no shop url parameter found, throw error */
  var referer = request.query.shop;
  if(referer == ''){
    throwCustomError('Shop address not found. Application can not authorize fetch attempt.');
  }

  /* Setup global shop variable */
  var shop = referer.replace('http://', '')
                    .replace('https://', '')
                    .replace('www.', '')
                    .replace('.com', '')
                    .toUpperCase();
                    // console.log(shop);

 /* IIFE
  * Query Client Config Variables For Yotpo Credentials
  * Set global yotpoConfig var with found credentials
  * If there is no match found in the config var, throw error
  * Begin yotpo fetch request
  */
  (function () {
    var apiKeyTag = 'API_KEY_' + shop;
    var apiPassTag = 'API_PASS_' + shop;
    yotpoConfig.client_id = process.env[apiKeyTag];
    yotpoConfig.client_secret = process.env[apiPassTag];
    if(!yotpoConfig.client_id || !yotpoConfig.client_secret){
      throwCustomError('Shop address invalid. Application can not authorize fetch attempt.');
    }else{
      console.log(yotpoConfig);
      return initYotpoPromiseChain();
    }
  }());

  /* Initialize Yotpo Auth and Retrieval */
  function initYotpoPromiseChain () {
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
        console.log('sealToken');
        console.log(parsedBody); 
        if(parsedBody.error && !pid){
          console.dir(parsedBody.error);
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
        console.log('handleToken');
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
        console.log('generateReviewsPackage');
        var reviewCountTag = 'REVIEW_COUNT_' + shop;
        var reviewCount = process.env[reviewCountTag] || false;
        console.log(reviewCount);
        if(!reviewCount) {
          reviewCount = process.env.DEFAULT_REVIEW_COUNT;
        }
        console.log(reviewCount);
        if(pid){
          var requestURI = 'http://api.yotpo.com/v1/widget/' + yotpoAPIKey + '/products/' + pid + '/reviews.json?per_page=' + reviewCount;
          var options = {
            uri: requestURI,
            json: true
          };
          return options;
        } else {
          var requestURI = 'http://api.yotpo.com/v1/apps/' + yotpoAPIKey + '/reviews?utoken='+ token +'&count=' + reviewCount;
          var options = {
            uri: requestURI,
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
        console.log('createFinalResponse');
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
        console.log('sendFinalResponse');
        response.json(body);
      }, handleYotpoErrors);

      /*End Promise Chain
      /*========================================================*/ 
  };

  /* Basic Custom Error Handling */
  function throwCustomError (error) {
    var customError = {
      "status" : "error",
      "error" : error
    };
    console.log(customError);
    response.status(200).send(customError);
  }

  /* Yotpo Custom Error Handling */
  function handleYotpoErrors (error) {
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
      "status" : "error",
      "error" : error.message,
      "error_description" : customErrorMessage
    } 

    console.log('CUSTOM ERROR:\n', returnError, '\n------END');
    
    return returnError;
  };

});

module.exports = router;
