    <!-- 500 Error Page (Hidden by default) -->
    <div id="error-500" class="min-h-screen flex items-center justify-center px-4 py-8 hidden">
        <div class="max-w-md w-full text-center">
            <!-- Error Icon -->
            <div class="mb-8">
                <div class="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg class="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
            
            <!-- Error Code -->
            <h1 class="text-6xl font-bold text-gray-900 mb-4">500</h1>
            
            <!-- Error Message -->
            <h2 class="text-xl font-semibold text-gray-800 mb-4">
                Intern serverfeil
            </h2>
            
            <p class="text-gray-600 mb-8 leading-relaxed">
                Beklager! Det oppstod en uventet feil på serveren. 
                Vi arbeider med å løse problemet så raskt som mulig.
            </p>
            
            <!-- Action Buttons -->
            <div class="space-y-3">
                <button onclick="refreshPage()" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                    Prøv igjen
                </button>
                <button onclick="goHome()" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                    Gå til forsiden
                </button>
            </div>
        </div>
    </div>