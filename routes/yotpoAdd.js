var express = require('express'); 
var router = express.Router();
var http    = require('http');
var rp      = require('request-promise');

router.get('/', function(request, response) {
  /* Set Headers */
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

  /* IIFE
  * Query Client Config Variables For Yotpo Credentials
  * Set global yotpoConfig var with found credentials
  * If there is no match found in the config var, throw error
  * Begin yotpo add request
  */
  (function () {
    var apiKeyTag = 'API_KEY_' + shop;
    yotpoConfig.client_id = process.env[apiKeyTag];
    if(!yotpoConfig.client_id){
      throwCustomError('Shop address invalid. Application can not authorize fetch attempt.');
    }else{
      return addReview();
    }
  }());

  /* Reads in all query parameteres and sends POST request to yotpo servers */
  function addReview() {

    /* Decode URL Querystrings */
    var product_id          = request.query.product_id || false;
    var product_title       = request.query.product_title || false;
    var review_score        = request.query.review_score || false;
    var review_title        = request.query.review_title || false;
    var review_content      = request.query.review_content || false;
    var display_name        = request.query.display_name || false;
    var email               = request.query.email || false;
    var product_image_url   = request.query.product_image_url || false;
    var product_description = request.query.product_description || false;

    /* Create Post Package */
    newReviewConfig = {
      "appkey"              : yotpoConfig.client_id,
      "sku"                 : product_id,
      "product_title"       : product_title,
      "review_score"        : review_score,
      "review_title"        : review_title,
      "review_content"      : review_content,
      "display_name"        : display_name,
      "email"               : email,
      "product_image_url"   : product_image_url,
      "product_description" : product_description
    };

    /* Create Post Options */
    var yotpoNewReviewOptions = {
      method  : 'POST',
      uri     :'https://api.yotpo.com/v1/widget/reviews', 
      body    : newReviewConfig,
      json    : true
    };

    /* Promise Chain
    /*========================================================*/ 

    /* Send POST Request and Send Response
    * Success - return success message
    * Fail - return error message
    */
    var requestWriteReview = rp(yotpoNewReviewOptions);

    var checkResponse = requestWriteReview.then(function(data) {
      var successData = {
        "status" : "success",
        "response" : data
      };
      console.log(successData);
      response.status(200).send(successData);
    }, function(error) {
      console.log(error.error.status);
      throwCustomError(error.error.status);
    });

    /* End Promise Chain
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
  };

});

module.exports = router;
