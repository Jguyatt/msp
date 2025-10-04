// Environment Variables Test
// This file helps debug environment variable loading

export const testEnvironmentVariables = () => {
  console.log('🔍 Environment Variables Test:');
  console.log('REACT_APP_AWS_ACCESS_KEY_ID:', process.env.REACT_APP_AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('REACT_APP_AWS_SECRET_ACCESS_KEY:', process.env.REACT_APP_AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
  console.log('REACT_APP_AWS_REGION:', process.env.REACT_APP_AWS_REGION || '❌ Missing');
  console.log('REACT_APP_AWS_S3_BUCKET:', process.env.REACT_APP_AWS_S3_BUCKET || '❌ Missing');
  
  if (!process.env.REACT_APP_AWS_S3_BUCKET) {
    console.error('❌ CRITICAL: REACT_APP_AWS_S3_BUCKET is not set!');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
  }
  
  return {
    accessKey: !!process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretKey: !!process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    region: !!process.env.REACT_APP_AWS_REGION,
    bucket: !!process.env.REACT_APP_AWS_S3_BUCKET
  };
};

// Auto-run test when imported
if (typeof window !== 'undefined') {
  testEnvironmentVariables();
}
