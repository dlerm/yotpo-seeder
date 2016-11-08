(function (YotpoApp, $, undefined) {

  /* Dependencies:
  * yotpoApp window variable
  *
  * window.yotpoApp = { 
  *   "productId": "{{ product.id }}",
  *   "productTitle": "{{ product.title }}", 
  *   "reviewsEntryPoint": ".reviews-entry-point",
  *   "avgRatingEntryPoint": ".avg-review-stars",
  *   "herokuAppName": "sample-client-app"
  * };
  */
  var avgScore;
  var product_id = window.yotpoApp.productId;
  var product_title = window.yotpoApp.productTitle;
  var appURL = '//'+herokuAppName+'.herokuapp.com';
  var reviewsEntryPoint = $(window.yotpoApp.reviewsEntryPoint);
  var avgReviewStars = $(window.yotpoApp.avgRatingEntryPoint);
  var totalReviews, avgScore;

  var buildReview = function (review, productID) {
    /* Define custom html view for a single review
    * Specific-Product Fields:
    ** content, title, verified_buyer, votes_up, votes_down, created_at, id, product_id, score, custom_fields, source_review_id
    ** user.display_name, user.is_social_connected, user.social_image, user.user_id, user.user_type
    * --------------------------------------------------------------------------------------------
    * All-Products Fields:
    ** content, title, created_at, deleted, email, id, name, reviewer_type, score, sku, votes_up, votes_down
    */
    var title = review.title;
    var content = review.content;
    var score = review.score;
    var votesUp = review.votes_up;
    var votesDown = review.votes_down;
    var reviewID = review.id;
    var reviewDate = review.created_at;
    var userName = '';
    var userID = '';
    var userImage = '';
    var userType = '';
    var userSocialConnected = '';
    var verifiedBuyer = '';
    var userEmail = '';
    var customFields = '';
    var sourceReviewID = '';


    /* Date formatting */
    var stringDate = reviewDate;
    var newReviewDate = new Date(stringDate);
    var formatDate = (newReviewDate.getMonth() + 1) + '/' + newReviewDate.getDate() + '/' +  newReviewDate.getFullYear();

    if(productID != ''){
      userName = review.user.display_name;
      userID = review.user.user_id;
      /* userImage = review.user.social_image; */
      userType = review.user.user_type;
      userSocialConnected = review.user.is_social_connected;
      customFields = review.custom_fields;
      sourceReviewID = review.source_review_id;
      verifiedBuyer = review.verified_buyer;
    } else {
      userName = review.name;
      userEmail = review.email;
      userType = review.reviewer_type;
    }

    /* Truncate reviewer name to 2 words max */
    var reviewerName = userName.split(" ").splice(0,2).join(" ");

    var verifiedUserType = ''
    if(verifiedBuyer == true && userSocialConnected == 0) {
      verifiedUserType = 'Verified Buyer';
    } else if(verifiedBuyer == false && userSocialConnected == 1) {
      verifiedUserType = 'Verified Reviewer';
    } else {
      verifiedUserType = '';
    }

    var reviewStars = '<span class="start-wrap">';
    for(i=0; i<score; i++){
      reviewStars += '<i class="fa fa-star"></i>';
    }
    reviewStars += '</span>';

    /* String formatting for share URLs */
    var shareContent = content.replace(/ /g,'%20');
    var shareTitle = title.replace(/ /g,'%20');
    var shareUrl = window.location.href.replace('http:','http%3A');

    /* Html array string */
    html = [
    '<div class="review-padding"><div class="review" data-review-id="',reviewID,'">',
    '<div class="review-stars">', reviewStars, '<div class="review-date">',formatDate,'</div></div>',
    '<div class="review-user" data-user-id="',userID,'" data-verified-user="',verifiedBuyer,'">', reviewerName,
    '<img class = "review-checkmark" src="'+checkIcon+'" />',
    '<span> ',verifiedUserType,'</span></div>',
    '<div class="review-title">', title, '</div>',
    '<div class="review-content">', content, '</div>',
    '<div class="review-sharing"><div class="share-link-toggle"><i class="fa fa-share-square-o"></i> Share</div><div class="share-links flex">&nbsp; | <a class="facebook review-share-link" href="https://www.facebook.com/sharer/sharer.php?u=',shareUrl,'"><i class="fa fa-facebook-official"></i></a><a class="twitter review-share-link" href="//twitter.com/home?status=',shareContent,shareUrl,'"><i class="fa fa-twitter"></i></a><a class="linked-in review-share-link" href="https://www.linkedin.com/shareArticle?mini=true&url=',shareUrl,'&title=',shareTitle,'&summary=',shareContent,'&source="><i class="fa fa-linkedin-square"></i></a></div></div>',
    '<div class="review-votes" data-review-id="',reviewID,'">Was This Review Helpful?  &nbsp;<span class="vote vote-up" data-vote-type="up"><i class="fa fa-thumbs-up" aria-hidden="true"></i> ', votesUp,'</span> <span class="vote" data-vote-type="down"><i class="fa fa-thumbs-down" aria-hidden="true"></i> ', votesDown,'</span></div>','</div></div>'
    ].join('');

    /* Append review node to the reviewsEntrPoint */
    $(window.yotpoApp.reviewsEntryPoint).append(html);

  };

  var postNewReview = function(form) {
    var formData = $(form).serialize();
    yotpoCreateReviewURI = appURL + '/yotpo-add?' + formData;
    console.log(yotpoCreateReviewURI);
    var writeReviewRequest = $.get(yotpoCreateReviewURI)
    /* On Fail, log error */
    .fail(function(jqXHR, textStatus, errorThrown) {
      console.log('Failed to post');
      console.log(errorThrown);
      console.log(textStatus);
      console.log(jqXHR);
    })
    /* On Success, check one extra error, then close review form and send thank you message */
    .done(function(data) {
      if(data.hasOwnProperty('error_type')){
        alert('ERROR: Could not post your review\nError Code: '+data.code+'\nMessage: '+ data.message+'\nPlease fix the errors and try again.');
      } else {
        $('.write-review-form').slideToggle();
        $('.write-review').text('Thanks for Your Review!');
      }
    });
  };

  var sendReviewsRequest = function () {
    var reviewRequestURL = appURL + '/yotpo-fetch?pid=' + product_id;
    var appRequest = $.get(reviewRequestURL)
    /* On fail, log and send error */
    .fail(function(error) {
      console.log('Fail');
      console.log(error);
    })
    /* On success,
    * log (reviews) data object and set the reviews array accordingly
    * loop through the reviewsArray and build each review
    * Finally, display the reviews area
    */
    .done(function(data) {
      console.log(data);
      totalReviews = data.response.bottomline.total_review;
      var reviewsArray = '';
      avgScore = data.response.bottomline.average_score;
      if(product_id == ''){
        reviewsArray = data.reviews;
      } else {
        reviewsArray = data.response.reviews;
      }
      reviewsArray.forEach(function(review, index) {
        buildReview(review, product_id);
      });
      reviewsEntryPoint.show();
    })
    /* After fail or success,
    * init slider? show animation? bind new actions?...
    * Populate the average ration field
    */
    .always(function() {
      reviewsEntryPoint.slick();
      /* Calculating half stars for total average star rating */
      avgScoreInt = Math.floor(avgScore);
      var totalScore = '';
      for(i=0; i<avgScoreInt; i++){
        totalScore += '<i class="fa fa-star"></i>';
      }
      avgScoreDec = avgScore % 1;
      if(avgScoreDec < .25) {
        totalScore = totalScore;
      } else if (avgScoreDec > .249 && avgScoreDec < .75) {
        totalScore += '<i class="fa fa-star-half"></i>';
      } else if (avgScoreDec > .749) {
        totalScore += '<i class="fa fa-star"></i>';
      }
      /* Populate average rating */
      avgReviewStars.html(totalScore);

    });
  };

  var bindUIActions = function () {
    /* Review Voting */
    $(document).on('click', '.vote', function() {
      var voteType = $(this).attr('data-vote-type');
      var voteReviewID = $(this).parent().attr('data-review-id');
      var yotpoVoteURI = '//api.yotpo.com/reviews/' + voteReviewID + '/vote/' + voteType;
      var voteRequest = $.get(yotpoVoteURI)
      /* Fail function */
      .fail(function(error) {
        console.log(error);
        alert(error);
      })
      /* Success function */
      .done(function(data) {
        $(this).addClass('reviewed');
        console.log(data);
      });
    });

    /* Write a review - Score Stars */
    /* Click start */
    $(document).on('click', '.star-score-wrap .star-score',function() {
      var newScore = $(this).attr('data-score');
      $('#review_score').val(newScore);
      $('.star-score i').removeClass('fa-star').addClass('fa-star-o');
      for(i=1; i<=newScore; i++){
        $('.star-score[data-score="'+i+'"]').find('i').removeClass('fa-star-o').addClass('fa-star');
      }
    });
    /* Hover start */
    $(document).on('hover', '.star-score-wrap .star-score', function() {
      var hoverScore = $(this).attr('data-score');
      $('.star-score i').removeClass('fa-star').addClass('fa-star-o');
      for(i=1; i<=hoverScore; i++){
        $('.star-score[data-score="'+i+'"]').find('i').removeClass('fa-star-o').addClass('fa-star');
      }
    }, function() {
      var currentScore = $('#review_score').val();
      $('.star-score i').removeClass('fa-star').addClass('fa-star-o');
      for(i=1; i<=currentScore; i++){
        $('.star-score[data-score="'+i+'"]').find('i').removeClass('fa-star-o').addClass('fa-star');
      }
    });
    /* Share link click */
    $(document).on('click' '.share-link-toggle',function() {
      if( $(this).closest('.review-sharing').find('.share-links').hasClass('active') ) {
        $(this).closest('.review-sharing').find('.share-links').removeClass('active');
      } else {
        $(this).closest('.review-sharing').find('.share-links').addClass('active');
      }
    });

    /* Grab Form Values and Send App Request */
    $(document).on('submit', '#writeReview', function(e){
      e.preventDefault();
      postNewReview(this);
    });

    /* Onpen share link in new window */
    $(document).on('click','.review-share-link',function(){
      var currentHref= $(this).attr('href');
      window.open(currentHref,'_blank','toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=600,height=400',false);
      return false;
    });
    /* Click write-review and toggle review form */
    $(document).on('click', '.write-review', function() {
      $('.write-review-form').slideToggle();
    });
  };

  YotpoApp.init = function () {
    sendReviewsRequest();
    bindUIActions();
  };

}(window.YotpoApp = window.YotpoApp || {}, jQuery));
