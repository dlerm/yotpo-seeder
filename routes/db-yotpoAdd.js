var express = require('express');
var router = express.Router();
var http    = require('http');
var rp      = require('request-promise');
var mysql = require('promise-mysql');

/* Configuation Variables */
var yotpoConfig = require('../yotpoAuth.js');
var clearDBConfig = require('../clearDBAuth.js');

router.get('/', function(request, response) {
  /* Set Headers */
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  response.set('Content-Type', 'application/json');
  var connection;
  var referer = request.query.shop;

  if(referer == ''){
    var error = {
      "Error" : "Referral address not found. Application can not authorize add attempt"
    };
    console.log(error);
    response.send(error);
    throw new Error('Referral address not found. Application can not authorize add attempt');
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
        return addReview();
      } else {
        connection.destroy();
        handleFailedQuery(); 
      }
    });
  /*End Promise Chain
  /*========================================================*/ 
  }());

  /* Reads in all query parameteres and sends POST request to yotpo servers */
  var addReview = function () {

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
    response.status(200).send(data);
  }, function(error) {
    console.log(error.error.status);
    response.status(200).send(error.error.status);
    return error.error.status;
  });

  /* End Promise Chain
  /*========================================================*/ 
};
});

module.exports = router;