const prismaService = require('../services/prismaService');

// ==========================================
// DASHBOARD CONTROLLER - PRISMA VERSION
// ==========================================

const getDashboardStats = async (req, res) => {
  try {
    const stats = await prismaService.getDashboardStats();
    
    // Add performance metadata
    const metadata = {
      dataFreshness: 'real-time',
      lastUpdated: new Date().toISOString(),
      cacheStatus: 'live'
    };
    
    res.status(200).json({
      success: true,
      data: {
        ...stats,
        metadata
      },
      message: 'Dashboard statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ==========================================
// ADVANCED DASHBOARD OPERATIONS
// ==========================================

const getFleetSummary = async (req, res) => {
  try {
    const [stats, recentAlerts, fuelStats, performanceMetrics] = await Promise.all([
      prismaService.getDashboardStats(),
      getRecentAlerts(),
      getFuelAnalytics(),
      getFleetPerformanceMetrics()
    ]);

    res.status(200).json({
      success: true,
      data: {
        fleetOverview: stats,
        recentAlerts,
        fuelAnalytics: fuelStats,
        performance: performanceMetrics,
        generatedAt: new Date().toISOString()
      },
      message: 'Fleet summary retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getFleetSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fleet summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getAlertSummary = async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Calculate time range
    const since = new Date();
    switch (timeRange) {
      case '1h':
        since.setHours(since.getHours() - 1);
        break;
      case '24h':
        since.setHours(since.getHours() - 24);
        break;
      case '7d':
        since.setDate(since.getDate() - 7);
        break;
      case '30d':
        since.setDate(since.getDate() - 30);
        break;
      default:
        since.setHours(since.getHours() - 24);
    }

    const [alertStats, severityBreakdown, topAlertTypes] = await Promise.all([
      // Total alerts in time range
      prismaService.prisma.truckAlert.count({
        where: {
          createdAt: {
            gte: since
          }
        }
      }),
      
      // Breakdown by severity
      prismaService.prisma.truckAlert.groupBy({
        by: ['severity'],
        where: {
          createdAt: {
            gte: since
          }
        },
        _count: {
          _all: true
        }
      }),
      
      // Top alert types
      prismaService.prisma.truckAlert.groupBy({
        by: ['alertType'],
        where: {
          createdAt: {
            gte: since
          }
        },
        _count: {
          _all: true
        },
        orderBy: {
          _count: {
            _all: 'desc'
          }
        },
        take: 5
      })
    ]);

    // Format severity breakdown
    const severityMap = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    severityBreakdown.forEach(item => {
      severityMap[item.severity] = item._count._all;
    });

    res.status(200).json({
      success: true,
      data: {
        timeRange,
        totalAlerts: alertStats,
        severityBreakdown: severityMap,
        topAlertTypes: topAlertTypes.map(item => ({
          type: item.alertType,
          count: item._count._all
        })),
        generatedAt: new Date().toISOString()
      },
      message: `Alert summary for ${timeRange} retrieved successfully`
    });

  } catch (error) {
    console.error('Error in getAlertSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getFuelReport = async (req, res) => {
  try {
    const [fuelStats, lowFuelTrucks, fuelTrends] = await Promise.all([
      // Overall fuel statistics
      prismaService.prisma.truck.aggregate({
        where: {
          status: 'active'
        },
        _avg: {
          fuelPercentage: true
        },
        _min: {
          fuelPercentage: true
        },
        _max: {
          fuelPercentage: true
        }
      }),
      
      // Trucks with low fuel
      prismaService.prisma.truck.findMany({
        where: {
          status: 'active',
          fuelPercentage: {
            lt: 25 // Less than 25%
          }
        },
        select: {
          id: true,
          truckNumber: true,
          fuelPercentage: true,
          driverName: true,
          updatedAt: true
        },
        orderBy: {
          fuelPercentage: 'asc'
        }
      }),
      
      // Fuel consumption trends (last 7 days)
      getFuelConsumptionTrend()
    ]);

    // Calculate fuel distribution
    const fuelRanges = await prismaService.prisma.truck.groupBy({
      by: [],
      where: {
        status: 'active'
      },
      _count: {
        _all: true
      }
    });

    // Get fuel distribution by ranges
    const distributionQuery = await prismaService.prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN fuel_percentage >= 75 THEN 'high'
          WHEN fuel_percentage >= 50 THEN 'medium'
          WHEN fuel_percentage >= 25 THEN 'low'
          ELSE 'critical'
        END as fuel_range,
        COUNT(*) as count
      FROM trucks 
      WHERE status = 'active'
      GROUP BY fuel_range
    `;

    const distribution = {
      high: 0,    // 75-100%
      medium: 0,  // 50-74%
      low: 0,     // 25-49%
      critical: 0 // 0-24%
    };

    distributionQuery.forEach(row => {
      distribution[row.fuel_range] = parseInt(row.count);
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          averageFuel: parseFloat(fuelStats._avg.fuelPercentage) || 0,
          minFuel: parseFloat(fuelStats._min.fuelPercentage) || 0,
          maxFuel: parseFloat(fuelStats._max.fuelPercentage) || 0
        },
        distribution,
        lowFuelTrucks: lowFuelTrucks.map(truck => ({
          id: truck.id,
          truckNumber: truck.truckNumber,
          fuel: parseFloat(truck.fuelPercentage),
          driver: truck.driverName,
          lastUpdate: truck.updatedAt
        })),
        trends: fuelTrends,
        generatedAt: new Date().toISOString()
      },
      message: 'Fuel report generated successfully'
    });

  } catch (error) {
    console.error('Error in getFuelReport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate fuel report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getMaintenanceReport = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const [overdueMaintenance, upcomingMaintenance, maintenanceStats] = await Promise.all([
      // Overdue maintenance
      prismaService.prisma.truck.findMany({
        where: {
          lastMaintenance: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        },
        select: {
          id: true,
          truckNumber: true,
          lastMaintenance: true,
          status: true,
          model: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          lastMaintenance: 'asc'
        }
      }),
      
      // Upcoming maintenance (based on engine hours)
      prismaService.prisma.truck.findMany({
        where: {
          status: 'active',
          engineHours: {
            gte: 8000 // High engine hours
          }
        },
        select: {
          id: true,
          truckNumber: true,
          engineHours: true,
          lastMaintenance: true,
          model: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          engineHours: 'desc'
        },
        take: 20
      }),
      
      // Maintenance statistics
      prismaService.prisma.truck.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      })
    ]);

    const statusBreakdown = {
      active: 0,
      maintenance: 0,
      inactive: 0
    };

    maintenanceStats.forEach(stat => {
      statusBreakdown[stat.status] = stat._count._all;
    });

    res.status(200).json({
      success: true,
      data: {
        statusBreakdown,
        overdueMaintenance: overdueMaintenance.map(truck => ({
          id: truck.id,
          truckNumber: truck.truckNumber,
          model: truck.model?.name,
          lastMaintenance: truck.lastMaintenance,
          daysSinceLastMaintenance: truck.lastMaintenance ? 
            Math.floor((today - new Date(truck.lastMaintenance)) / (1000 * 60 * 60 * 24)) : null,
          status: truck.status
        })),
        upcomingMaintenance: upcomingMaintenance.map(truck => ({
          id: truck.id,
          truckNumber: truck.truckNumber,
          model: truck.model?.name,
          engineHours: truck.engineHours,
          lastMaintenance: truck.lastMaintenance,
          priority: truck.engineHours > 9000 ? 'high' : 'medium'
        })),
        generatedAt: new Date().toISOString()
      },
      message: 'Maintenance report generated successfully'
    });

  } catch (error) {
    console.error('Error in getMaintenanceReport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate maintenance report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function getRecentAlerts() {
  const alerts = await prismaService.prisma.truckAlert.findMany({
    where: {
      isResolved: false,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    include: {
      truck: {
        select: {
          truckNumber: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  return alerts.map(alert => ({
    id: alert.id,
    type: alert.alertType,
    severity: alert.severity,
    message: alert.message,
    truckNumber: alert.truck.truckNumber,
    createdAt: alert.createdAt
  }));
}

async function getFuelAnalytics() {
  const result = await prismaService.prisma.$queryRaw`
    SELECT 
      AVG(fuel_percentage) as avg_fuel,
      COUNT(CASE WHEN fuel_percentage < 25 THEN 1 END) as low_fuel_count,
      COUNT(CASE WHEN fuel_percentage < 10 THEN 1 END) as critical_fuel_count
    FROM trucks 
    WHERE status = 'active'
  `;

  return {
    averageFuel: parseFloat(result[0].avg_fuel) || 0,
    lowFuelCount: parseInt(result[0].low_fuel_count),
    criticalFuelCount: parseInt(result[0].critical_fuel_count)
  };
}

async function getFleetPerformanceMetrics() {
  const result = await prismaService.prisma.$queryRaw`
    SELECT 
      AVG(speed) as avg_speed,
      MAX(speed) as max_speed,
      AVG(payload_tons) as avg_payload,
      SUM(payload_tons) as total_payload
    FROM trucks 
    WHERE status = 'active'
  `;

  return {
    averageSpeed: parseFloat(result[0].avg_speed) || 0,
    maxSpeed: parseFloat(result[0].max_speed) || 0,
    averagePayload: parseFloat(result[0].avg_payload) || 0,
    totalPayload: parseFloat(result[0].total_payload) || 0
  };
}

async function getFuelConsumptionTrend() {
  // This would ideally use time-series data
  // For now, return mock trend data
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      averageFuel: 65 + Math.random() * 20 // Mock data
    });
  }
  
  return days;
}

// ==========================================
// EXPORT FUNCTIONS
// ==========================================

module.exports = {
  getDashboardStats,
  getFleetSummary,
  getAlertSummary,
  getFuelReport,
  getMaintenanceReport
};