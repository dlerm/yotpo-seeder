# Yotpo Seeder (Version 2.0.0)

👾 A simple node express middleware API between the front-end and the Yotpo Rest API. 

Looking for version 1? [Click here](https://github.com/dlerm/yotpo-seeder/tree/release/1.x.x)

## Reviews
For a specific product:

    GET   /reviews/:id
    POST  /reviews/:id

All products:

    GET   /reviews/all

Sample response:

    {
      status: {
        code: 200,
        message: 'OK'
      },
      reviews: [{...}],
      pagination: {
        page: 1,
        per_page: 100,
        total: 300
      },
      bottomline: {
        total_review: 300,
        average_score: 4.6
      },
      grouping_data: {...},
      products: [{...}],
      product_tags: ...
    }

## Questions/Answers
For a specific product:

    GET   /questions/:id
    POST  /questions/:id

All products [coming soon]:

    GET /questions/all

Sample response:

    {
      status: {
        code: 200,
        message: 'OK'
      },
      questions: [{...}],
      pagination: {
        page: 1,
        per_page: 100,
        total: 30
      },
      bottomline: {
        total_questions: 30,
        total_answers: 30
      }
    }
