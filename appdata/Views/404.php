    <!-- 404 Error Page -->
    <div id="error-404" class="min-h-screen flex items-center justify-center px-4 py-8">
        <div class="max-w-md w-full text-center">
            <!-- Error Icon -->
            <div class="mb-8">
                <div class="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                    <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                </div>
            </div>
            
            <!-- Error Code -->
            <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
            
            <!-- Error Message -->
            <h2 class="text-xl font-semibold text-gray-800 mb-4">
                Siden ble ikke funnet
            </h2>
            
            <p class="text-gray-600 mb-8 leading-relaxed">
                Beklager! Siden du prøver å nå eksisterer ikke eller har blitt flyttet. 
                Dette kan skje når URL-parametere blir manipulert.
            </p>
            
            <!-- Action Buttons -->
            <div class="space-y-3">
                <button onclick="goHome()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                    Gå til forsiden
                </button>
                <button onclick="goBack()" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                    Gå tilbake
                </button>
            </div>
        </div>
    </div>