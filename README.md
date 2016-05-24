# yotpo-seeder

A simple Node.js Heroku app to write/retreive yotpo reviews and return JSON for full front-end control.

This application supports the [Getting Started with Node on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs) article - check it out.

## Routes

```
.../yotpo-fetch
```

This route is used for retreiving yotpo reviews. When this route is used with no querystring parameters, all yotpo reviews for the account are retreieved. 


```
.../yotpo-fetch?pid=1234567
```

This route can take one optional querystring parameter - 'pid'. The 'pid' parameter stands for 'product id' and is used for retreiving reviews of a single product.

OR

```
.../yotpo-add
```

This route is used for creating reviews for a single product. This route has many query string parameters, some are required and others are not.

REQUIRED QUERYSTRING PARAMETERS:
```
product_id: Specifies a unique product ID to add this review to.
```
```
product_title: The title of the product.
```
```
display_name: The reviewer's name.
```
```
email: The email of the reviewer.
```
```
review_content: The content of the review.
```
```
review_title: The title of the review.
```
```
review_score: The review score.
```

OPTIONAL QUERYSTRING PARAMETERS:
```
product_description: The description of the product.
```
```
product_image_url: The url of the product image.
```

More app usage examples and details can be found at the at homepage route [localhost:5000](http://localhost:5000/). 


## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.

```sh
$ git clone https://github.com/dlerm/yotpo-seeder.git
$ cd yotpo-seeder
$ npm install
$ heroku local web
```

Your app should now be running on [localhost:5000](http://localhost:5000/). App usage details can also be found on the app homepage.

## Deploying to Heroku

```
$ heroku create
$ git push heroku master
$ heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Documentation

For more information about using Node.js on Heroku, see these Dev Center articles:

- [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs)
- [Best Practices for Node.js Development](https://devcenter.heroku.com/articles/node-best-practices)
- [Using WebSockets on Heroku with Node.js](https://devcenter.heroku.com/articles/node-websockets)
