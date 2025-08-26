const { getMiningAreaData } = require('../services/miningAreaService');

const getMiningAreas = async (req, res) => {
  try {
    const miningArea = getMiningAreaData();
    
    res.status(200).json({
      success: true,
      data: miningArea
    });
  } catch (error) {
    console.error('Error fetching mining areas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getMiningAreas
};