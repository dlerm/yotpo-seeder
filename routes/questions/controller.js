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

const getAddParams = req => {
  const { 
    product_title = false,
    product_url = false,
    question_content = false,
    display_name = false,
    email = false,
    product_image_url = null,
    product_description = null
  } = req.body

  return {
    product_title,
    product_url,
    question_content,
    display_name,
    email,
    product_image_url,
    product_description
  }
}

const validateAddParams = (params, next) => {
  const { product_title, product_url, review_score, question_content, display_name, email } = params
  const requiredFields = {
    product_title,
    product_url,
    question_content,
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
  const { product_title, product_url, question_content, display_name, email, product_image_url, product_description } = params
  const body = {
    appkey: auth[0],
    sku: id,
    product_title,
    product_url,
    review_content: question_content,
    display_name,
    email,
    product_image_url,
    product_description
  }

  return {
    method: 'POST',
    uri: 'https://api.yotpo.com/questions/send_confirmation_mail',
    json: true,
    body,
  }
}

const generateQuestionsPackage = (id, auth) => { 
  return {
    uri: `https://api.yotpo.com/products/${auth[0]}/${id}/questions`,
    json: true
  }
}

const formatReturnPackage = data => {
  const { status = { code: 200, message: 'OK'} } = data
  const { questions = [], total_questions = false, total_answers = false, page = false, per_page = false } = data.response || data || {}
  const bottomline = { total_questions, total_answers }
  const pagination = { page, per_page, total: total_questions }
  if (status.code == null) {
    status.code = 200
  }
  return {
    status,
    questions,
    pagination,
    bottomline
  }
}

module.exports.getShopKey = getShopKey
module.exports.getAddParams = getAddParams
module.exports.validateAddParams = validateAddParams
module.exports.generateAddPackage = generateAddPackage
module.exports.generateQuestionsPackage = generateQuestionsPackage
module.exports.formatReturnPackage = formatReturnPackage