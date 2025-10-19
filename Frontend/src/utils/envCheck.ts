// Environment and API configuration checker
export const checkEnvironment = () => {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check NEXT_PUBLIC_SERVER_URI
  const serverUri = process.env.NEXT_PUBLIC_SERVER_URI;
  if (!serverUri) {
    issues.push('NEXT_PUBLIC_SERVER_URI is not set in environment variables');
  } else {
    console.log('✅ NEXT_PUBLIC_SERVER_URI:', serverUri);
    
    // Check if it ends with correct format
    if (!serverUri.endsWith('/api/v1/') && !serverUri.endsWith('/api/v1')) {
      warnings.push('NEXT_PUBLIC_SERVER_URI should end with /api/v1/ for proper API calls');
    }
  }

  // Check if we're in development
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log('🔧 Running in development mode');
  }

  // Check if we have fallback URL
  const fallbackUrl = 'http://localhost:8000/api/v1/';
  console.log('🔄 Fallback URL available:', fallbackUrl);

  return {
    issues,
    warnings,
    serverUri: serverUri || fallbackUrl,
    isDev
  };
};

// Test API connectivity
export const testAPIConnectivity = async () => {
  const { serverUri } = checkEnvironment();
  
  try {
    console.log('🧪 Testing API connectivity to:', serverUri);
    
    const response = await fetch(`${serverUri}marketplace/stats`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      console.error('❌ API returned non-JSON response:', contentType);
      console.error('Response body:', await response.text());
      return {
        success: false,
        error: `API returned ${contentType} instead of JSON`,
        status: response.status
      };
    }

    const data = await response.json();
    console.log('✅ API Response Data:', data);
    
    return {
      success: true,
      data,
      status: response.status
    };
  } catch (error: any) {
    console.error('❌ API connectivity test failed:', error);
    return {
      success: false,
      error: error.message,
      status: 0
    };
  }
};

// Log environment info on app start
export const logEnvironmentInfo = () => {
  console.log('🚀 Application starting...');
  const envInfo = checkEnvironment();
  
  if (envInfo.issues.length > 0) {
    console.error('❌ Environment Issues:');
    envInfo.issues.forEach(issue => console.error('  -', issue));
  }
  
  if (envInfo.warnings.length > 0) {
    console.warn('⚠️ Environment Warnings:');
    envInfo.warnings.forEach(warning => console.warn('  -', warning));
  }
  
  if (envInfo.issues.length === 0 && envInfo.warnings.length === 0) {
    console.log('✅ Environment configuration looks good');
  }
  
  return envInfo;
};
