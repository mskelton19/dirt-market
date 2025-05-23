'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

type MaterialData = {
  materialType: string
  totalQuantity: number
}

type CompletedListing = {
  quantity_moved: number
  completed_at: string
  material_type: string
  unit: string
  companies: { name: string } | null
}

export default function MaterialMovementCharts({ refreshTrigger }: { refreshTrigger?: number }) {
  const [tonsData, setTonsData] = useState<{
    companyName: string;
    materialType: string;
    totalQuantity: number;
  }[]>([])
  const [cubicYardsData, setCubicYardsData] = useState<{
    companyName: string;
    materialType: string;
    totalQuantity: number;
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchMaterialMovementData()
  }, [refreshTrigger])

  async function fetchMaterialMovementData() {
    try {
      setLoading(true)
      // Fetch data with company names
      const { data: completedListings, error } = await supabase
        .from('completed_listings')
        .select(`
          quantity_moved,
          completed_at,
          material_type,
          unit,
          companies (name)
        `)
        .order('completed_at', { ascending: false }) as { data: CompletedListing[] | null, error: any }

      if (error) throw error

      // Process data to group by company and material type
      const processedData: { companyName: string; materialType: string; totalQuantity: number; unit: string }[] = []
      
      completedListings?.forEach(listing => {
        const companyName = listing.companies?.name || 'Unknown Company';
        const materialType = listing.material_type || 'Other';
        const quantity = listing.quantity_moved || 0;
        const listingUnit = listing.unit || '';
        
        // Add new entry for each listing, we will aggregate later per chart type
        processedData.push({
          companyName,
          materialType,
          totalQuantity: quantity,
          unit: listingUnit // Store unit with each entry for consistency, though currently assuming one unit type
        });
      });
      
      // Separate data by unit type
      const tonsDataFiltered = processedData.filter(item => item.unit?.toLowerCase() === 'ton' || item.unit?.toLowerCase() === 'tons');
      const cubicYardsDataFiltered = processedData.filter(item => item.unit?.toLowerCase() === 'cubic yard' || item.unit?.toLowerCase() === 'cubic yards' || item.unit?.toLowerCase() === 'cy');

      // Aggregate data for tons chart (by company and material type)
      const aggregatedTonsData = aggregateData(tonsDataFiltered);
      setTonsData(aggregatedTonsData);

      // Aggregate data for cubic yards chart (by company and material type)
      const aggregatedCubicYardsData = aggregateData(cubicYardsDataFiltered);
      setCubicYardsData(aggregatedCubicYardsData);

    } catch (error: any) {
      console.error('Error fetching material data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper to aggregate data by company and material type
  function aggregateData(data: { companyName: string; materialType: string; totalQuantity: number; unit: string }[]) {
    const aggregated = new Map<string, Map<string, number>>(); // Map: Company -> (MaterialType -> TotalQuantity)

    data.forEach(item => {
      if (!aggregated.has(item.companyName)) {
        aggregated.set(item.companyName, new Map<string, number>());
      }
      const materialQuantities = aggregated.get(item.companyName)!;
      materialQuantities.set(
        item.materialType,
        (materialQuantities.get(item.materialType) || 0) + item.totalQuantity
      );
    });

    // Convert the nested map to the desired array structure
    const result: { companyName: string; materialType: string; totalQuantity: number }[] = [];
    aggregated.forEach((materialQuantities, companyName) => {
      materialQuantities.forEach((totalQuantity, materialType) => {
        result.push({ companyName, materialType, totalQuantity });
      });
    });

    return result;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading chart data: {error}
      </div>
    )
  }

  if (tonsData.length === 0 && cubicYardsData.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        No material movement data available
      </div>
    )
  }

  // Format material type for display
  const formatMaterialType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Define material colors (should ideally match styles on manage page)
  const getMaterialColor = (materialType: string) => {
    switch (materialType) {
      case 'soil': return 'rgba(217, 119, 6, 0.6)'; // Amber
      case 'gravel': return 'rgba(100, 116, 139, 0.6)'; // Slate
      case 'structural_fill': return 'rgba(16, 185, 129, 0.6)'; // Emerald
      default: return 'rgba(156, 163, 175, 0.6)'; // Gray
    }
  }

  // Function to prepare data for a grouped bar chart
  const prepareGroupedChartData = (data: { companyName: string; materialType: string; totalQuantity: number }[], unit: string) => {
    const companies = Array.from(new Set(data.map(item => item.companyName))).sort();
    const materialTypes = Array.from(new Set(data.map(item => item.materialType))).sort();

    const datasets = materialTypes.map(materialType => {
      const color = getMaterialColor(materialType);
      return {
        label: formatMaterialType(materialType),
        data: companies.map(companyName => {
          const dataPoint = data.find(
            item => item.companyName === companyName && item.materialType === materialType
          );
          return dataPoint ? dataPoint.totalQuantity : 0;
        }),
        backgroundColor: color,
        borderColor: color.replace('0.6', '1'),
        borderWidth: 1,
      };
    });

    return {
      labels: companies,
      datasets: datasets,
    };
  };

  const groupedChartOptions = (unit: string) => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Material Movement by Company (${unit})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: `Quantity (${unit})`,
        },
        stacked: false,
      },
      x: {
        stacked: false,
      },
    },
  })

  return (
    <div className="">
      {/* Tons Chart */}
      {tonsData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <Bar 
            data={prepareGroupedChartData(tonsData, 'Tons')} 
            options={groupedChartOptions('Tons')} 
          />
        </div>
      )}

      {/* Cubic Yards Chart */}
      {cubicYardsData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <Bar 
            data={prepareGroupedChartData(cubicYardsData, 'Cubic Yards')} 
            options={groupedChartOptions('Cubic Yards')} 
          />
        </div>
      )}
    </div>
  )
} 