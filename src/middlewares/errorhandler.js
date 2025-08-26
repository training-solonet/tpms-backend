const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Database errors
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Conflict error'
      });
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: err.details || err.message
      });
    }
    
    // Default server error
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  };
  
  const notFoundHandler = (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      available_endpoints: {
        health: '/health',
        root: '/',
        auth: '/api/auth/login',
        trucks: '/api/trucks',
        dashboard: '/api/dashboard/stats'
      }
    });
  };
  
  module.exports = {
    errorHandler,
    notFoundHandler
  };