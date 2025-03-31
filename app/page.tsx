import Link from 'next/link'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Trade Construction</span>
                  <span className="block text-indigo-600">Materials Sustainably</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Connect with local construction companies to buy and sell excess materials. 
                  Save money, reduce waste, and contribute to a more sustainable construction industry.
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Benefits</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              A better way to handle excess materials
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {/* Eco Friendly */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  🌱
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Eco Friendly</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Reduce construction waste by giving materials a second life. 
                  Help minimize landfill impact and promote sustainable practices.
                </p>
              </div>

              {/* Cost Effective */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  💰
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Cost Effective</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Save money on new materials and generate revenue from excess inventory.
                  Better than traditional disposal methods.
                </p>
              </div>

              {/* Landfill Alternative */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  ♻️
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Landfill Alternative</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Avoid expensive landfill fees and transportation costs.
                  Connect with local buyers and sellers for efficient material exchange.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-indigo-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Ready to reduce waste?</span>
            <span className="block text-indigo-600">Start trading materials today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                href="/listings"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Browse Materials
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}