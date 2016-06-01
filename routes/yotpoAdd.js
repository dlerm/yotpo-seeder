var express = require('express');
var router = express.Router();
var http    = require('http');
var rp      = require('request-promise');

/* Configuation Variables */
var yotpoConfig = require('../yotpoAuth.js');

router.get('/', function(request, response) {
  /* Set Headers */
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  response.set('Content-Type', 'application/json');

  /* Decode URL Querystring */
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
    "appkey"              : process.env.CLIENT_ID,
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
    response.status(200).send(data);
  }, function(error) {
    console.log(error.error.status);
    response.status(200).send(error.error.status);
    return error.error.status;
  });

  /* End Promise Chain
  /*========================================================*/ 

});

module.exports = router;