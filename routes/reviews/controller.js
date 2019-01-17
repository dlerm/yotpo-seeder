const ApplicationError = require.main.require('./classes/ApplicationError')

const getShopKey = (origin, host) => {
  let shop = origin.toString()
  if (!origin && host.indexOf('localhost') !== -1) {
    shop = process.env.TEST_SHOP
  }
  return shop = shop.replace('http://', '')
  .replace('https://', '')
  .replace('www.', '')
  .replace('.com', '')
  .replace('.myshopify', '')
  .toUpperCase()
}

const getOptions = (req, shop) => {
  const countTag = `REVIEW_COUNT_${shop}`
  return {
    sort: getSortParams(req),
    page: getPageParam(req),
    count: process.env[countTag] || 150
  }
}

const getPageParam = req => {
  let { pageNumber = 1 } = req.query
  if (isNaN(pageNumber)) {
    pageNumber = 1
  }
  return pageNumber
}

const getSortParams = req => {
  let sortParams = ''
  let { sort = false, dir = false } = req.query
  if (sort) {
    sort = sort.split(',')
    sort.forEach( (sortOption, index) => {
      sortParams += `sort[]=${sortOption}&`
    })
  }
  if (dir) {
    sortParams += `direction=${dir}&`
  }
  return sortParams
}

const getAddParams = req => {
  const { 
    product_title = false,
    review_score = false,
    review_title = false,
    review_content = false,
    display_name = false,
    email = false,
    product_image_url = null,
    product_description = null
  } = req.body

  const custom_fields = Object.keys(req.body).reduce((fields, key) => {
    if (key.indexOf('--') !== -1) {
      fields[key] = req.body[key].trim()
    }
    return fields
  }, {})

  return {
    product_title,
    review_score,
    review_title,
    review_content,
    display_name,
    email,
    product_image_url,
    product_description,
    custom_fields
  }
}

const validateAddParams = (params, next) => {
  const { product_title, review_score, review_title, review_content, display_name, email } = params
  const requiredFields = {
    product_title,
    review_score,
    review_title,
    review_content,
    display_name,
    email
  }

  Object.keys(requiredFields).forEach(key => {
    if (!requiredFields[key]) {
      throw new ApplicationError(`Missing required parameter: ${key}`, 400)
    }
  })

  return true
}

const generateAddPackage = (auth, id, params) => {
  const { product_title, review_score, review_title, review_content, display_name, email, product_image_url, product_description, custom_fields = {} } = params
  const body = {
    appkey: auth[0],
    sku: id,
    product_title,
    review_score,
    review_title,
    review_content,
    display_name,
    email,
    product_image_url,
    product_description
  }

  if (Object.keys(custom_fields).length !== 0) {
    body.custom_fields = custom_fields
  }

  return {
    method: 'POST',
    uri: 'https://api.yotpo.com/v1/widget/reviews',
    json: true,
    body,
  }
}

const generateReviewsPackage = (id, auth, options) => { 
  const { sort, count, page } = options
  return {
    uri: `http://api.yotpo.com/v1/widget/${auth[0]}/products/${id}/reviews.json?${sort}per_page=${count}&page=${page}`,
    json: true
  }
}

const generateAllReviewsPackage = (token, auth, options) => { 
  const { count, page } = options
  return {
    uri: `http://api.yotpo.com/v1/apps/${auth[0]}/reviews?utoken=${token}&count=${count}&page=${page}`,
    json: true
  }
}

const generateTokenPackage = (auth) => { 
  return {
    uri  :'https://api.yotpo.com/oauth/token', 
    body : {
      client_id: auth[0],
      client_secret: auth[1],
      grant_type: 'client_credentials'
    }, 
    json : true
  }
}

const validateToken = (response, next) => {
  const token = response.access_token || false
  if (token) {
    return token 
  } else if (response.error) {
    throw new ApplicationError(response.error, 401)
  } else {
    throw new ApplicationError('Invalid token authorization', 401)
  }
}

const formatReturnPackage = data => {
  const { status = { code: 200, message: 'OK'} } = data
  const { pagination = false, bottomline = false, grouping_data = false, products = false, product_tags = false } = data.response || {}
  const { reviews } = data.response || data || {}
  return {
    status,
    reviews,
    pagination,
    bottomline,
    grouping_data,
    products,
    product_tags
  }
}

module.exports.getShopKey = getShopKey
module.exports.getOptions = getOptions
module.exports.getPageParam = getPageParam
module.exports.getSortParams = getSortParams
module.exports.generateReviewsPackage = generateReviewsPackage
module.exports.generateAllReviewsPackage = generateAllReviewsPackage
module.exports.generateTokenPackage = generateTokenPackage
module.exports.formatReturnPackage = formatReturnPackage
module.exports.validateToken = validateToken
module.exports.getAddParams = getAddParams
module.exports.validateAddParams = validateAddParams
module.exports.generateAddPackage = generateAddPackage