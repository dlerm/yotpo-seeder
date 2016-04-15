//Required Dependencies
//=================================================================================// 
var express = require('express');
var app = express();
var http = require('http');
var rp = require('request-promise');
var shopifyAPI = require('shopify-node-api');

//Configuation Variables
//=================================================================================// 
var shopifyConfig = require('./config.js'); 
var yotpoConfig = require('./yotpoAuth.js');

var Shopify = new shopifyAPI(shopifyConfig);

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.send('id: ' + request.query.id);
  response.render('pages/index');
});

app.get('/yotpo-fetch', function(request, response) {

  //Global Variables
  //========================================================//  
  var yotpoAuthOptions = {
    uri:'https://api.yotpo.com/oauth/token', 
    body: yotpoConfig,
    json: true
  };
  var parsedReviews = '';
  var yotpoToken = '';
  var yotpoAPIKey = yotpoConfig.client_id;
  var html = [
  '<!doctype html>',
  '  <html lang="en">',
  '  <head>',
  '  <meta charset="utf-8">',
  '  <title>Yopot Fetch</title>',
  '  <meta name="description" content="Yotpo Reviews Fetching">',
  '  <meta name="author" content="BVACCEL">',
  '  <link rel="stylesheet" href="main.css">',
  '  <!--[if lt IE 9]>',
  '  <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>',
  '  <![endif]-->',
  '  </head>',
  '  <body>'
  ].join('');

  //var html = '';

  //Promise Chain
  //========================================================//  
  var tokenRequest = rp(yotpoAuthOptions);
  html += 'Requesting Yotpo Auhtorization Token...<br/>';

  var sealToken = tokenRequest.then( function(parsedBody) {
    yotpoToken = parsedBody.access_token;
    console.log("token: "+ yotpoToken); 
    html += 'Token Aquired!<br/> Token: "' + yotpoToken + '"<br/>';
    return yotpoToken;
  });

  var createReviewPackage = sealToken.then(function(data) {
    var reviewURI = 'http://api.yotpo.com/v1/apps/' + yotpoAPIKey + '/reviews';
    var yotpoReviewsOptions = {
      uri: reviewURI,
      qs: {
        utoken: data 
      },
      json: true
    };
    console.log('Review Request Package Created:');
    html += 'Creating Request Package...<br/>';
    html += 'Review Request Package Created!<br/>';
    html += '<div style="padding-left:20px;">' + JSON.stringify(yotpoReviewsOptions) + '</div>';
    console.log(yotpoReviewsOptions);
    return yotpoReviewsOptions;
  }); 

  var reviewsRequest = createReviewPackage.then(function(data) {
    html += 'Sending Request Package...<br/>';
    return rp(data);
  });

  var allReviews = reviewsRequest.then(function(parsedBody) {
    console.log('Review Request Successfull!');
    parsedReviews = parsedBody;
    html += 'Request Granted!<br/>';
    html += 'Reviews:<br/>';
    html += '<div style="padding-left:20px;">' + JSON.stringify(parsedReviews) + '</div>';
    return parsedBody;
  });

  var final = allReviews.then(function(data){
    console.log('Reviews Received:');
    console.log(parsedReviews);
    html += '</body></html>';
    //console.log('html:'+html);
    response.send(html);
    //return paresedReviews;
  });

  
  
  
  //========================================================//  
});



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


