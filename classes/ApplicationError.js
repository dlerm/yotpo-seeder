class ApplicationError extends Error {
  constructor(message, code) {
    super()
    
    Error.captureStackTrace(this, this.constructor)
    
    this.status = 'error'

    this.name = this.constructor.name
    
    this.message = message || 'Something went wrong. Please try again.'
    
    this.code = code || 500
  }
}

module.exports = ApplicationError