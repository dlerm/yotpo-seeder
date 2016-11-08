/* Required Dependencies */
/*========================================*/
var express = require('express');
var app     = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

/*========================================*/
/* INSTRUCTION SCREEN
/*========================================*/
app.get('/', function(request, response) {
  response.set('Content-Type', 'text/html');
  response.sendFile(__dirname + '/index.html');
}); 

/*========================================*/
/* FETCHING REVIEWS
/*========================================*/
var yotpoFetch = require('./routes/yotpoFetch');
app.use('/yotpo-fetch', yotpoFetch);

/*========================================*/
/* ADDING REVIEWS
/*========================================*/
var yotpoAdd = require('./routes/yotpoAdd');
app.use('/yotpo-add', yotpoAdd);

/*========================================*/
/* ADDING CLIENTS
/*========================================*/
var clientAdd = require('./routes/clientAdd');
app.use('/client-add', clientAdd);


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


