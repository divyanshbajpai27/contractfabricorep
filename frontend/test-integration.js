// Simple integration test to verify component structure
const fs = require('fs')
const path = require('path')

const COMPONENTS_DIR = path.join(__dirname, 'src/components')
const PAGES_DIR = path.join(__dirname, 'src/app')

// Test cases
const testCases = [
  // Core components
  'src/components/StripeCheckout.tsx',
  'src/components/ui/Button.tsx',
  'src/components/ui/Modal.tsx',
  'src/components/ui/ErrorMessage.tsx',
  'src/components/ui/SuccessMessage.tsx',
  'src/components/ui/LoadingSpinner.tsx',

  // Pages
  'src/app/admin/login/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/analytics/page.tsx',
  'src/app/admin/orders/page.tsx',
  'src/app/admin/templates/page.tsx',
  'src/app/not-found.tsx',
  'src/app/error.tsx',

  // Utilities
  'src/lib/validations.ts',
  'src/lib/errorHandler.ts',
  'src/lib/api.ts',

  // Types
  'src/types/index.ts',
]

console.log('🔍 Testing ContractFabrico Frontend Integration...\n')

let passedTests = 0
let totalTests = testCases.length

testCases.forEach((testCase, index) => {
  const filePath = path.join(__dirname, testCase)

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')

    // Basic checks
    const hasReactImport = content.includes('import React') || content.includes('\'react\'')
    const hasExportDefault = content.includes('export default')
    const hasValidExtension = filePath.endsWith('.tsx') || filePath.endsWith('.ts')

    // Specific component checks
    let componentSpecificChecks = true
    if (testCase.includes('StripeCheckout')) {
      componentSpecificChecks = content.includes('useState') &&
                              content.includes('loadStripe') &&
                              content.includes('handlePayment')
    } else if (testCase.includes('admin')) {
      componentSpecificChecks = content.includes('adminApi') ||
                              content.includes('AdminAuth') ||
                              content.includes('router.push')
    } else if (testCase.includes('validations')) {
      componentSpecificChecks = content.includes('zod') &&
                              content.includes('emailSchema')
    } else if (testCase.includes('errorHandler')) {
      componentSpecificChecks = content.includes('ErrorHandler') &&
                              content.includes('parseNetworkError')
    } else if (testCase.includes('api')) {
      componentSpecificChecks = content.includes('axios') &&
                              content.includes('templateApi')
    }

    if (hasValidExtension && (hasExportDefault || testCase.includes('.lib/')) && componentSpecificChecks) {
      console.log(`✅ ${index + 1}. ${testCase}`)
      passedTests++
    } else {
      console.log(`❌ ${index + 1}. ${testCase} - Missing required elements`)
      console.log(`   React Import: ${hasReactImport}, Export Default: ${hasExportDefault}, Valid Extension: ${hasValidExtension}, Specific Checks: ${componentSpecificChecks}`)
    }
  } else {
    console.log(`❌ ${index + 1}. ${testCase} - File not found`)
  }
})

// Check directory structure
console.log('\n📁 Checking directory structure...')

const requiredDirs = [
  'src/components',
  'src/components/ui',
  'src/app/admin',
  'src/app/admin/login',
  'src/app/admin/analytics',
  'src/app/admin/orders',
  'src/app/admin/templates',
  'src/lib',
  'src/types',
]

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir)
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${dir}/`)
  } else {
    console.log(`❌ ${dir}/ - Directory not found`)
  }
})

// Check package.json for required dependencies
console.log('\n📦 Checking package.json dependencies...')

const packageJsonPath = path.join(__dirname, 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const requiredDeps = [
    'react',
    'next',
    '@stripe/stripe-js',
    '@stripe/react-stripe-js',
    'axios',
    'zod',
    'clsx',
    'tailwind-merge',
    '@heroicons/react',
  ]

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`)
    } else {
      console.log(`❌ ${dep} - Not found`)
    }
  })
} else {
  console.log('❌ package.json not found')
}

// Summary
console.log('\n📊 Test Summary:')
console.log(`Passed: ${passedTests}/${totalTests} tests`)
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)

if (passedTests === totalTests) {
  console.log('\n🎉 All integration tests passed! The frontend components are properly structured.')
} else {
  console.log('\n⚠️  Some tests failed. Please review the issues above.')
}