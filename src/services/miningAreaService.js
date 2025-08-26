const getMiningAreaData = () => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Main Mining Zone",
            zone_type: "extraction"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [107.1000, -6.8000],
              [107.2000, -6.8000],
              [107.2000, -6.7000],
              [107.1000, -6.7000],
              [107.1000, -6.8000]
            ]]
          }
        },
        {
          type: "Feature",
          properties: {
            name: "Processing Area",
            zone_type: "processing"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [107.1200, -6.7800],
              [107.1800, -6.7800],
              [107.1800, -6.7200],
              [107.1200, -6.7200],
              [107.1200, -6.7800]
            ]]
          }
        }
      ]
    };
  };
  
  module.exports = {
    getMiningAreaData
  };